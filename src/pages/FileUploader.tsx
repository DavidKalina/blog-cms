import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";

interface ProcessedFile {
  id: string;
  name: string;
  content: string;
  frontmatter: {
    title: string;
    excerpt: string;
    category: string;
    date: string;
    tags: string[];
  } | null;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

function parseFrontmatter(content: string): {
  frontmatter: ProcessedFile["frontmatter"];
  content: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: null, content };
  }

  const [, frontmatterStr, mainContent] = match;
  const frontmatter: ProcessedFile["frontmatter"] = {
    title: "",
    excerpt: "",
    category: "",
    date: "",
    tags: [],
  };

  // Parse frontmatter fields
  const lines = frontmatterStr.split("\n");
  for (const line of lines) {
    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":").trim();

    if (key === "title") frontmatter.title = value.replace(/^"|"$/g, "");
    else if (key === "excerpt") frontmatter.excerpt = value.replace(/^"|"$/g, "");
    else if (key === "category") frontmatter.category = value.replace(/^"|"$/g, "");
    else if (key === "date") frontmatter.date = value.replace(/^"|"$/g, "");
    else if (key === "tags") {
      try {
        frontmatter.tags = JSON.parse(value);
      } catch {
        frontmatter.tags = [];
      }
    }
  }

  return { frontmatter, content: mainContent.trim() };
}

export function FileUploader() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(async (file: File): Promise<ProcessedFile> => {
    const content = await file.text();
    const { frontmatter, content: markdownContent } = parseFrontmatter(content);

    return {
      id: crypto.randomUUID(),
      name: file.name,
      content: markdownContent,
      frontmatter,
      status: "pending",
    };
  }, []);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const markdownFiles = Array.from(fileList).filter(
        (file) => file.name.endsWith(".md") || file.name.endsWith(".markdown")
      );

      if (markdownFiles.length === 0) {
        alert("Please select markdown files (.md or .markdown)");
        return;
      }

      const processedFiles: ProcessedFile[] = [];

      for (const file of markdownFiles) {
        try {
          const processed = await processFile(file);
          processedFiles.push(processed);
        } catch {
          processedFiles.push({
            id: crypto.randomUUID(),
            name: file.name,
            content: "",
            frontmatter: null,
            status: "error",
            error: "Failed to read file",
          });
        }
      }

      setFiles((prev) => [...prev, ...processedFiles]);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const saveToDatabase = async (file: ProcessedFile) => {
    if (file.status === "processing" || file.status === "success") return;

    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "processing" } : f)));

    try {
      // Get the full markdown content with frontmatter
      const fullContent = file.frontmatter
        ? `---\ntitle: "${file.frontmatter.title}"\nexcerpt: "${
            file.frontmatter.excerpt
          }"\ncategory: "${file.frontmatter.category}"\ndate: "${
            file.frontmatter.date
          }"\ntags: ${JSON.stringify(file.frontmatter.tags)}\n---\n\n${file.content}`
        : file.content;

      // Call the edge function
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-markdown`;

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markdown: fullContent,
          filename: file.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process markdown");
      }

      const result = await response.json();

      if (result.success) {
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "success" } : f)));
      } else {
        throw new Error(result.error || "Failed to save article");
      }
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Failed to save",
              }
            : f
        )
      );
    }
  };

  const saveAllFiles = async () => {
    setIsProcessing(true);
    const pendingFiles = files.filter((f) => f.status === "pending");

    for (const file of pendingFiles) {
      await saveToDatabase(file);
      // Small delay to avoid overwhelming the edge function
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setIsProcessing(false);
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white/80 to-zinc-50/80 dark:from-zinc-800/85 dark:to-zinc-900/85">
      {/* Header */}
      <header className="border-b border-zinc-100 dark:border-zinc-700/50 bg-white dark:bg-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="font-mono text-sm">Back to Dashboard</span>
            </button>
            <h1 className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Markdown File Uploader
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragOver
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500 mb-4" />
          <h3 className="font-mono text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Drop your markdown files here
          </h3>
          <p className="font-mono text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            or click to select files
          </p>
          <input
            type="file"
            multiple
            accept=".md,.markdown"
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="inline-flex items-center px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-mono text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Select Files
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-mono text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Files ({files.length})
              </h2>
              {pendingCount > 0 && (
                <button
                  onClick={saveAllFiles}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full font-mono text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : `Save All (${pendingCount})`}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-zinc-400" />
                    <div>
                      <h3 className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {file.name}
                      </h3>
                      {file.frontmatter?.title && (
                        <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                          Title: {file.frontmatter.title}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === "pending" && (
                      <button
                        onClick={() => saveToDatabase(file)}
                        className="px-3 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-mono text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                      >
                        Save
                      </button>
                    )}
                    {file.status === "processing" && (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                        <span className="font-mono text-xs">Processing...</span>
                      </div>
                    )}
                    {file.status === "success" && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-mono text-xs">Saved</span>
                      </div>
                    )}
                    {file.status === "error" && (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-mono text-xs">{file.error}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            {(successCount > 0 || errorCount > 0) && (
              <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-4 font-mono text-sm">
                  {successCount > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ {successCount} saved
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-600 dark:text-red-400">✗ {errorCount} failed</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
