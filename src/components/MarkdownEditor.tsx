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
import { useEffect } from "react";
import { Toolbar } from "./editor/Toolbar";
import { EditorContentArea } from "./editor/EditorContent";

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

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export function MarkdownEditor({ content, onChange, className }: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: "scroll-mt-16",
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
    ],
    content: content || "",
    onUpdate: ({ editor }: { editor: Editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items || !editor) return false;

        for (const item of items) {
          if (item.type.indexOf("image") === 0) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;

            const reader = new FileReader();
            reader.onload = (e) => {
              const base64Image = e.target?.result as string;
              if (base64Image && editor) {
                editor.chain().focus().setImage({ src: base64Image }).run();
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handleClick: () => {
        // Prevent default scroll behavior
        return false;
      },
      handleDOMEvents: {
        focus: (_view, event) => {
          // Prevent automatic scrolling on focus
          event.preventDefault();
          return false;
        },
        blur: (_view, event) => {
          // Prevent automatic scrolling on blur
          event.preventDefault();
          return false;
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

    try {
      if (!editor.isDestroyed) {
        editor.commands.setContent(content);
      }
    } catch (error) {
      console.error("Error initializing editor content:", error);
    }
  }, [editor, content]);

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
      <Toolbar editor={editor} />
      <EditorContentArea editor={editor} />
    </div>
  );
}
