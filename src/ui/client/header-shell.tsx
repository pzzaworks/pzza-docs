"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { HeaderTransparentMode } from "../../types.js";

export interface HeaderShellProps {
  /** "top" is transparent until the page scrolls past 10px, "always" stays transparent. Defaults to "none". */
  transparentMode?: HeaderTransparentMode;
  className?: string;
  children: ReactNode;
}

/** The `<header>` element; sets `data-transparent` according to `transparentMode` and the scroll position. */
export function HeaderShell({ transparentMode = "none", className, children }: HeaderShellProps) {
  const [atTop, setAtTop] = useState(transparentMode === "top");

  useEffect(() => {
    if (transparentMode !== "top") return;
    const update = (): void => setAtTop(window.scrollY < 10);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [transparentMode]);

  const transparent = transparentMode === "always" || (transparentMode === "top" && atTop);
  return (
    <header className={["pd-header", className].filter(Boolean).join(" ")} data-transparent={transparent ? "" : undefined}>
      {children}
    </header>
  );
}
