import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EditorView } from "@codemirror/view";
import { Bold, Italic, Heading1, Heading2, List, Eye, EyeOff } from "lucide-react";

interface MarkdownEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

const toolbarButtons = [
  {
    icon: Bold,
    title: "Bold",
    action: (text: string, sel: [number, number]) => wrapSelection(text, sel, "**", "**"),
  },
  {
    icon: Italic,
    title: "Italic",
    action: (text: string, sel: [number, number]) => wrapSelection(text, sel, "*", "*"),
  },
  {
    icon: Heading1,
    title: "Heading 1",
    action: (text: string, sel: [number, number]) => insertAtLineStart(text, sel, "# "),
  },
  {
    icon: Heading2,
    title: "Heading 2",
    action: (text: string, sel: [number, number]) => insertAtLineStart(text, sel, "## "),
  },
  {
    icon: List,
    title: "Bullet List",
    action: (text: string, sel: [number, number]) => insertAtLineStart(text, sel, "- "),
  },
];

function wrapSelection(text: string, sel: [number, number], before: string, after: string) {
  const [start, end] = sel;
  return text.slice(0, start) + before + text.slice(start, end) + after + text.slice(end);
}

function insertAtLineStart(text: string, sel: [number, number], prefix: string) {
  const [start, end] = sel;
  const before = text.slice(0, start);
  const selection = text.slice(start, end);
  const after = text.slice(end);
  // Find start of the line
  const lineStart = before.lastIndexOf("\n") + 1;
  return before.slice(0, lineStart) + prefix + before.slice(lineStart) + selection + after;
}

export function MarkdownEditor({ initialContent = "", onChange }: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [preview, setPreview] = useState(false);
  const [selection, setSelection] = useState<[number, number]>([0, 0]);

  const handleChange = (value: string) => {
    setContent(value);
    onChange?.(value);
  };

  const handleToolbarClick = (action: (text: string, sel: [number, number]) => string) => {
    const newValue = action(content, selection);
    setContent(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="relative">
      {/* Fixed Toolbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-white/95 to-white/90 dark:from-zinc-800/95 dark:to-zinc-800/90 border-b border-zinc-100 dark:border-zinc-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Formatting Tools */}
            <div className="flex items-center gap-1">
              {toolbarButtons.map((btn) => (
                <button
                  key={btn.title}
                  title={btn.title}
                  className="p-1.5 rounded-md bg-gradient-to-r from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900
                    text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700
                    transition-all duration-300 
                    hover:text-black dark:hover:text-white
                    hover:border-zinc-900 dark:hover:border-zinc-400
                    hover:from-zinc-50 hover:to-white dark:hover:from-zinc-700 dark:hover:to-zinc-800
                    hover:shadow-sm hover:-translate-y-0.5"
                  onClick={() => handleToolbarClick(btn.action)}
                  type="button"
                >
                  <btn.icon size={16} />
                </button>
              ))}
            </div>

            {/* Right Section - Preview Toggle */}
            <button
              className="px-4 py-1.5 rounded-md bg-gradient-to-r from-[#333] via-zinc-800 to-[#333] dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-700
                text-white font-mono text-xs group
                border border-zinc-800 dark:border-zinc-600
                transition-all duration-300 
                hover:border-white dark:hover:border-zinc-400
                hover:from-[#444] hover:via-zinc-700 hover:to-[#444] 
                dark:hover:from-zinc-600 dark:hover:via-zinc-700 dark:hover:to-zinc-600
                hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.6)]
                hover:-translate-y-0.5"
              onClick={() => setPreview((p) => !p)}
              type="button"
            >
              {preview ? (
                <>
                  <EyeOff
                    className="inline-block mr-1.5 transition-transform group-hover:translate-x-0.5"
                    size={14}
                  />
                  PREVIEW
                </>
              ) : (
                <>
                  <Eye
                    className="inline-block mr-1.5 transition-transform group-hover:translate-x-0.5"
                    size={14}
                  />
                  EDIT
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor/Preview Area - Update padding to match new toolbar height */}
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-8">
          {preview ? (
            <div className="prose dark:prose-invert max-w-none prose-headings:font-mono prose-p:font-mono prose-li:font-mono prose-a:text-blue-600 dark:prose-a:text-blue-400">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.04),rgba(255,255,255,0))] opacity-0 hover:opacity-100 transition-opacity duration-500" />
              <CodeMirror
                value={content}
                height="calc(100vh - 12rem)"
                extensions={[
                  markdown(),
                  EditorView.lineWrapping,
                  EditorView.theme({
                    "&": {
                      padding: "0",
                      outline: "none !important",
                      border: "none !important",
                    },
                    ".cm-editor": {
                      outline: "none !important",
                      border: "none !important",
                    },
                    ".cm-scroller": {
                      outline: "none !important",
                      border: "none !important",
                    },
                    ".cm-gutters": {
                      display: "none",
                    },
                    ".cm-focused": {
                      outline: "none !important",
                      border: "none !important",
                    },
                    ".cm-content": {
                      caretColor: "currentColor",
                      outline: "none !important",
                      border: "none !important",
                    },
                    ".cm-line": {
                      outline: "none !important",
                      border: "none !important",
                    },
                    ".cm-activeLine": {
                      background: "transparent !important",
                    },
                    ".cm-activeLineGutter": {
                      background: "transparent !important",
                    },
                  }),
                ]}
                theme={"light"}
                onChange={handleChange}
                onUpdate={(viewUpdate) => {
                  const sel = viewUpdate.state.selection.main;
                  setSelection([sel.from, sel.to]);
                }}
                className="font-mono text-zinc-900 dark:text-zinc-200 bg-transparent dark:bg-transparent
                  [&_.cm-editor]:bg-transparent [&_.cm-editor]:dark:bg-transparent
                  [&_.cm-scroller]:bg-transparent [&_.cm-scroller]:dark:bg-transparent
                  [&_.cm-content]:font-mono [&_.cm-content]:text-lg
                  [&_.cm-line]:px-0 [&_.cm-line]:py-1
                  [&_.cm-cursor]:border-l-2 [&_.cm-cursor]:border-zinc-900 [&_.cm-cursor]:dark:border-zinc-100
                  [&_.cm-editor]:!outline-none [&_.cm-editor]:!border-none
                  [&_.cm-scroller]:!outline-none [&_.cm-scroller]:!border-none
                  [&_.cm-content]:!outline-none [&_.cm-content]:!border-none
                  [&_.cm-line]:!outline-none [&_.cm-line]:!border-none
                  [&_.cm-activeLine]:!bg-transparent [&_.cm-activeLineGutter]:!bg-transparent"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
