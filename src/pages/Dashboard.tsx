import { Badge } from "../components/ui/badge";
import { BookOpen, Clock, Plus, Upload, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Tables } from "../../database.types";

type Article = Tables<"articles">;

export function Dashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setArticles(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch articles");
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  return (
    <main className="min-h-screen pt-20 bg-gradient-to-b from-white/80 to-zinc-50/80 dark:from-zinc-800/95 dark:to-zinc-900/95">
      {/* Hero Section */}
      <div className="relative border-b border-zinc-100 dark:border-zinc-700/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.05),rgba(255,255,255,0))]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Blog Dashboard
            </h1>
            <p className="font-mono text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-8">
              Manage your blog posts, drafts, and published articles all in one place.
            </p>
            <div className="flex items-center gap-4 justify-center">
              <Link
                to="/editor"
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-mono text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                <Plus size={16} />
                New Article
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-mono text-sm hover:bg-blue-700 transition-colors"
              >
                <Upload size={16} />
                Upload Files
              </Link>
              <Link
                to="/articles"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full font-mono text-sm hover:bg-green-700 transition-colors"
              >
                <FileText size={16} />
                Manage Articles
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Articles Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Grid Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <h2 className="font-mono text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Your Articles
            </h2>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span className="font-mono">Sort by Date</span>
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100 mb-4" />
              <p className="font-mono text-zinc-600 dark:text-zinc-400">Loading articles...</p>
            </div>
          ) : error ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 mb-6">
                <BookOpen className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-mono text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                Error Loading Articles
              </h3>
              <p className="font-mono text-zinc-600 dark:text-zinc-400 max-w-md">{error}</p>
            </div>
          ) : articles.length > 0 ? (
            articles.map((article) => (
              <Link
                key={article.id}
                to={`/editor/${article.id}`}
                className="group block bg-white dark:bg-zinc-800 rounded-2xl lg:rounded-3xl 
                  border-2 border-zinc-100 dark:border-zinc-700/50 
                  hover:border-black dark:hover:border-white 
                  transition-all duration-300 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50
                  hover:-translate-y-1 hover:scale-[1.01] overflow-hidden"
              >
                <div className="relative h-full">
                  {/* Gradient Header */}
                  <div className="relative bg-gradient-to-br from-[#333] to-zinc-700 dark:from-zinc-700 dark:to-zinc-800 p-6 lg:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.04),rgba(255,255,255,0))] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      {/* Status Badge */}
                      <Badge
                        className={`${
                          article.status === "published"
                            ? "bg-green-500/20 text-green-500"
                            : article.status === "draft"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-zinc-500/20 text-zinc-500"
                        } px-3 lg:px-4 py-2 rounded-full text-[10px] lg:text-xs font-mono mb-4`}
                      >
                        {article.status}
                      </Badge>

                      {/* Title */}
                      <h3 className="font-mono text-xl font-bold text-white mb-3 group-hover:text-white/90 transition-colors duration-300">
                        {article.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="font-mono text-sm text-white/60 line-clamp-3">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Content Footer */}
                  <div className="p-6 lg:p-8 bg-white dark:bg-zinc-800">
                    <div className="space-y-6">
                      {/* Meta Information */}
                      <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span className="font-mono text-xs">{article.read_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{article.category}</span>
                        </div>
                      </div>

                      {/* Edit Button */}
                      <button
                        className="w-full text-left font-mono text-sm text-zinc-600 dark:text-zinc-300 
                          group-hover:text-[#333] dark:group-hover:text-white flex items-center justify-between"
                      >
                        <span>EDIT ARTICLE</span>
                        <svg
                          className="w-4 h-4 transition-transform group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full p-4 mb-6">
                <BookOpen className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-mono text-xl font-bold text-zinc-900 dark:text-zinc-200 mb-2">
                No Articles Yet
              </h3>
              <p className="font-mono text-zinc-600 dark:text-zinc-400 max-w-md">
                Start writing your first article by clicking the "New Article" button above!
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
