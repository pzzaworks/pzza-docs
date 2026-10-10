"use client";

import { Check, ChevronDown, Copy, ExternalLink } from "lucide-react";
import { ClaudeIcon, CursorIcon, GitHubIcon, MarkdownIcon, OpenAIIcon } from "./brand-icons.js";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface PageActionsProps {
  /** Route serving the page as raw Markdown. Enables "Copy Markdown" and the AI links. */
  markdownUrl?: string;
  /** Public origin used to make the Markdown URL absolute in prompts. Falls back to the browser origin. */
  siteUrl?: string;
  /** "Open in GitHub" target. */
  editUrl?: string;
  /** Current page route, used as a fallback for the prompt when `markdownUrl` is missing. */
  pageUrl?: string;
}

interface MenuItem {
  label: string;
  href: string;
  external: boolean;
  icon: ReactNode;
}

function absolute(path: string, siteUrl?: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl ?? window.location.origin}${path}`;
}

function promptFor(markdownPath: string, siteUrl?: string): string {
  return `Read ${absolute(markdownPath, siteUrl)} so I can ask questions about it.`;
}

/** Copy-as-Markdown button plus a "View options" menu linking the Markdown source and AI assistants. */
export function PageActions({ markdownUrl, editUrl, pageUrl, siteUrl }: PageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const copy = useCallback(async () => {
    if (!markdownUrl) return;
    try {
      const res = await fetch(markdownUrl);
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      await navigator.clipboard.writeText(await res.text());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [markdownUrl]);

  // Prompt URLs need `window.location.origin`, so they are built when the menu opens rather than during render.
  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const source = markdownUrl ?? pageUrl;
        const list: MenuItem[] = [];
        if (editUrl) list.push({ label: "Open in GitHub", href: editUrl, external: true, icon: <GitHubIcon /> });
        if (markdownUrl) list.push({ label: "View as Markdown", href: absolute(markdownUrl, siteUrl), external: true, icon: <MarkdownIcon /> });
        if (source) {
          const prompt = encodeURIComponent(promptFor(source, siteUrl));
          list.push(
            { label: "Open in Claude", href: `https://claude.ai/new?q=${prompt}`, external: true, icon: <ClaudeIcon /> },
            { label: "Open in ChatGPT", href: `https://chatgpt.com/?hints=search&q=${prompt}`, external: true, icon: <OpenAIIcon /> },
            { label: "Open in Cursor", href: `https://cursor.com/link/prompt?text=${prompt}`, external: true, icon: <CursorIcon /> },
          );
        }
        setItems(list);
      }
      return next;
    });
  }, [editUrl, markdownUrl, pageUrl, siteUrl]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    const frame = window.requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const links = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const current = links.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number): void => links[(i + links.length) % links.length]?.focus();
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusAt(current + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(current - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(links.length - 1);
        break;
      case "Escape":
      case "Tab":
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      default:
        break;
    }
  };

  if (!markdownUrl && !editUrl) return null;

  return (
    <div ref={rootRef} className="pd-page-actions">
      {markdownUrl ? (
        <button type="button" className="pd-page-action" onClick={() => void copy()} data-copied={copied ? "" : undefined}>
          {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          <span>{copied ? "Copied" : "Copy Markdown"}</span>
          <span className="pd-visually-hidden" aria-live="polite">
            {copied ? "Markdown copied to clipboard" : ""}
          </span>
        </button>
      ) : null}
      <button
        ref={buttonRef}
        type="button"
        className="pd-page-action"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            toggle();
          }
        }}
      >
        <span>View options</span>
        <ChevronDown size={14} className="pd-page-action-chevron" aria-hidden />
      </button>
      {open ? (
        <div id={menuId} ref={menuRef} className="pd-page-actions-menu" role="menu" aria-label="View options" onKeyDown={onMenuKeyDown}>
          {items.map((item) => (
            <a
              key={item.label}
              role="menuitem"
              tabIndex={-1}
              className="pd-page-actions-item"
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer noopener" : undefined}
              onClick={() => setOpen(false)}
            >
              <span className="pd-page-actions-item-icon">{item.icon}</span>
              <span className="pd-page-actions-item-label">{item.label}</span>
              <ExternalLink size={12} className="pd-page-actions-item-external" aria-hidden />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
