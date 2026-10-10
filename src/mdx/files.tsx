import { File as FileIcon, FolderIcon, FolderOpen } from "lucide-react";
import type { ReactNode } from "react";

export interface FilesProps {
  children: ReactNode;
  className?: string;
}

/** File tree container. Nest `Folder` and `File` inside it. */
export function Files({ children, className }: FilesProps) {
  return (
    <div className={["pd-files", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export interface FolderProps {
  name: string;
  defaultOpen?: boolean;
  children?: ReactNode;
  className?: string;
}

/** Collapsible directory built on native details/summary so it works without JavaScript. */
export function Folder({ name, defaultOpen, children, className }: FolderProps) {
  return (
    <details className={["pd-files-folder", className].filter(Boolean).join(" ")} open={defaultOpen}>
      <summary className="pd-files-row pd-files-folder-row">
        <FolderIcon size={14} className="pd-files-icon pd-files-icon-closed" aria-hidden />
        <FolderOpen size={14} className="pd-files-icon pd-files-icon-open" aria-hidden />
        <span className="pd-files-name">{name}</span>
      </summary>
      <div className="pd-files-children">{children}</div>
    </details>
  );
}

export interface FileProps {
  name: string;
  /** Replaces the default file icon. */
  icon?: ReactNode;
  className?: string;
}

export function File({ name, icon, className }: FileProps) {
  return (
    <div className={["pd-files-row pd-files-file", className].filter(Boolean).join(" ")}>
      <span className="pd-files-icon">{icon ?? <FileIcon size={14} aria-hidden />}</span>
      <span className="pd-files-name">{name}</span>
    </div>
  );
}
