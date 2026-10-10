"use client";

import { ChevronDown, Text } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TocItem } from "../../types.js";

export interface TOCProps {
  items: TocItem[];
  className?: string;
  /** "bar" forces the popover bar at every width (used by full-width pages). Defaults to "auto". */
  variant?: "auto" | "bar";
}

/**
 * "On this page" list. Sticky right column from 1024px; below that it becomes
 * a 36px bar that expands into a popover. The active heading is tracked with
 * an IntersectionObserver over the heading elements.
 */
export function TOC({ items, className, variant = "auto" }: TOCProps) {
  const [active, setActive] = useState<string | undefined>(items[0]?.id);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const visible = new Map<string, number>();
    const pick = (): void => {
      if (visible.size > 0) {
        // Topmost intersecting heading wins.
        const [top] = [...visible.entries()].sort((a, b) => a[1] - b[1]);
        if (top) setActive(top[0]);
        return;
      }
      // Nothing in view: the closest heading above the viewport top.
      let best: HTMLElement | undefined;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= 0) best = heading;
      }
      if (best) setActive(best.id);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        pick();
      },
      { rootMargin: "-48px 0px -40% 0px", threshold: 0.9 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  // Keep the active link visible inside the panel without scrolling the page.
  useEffect(() => {
    const list = listRef.current;
    const panel = panelRef.current;
    if (!list || !panel) return;
    const link = list.querySelector<HTMLElement>(".pd-toc-link[data-active]");
    if (link) {
      const panelRect = panel.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const top = linkRect.top - panelRect.top + panel.scrollTop;
      const bottom = top + linkRect.height;
      if (top < panel.scrollTop) panel.scrollTop = top;
      else if (bottom > panel.scrollTop + panel.clientHeight) panel.scrollTop = bottom - panel.clientHeight;
    }
  }, [active, items]);

  if (items.length === 0) return null;

  const current = items.find((i) => i.id === active);
  return (
    <aside
      className={["pd-toc", className].filter(Boolean).join(" ")}
      data-open={open ? "" : undefined}
      data-bar={variant === "bar" ? "" : undefined}
    >
      <button
        type="button"
        className="pd-toc-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="pd-toc-list"
      >
        <Text size={14} aria-hidden />
        <span className="pd-toc-trigger-text">{current ? current.title : "On this page"}</span>
        <ChevronDown size={14} className="pd-toc-trigger-chevron" aria-hidden />
      </button>
      <div ref={panelRef} className="pd-toc-panel">
        <p className="pd-toc-heading">
          <Text size={14} aria-hidden />
          On this page
        </p>
        <ul id="pd-toc-list" ref={listRef} className="pd-toc-list">
          {items.map((item) => (
            <li key={item.id} data-depth={item.depth}>
              <a
                href={`#${item.id}`}
                className="pd-toc-link"
                data-active={item.id === active ? "" : undefined}
                aria-current={item.id === active ? "location" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
