import { EditorContent, Editor } from "@tiptap/react";
import "highlight.js/styles/github-dark.css";

interface EditorContentProps {
  editor: Editor;
}

export function EditorContentArea({ editor }: EditorContentProps) {
  return (
    <div className="flex-1 overflow-auto">
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
          [&_.ProseMirror_code]:bg-zinc-100 dark:[&_.ProseMirror_code]:bg-zinc-800 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:text-zinc-900 dark:[&_.ProseMirror_code]:text-zinc-200
          [&_.ProseMirror_pre]:!bg-[#0d1117] [&_.ProseMirror_pre]:!p-0 [&_.ProseMirror_pre]:!overflow-hidden [&_.ProseMirror_pre]:!rounded-none
          [&_.ProseMirror_pre_code]:!block [&_.ProseMirror_pre_code]:!p-4 [&_.ProseMirror_pre_code]:!text-sm [&_.ProseMirror_pre_code]:!text-zinc-200 [&_.ProseMirror_pre_code]:!font-mono [&_.ProseMirror_pre_code]:!whitespace-pre [&_.ProseMirror_pre_code]:!overflow-x-auto
          [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-zinc-300 dark:[&_.ProseMirror_blockquote]:border-zinc-600 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-4
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:mb-4
          [&_.ProseMirror_li]:mb-1
          [&_.ProseMirror_img]:rounded-xl [&_.ProseMirror_img]:border [&_.ProseMirror_img]:border-zinc-200 dark:[&_.ProseMirror_img]:border-zinc-700
          [&_.ProseMirror_hr]:border-zinc-200 dark:[&_.ProseMirror_hr]:border-zinc-700 [&_.ProseMirror_hr]:my-8"
      />
    </div>
  );
}
