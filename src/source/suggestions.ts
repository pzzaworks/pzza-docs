import type { PageData, PageSuggestion } from "../types.js";

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

function bigrams(value: string): Set<string> {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const out = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i += 1) out.add(normalized.slice(i, i + 2));
  return out;
}

function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const gram of a) if (b.has(gram)) shared += 1;
  return (2 * shared) / (a.size + b.size);
}

/** "Did you mean" candidates for an unknown pathname, ranked by token overlap and string similarity. */
export function suggestPages(pages: PageData[], pathname: string, limit: number): PageSuggestion[] {
  const wanted = tokens(pathname);
  const wantedGrams = bigrams(pathname.split("/").filter(Boolean).slice(-1)[0] ?? pathname);

  return pages
    .map((page): PageSuggestion => {
      const own = new Set([...tokens(page.url), ...tokens(page.title)]);
      const overlap = wanted.filter((t) => own.has(t)).length;
      const similarity = Math.max(dice(wantedGrams, bigrams(page.slug[page.slug.length - 1] ?? "")), dice(wantedGrams, bigrams(page.title)));
      return { url: page.url, title: page.title, score: overlap + similarity };
    })
    .filter((s) => s.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
