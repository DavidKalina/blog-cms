import { useState } from "react";
import { X, Plus } from "lucide-react";
import type { Tables } from "../../../database.types";

type Article = Tables<"articles">;

interface MetadataEditorProps {
  article: Article | null;
  onUpdate: (updates: Partial<Article>) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function MetadataEditor({ article, onUpdate, tags, onTagsChange }: MetadataEditorProps) {
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (tags.includes(newTag.trim())) return;
    onTagsChange([...tags, newTag.trim()]);
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!article) return null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          value={article.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          placeholder="Enter article title"
        />
      </div>

      {/* Excerpt */}
      <div>
        <label
          htmlFor="excerpt"
          className="block font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
        >
          Excerpt
        </label>
        <textarea
          id="excerpt"
          value={article.excerpt}
          onChange={(e) => onUpdate({ excerpt: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
          rows={3}
          placeholder="Enter article excerpt"
        />
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="block font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
        >
          Category
        </label>
        <input
          type="text"
          id="category"
          value={article.category}
          onChange={(e) => onUpdate({ category: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          placeholder="Enter article category"
        />
      </div>

      {/* Tags */}
      <div>
        <label
          htmlFor="tags"
          className="block font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
        >
          Tags
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-sm font-mono"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Add a tag"
          />
          <button
            onClick={handleAddTag}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-mono hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
