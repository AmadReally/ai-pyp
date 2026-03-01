import { NextRequest, NextResponse } from "next/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file || file.size === 0) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured." },
                { status: 500 }
            );
        }

        // Write file to /tmp
        const buffer = Buffer.from(await file.arrayBuffer());
        const tmpPath = join(tmpdir(), `upload-${Date.now()}-${file.name}`);
        await writeFile(tmpPath, buffer);

        try {
            // Upload to Gemini File API
            const fileManager = new GoogleAIFileManager(apiKey);
            const result = await fileManager.uploadFile(tmpPath, {
                mimeType: file.type || "application/pdf",
                displayName: file.name,
            });

            return NextResponse.json({
                uri: result.file.uri,
                name: result.file.name,
                displayName: result.file.displayName,
                mimeType: result.file.mimeType,
            });
        } finally {
            // Always clean up tmp file
            await unlink(tmpPath).catch(() => { });
        }
    } catch (error: unknown) {
        console.error("Upload error:", error);
        const message =
            error instanceof Error ? error.message : "Upload failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
