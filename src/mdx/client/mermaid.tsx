"use client";

import { useTheme } from "next-themes";
import { useEffect, useId, useState } from "react";

export interface MermaidProps {
  /** Diagram source in Mermaid syntax. */
  chart: string;
  /** Optional caption rendered under the diagram. */
  title?: string;
  className?: string;
}

type RenderState = { status: "loading" } | { status: "ready"; svg: string } | { status: "error"; message: string };

/** Design tokens the diagram reads from the page so it follows the active preset and theme. */
const TOKENS = ["background", "surface", "surface-2", "surface-3", "foreground", "foreground-2", "muted-foreground", "border", "border-strong", "font-sans"] as const;
type Token = (typeof TOKENS)[number];

function readTokens(): Record<Token, string> {
  const styles = getComputedStyle(document.documentElement);
  const values = {} as Record<Token, string>;
  for (const token of TOKENS) values[token] = styles.getPropertyValue(`--pd-${token}`).trim();
  return values;
}

let counter = 0;

/**
 * Renders a Mermaid diagram on the client. The library is loaded on demand so
 * pages without diagrams never ship it, and the colours come from the `--pd-*`
 * tokens so diagrams stay monochrome and switch with the theme.
 */
export function Mermaid({ chart, title, className }: MermaidProps) {
  const { resolvedTheme } = useTheme();
  const reactId = useId();
  const [state, setState] = useState<RenderState>({ status: "loading" });

  useEffect(() => {
    if (!resolvedTheme) return;
    let cancelled = false;

    async function render() {
      try {
        const { default: mermaid } = await import("mermaid");
        const tokens = readTokens();
        const dark = resolvedTheme === "dark";
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily: tokens["font-sans"],
          darkMode: dark,
          themeVariables: {
            background: tokens.background,
            fontFamily: tokens["font-sans"],
            fontSize: "13px",
            primaryColor: tokens["surface-2"],
            primaryTextColor: tokens.foreground,
            primaryBorderColor: tokens["border-strong"],
            secondaryColor: tokens.surface,
            secondaryTextColor: tokens.foreground,
            secondaryBorderColor: tokens.border,
            tertiaryColor: tokens["surface-3"],
            tertiaryTextColor: tokens.foreground,
            tertiaryBorderColor: tokens.border,
            lineColor: tokens["muted-foreground"],
            textColor: tokens.foreground,
            mainBkg: tokens["surface-2"],
            nodeBorder: tokens["border-strong"],
            clusterBkg: tokens.surface,
            clusterBorder: tokens.border,
            titleColor: tokens.foreground,
            edgeLabelBackground: tokens.background,
            noteBkgColor: tokens["surface-2"],
            noteTextColor: tokens.foreground,
            noteBorderColor: tokens["border-strong"],
            actorBkg: tokens["surface-2"],
            actorBorder: tokens["border-strong"],
            actorTextColor: tokens.foreground,
            actorLineColor: tokens.border,
            signalColor: tokens.foreground,
            signalTextColor: tokens.foreground,
            labelBoxBkgColor: tokens["surface-2"],
            labelBoxBorderColor: tokens["border-strong"],
            labelTextColor: tokens.foreground,
            loopTextColor: tokens.foreground,
            activationBkgColor: tokens["surface-3"],
            activationBorderColor: tokens["border-strong"],
            sequenceNumberColor: tokens.background,
            pie1: tokens["surface-3"],
            pie2: tokens["border-strong"],
            pie3: tokens["muted-foreground"],
            pie4: tokens["foreground-2"],
            pieTitleTextColor: tokens.foreground,
            pieSectionTextColor: tokens.foreground,
            pieLegendTextColor: tokens.foreground,
            pieStrokeColor: tokens.background,
            pieOuterStrokeColor: tokens.border,
            git0: tokens["surface-3"],
            git1: tokens["border-strong"],
            git2: tokens["muted-foreground"],
            git3: tokens["foreground-2"],
            gitBranchLabel0: tokens.foreground,
            gitBranchLabel1: tokens.foreground,
            gitBranchLabel2: tokens.background,
            gitBranchLabel3: tokens.background,
            commitLabelColor: tokens.foreground,
            commitLabelBackground: tokens["surface-2"],
            tagLabelColor: tokens.foreground,
            tagLabelBackground: tokens["surface-2"],
            tagLabelBorder: tokens["border-strong"],
          },
        });
        // Mermaid needs a DOM-safe unique id per render; the React id contains colons.
        const id = `pd-mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}-${(counter += 1)}`;
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled) setState({ status: "ready", svg });
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: error instanceof Error ? error.message : String(error) });
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [chart, reactId, resolvedTheme]);

  return (
    <figure className={["pd-mermaid", className].filter(Boolean).join(" ")} data-state={state.status}>
      {state.status === "ready" ? (
        <div className="pd-mermaid-diagram" dangerouslySetInnerHTML={{ __html: state.svg }} />
      ) : state.status === "error" ? (
        <pre className="pd-mermaid-error">{state.message}</pre>
      ) : (
        <div className="pd-mermaid-diagram" aria-busy="true" />
      )}
      {title ? <figcaption className="pd-mermaid-title">{title}</figcaption> : null}
    </figure>
  );
}
