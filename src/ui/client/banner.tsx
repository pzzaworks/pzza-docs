"use client";

import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useLabels } from "./labels.js";

export interface BannerProps {
  /** When set, dismissal is remembered in localStorage under `pd-banner:<id>`. */
  id?: string;
  /** "rainbow" adds an animated accent border. Defaults to "normal". */
  variant?: "normal" | "rainbow";
  children: ReactNode;
  className?: string;
}

const BANNER_HEIGHT = "36px";

function storageKey(id: string): string {
  return `pd-banner:${id}`;
}

function readDismissed(id: string): boolean {
  try {
    return window.localStorage.getItem(storageKey(id)) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(id: string): void {
  try {
    window.localStorage.setItem(storageKey(id), "1");
  } catch {
    // Storage unavailable: the banner still hides for this page view.
  }
}

/**
 * Dismissible announcement bar rendered above the header. While visible it
 * publishes `--pd-banner-height` on the root element so sticky elements can
 * offset themselves.
 */
export function Banner({ id, variant = "normal", children, className }: BannerProps) {
  const labels = useLabels();
  // Starts hidden when an id exists so a remembered dismissal never flashes the banner.
  const [visible, setVisible] = useState(id === undefined);

  useEffect(() => {
    if (id !== undefined) setVisible(!readDismissed(id));
  }, [id]);

  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    root.style.setProperty("--pd-banner-height", BANNER_HEIGHT);
    return () => {
      root.style.removeProperty("--pd-banner-height");
    };
  }, [visible]);

  if (!visible) return null;

  const dismiss = (): void => {
    if (id !== undefined) writeDismissed(id);
    setVisible(false);
  };

  return (
    <div className={["pd-banner", className].filter(Boolean).join(" ")} data-variant={variant} role="region" aria-label="Announcement">
      <div className="pd-banner-content">{children}</div>
      <button type="button" className="pd-banner-close" onClick={dismiss} aria-label={labels.dismiss}>
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}
