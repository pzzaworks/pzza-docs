"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLabels } from "../../ui/client/labels.js";

export interface CopyButtonProps {
  /** Text written to the clipboard. When omitted the nearest `<pre>` is read instead. */
  text?: string;
  className?: string;
}

/** Reads the visible code from a `<pre>`, dropping removed diff lines. */
function readPre(button: HTMLButtonElement): string {
  const pre = button.closest(".pd-code")?.querySelector("pre") ?? button.parentElement?.querySelector("pre");
  if (!pre) return "";
  const clone = pre.cloneNode(true) as HTMLElement;
  for (const line of clone.querySelectorAll(".line.diff.remove")) {
    const trailing = line.nextSibling;
    if (trailing?.nodeType === Node.TEXT_NODE && trailing.textContent === "\n") trailing.remove();
    line.remove();
  }
  return clone.textContent ?? "";
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const labels = useLabels();
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const onClick = useCallback(() => {
    const value = text ?? (ref.current ? readPre(ref.current) : "");
    void navigator.clipboard.writeText(value).then(() => setCopied(true));
  }, [text]);

  return (
    <button
      ref={ref}
      type="button"
      className={["pd-copy", className].filter(Boolean).join(" ")}
      onClick={onClick}
      aria-label={labels.copyCode}
      data-copied={copied ? "" : undefined}
    >
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      <span className="pd-sr-only" aria-live="polite">
        {copied ? labels.copied : ""}
      </span>
    </button>
  );
}
