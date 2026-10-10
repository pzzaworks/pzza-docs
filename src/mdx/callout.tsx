import { CircleCheck, Info, OctagonX, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

export type CalloutType = "info" | "warn" | "error" | "success";

export interface CalloutProps {
  /** Defaults to "info". */
  type?: CalloutType;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const ICONS = {
  info: Info,
  warn: TriangleAlert,
  error: OctagonX,
  success: CircleCheck,
} as const;

/** Tinted note box. The icon and title share one row; the body sits under them. */
export function Callout({ type = "info", title, children, className }: CalloutProps) {
  const Icon = ICONS[type];
  return (
    <div
      className={["pd-callout", className].filter(Boolean).join(" ")}
      data-type={type}
      data-untitled={title ? undefined : ""}
      role="note"
    >
      <div className="pd-callout-head">
        <Icon className="pd-callout-icon" size={15} aria-hidden />
        {title ? <p className="pd-callout-title">{title}</p> : null}
      </div>
      <div className="pd-callout-body">
        <div className="pd-callout-content">{children}</div>
      </div>
    </div>
  );
}
