import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Allow longer execution time on Vercel
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        // Parse FormData instead of JSON to avoid base64 bloat
        const formData = await request.formData();

        const optionsRaw = formData.get("options") as string;
        const options = JSON.parse(optionsRaw || "{}");

        // Collect source files
        const sourceFiles: { name: string; mimeType: string; data: string }[] = [];
        const pypFiles: { name: string; mimeType: string; data: string }[] = [];

        // Process all form entries
        for (const [key, value] of formData.entries()) {
            if (value instanceof File && value.size > 0) {
                const buffer = Buffer.from(await value.arrayBuffer());
                const base64 = buffer.toString("base64");
                const fileObj = {
                    name: value.name,
                    mimeType: value.type || "application/pdf",
                    data: base64,
                };

                if (key.startsWith("source")) {
                    sourceFiles.push(fileObj);
                } else if (key.startsWith("pyp")) {
                    pypFiles.push(fileObj);
                }
            }
        }

        // Validate
        if (!sourceFiles.length || !pypFiles.length) {
            return NextResponse.json(
                { error: "Please upload at least one source file and one past year paper." },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured. Add GEMINI_API_KEY to your .env.local file." },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // ---- Stage 1: Prepare file parts for Gemini ----
        const sourceParts = sourceFiles.map((f) => ({
            inlineData: { mimeType: f.mimeType, data: f.data },
        }));

        const pypParts = pypFiles.map((f) => ({
            inlineData: { mimeType: f.mimeType, data: f.data },
        }));

        // ---- Stage 2: Analyze PYP format ----
        const analyzePrompt = `You are an expert exam paper analyst. Analyze the following past year paper(s) and extract the EXACT format structure.

Return a JSON object with this structure:
{
  "examTitle": "exact title from the paper",
  "courseCode": "course code if visible",
  "duration": "exam duration",
  "totalMarks": number,
  "instructions": ["list of instructions from the paper"],
  "sections": [
    {
      "name": "Section A / Part A / etc",
      "type": "MCQ / Structured / Essay / ShortAnswer / Calculation",
      "questionCount": number,
      "marksPerQuestion": number,
      "totalMarks": number,
      "chooseCount": number or null,
      "description": "any specific instructions for this section"
    }
  ]
}

Be precise — capture the exact format, marks, and structure. Return ONLY valid JSON, no markdown.`;

        const analyzeResult = await model.generateContent([
            analyzePrompt,
            ...pypParts,
        ]);
        const formatJson = analyzeResult.response.text();

        // ---- Stage 3: Generate the actual exam paper ----
        const difficultyMap: Record<string, string> = {
            easy: "slightly easier than the reference paper — focus on basic recall and understanding",
            medium: "similar difficulty to the reference paper — mix of recall, understanding, and application",
            hard: "slightly harder than the reference paper — focus on application, analysis, and synthesis",
        };

        const answerInstructions = options.includeAnswerKey
            ? `After the exam paper, generate a SEPARATE section titled "ANSWER KEY" with:
${options.includeMarkingScheme ? "- Full model answers with step-by-step working\n- Mark allocation breakdown for each question" : "- Brief correct answers only (no detailed working)"}`
            : "";

        const generatePrompt = `You are a professional university exam paper generator.

## YOUR TASK
Generate a BRAND NEW exam paper that EXACTLY follows the format of the reference past year paper.

## FORMAT TEMPLATE (extracted from the past year paper)
${formatJson}

## RULES
1. The questions MUST be based ENTIRELY on the source material provided — do NOT create questions about topics not covered in the source.
2. Match the EXACT format: same number of sections, same question types, same marks allocation, same style of wording.
3. Do NOT copy or rephrase any questions from the past year paper — generate completely NEW questions.
4. Difficulty level: ${difficultyMap[options.difficulty] || difficultyMap.medium}
5. Include clear instructions and marks for each question, matching the original format.
6. For MCQ questions, always provide 4 options (A, B, C, D) with only one correct answer.

## OUTPUT FORMAT
Return the exam paper in clean HTML format using these guidelines:
- Use <h1> for the exam title
- Use <h2> for section headers
- Use <h3> for sub-sections if needed
- Use <p> for questions with a <strong> tag for question numbers and marks
- Use <div class="option"> for MCQ options
- Use <table> for any tabular data
- Use <div class="instructions"> for instruction boxes
- Keep the HTML clean and simple — it will be rendered in a white paper view

${answerInstructions ? `## ANSWER KEY\n${answerInstructions}\nSeparate the answer key from the paper with: <hr class="answer-separator">` : ""}

Generate the complete exam paper now. Output ONLY the HTML content, no markdown code fences.`;

        const generateResult = await model.generateContent([
            generatePrompt,
            ...sourceParts,
            ...pypParts,
        ]);

        let fullOutput = generateResult.response.text();

        // Clean up any markdown code fences
        fullOutput = fullOutput
            .replace(/^```html?\n?/i, "")
            .replace(/\n?```$/i, "")
            .trim();

        // Split paper and answer key
        let paper = fullOutput;
        let answerKey = "";

        const separatorIndex = fullOutput.indexOf('<hr class="answer-separator">');
        if (separatorIndex !== -1) {
            paper = fullOutput.substring(0, separatorIndex).trim();
            answerKey = fullOutput.substring(separatorIndex + '<hr class="answer-separator">'.length).trim();
        } else {
            // Try alternative split
            const answerKeyMatch = fullOutput.match(/<h[12][^>]*>\s*(ANSWER\s*KEY|MARKING\s*SCHEME|MODEL\s*ANSWERS)/i);
            if (answerKeyMatch && answerKeyMatch.index) {
                paper = fullOutput.substring(0, answerKeyMatch.index).trim();
                answerKey = fullOutput.substring(answerKeyMatch.index).trim();
            }
        }

        return NextResponse.json({
            paper,
            answerKey,
            format: formatJson,
        });
    } catch (error: unknown) {
        console.error("Generation error:", error);
        const message =
            error instanceof Error ? error.message : "An unexpected error occurred";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
