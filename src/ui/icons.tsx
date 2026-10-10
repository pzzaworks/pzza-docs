import { createElement, type ReactNode } from "react";
import { icons, type LucideIcon } from "lucide-react";
import type { PageTreeNode } from "../types.js";

const ICONS: Record<string, LucideIcon | undefined> = icons;

/** "rocket", "arrow-right" and "ArrowRight" all resolve to the `ArrowRight` export. */
export function toPascalCase(name: string): string {
  return name
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** Server-safe lookup of a lucide icon by PascalCase or kebab-case name. */
export function resolveIcon(name: string, size = 16): ReactNode | undefined {
  const Icon = ICONS[name] ?? ICONS[toPascalCase(name)];
  if (!Icon) return undefined;
  return createElement(Icon, { size, "aria-hidden": true });
}

/** Every icon name referenced by the tree, resolved to elements so the tree itself stays serializable. */
export function collectTreeIcons(tree: PageTreeNode[], size = 16): Record<string, ReactNode> {
  const out: Record<string, ReactNode> = {};
  const add = (name: string | undefined): void => {
    if (!name || name in out) return;
    const element = resolveIcon(name, size);
    if (element !== undefined) out[name] = element;
  };
  const walk = (nodes: PageTreeNode[]): void => {
    for (const node of nodes) {
      add(node.icon);
      if (node.type === "folder") {
        add(node.index?.icon);
        walk(node.children);
      }
    }
  };
  walk(tree);
  return out;
}
