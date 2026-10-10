import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import { CopyButton } from "./client/copy-button.js";
import { LangIcon } from "./lang-icons.js";

export interface CodeBlockProps {
  /** Shown in the header bar. Falls back to the language. */
  title?: string;
  lang?: string;
  /** Clean source for the copy button. When omitted the button reads the rendered `<pre>`. */
  code?: string;
  /** Set to false to hide the copy button. */
  allowCopy?: boolean;
  lineNumbers?: boolean;
  /** First line number, defaults to 1. */
  lineStart?: number;
  /** Replaces the language icon in the header. */
  icon?: ReactNode;
  /** The `<pre>` element (already highlighted or plain). */
  children: ReactNode;
  className?: string;
}

type LineStartStyle = CSSProperties & Record<"--pd-line-start", number>;

/** Frame around a `<pre>`: header with icon, filename or language and a copy button. */
export function CodeBlock({
  title,
  lang,
  code,
  allowCopy = true,
  lineNumbers = false,
  lineStart = 1,
  icon,
  children,
  className,
}: CodeBlockProps) {
  const label = title ?? lang;
  const style: LineStartStyle = { "--pd-line-start": lineStart - 1 };
  const showHeader = Boolean(label) || allowCopy;

  return (
    <figure
      className={["pd-code", className].filter(Boolean).join(" ")}
      data-lang={lang}
      data-line-numbers={lineNumbers ? "" : undefined}
      style={style}
    >
      {showHeader ? (
        <figcaption className="pd-code-header">
          <span className="pd-code-label">
            {icon ?? (lang ? <LangIcon lang={lang} size={14} /> : null)}
            <span className="pd-code-title" data-kind={title ? "title" : "lang"}>
              {label}
            </span>
          </span>
          {allowCopy ? <CopyButton text={code} /> : null}
        </figcaption>
      ) : null}
      <div className="pd-code-body">{children}</div>
    </figure>
  );
}

type PreProps = ComponentPropsWithoutRef<"pre"> & {
  "data-lang"?: string;
  "data-title"?: string;
  "data-tab"?: string;
  "data-tab-group"?: string;
  "data-no-copy"?: string;
  "data-line-numbers"?: string;
  "data-line-start"?: string | number;
  "data-code"?: string;
};

/**
 * MDX `pre` mapping. The rehype shiki step stores the meta values and clean
 * source as data attributes; this component turns them into the header bar and
 * strips them from the DOM.
 */
export function Pre(props: PreProps) {
  const {
    "data-lang": lang,
    "data-title": title,
    "data-tab": _tab,
    "data-tab-group": _tabGroup,
    "data-no-copy": noCopy,
    "data-line-numbers": lineNumbers,
    "data-line-start": lineStart,
    "data-code": code,
    className,
    children,
    ...rest
  } = props;
  void _tab;
  void _tabGroup;
  const start = Number(lineStart);
  return (
    <CodeBlock
      title={title}
      lang={lang}
      code={code}
      allowCopy={noCopy === undefined}
      lineNumbers={lineNumbers !== undefined}
      lineStart={Number.isFinite(start) && start > 0 ? start : 1}
    >
      <pre className={["pd-pre", className].filter(Boolean).join(" ")} {...rest}>
        {children}
      </pre>
    </CodeBlock>
  );
}
