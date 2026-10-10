import { ChevronRight } from "lucide-react";
import type { TocItem } from "../types.js";

export interface InlineTOCProps {
  items: TocItem[];
  /** Expanded on first render. */
  defaultOpen?: boolean;
  /** Summary label. Defaults to "Table of contents". */
  title?: string;
  className?: string;
}

/** Collapsible list of the page headings for use inside the article body. */
export function InlineTOC({ items, defaultOpen, title = "Table of contents", className }: InlineTOCProps) {
  if (items.length === 0) return null;
  return (
    <details className={["pd-inline-toc", className].filter(Boolean).join(" ")} open={defaultOpen}>
      <summary className="pd-inline-toc-trigger">
        <ChevronRight className="pd-inline-toc-chevron" size={14} aria-hidden />
        <span>{title}</span>
      </summary>
      <ul className="pd-inline-toc-list">
        {items.map((item) => (
          <li key={item.id} data-depth={item.depth}>
            <a href={`#${item.id}`} className="pd-inline-toc-link">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
