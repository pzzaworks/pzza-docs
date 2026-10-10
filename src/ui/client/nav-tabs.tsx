"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "../../types.js";

export interface NavTabsProps {
  links: NavLink[];
  className?: string;
}

function isExternal(link: NavLink): boolean {
  return link.external ?? /^https?:\/\//.test(link.href);
}

function normalizePath(value: string): string {
  return value.replace(/\/+$/, "") || "/";
}

/**
 * Picks the active nav link: the longest `activePrefix` (or href) that is the
 * current path or one of its ancestors. A base link such as "/docs" therefore
 * only wins when no more specific link matches.
 */
export function activeNavHref(links: NavLink[], pathname: string): string | undefined {
  const current = normalizePath(pathname);
  let best: { link: NavLink; prefix: string } | undefined;
  for (const link of links) {
    if (isExternal(link)) continue;
    const prefix = normalizePath(link.activePrefix ?? link.href);
    // A root link is the least specific match, so it only wins when nothing else matches.
    const matches = prefix === "/" || current === prefix || current.startsWith(`${prefix}/`);
    if (matches && (!best || prefix.length > best.prefix.length)) best = { link, prefix };
  }
  return best?.link.href;
}

export function NavTabs({ links, className }: NavTabsProps) {
  const pathname = usePathname();
  const active = activeNavHref(links, pathname);
  return (
    <nav className={["pd-nav-tabs", className].filter(Boolean).join(" ")} aria-label="Primary">
      {links.map((link) =>
        isExternal(link) ? (
          <a key={link.href} className="pd-nav-tab" href={link.href} target="_blank" rel="noreferrer noopener">
            {link.text}
          </a>
        ) : (
          <Link
            key={link.href}
            className="pd-nav-tab"
            href={link.href}
            data-active={link.href === active ? "" : undefined}
            aria-current={link.href === active ? "page" : undefined}
          >
            {link.text}
          </Link>
        ),
      )}
    </nav>
  );
}
