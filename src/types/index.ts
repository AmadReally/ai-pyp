// ---- Types for the AI PYP application ----

export interface UploadedFile {
    name: string;
    size: number;
    type: string;
    content: string; // base64 encoded
}

export interface PYPFormat {
    examTitle: string;
    duration: string;
    totalMarks: number;
    instructions: string[];
    sections: PYPSection[];
}

export interface PYPSection {
    name: string;
    type: "MCQ" | "Structured" | "Essay" | "ShortAnswer" | "Calculation";
    questionCount: number;
    marksPerQuestion: number;
    totalMarks: number;
    chooseCount?: number; // "answer any X out of Y"
    description?: string;
}

export interface GeneratedPaper {
    id: string;
    title: string;
    format: PYPFormat;
    content: string; // The full generated paper in HTML format
    answerKey?: string; // Answer key in HTML format
    createdAt: string;
}

export interface GenerationRequest {
    sourceFiles: UploadedFile[];
    pypFiles: UploadedFile[];
    options: GenerationOptions;
}

export interface GenerationOptions {
    includeAnswerKey: boolean;
    includeMarkingScheme: boolean;
    difficulty: "easy" | "medium" | "hard";
}

export interface GenerationStatus {
    stage: "uploading" | "analyzing" | "planning" | "generating" | "formatting" | "done" | "error";
    progress: number; // 0–100
    message: string;
}
