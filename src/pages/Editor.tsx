import { MarkdownEditor } from "../components/MarkdownEditor";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Tables } from "../../database.types";

type Article = Tables<"articles">;

interface Frontmatter {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  tags: string[];
}

function parseFrontmatter(content: string): { frontmatter: Frontmatter | null; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: null, content };
  }

  const [, frontmatterStr, mainContent] = match;
  const frontmatter: Frontmatter = {
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

function generateFrontmatter(article: Article): string {
  return `---\ntitle: "${article.title}"\nexcerpt: "${article.excerpt}"\ncategory: "${
    article.category
  }"\ndate: "${article.date || new Date().toISOString()}"\ntags: ${JSON.stringify(
    article.tags || []
  )}\n---\n\n`;
}

export function Editor() {
  const params = useParams();
  const id = params.id;
  const navigate = useNavigate();
  const isNewArticle = !id;

  const [article, setArticle] = useState<Article | null>(null);
  const [articleTags, setArticleTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(!isNewArticle);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNewArticle) return;

    async function fetchArticle() {
      if (!id) return;

      try {
        // Fetch article data
        const { data: articleData, error: articleError } = await supabase
          .from("articles")
          .select("*")
          .eq("id", id)
          .single();

        if (articleError) throw articleError;

        // Fetch article tags
        const { data: tagsData, error: tagsError } = await supabase
          .from("article_tags")
          .select("tag_id")
          .eq("article_id", id);

        if (tagsError) throw tagsError;

        // Get tag names
        const tagIds = tagsData.map((t) => t.tag_id);
        const { data: tagNames, error: tagNamesError } = await supabase
          .from("tags")
          .select("name")
          .in("id", tagIds);

        if (tagNamesError) throw tagNamesError;

        // Parse frontmatter from content if it exists
        let markdownContent = articleData.markdown_content || "";
        if (markdownContent) {
          const { frontmatter, content } = parseFrontmatter(markdownContent);
          if (frontmatter) {
            // Update article with frontmatter data
            articleData.title = frontmatter.title || articleData.title;
            articleData.excerpt = frontmatter.excerpt || articleData.excerpt;
            articleData.category = frontmatter.category || articleData.category;
            articleData.date = frontmatter.date || articleData.date;
            // Update content without frontmatter
            markdownContent = content;
          }
        }

        setArticle({ ...articleData, markdown_content: markdownContent });
        setArticleTags(tagNames.map((t) => t.name));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch article");
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [id, isNewArticle]);

  const handleSave = async (status: Article["status"] = "draft") => {
    if (!article?.markdown_content) return;

    setSaving(true);
    try {
      // Generate frontmatter and combine with content
      const fullContent =
        generateFrontmatter({ ...article, tags: articleTags }) + article.markdown_content;

      // Start a transaction
      const { error: articleError } = await supabase.from("articles").upsert({
        ...article,
        markdown_content: fullContent,
        status,
        updated_at: new Date().toISOString(),
      });

      if (articleError) throw articleError;

      // If we have an article ID, update the tags
      if (article.id) {
        // Delete existing tags
        const { error: deleteError } = await supabase
          .from("article_tags")
          .delete()
          .eq("article_id", article.id);

        if (deleteError) throw deleteError;

        // Insert new tags
        if (articleTags.length > 0) {
          // First ensure all tags exist
          const { data: existingTags, error: tagsError } = await supabase
            .from("tags")
            .select("id, name")
            .in("name", articleTags);

          if (tagsError) throw tagsError;

          const existingTagNames = new Set(existingTags.map((t) => t.name));
          const newTags = articleTags.filter((name) => !existingTagNames.has(name));

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
            existingTags.map((tag) => ({
              article_id: article.id,
              tag_id: tag.id,
            }))
          );

          if (relationError) throw relationError;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!article?.markdown_content || !article.id) return;

    setSaving(true);
    try {
      // Generate frontmatter and combine with content before publishing
      const fullContent = generateFrontmatter(article) + article.markdown_content;

      // Update the article with frontmatter before publishing
      await supabase
        .from("articles")
        .update({ markdown_content: fullContent })
        .eq("id", article.id);

      const { error } = await supabase.rpc("publish_article", {
        article_id: article.id,
      });

      if (error) throw error;
      setArticle((prev) => (prev ? { ...prev, status: "published" } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish article");
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (content: string) => {
    setArticle((prev) =>
      prev
        ? {
            ...prev,
            markdown_content: content,
            html_content: null, // We'll generate this on save
          }
        : {
            id: crypto.randomUUID(),
            title: "Untitled Article",
            slug: "untitled-article",
            excerpt: "No excerpt provided",
            category: "Uncategorized",
            read_time: "5 min read",
            status: "draft",
            markdown_content: content,
            html_content: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            date: null,
            tags: [],
          }
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 mb-6">
          <ArrowLeft className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="font-mono text-xl font-bold text-red-600 dark:text-red-400 mb-2">
          Error Loading Article
        </h3>
        <p className="font-mono text-zinc-600 dark:text-zinc-400 max-w-md mb-8">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-mono text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

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
              <button
                onClick={() => handleSave("draft")}
                disabled={saving}
                className="px-4 py-2 text-sm font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={handlePublish}
                disabled={saving || article?.status === "published"}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-mono text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? "Publishing..."
                  : article?.status === "published"
                  ? "Published"
                  : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor
          content={
            article?.markdown_content || "# New Article\n\nStart writing your content here..."
          }
          onChange={handleContentChange}
          className="h-full"
        />
      </div>
    </div>
  );
}
