import { useEditor, EditorContent, BubbleMenu, FloatingMenu, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import ImageResize from "tiptap-extension-resize-image";
import { cn } from "../lib/utils";
import { useTheme } from "../contexts/ThemeProvider";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Code,
  Quote,
  Strikethrough,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Minus,
  ListChecks,
  Moon,
  Sun,
} from "lucide-react";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

const MenuButton = ({
  onClick,
  isActive,
  children,
  title,
  disabled,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-300",
      isActive && "bg-zinc-100 dark:bg-zinc-800",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    {children}
  </button>
);

const ToolbarDivider = () => <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />;

export function MarkdownEditor({ content, onChange, className }: MarkdownEditorProps) {
  const { theme, setTheme } = useTheme();
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
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
      Image.configure({
        HTMLAttributes: {
          class: "rounded-xl border border-zinc-200 dark:border-zinc-700 max-w-full",
        },
      }),
      ImageResize.configure({
        HTMLAttributes: {
          class: "rounded-xl border border-zinc-200 dark:border-zinc-700 max-w-full",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }: { editor: Editor }) => {
      onChange(editor.getHTML());
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
      attributes: {
        class: "prose-mirror-editor",
        style: `
          caret-color: rgb(59 130 246);
          caret-width: 3px;
        `,
      },
    },
  });

  // Add custom styles for the editor
  useEffect(() => {
    if (!editor) return;

    // Add custom styles for the caret
    const style = document.createElement("style");
    style.textContent = `
      .prose-mirror-editor {
        caret-color: transparent !important;
      }
      .prose-mirror-editor::selection {
        background-color: rgba(59, 130, 246, 0.2);
      }
      .dark .prose-mirror-editor {
        caret-color: transparent !important;
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
    if (!editor) return;

    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const img = entry.target as HTMLImageElement;
        if (!img.dataset.nodeId) return;

        const pos = parseInt(img.dataset.nodeId, 10);
        if (isNaN(pos)) return;

        const { width, height } = entry.contentRect;
        editor.commands.updateAttributes("image", { width, height });
      });
    });

    const images = editor.view.dom.querySelectorAll("img");
    images.forEach((img) => {
      observer.observe(img);
      img.dataset.nodeId = editor.view.posAtDOM(img, 0).toString();
    });

    return () => observer.disconnect();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt("Enter URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("Enter image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col bg-gradient-to-b from-white/80 to-zinc-50/80 dark:from-zinc-800/85 dark:to-zinc-900/85",
        className
      )}
    >
      {/* Fixed Toolbar */}
      <div className="sticky top-0 z-50 w-full bg-gradient-to-br from-[#333] to-zinc-700 dark:from-zinc-700 dark:to-zinc-800 p-2 flex flex-wrap gap-1 items-center justify-center border-b border-zinc-200 dark:border-zinc-700/50">
        <div className="w-full flex flex-wrap gap-1 items-center justify-center">
          {/* History */}
          <div className="flex items-center">
            <MenuButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="w-4 h-4 text-white" />
            </MenuButton>
          </div>

          <ToolbarDivider />

          {/* Theme Toggle */}
          <div className="flex items-center">
            <MenuButton
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-white" />
              ) : (
                <Sun className="w-4 h-4 text-white" />
              )}
            </MenuButton>
          </div>

          <ToolbarDivider />

          {/* Text Style */}
          <div className="flex items-center">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold"
            >
              <Bold className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic"
            >
              <Italic className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4 text-white" />
            </MenuButton>
          </div>

          <ToolbarDivider />

          {/* Headings */}
          <div className="flex items-center">
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4 text-white" />
            </MenuButton>
          </div>

          <ToolbarDivider />

          {/* Lists */}
          <div className="flex items-center">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <List className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Ordered List"
            >
              <ListOrdered className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive("taskList")}
              title="Task List"
            >
              <ListChecks className="w-4 h-4 text-white" />
            </MenuButton>
          </div>

          <ToolbarDivider />

          {/* Other Formatting */}
          <div className="flex items-center">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title="Blockquote"
            >
              <Quote className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive("codeBlock")}
              title="Code Block"
            >
              <Code className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              <Minus className="w-4 h-4 text-white" />
            </MenuButton>
          </div>

          <ToolbarDivider />

          {/* Links and Images */}
          <div className="flex items-center">
            <MenuButton onClick={addLink} isActive={editor.isActive("link")} title="Add Link">
              <LinkIcon className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton onClick={addImage} title="Add Image">
              <ImageIcon className="w-4 h-4 text-white" />
            </MenuButton>
          </div>
        </div>
      </div>

      {/* Editor Content with Scroll */}
      <div className="flex-1 overflow-auto">
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="flex gap-1 p-1 bg-gradient-to-br from-[#333] to-zinc-700 dark:from-zinc-700 dark:to-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg"
          >
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold"
            >
              <Bold className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic"
            >
              <Italic className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <List className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Ordered List"
            >
              <ListOrdered className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive("taskList")}
              title="Task List"
            >
              <CheckSquare className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive("codeBlock")}
              title="Code Block"
            >
              <Code className="w-4 h-4 text-white" />
            </MenuButton>
          </BubbleMenu>
        )}

        {editor && (
          <FloatingMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="flex gap-1 p-1 bg-gradient-to-br from-[#333] to-zinc-700 dark:from-zinc-700 dark:to-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg"
          >
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              <List className="w-4 h-4 text-white" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              title="Task List"
            >
              <CheckSquare className="w-4 h-4 text-white" />
            </MenuButton>
          </FloatingMenu>
        )}

        <EditorContent
          editor={editor}
          className="prose prose-zinc dark:prose-invert max-w-4xl mx-auto p-6 min-h-[calc(100vh-4rem)]
            [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:focus:border-none
            [&_.ProseMirror]:font-mono [&_.ProseMirror]:text-zinc-600 dark:[&_.ProseMirror]:text-zinc-300
            [&_.ProseMirror_caret]:!visible [&_.ProseMirror_caret]:!w-[3px] [&_.ProseMirror_caret]:!bg-blue-500 dark:[&_.ProseMirror_caret]:!bg-blue-400 [&_.ProseMirror_caret]:!animate-none
            [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:text-zinc-900 dark:[&_.ProseMirror_h1]:text-zinc-200 [&_.ProseMirror_h1]:mb-4
            [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-zinc-900 dark:[&_.ProseMirror_h2]:text-zinc-200 [&_.ProseMirror_h2]:mb-3
            [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:text-zinc-900 dark:[&_.ProseMirror_h3]:text-zinc-200 [&_.ProseMirror_h3]:mb-2
            [&_.ProseMirror_p]:mb-4 [&_.ProseMirror_p]:leading-relaxed
            [&_.ProseMirror_a]:text-blue-600 dark:[&_.ProseMirror_a]:text-blue-400 [&_.ProseMirror_a]:hover:underline
            [&_.ProseMirror_code]:bg-zinc-100 dark:[&_.ProseMirror_code]:bg-zinc-800 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-zinc-900 dark:[&_.ProseMirror_code]:text-zinc-200
            [&_.ProseMirror_pre]:bg-zinc-100 dark:[&_.ProseMirror_pre]:bg-zinc-800 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:border [&_.ProseMirror_pre]:border-zinc-200 dark:[&_.ProseMirror_pre]:border-zinc-700
            [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-zinc-300 dark:[&_.ProseMirror_blockquote]:border-zinc-600 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic
            [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-4
            [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:mb-4
            [&_.ProseMirror_li]:mb-1
            [&_.ProseMirror_img]:rounded-xl [&_.ProseMirror_img]:border [&_.ProseMirror_img]:border-zinc-200 dark:[&_.ProseMirror_img]:border-zinc-700
            [&_.ProseMirror_hr]:border-zinc-200 dark:[&_.ProseMirror_hr]:border-zinc-700 [&_.ProseMirror_hr]:my-8"
        />
      </div>
    </div>
  );
}
