import { useCallback, useRef, useState, useEffect } from "react";
import type { ImageSize } from "../hooks/useImageUpload";

interface ResizableImageProps {
  src: string;
  alt: string;
  size?: ImageSize;
  onResize?: (newSize: ImageSize) => void;
  className?: string;
}

export function ResizableImage({ src, alt, size, onResize, className = "" }: ResizableImageProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [currentSize, setCurrentSize] = useState<ImageSize | undefined>(size);
  const imgRef = useRef<HTMLImageElement>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startSizeRef = useRef<ImageSize>({ width: 0, height: 0 });
  const aspectRatioRef = useRef<number>(1);

  // Store the original aspect ratio when the image loads
  useEffect(() => {
    if (imgRef.current) {
      const img = imgRef.current;
      if (img.complete) {
        aspectRatioRef.current = img.naturalWidth / img.naturalHeight;
      } else {
        img.onload = () => {
          aspectRatioRef.current = img.naturalWidth / img.naturalHeight;
        };
      }
    }
  }, [src]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest(".resize-handle")) {
      e.preventDefault();
      e.stopPropagation();

      // Prevent scrolling during resize
      document.body.style.overflow = "hidden";
      document.body.style.userSelect = "none";

      setIsResizing(true);
      startPosRef.current = { x: e.clientX, y: e.clientY };
      if (imgRef.current) {
        startSizeRef.current = {
          width: imgRef.current.offsetWidth,
          height: imgRef.current.offsetHeight,
        };
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !imgRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;

      // Always maintain aspect ratio by default
      let newWidth = startSizeRef.current.width + dx;
      let newHeight = newWidth / aspectRatioRef.current;

      // If shift key is pressed, allow free-form resizing
      if (e.shiftKey) {
        newHeight = startSizeRef.current.height + dy;
      }

      // Apply minimum size constraints while maintaining aspect ratio
      const minSize = 100;
      if (newWidth < minSize) {
        newWidth = minSize;
        newHeight = newWidth / aspectRatioRef.current;
      }
      if (newHeight < minSize) {
        newHeight = minSize;
        newWidth = newHeight * aspectRatioRef.current;
      }

      // Apply maximum size constraints (80% of viewport)
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.8;

      if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = newWidth / aspectRatioRef.current;
      }
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * aspectRatioRef.current;
      }

      setCurrentSize({ width: newWidth, height: newHeight });
      imgRef.current.style.width = `${newWidth}px`;
      imgRef.current.style.height = `${newHeight}px`;
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      // Restore scrolling and selection
      document.body.style.overflow = "";
      document.body.style.userSelect = "";

      if (currentSize) {
        onResize?.(currentSize);
      }
      setIsResizing(false);
    }
  }, [isResizing, currentSize, onResize]);

  // Set up and clean up event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove, { passive: false });
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Ensure we restore scrolling and selection if component unmounts during resize
      document.body.style.overflow = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`relative inline-block group ${className}`}
      onMouseDown={handleMouseDown}
      style={{ touchAction: "none" }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="inline-block rounded-md my-2 max-w-full select-none"
        style={
          currentSize
            ? {
                width: `${currentSize.width}px`,
                height: `${currentSize.height}px`,
                objectFit: "contain",
              }
            : undefined
        }
      />
      <div
        className="resize-handle absolute bottom-0 right-0 w-6 h-6 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-bl cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        style={{ touchAction: "none" }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-500 dark:text-zinc-400">
          <path
            fill="currentColor"
            d="M22 22H20V20H22V22M22 18H20V16H22V18M18 22H16V20H18V22M18 18H16V16H18V18M14 22H12V20H14V22M22 14H20V12H22V14Z"
          />
        </svg>
      </div>
      {isResizing && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-sm px-3 py-1.5 rounded-full pointer-events-none z-50">
          {Math.round(currentSize?.width || 0)} × {Math.round(currentSize?.height || 0)}
        </div>
      )}
    </div>
  );
}
