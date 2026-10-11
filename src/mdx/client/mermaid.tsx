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
 * Flat overrides on top of Mermaid's base theme: no shadows, hairline strokes,
 * 4px corners, and arrowheads in the same colour as their lines.
 */
function flatThemeCss(tokens: Record<Token, string>): string {
  return [
    `.node rect, .node polygon, .node circle, .node ellipse, .node path, .cluster rect { stroke-width: 1px; filter: none; }`,
    `.node rect, .cluster rect, .actor, .labelBox, .note, rect.note { rx: 4px; ry: 4px; }`,
    `.cluster rect { fill: ${tokens.background}; stroke: ${tokens.border}; }`,
    `.cluster-label text, .cluster span { fill: ${tokens["muted-foreground"]}; color: ${tokens["muted-foreground"]}; font-size: 12px; }`,
    `.edgePaths .path, .flowchart-link, .messageLine0, .messageLine1, .transition, .relation, line.loopLine, .actor-line { stroke: ${tokens["border-strong"]}; stroke-width: 1px; }`,
    `.arrowheadPath, .marker, marker path, #arrowhead path, #filled-head path, #crosshead path, #sequencenumber { fill: ${tokens["border-strong"]}; stroke: ${tokens["border-strong"]}; }`,
    `.edgeLabel, .edgeLabel p, .edgeLabel rect { background-color: ${tokens.surface}; fill: ${tokens.surface}; opacity: 1; }`,
    `.edgeLabel, .messageText, .loopText, .noteText, .stateLabel, .edgeLabel .label text { font-size: 12px; }`,
    `.messageText, .loopText, .loopText tspan { fill: ${tokens["muted-foreground"]}; }`,
    `.actor { fill: ${tokens["surface-2"]}; stroke: ${tokens["border-strong"]}; }`,
    `text.actor > tspan { font-size: 13px; }`,
    `.actor-line { stroke-dasharray: 2 4; }`,
    `.labelBox { fill: ${tokens["surface-2"]}; stroke: ${tokens["border-strong"]}; }`,
    `.activation0, .activation1, .activation2 { fill: ${tokens["surface-3"]}; stroke: ${tokens["border-strong"]}; }`,
    `.sequenceNumber { fill: ${tokens.background}; }`,
    `.statediagram-state rect, .statediagram-cluster rect { rx: 4px; ry: 4px; }`,
    `.statediagram-state .divider { stroke: ${tokens.border}; }`,
    `.node circle.state-start, .node .state-end, .start-state, .end-state { fill: ${tokens["muted-foreground"]}; stroke: ${tokens["muted-foreground"]}; }`,
    `.commit-label, .branchLabel, .tag-label { font-size: 11px; }`,
    `.arrow { stroke-width: 2px; }`,
    `.branch { stroke-width: 1px; stroke-dasharray: 2 4; }`,
    `.commit-merge, .commit-highlight-inner { fill: ${tokens.background}; stroke: ${tokens.background}; }`,
    `.commit-label-bkg { fill: ${tokens.surface}; opacity: 1; }`,
    `.label0, .label1, .label2, .label3, .label4, .label5, .label6, .label7 { fill: ${tokens["surface-2"]}; stroke: ${tokens.border}; rx: 4px; ry: 4px; }`,
    `.mermaid-main-font, .label, text, tspan { font-family: ${tokens["font-sans"]}; }`,
  ].join("\n");
}

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
          // The default "neo" look adds drop shadows; classic shapes stay flat.
          look: "classic",
          themeCSS: flatThemeCss(tokens),
          fontFamily: tokens["font-sans"],
          darkMode: dark,
          flowchart: { padding: 12, nodeSpacing: 40, rankSpacing: 48 },
          sequence: { actorMargin: 48, width: 120, height: 40, boxMargin: 8, messageMargin: 32, mirrorActors: false, actorFontSize: 13, messageFontSize: 12, noteFontSize: 12 },
          gitGraph: { rotateCommitLabel: false },
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
            lineColor: tokens["border-strong"],
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
            signalColor: tokens["border-strong"],
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
            git0: tokens["muted-foreground"],
            git1: tokens["foreground-2"],
            git2: tokens["border-strong"],
            git3: tokens.foreground,
            gitBranchLabel0: tokens.foreground,
            gitBranchLabel1: tokens.foreground,
            gitBranchLabel2: tokens.foreground,
            gitBranchLabel3: tokens.foreground,
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
