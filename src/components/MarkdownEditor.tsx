import { useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import ImageResize from "tiptap-extension-resize-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import html from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import { cn } from "../lib/utils";
import { useEffect, useState, useRef } from "react";
import { Toolbar } from "./editor/Toolbar";
import { EditorContentArea } from "./editor/EditorContent";
import { SettingsModal } from "./editor/SettingsModal";
import type { Tables } from "../../database.types";
import { uploadArticleImage } from "../lib/supabase";
import { Markdown } from "tiptap-markdown";

// Register languages
const lowlight = createLowlight(common);

// Register additional languages
lowlight.register("javascript", js);
lowlight.register("typescript", ts);
lowlight.register("css", css);
lowlight.register("html", html);
lowlight.register("json", json);
lowlight.register("python", python);
lowlight.register("bash", bash);

type Article = Tables<"articles">;

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  article: Article | null;
  onArticleUpdate: (updates: Partial<Article>) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function MarkdownEditor({
  content,
  onChange,
  className,
  article,
  onArticleUpdate,
  tags,
  onTagsChange,
}: MarkdownEditorProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler for file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !article?.id || !editor) return;
    try {
      const url = await uploadArticleImage(article.id, file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      alert("Image upload failed");
    }
  };

  // Handler to trigger file input from toolbar
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: "",
          },
        },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "rounded-lg",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 hover:underline",
        },
      }),
      ImageResize.configure({
        HTMLAttributes: {
          class: "rounded-xl border border-zinc-200 dark:border-zinc-700 max-w-full",
        },
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }: { editor: Editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items || !editor || !article?.id) return false;

        // Handle image pasting
        for (const item of items) {
          if (item.type.indexOf("image") === 0) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;
            uploadArticleImage(article.id, file)
              .then((url) => {
                editor.chain().focus().setImage({ src: url }).run();
              })
              .catch(() => {
                alert("Image upload failed");
              });
            return true;
          }
        }

        // Let the markdown extension handle the paste
        return false;
      },
      handleClick: () => {
        const target = event?.target as HTMLElement;
        if (
          target?.tagName?.toLowerCase() === "h1" ||
          target?.tagName?.toLowerCase() === "h2" ||
          target?.tagName?.toLowerCase() === "h3"
        ) {
          return false;
        }
        return true;
      },
      handleDOMEvents: {
        focus: (_view, event) => {
          const target = event?.target as HTMLElement;
          if (
            target?.tagName?.toLowerCase() === "h1" ||
            target?.tagName?.toLowerCase() === "h2" ||
            target?.tagName?.toLowerCase() === "h3"
          ) {
            event.preventDefault();
            return false;
          }
          return true;
        },
        blur: (_view, event) => {
          const target = event?.target as HTMLElement;
          if (
            target?.tagName?.toLowerCase() === "h1" ||
            target?.tagName?.toLowerCase() === "h2" ||
            target?.tagName?.toLowerCase() === "h3"
          ) {
            event.preventDefault();
            return false;
          }
          return true;
        },
      },
      attributes: {
        class: "prose-mirror-editor",
        style: `
          caret-color: rgb(59 130 246);
          caret-width: 3px;
        `,
      },
    },
  });

  // Initialize editor with content
  useEffect(() => {
    if (!editor || !content) return;

    // Store current scroll position
    const scrollPosition = window.scrollY;

    try {
      if (!editor.isDestroyed) {
        // Only update content if it's different from current content
        const currentContent = editor.getHTML();
        if (currentContent !== content) {
          // Temporarily disable scroll behavior
          const originalScrollBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = "auto";

          editor.commands.setContent(content);

          // Restore scroll position and behavior
          window.scrollTo(0, scrollPosition);
          document.documentElement.style.scrollBehavior = originalScrollBehavior;
        }
      }
    } catch (error) {
      console.error("Error initializing editor content:", error);
    }
  }, [editor, content]);

  // Add scroll position preservation for editor updates
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      // Store scroll position before update
      const scrollPosition = window.scrollY;

      // Use requestAnimationFrame to restore scroll position after the update
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    };

    editor.on("update", handleUpdate);
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      editor.off("transaction", handleUpdate);
    };
  }, [editor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Add custom styles for the editor
  useEffect(() => {
    if (!editor) return;

    // Add custom styles for the caret
    const style = document.createElement("style");
    style.textContent = `
      .prose-mirror-editor {
        caret-color: rgb(59, 130, 246) !important;
      }
      .prose-mirror-editor::selection {
        background-color: rgba(59, 130, 246, 0.2);
      }
      .dark .prose-mirror-editor {
        caret-color: rgb(96, 165, 250) !important;
      }
      .dark .prose-mirror-editor::selection {
        background-color: rgba(96, 165, 250, 0.2);
      }
      /* Custom caret styling */
      .prose-mirror-editor .ProseMirror-cursor {
        border-left: 3px solid rgb(59, 130, 246) !important;
        border-right: none !important;
        margin-left: -1px;
      }
      .dark .prose-mirror-editor .ProseMirror-cursor {
        border-left: 3px solid rgb(96, 165, 250) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [editor]);

  // Add resize observer to handle image resizing
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    // Wait for the editor to be ready
    const setupResizeObserver = () => {
      const observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const img = entry.target as HTMLImageElement;
          if (!img.dataset.nodeId) return;

          const pos = parseInt(img.dataset.nodeId, 10);
          if (isNaN(pos)) return;

          const { width, height } = entry.contentRect;
          editor.commands.updateAttributes("image", { width, height, at: pos });
        });
      });

      // Only observe images that are already in the editor
      const images = editor.view.dom.querySelectorAll("img");
      images.forEach((img) => {
        try {
          const pos = editor.view.posAtDOM(img, 0);
          if (pos !== null) {
            img.dataset.nodeId = pos.toString();
            observer.observe(img);
          }
        } catch (error) {
          console.error("Error setting up image observer:", error);
        }
      });

      return observer;
    };

    // Small delay to ensure editor is ready
    const timeoutId = setTimeout(() => {
      const observer = setupResizeObserver();
      return () => {
        observer.disconnect();
        clearTimeout(timeoutId);
      };
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative flex flex-col bg-gradient-to-b from-white/80 to-zinc-50/80 dark:from-zinc-800/85 dark:to-zinc-900/85",
        className
      )}
    >
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Toolbar
        editor={editor}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onImageUpload={triggerImageUpload}
      />
      <EditorContentArea editor={editor} />
      <SettingsModal
        article={article}
        onUpdate={onArticleUpdate}
        tags={tags}
        onTagsChange={onTagsChange}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
