import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, FileText, Edit, Trash2, Upload, Calendar, Tag, Search } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Tables } from "../../database.types";

type Article = Tables<"articles">;

interface ArticleWithTags extends Article {
  tags: string[];
}

interface TagRecord {
  id: string;
  name: string;
}

export function ArticleManager() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<ArticleWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Article["status"] | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replacingArticle, setReplacingArticle] = useState<string | null>(null);

  // Fetch articles with tags
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (articlesError) throw articlesError;

      // Fetch tags for all articles
      const { data: tagsData, error: tagsError } = await supabase.from("article_tags").select(`
          article_id,
          tags (name)
        `);

      if (tagsError) throw tagsError;

      // Create a map of article_id to tags
      const articleTagsMap = new Map<string, string[]>();
      tagsData?.forEach((item: { article_id: string; tags: { name: string } }) => {
        const articleId = item.article_id;
        const tagName = item.tags?.name;
        if (articleId && tagName) {
          if (!articleTagsMap.has(articleId)) {
            articleTagsMap.set(articleId, []);
          }
          articleTagsMap.get(articleId)!.push(tagName);
        }
      });

      // Combine articles with their tags
      const articlesWithTags: ArticleWithTags[] = (articlesData || []).map((article) => ({
        ...article,
        tags: articleTagsMap.get(article.id) || [],
      }));

      setArticles(articlesWithTags);
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Filter articles based on search and filters
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || article.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(articles.map((article) => article.category)));

  // Handle file selection for replacement
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith(".md") || file.name.endsWith(".markdown"))) {
      setSelectedFile(file);
    }
  };

  // Replace article with new markdown file
  const replaceArticle = async (articleId: string) => {
    if (!selectedFile) return;

    try {
      setReplacingArticle(articleId);

      // Read the file content
      const content = await selectedFile.text();

      // Parse frontmatter
      const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
      const match = content.match(frontmatterRegex);

      let markdownContent = content;
      let title = selectedFile.name.replace(/\.(md|markdown)$/, "");
      let excerpt = "No excerpt provided";
      let category = "Uncategorized";
      let date = new Date().toISOString();
      let tags: string[] = [];

      if (match) {
        const [, frontmatterStr, mainContent] = match;
        markdownContent = mainContent.trim();

        // Parse frontmatter fields
        const lines = frontmatterStr.split("\n");
        for (const line of lines) {
          const [key, ...valueParts] = line.split(":");
          const value = valueParts.join(":").trim();

          if (key === "title") title = value.replace(/^"|"$/g, "");
          else if (key === "excerpt") excerpt = value.replace(/^"|"$/g, "");
          else if (key === "category") category = value.replace(/^"|"$/g, "");
          else if (key === "date") date = value.replace(/^"|"$/g, "");
          else if (key === "tags") {
            try {
              tags = JSON.parse(value);
            } catch {
              tags = [];
            }
          }
        }
      }

      // Update the article
      const { error: updateError } = await supabase
        .from("articles")
        .update({
          title,
          excerpt,
          category,
          markdown_content: markdownContent,
          updated_at: new Date().toISOString(),
          date,
        })
        .eq("id", articleId);

      if (updateError) throw updateError;

      // Update tags
      if (tags.length > 0) {
        // Delete existing tags
        await supabase.from("article_tags").delete().eq("article_id", articleId);

        // Ensure all tags exist
        const { data: existingTags, error: tagsError } = await supabase
          .from("tags")
          .select("id, name")
          .in("name", tags);

        if (tagsError) throw tagsError;

        const existingTagNames = new Set(existingTags.map((t: TagRecord) => t.name));
        const newTags = tags.filter((name) => !existingTagNames.has(name));

        if (newTags.length > 0) {
          const { data: insertedTags, error: insertError } = await supabase
            .from("tags")
            .insert(newTags.map((name) => ({ name })))
            .select();

          if (insertError) throw insertError;
          existingTags.push(...insertedTags);
        }

        // Create article-tag relationships
        const { error: relationError } = await supabase.from("article_tags").insert(
          existingTags.map((tag: TagRecord) => ({
            article_id: articleId,
            tag_id: tag.id,
          }))
        );

        if (relationError) throw relationError;
      }

      // Refresh articles
      await fetchArticles();
      setSelectedFile(null);
      setReplacingArticle(null);
    } catch (error) {
      console.error("Error replacing article:", error);
      setReplacingArticle(null);
    }
  };

  // Delete article
  const deleteArticle = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      // Delete article tags first
      await supabase.from("article_tags").delete().eq("article_id", articleId);

      // Delete the article
      const { error } = await supabase.from("articles").delete().eq("id", articleId);

      if (error) throw error;

      // Refresh articles
      await fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white/80 to-zinc-50/80 dark:from-zinc-800/85 dark:to-zinc-900/85 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100" />
      </div>
    );
  }

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
              Article Manager
            </h1>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-mono text-sm hover:bg-blue-700 transition-colors"
            >
              <Upload size={16} />
              Upload Files
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Article["status"] | "all")}
              className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Results Count */}
            <div className="flex items-center justify-end text-sm text-zinc-600 dark:text-zinc-400 font-mono">
              {filteredArticles.length} of {articles.length} articles
            </div>
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-zinc-400 mr-3" />
                        <div>
                          <div className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {article.title}
                          </div>
                          <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                            {article.excerpt}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-mono rounded-full ${
                          article.status === "published"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : article.status === "draft"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400"
                        }`}
                      >
                        {article.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 text-xs font-mono bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-mono bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 rounded-full">
                            +{article.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(article.created_at || "").toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/editor/${article.id}`)}
                          className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteArticle(article.id)}
                          className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".md,.markdown"
                            onChange={handleFileSelect}
                            className="hidden"
                            id={`replace-${article.id}`}
                          />
                          <label
                            htmlFor={`replace-${article.id}`}
                            className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title="Replace with file"
                          >
                            <Upload className="h-4 w-4" />
                          </label>
                        </div>
                        {selectedFile && (
                          <button
                            onClick={() => replaceArticle(article.id)}
                            disabled={replacingArticle === article.id}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-mono rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {replacingArticle === article.id ? "Replacing..." : "Replace"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
              <h3 className="font-mono text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                No articles found
              </h3>
              <p className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                {articles.length === 0
                  ? "Upload some markdown files to get started!"
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
