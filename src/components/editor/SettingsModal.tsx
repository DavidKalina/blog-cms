import { X } from "lucide-react";
import { MetadataEditor } from "./MetadataEditor";
import type { Tables } from "../../../database.types";
import { supabase } from "../../lib/supabase";
import { useState } from "react";

type Article = Tables<"articles">;

interface SettingsModalProps {
  article: Article | null;
  onUpdate: (updates: Partial<Article>) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({
  article,
  onUpdate,
  tags,
  onTagsChange,
  isOpen,
  onClose,
}: SettingsModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!article) return;

    setSaving(true);
    setError(null);

    try {
      // Start a transaction
      const { error: articleError } = await supabase.from("articles").upsert({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        category: article.category,
        read_time: article.read_time,
        status: article.status,
        markdown_content: article.markdown_content,
        html_content: article.html_content,
        created_at: article.created_at,
        updated_at: new Date().toISOString(),
        date: article.date,
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
        if (tags.length > 0) {
          // First ensure all tags exist
          const { data: existingTags, error: tagsError } = await supabase
            .from("tags")
            .select("id, name")
            .in("name", tags);

          if (tagsError) throw tagsError;

          const existingTagNames = new Set(existingTags.map((t) => t.name));
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
            existingTags.map((tag) => ({
              article_id: article.id,
              tag_id: tag.id,
            }))
          );

          if (relationError) throw relationError;
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-700/50">
          <h2 className="font-mono text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Article Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <MetadataEditor
            article={article}
            onUpdate={onUpdate}
            tags={tags}
            onTagsChange={onTagsChange}
            isOpen={true}
            onClose={onClose}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-700/50 flex items-center justify-end gap-3">
          {error && (
            <span className="text-sm text-red-500 dark:text-red-400 font-mono flex-1">{error}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-mono text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
