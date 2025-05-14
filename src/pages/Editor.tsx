import { MarkdownEditor } from "../components/MarkdownEditor";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewArticle = !id;

  // TODO: Fetch article content if editing existing article
  const content = isNewArticle
    ? "# New Article\n\nStart writing your content here..."
    : "# Loading article...";

  return (
    <div className="h-screen flex flex-col">
      {/* Editor Header */}
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
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-sm font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Save Draft
              </button>
              <button className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-mono text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                Publish
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor content={content} onChange={() => {}} className="h-full" />
      </div>
    </div>
  );
}
