import type { ReactNode } from "react";

interface ToolbarSectionProps {
  children: ReactNode;
}

export function ToolbarSection({ children }: ToolbarSectionProps) {
  return <div className="flex items-center">{children}</div>;
}
