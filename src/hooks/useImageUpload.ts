import { useState, useCallback } from "react";
import type { ClipboardEvent } from "react";
import type { EditorView } from "@codemirror/view";

export interface ImageSize {
  width: number;
  height: number;
}

export interface ImageData {
  url: string;
  alt: string;
  size?: ImageSize;
}

export function useImageUpload(editorView: EditorView | null) {
  const [isProcessing, setIsProcessing] = useState(false);

  const insertImageMarkdown = useCallback(
    (imageData: ImageData) => {
      if (!editorView) return;

      const { url, alt, size } = imageData;
      const sizeStr = size ? `|${size.width}x${size.height}` : "";
      const markdown = `![${alt}${sizeStr}](${url})`;

      // Get current selection or cursor position
      const { from } = editorView.state.selection.main;

      editorView.dispatch({
        changes: { from, insert: markdown },
      });
    },
    [editorView]
  );

  const handlePaste = useCallback(
    async (e: ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          setIsProcessing(true);

          try {
            const file = item.getAsFile();
            if (!file) continue;

            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });

            insertImageMarkdown({
              url: base64,
              alt: file.name,
            });
          } catch (error) {
            console.error("Error processing pasted image:", error);
          } finally {
            setIsProcessing(false);
          }
        }
      }
    },
    [insertImageMarkdown]
  );

  const updateImageSize = useCallback(
    (imageData: ImageData, newSize: ImageSize) => {
      if (!editorView) return;

      const doc = editorView.state.doc.toString();
      const { url, alt } = imageData;

      // Create regex that matches the image markdown with or without size
      const regex = new RegExp(`!\\[${alt}(?:\\|\\d+x\\d+)?\\]\\(${url}\\)`);
      const newMarkdown = `![${alt}|${newSize.width}x${newSize.height}](${url})`;

      editorView.dispatch({
        changes: {
          from: 0,
          to: doc.length,
          insert: doc.replace(regex, newMarkdown),
        },
      });
    },
    [editorView]
  );

  return {
    handlePaste,
    insertImageMarkdown,
    updateImageSize,
    isProcessing,
  };
}
