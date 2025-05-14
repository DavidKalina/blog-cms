import { Editor } from "@tiptap/react";
import { useTheme } from "../../contexts/ThemeProvider";
import { ToolbarButton } from "./ToolbarButton";
import { ToolbarDivider } from "./ToolbarDivider";
import { ToolbarSection } from "./ToolbarSection";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
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

interface ToolbarProps {
  editor: Editor;
}

export function Toolbar({ editor }: ToolbarProps) {
  const { theme, setTheme } = useTheme();

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
    <div className="sticky top-0 z-50 w-full bg-gradient-to-br from-[#333] to-zinc-700 dark:from-zinc-700 dark:to-zinc-800 p-2 flex flex-wrap gap-1 items-center justify-center border-b border-zinc-200 dark:border-zinc-700/50">
      <div className="w-full flex flex-wrap gap-1 items-center justify-center">
        {/* History */}
        <ToolbarSection>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="w-4 h-4 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="w-4 h-4 text-white" />
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarDivider />

        {/* Theme Toggle */}
        <ToolbarSection>
          <ToolbarButton
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-white" />
            ) : (
              <Sun className="w-4 h-4 text-white" />
            )}
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarDivider />

        {/* Text Style */}
        <ToolbarSection>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="w-4 h-4 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="w-4 h-4 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4 text-white" />
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarSection>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4 text-white" />
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarSection>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="w-4 h-4 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Ordered List"
          >
            <ListOrdered className="w-4 h-4 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive("taskList")}
            title="Task List"
          >
            <ListChecks className="w-4 h-4 text-white" />
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarDivider />

        {/* Other Formatting */}
        <ToolbarSection>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <Quote className="w-4 h-4 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            title="Code Block"
          >
            <Code className="w-4 h-4 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className="w-4 h-4 text-white" />
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarDivider />

        {/* Links and Images */}
        <ToolbarSection>
          <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} title="Add Link">
            <LinkIcon className="w-4 h-4 text-white" />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} title="Add Image">
            <ImageIcon className="w-4 h-4 text-white" />
          </ToolbarButton>
        </ToolbarSection>
      </div>
    </div>
  );
}
