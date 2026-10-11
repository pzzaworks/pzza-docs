"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { getBreadcrumbsFromTree } from "../../tree.js";
import type { BreadcrumbItem, PageTreeNode } from "../../types.js";
import { useLabels } from "./labels.js";

export interface BreadcrumbsProps {
  /** Explicit items. When omitted they are derived from `tree` and the current URL. */
  items?: BreadcrumbItem[];
  tree?: PageTreeNode[];
  /** Current page URL. Defaults to the router pathname. */
  url?: string;
  className?: string;
}

export function Breadcrumbs({ items, tree, url, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  const labels = useLabels();
  const crumbs = items ?? (tree ? getBreadcrumbsFromTree(tree, url ?? pathname) : []);
  // The page itself is the h1; only its ancestors are shown.
  const trail = items ? crumbs : crumbs.slice(0, -1);
  if (trail.length === 0) return null;

  return (
    <nav className={["pd-breadcrumbs", className].filter(Boolean).join(" ")} aria-label={labels.breadcrumb}>
      {trail.map((crumb, index) => (
        <Fragment key={`${crumb.name}-${index}`}>
          {index > 0 ? <ChevronRight size={14} className="pd-breadcrumb-separator" aria-hidden /> : null}
          {crumb.url ? (
            <Link href={crumb.url} className="pd-breadcrumb">
              {crumb.name}
            </Link>
          ) : (
            <span className="pd-breadcrumb">{crumb.name}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
