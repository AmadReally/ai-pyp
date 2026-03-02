import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

interface FileData {
    mimeType: string;
    data: string; // base64
}

interface GenerateBody {
    sourceFiles: FileData[];
    pypFiles: FileData[];
    options: {
        includeAnswerKey: boolean;
        includeMarkingScheme: boolean;
        difficulty: "easy" | "medium" | "hard";
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: GenerateBody = await request.json();
        const { sourceFiles, pypFiles, options } = body;

        if (!sourceFiles.length || !pypFiles.length) {
            return NextResponse.json(
                { error: "Please upload at least one source file and one past year paper." },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured. Add GEMINI_API_KEY to environment variables." },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Build file parts
        const sourceParts = sourceFiles.map((f) => ({
            inlineData: { mimeType: f.mimeType, data: f.data },
        }));

        const pypParts = pypFiles.map((f) => ({
            inlineData: { mimeType: f.mimeType, data: f.data },
        }));

        // ---- Analyze PYP format ----
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

Be precise. Return ONLY valid JSON, no markdown.`;

        const analyzeResult = await model.generateContent([analyzePrompt, ...pypParts]);
        const formatJson = analyzeResult.response.text();

        // ---- Generate exam paper ----
        const difficultyMap: Record<string, string> = {
            easy: "slightly easier than the reference paper",
            medium: "similar difficulty to the reference paper",
            hard: "slightly harder than the reference paper",
        };

        const answerInstructions = options.includeAnswerKey
            ? `After the exam paper, generate a SEPARATE section titled "ANSWER KEY" with:
${options.includeMarkingScheme ? "- Full model answers with step-by-step working\n- Mark allocation breakdown for each question" : "- Brief correct answers only"}`
            : "";

        const generatePrompt = `You are a professional university exam paper generator.

## YOUR TASK
Generate a BRAND NEW exam paper that EXACTLY follows the format of the reference past year paper.

## FORMAT TEMPLATE
${formatJson}

## RULES
1. Questions MUST be based ENTIRELY on the source material provided.
2. Match the EXACT format: same sections, question types, marks allocation, style.
3. Do NOT copy questions from the past year paper — generate completely NEW ones.
4. Difficulty level: ${difficultyMap[options.difficulty] || difficultyMap.medium}
5. Include clear instructions and marks for each question.
6. For MCQ questions, provide 4 options (A, B, C, D).

## OUTPUT FORMAT
Return clean HTML:
- <h1> for exam title, <h2> for sections, <p> for questions
- <div class="option"> for MCQ options, <table> for tabular data
- <div class="instructions"> for instruction boxes
${answerInstructions ? `\n## ANSWER KEY\n${answerInstructions}\nSeparate with: <hr class="answer-separator">` : ""}

Output ONLY HTML, no markdown code fences.`;

        const generateResult = await model.generateContent([generatePrompt, ...sourceParts, ...pypParts]);
        let fullOutput = generateResult.response.text();

        fullOutput = fullOutput.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

        let paper = fullOutput;
        let answerKey = "";

        const separatorIndex = fullOutput.indexOf('<hr class="answer-separator">');
        if (separatorIndex !== -1) {
            paper = fullOutput.substring(0, separatorIndex).trim();
            answerKey = fullOutput.substring(separatorIndex + '<hr class="answer-separator">'.length).trim();
        } else {
            const match = fullOutput.match(/<h[12][^>]*>\s*(ANSWER\s*KEY|MARKING\s*SCHEME|MODEL\s*ANSWERS)/i);
            if (match?.index) {
                paper = fullOutput.substring(0, match.index).trim();
                answerKey = fullOutput.substring(match.index).trim();
            }
        }

        return NextResponse.json({ paper, answerKey, format: formatJson });
    } catch (error: unknown) {
        console.error("Generation error:", error);
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
