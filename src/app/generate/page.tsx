"use client";

import { useState, useCallback, useRef } from "react";
import styles from "./page.module.css";
import type {
    UploadedFile,
    GenerationOptions,
    GenerationStatus,
} from "@/types";

export default function GeneratePage() {
    const [sourceFiles, setSourceFiles] = useState<UploadedFile[]>([]);
    const [pypFiles, setPypFiles] = useState<UploadedFile[]>([]);
    const [options, setOptions] = useState<GenerationOptions>({
        includeAnswerKey: true,
        includeMarkingScheme: true,
        difficulty: "medium",
    });
    const [status, setStatus] = useState<GenerationStatus | null>(null);
    const [generatedContent, setGeneratedContent] = useState<string>("");
    const [answerKeyContent, setAnswerKeyContent] = useState<string>("");
    const [showAnswers, setShowAnswers] = useState(false);

    const sourceInputRef = useRef<HTMLInputElement>(null);
    const pypInputRef = useRef<HTMLInputElement>(null);

    // ---- File Upload Handler ----
    const handleFiles = useCallback(
        async (
            files: FileList | null,
            type: "source" | "pyp"
        ) => {
            if (!files) return;

            const processed: UploadedFile[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const content = await fileToBase64(file);
                processed.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    content,
                });
            }

            if (type === "source") {
                setSourceFiles((prev) => [...prev, ...processed]);
            } else {
                setPypFiles((prev) => [...prev, ...processed]);
            }
        },
        []
    );

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    };

    const removeFile = (type: "source" | "pyp", index: number) => {
        if (type === "source") {
            setSourceFiles((prev) => prev.filter((_, i) => i !== index));
        } else {
            setPypFiles((prev) => prev.filter((_, i) => i !== index));
        }
    };

    // ---- Drag & Drop ----
    const handleDrop = useCallback(
        (e: React.DragEvent, type: "source" | "pyp") => {
            e.preventDefault();
            e.stopPropagation();
            handleFiles(e.dataTransfer.files, type);
        },
        [handleFiles]
    );

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // ---- Generate ----
    const handleGenerate = async () => {
        if (sourceFiles.length === 0 || pypFiles.length === 0) return;

        setGeneratedContent("");
        setAnswerKeyContent("");
        setShowAnswers(false);

        const stages: { stage: GenerationStatus["stage"]; msg: string; progress: number }[] = [
            { stage: "uploading", msg: "Processing uploaded files...", progress: 10 },
            { stage: "analyzing", msg: "Analyzing past year paper format...", progress: 30 },
            { stage: "planning", msg: "Planning question distribution...", progress: 50 },
            { stage: "generating", msg: "Generating exam paper with AI...", progress: 70 },
            { stage: "formatting", msg: "Formatting final output...", progress: 90 },
        ];

        try {
            // Show initial status
            setStatus({ stage: "uploading", progress: 5, message: "Starting..." });

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceFiles,
                    pypFiles,
                    options,
                }),
            });

            if (!response.ok) {
                let errorMessage = "Generation failed";
                try {
                    const err = await response.json();
                    errorMessage = err.error || errorMessage;
                } catch {
                    // Response might not be JSON (e.g. 413 Request Entity Too Large)
                    const text = await response.text();
                    if (response.status === 413) {
                        errorMessage = "Files too large. Try uploading smaller files (under 10MB each).";
                    } else {
                        errorMessage = text || `Server error (${response.status})`;
                    }
                }
                throw new Error(errorMessage);
            }

            // Simulate progress while waiting for the streamed response
            let stageIndex = 0;
            const progressInterval = setInterval(() => {
                if (stageIndex < stages.length) {
                    setStatus({
                        stage: stages[stageIndex].stage,
                        progress: stages[stageIndex].progress,
                        message: stages[stageIndex].msg,
                    });
                    stageIndex++;
                }
            }, 3000);

            const data = await response.json();
            clearInterval(progressInterval);

            setGeneratedContent(data.paper);
            setAnswerKeyContent(data.answerKey || "");
            setStatus({ stage: "done", progress: 100, message: "Paper generated successfully!" });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Something went wrong";
            setStatus({
                stage: "error",
                progress: 0,
                message: errorMessage,
            });
        }
    };

    const handleExport = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const content = showAnswers && answerKeyContent
            ? generatedContent + '<div style="page-break-before: always;"></div>' + answerKeyContent
            : generatedContent;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Generated Exam Paper</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            max-width: 210mm;
            margin: 20mm auto;
            padding: 0 20px;
            color: #1a1a1a;
            line-height: 1.6;
          }
          h1 { font-size: 1.5rem; text-align: center; margin-bottom: 8px; }
          h2 { font-size: 1.2rem; margin: 24px 0 12px; border-bottom: 2px solid #333; padding-bottom: 4px; }
          h3 { font-size: 1rem; margin: 16px 0 8px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          .question { margin: 16px 0; }
          .question-number { font-weight: 700; }
          .marks { color: #666; font-size: 0.9em; }
          .option { margin: 4px 0 4px 20px; }
          .instructions { background: #f8f8f8; padding: 16px; border-radius: 8px; margin: 16px 0; }
          .answer-key { background: #e8f5e9; padding: 16px; border-radius: 8px; margin: 16px 0; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const isReady = sourceFiles.length > 0 && pypFiles.length > 0;
    const isGenerating = status !== null && status.stage !== "done" && status.stage !== "error";

    return (
        <div className={styles.page}>
            {/* Floating orbs */}
            <div className={styles.orbContainer}>
                <div className={`${styles.orb} ${styles.orb1}`} />
                <div className={`${styles.orb} ${styles.orb2}`} />
            </div>

            {/* Navbar */}
            <nav className={styles.nav}>
                <div className={`container ${styles.navInner}`}>
                    <a href="/" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#grad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <defs>
                                    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6c5ce7" />
                                        <stop offset="100%" stopColor="#00cec9" />
                                    </linearGradient>
                                </defs>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        </div>
                        <span className={styles.logoText}>
                            AI <span className="gradient-text">PYP</span>
                        </span>
                    </a>
                </div>
            </nav>

            {/* Main Content */}
            <main className={styles.main}>
                <div className="container">
                    {!generatedContent ? (
                        // ---- UPLOAD & SETTINGS VIEW ----
                        <div className={styles.uploadView}>
                            <div className={styles.header}>
                                <h1>
                                    Generate Your <span className="gradient-text">Exam Paper</span>
                                </h1>
                                <p>Upload your source material and a past year paper to get started</p>
                            </div>

                            <div className={styles.uploadGrid}>
                                {/* Source Material Upload */}
                                <div className={`glass-card ${styles.uploadCard}`}>
                                    <div className={styles.uploadCardHeader}>
                                        <div className={styles.uploadIcon}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3>Source Material</h3>
                                            <p>Lecture notes, slides, textbook PDFs</p>
                                        </div>
                                    </div>

                                    <div
                                        className={styles.dropZone}
                                        onDrop={(e) => handleDrop(e, "source")}
                                        onDragOver={handleDragOver}
                                        onClick={() => sourceInputRef.current?.click()}
                                    >
                                        <input
                                            ref={sourceInputRef}
                                            type="file"
                                            multiple
                                            accept=".pdf,.docx,.doc,.txt"
                                            style={{ display: "none" }}
                                            onChange={(e) => handleFiles(e.target.files, "source")}
                                        />
                                        <div className={styles.dropIcon}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                        </div>
                                        <p className={styles.dropText}>
                                            Drag & drop or <span>browse</span>
                                        </p>
                                        <p className={styles.dropHint}>PDF, DOCX, TXT — up to 20MB each</p>
                                    </div>

                                    {sourceFiles.length > 0 && (
                                        <div className={styles.fileList}>
                                            {sourceFiles.map((f, i) => (
                                                <div key={i} className={styles.fileItem}>
                                                    <div className={styles.fileInfo}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                        </svg>
                                                        <span className={styles.fileName}>{f.name}</span>
                                                        <span className={styles.fileSize}>{formatSize(f.size)}</span>
                                                    </div>
                                                    <button
                                                        className={styles.removeBtn}
                                                        onClick={(e) => { e.stopPropagation(); removeFile("source", i); }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Past Year Paper Upload */}
                                <div className={`glass-card ${styles.uploadCard}`}>
                                    <div className={styles.uploadCardHeader}>
                                        <div className={`${styles.uploadIcon} ${styles.uploadIconPyp}`}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="16" y1="13" x2="8" y2="13" />
                                                <line x1="16" y1="17" x2="8" y2="17" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3>Past Year Paper</h3>
                                            <p>For format and style reference</p>
                                        </div>
                                    </div>

                                    <div
                                        className={styles.dropZone}
                                        onDrop={(e) => handleDrop(e, "pyp")}
                                        onDragOver={handleDragOver}
                                        onClick={() => pypInputRef.current?.click()}
                                    >
                                        <input
                                            ref={pypInputRef}
                                            type="file"
                                            multiple
                                            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                                            style={{ display: "none" }}
                                            onChange={(e) => handleFiles(e.target.files, "pyp")}
                                        />
                                        <div className={styles.dropIcon}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="16" y1="13" x2="8" y2="13" />
                                                <line x1="16" y1="17" x2="8" y2="17" />
                                            </svg>
                                        </div>
                                        <p className={styles.dropText}>
                                            Drag & drop or <span>browse</span>
                                        </p>
                                        <p className={styles.dropHint}>PDF, DOCX, images — up to 20MB each</p>
                                    </div>

                                    {pypFiles.length > 0 && (
                                        <div className={styles.fileList}>
                                            {pypFiles.map((f, i) => (
                                                <div key={i} className={styles.fileItem}>
                                                    <div className={styles.fileInfo}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                        </svg>
                                                        <span className={styles.fileName}>{f.name}</span>
                                                        <span className={styles.fileSize}>{formatSize(f.size)}</span>
                                                    </div>
                                                    <button
                                                        className={styles.removeBtn}
                                                        onClick={(e) => { e.stopPropagation(); removeFile("pyp", i); }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Options */}
                            <div className={`glass-card ${styles.optionsCard}`}>
                                <h3>Options</h3>
                                <div className={styles.optionsGrid}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={options.includeAnswerKey}
                                            onChange={(e) =>
                                                setOptions({ ...options, includeAnswerKey: e.target.checked })
                                            }
                                        />
                                        <span className={styles.checkbox}></span>
                                        Include Answer Key
                                    </label>

                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={options.includeMarkingScheme}
                                            onChange={(e) =>
                                                setOptions({ ...options, includeMarkingScheme: e.target.checked })
                                            }
                                        />
                                        <span className={styles.checkbox}></span>
                                        Include Marking Scheme
                                    </label>

                                    <div className={styles.difficultyGroup}>
                                        <span className={styles.diffLabel}>Difficulty:</span>
                                        <div className={styles.diffButtons}>
                                            {(["easy", "medium", "hard"] as const).map((d) => (
                                                <button
                                                    key={d}
                                                    className={`${styles.diffBtn} ${options.difficulty === d ? styles.diffBtnActive : ""
                                                        }`}
                                                    onClick={() => setOptions({ ...options, difficulty: d })}
                                                >
                                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <div className={styles.generateSection}>
                                {status && status.stage !== "done" && status.stage !== "error" && (
                                    <div className={styles.statusBar}>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-bar-fill"
                                                style={{ width: `${status.progress}%` }}
                                            />
                                        </div>
                                        <div className={styles.statusInfo}>
                                            <div className="spinner" />
                                            <span>{status.message}</span>
                                        </div>
                                    </div>
                                )}

                                {status?.stage === "error" && (
                                    <div className={styles.errorMsg}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="15" y1="9" x2="9" y2="15" />
                                            <line x1="9" y1="9" x2="15" y2="15" />
                                        </svg>
                                        {status.message}
                                    </div>
                                )}

                                <button
                                    className="btn btn-primary btn-lg"
                                    disabled={!isReady || isGenerating}
                                    onClick={handleGenerate}
                                    style={{ width: "100%", maxWidth: "400px" }}
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="spinner" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                            </svg>
                                            Generate Exam Paper
                                        </>
                                    )}
                                </button>

                                {!isReady && (
                                    <p className={styles.hint}>
                                        Upload at least one source file and one past year paper to continue
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        // ---- GENERATED PAPER VIEW ----
                        <div className={styles.resultView}>
                            <div className={styles.resultHeader}>
                                <div>
                                    <h2>Generated Exam Paper</h2>
                                    <p>Review, edit, or export your paper</p>
                                </div>
                                <div className={styles.resultActions}>
                                    {answerKeyContent && (
                                        <button
                                            className={`btn btn-secondary btn-sm`}
                                            onClick={() => setShowAnswers(!showAnswers)}
                                        >
                                            {showAnswers ? "Hide" : "Show"} Answers
                                        </button>
                                    )}
                                    <button className="btn btn-secondary btn-sm" onClick={handleExport}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        Export PDF
                                    </button>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                            setGeneratedContent("");
                                            setStatus(null);
                                        }}
                                    >
                                        New Paper
                                    </button>
                                </div>
                            </div>

                            <div className={styles.paperContainer}>
                                <div
                                    className={styles.paperContent}
                                    dangerouslySetInnerHTML={{ __html: generatedContent }}
                                />
                                {showAnswers && answerKeyContent && (
                                    <div className={styles.answerKeyContainer}>
                                        <div
                                            className={styles.answerKeyContent}
                                            dangerouslySetInnerHTML={{ __html: answerKeyContent }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
