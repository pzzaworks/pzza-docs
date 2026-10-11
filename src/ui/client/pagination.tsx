"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNeighboursFromTree } from "../../tree.js";
import type { Neighbours, PageTreeNode } from "../../types.js";
import { useLabels } from "./labels.js";

export interface PaginationProps {
  /** Explicit neighbours. When omitted they are derived from `tree` and the current URL. */
  neighbours?: Neighbours;
  tree?: PageTreeNode[];
  url?: string;
  className?: string;
}

export function Pagination({ neighbours, tree, url, className }: PaginationProps) {
  const pathname = usePathname();
  const labels = useLabels();
  const links = neighbours ?? (tree ? getNeighboursFromTree(tree, url ?? pathname) : {});
  if (!links.previous && !links.next) return null;

  return (
    <nav className={["pd-pagination", className].filter(Boolean).join(" ")} aria-label={labels.pagination}>
      {links.previous ? (
        <Link href={links.previous.url} className="pd-pagination-card" data-direction="previous" rel="prev">
          <span className="pd-pagination-label">
            <ChevronLeft size={14} aria-hidden />
            {labels.previous}
          </span>
          <span className="pd-pagination-title">{links.previous.name}</span>
        </Link>
      ) : (
        <span />
      )}
      {links.next ? (
        <Link href={links.next.url} className="pd-pagination-card" data-direction="next" rel="next">
          <span className="pd-pagination-label">
            {labels.next}
            <ChevronRight size={14} aria-hidden />
          </span>
          <span className="pd-pagination-title">{links.next.name}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
