import { cn } from "../../lib/utils";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}

export function ToolbarButton({
  onClick,
  isActive,
  children,
  title,
  disabled,
}: ToolbarButtonProps) {
  return (
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
}
