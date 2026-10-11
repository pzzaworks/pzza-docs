import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { glob } from "node:fs/promises";
import { defineConfig, type Options } from "tsup";

/** Concatenated in this order into dist/styles.css. */
const STYLE_FILES = ["src/styles/base.css", "src/styles/code.css", "src/styles/components.css", "src/styles/utilities.css"];

const shared: Options = {
  format: ["esm"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  splitting: false,
  external: ["react", "react-dom", "next", "next-themes", "react/jsx-runtime", /^next\//],
};

async function clientEntries(): Promise<Record<string, string>> {
  const entries: Record<string, string> = {};
  for await (const file of glob(["src/ui/client/*.tsx", "src/mdx/client/*.tsx"])) {
    const group = file.includes("/ui/") ? "ui" : "mdx";
    entries[`${group}/client/${basename(file, ".tsx")}`] = file;
  }
  return entries;
}

/**
 * Client components are built as individual files so the "use client" directive
 * at the top of each one survives bundling. The server bundles reference them
 * through relative imports left external, and client files keep sibling imports
 * external too so React contexts are not duplicated across bundles.
 */
export default defineConfig(async () => [
  {
    ...shared,
    entry: { index: "src/index.ts" },
    platform: "node",
    external: [...(shared.external ?? []), /^\.\/mdx\/index\.js$/],
    async onSuccess() {
      await mkdir("dist", { recursive: true });
      const [base, code, components, utilities] = await Promise.all(STYLE_FILES.map((file) => readFile(file, "utf8")));
      // Cascade layers: unlayered consumer CSS always beats the package without needing !important.
      const css = [
        "@layer pzzadocs.base, pzzadocs.components, pzzadocs.utilities;",
        `@layer pzzadocs.base {\n${base}\n}`,
        `@layer pzzadocs.components {\n${code}\n${components}\n}`,
        `@layer pzzadocs.utilities {\n${utilities}\n}`,
      ].join("\n");
      await writeFile("dist/styles.css", css);
      // KaTeX ships its own stylesheet and fonts; they are published next to styles.css
      // so `pzzadocs/math.css` resolves the font URLs without extra consumer setup.
      await cp("node_modules/katex/dist/katex.min.css", "dist/math.css");
      await cp("node_modules/katex/dist/fonts", "dist/fonts", { recursive: true });
    },
  },
  {
    ...shared,
    entry: { "ui/index": "src/ui/index.ts", "mdx/index": "src/mdx/index.ts" },
    platform: "neutral",
    external: [...(shared.external ?? []), /\/client\//],
  },
  {
    ...shared,
    entry: await clientEntries(),
    platform: "browser",
    // Sibling client modules and the shared labels context stay external so React contexts are not duplicated per bundle.
    external: [...(shared.external ?? []), /^\.\/[^/]+\.js$/, /^\.\.\/\.\.\/ui\/client\/labels\.js$/],
  },
]);
