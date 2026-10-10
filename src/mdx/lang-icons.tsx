import type { JSX, ReactNode, SVGProps } from "react";

export interface LangIconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  lang?: string;
  /** Pixel size; the glyph is drawn in a 16x16 box. */
  size?: number;
}

type Glyph = (props: SVGProps<SVGSVGElement>) => JSX.Element;

function frame(props: SVGProps<SVGSVGElement>, children: ReactNode) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

function letters(text: string, size = 7): Glyph {
  const Icon: Glyph = (props) =>
    frame(
      props,
      <>
        <rect x="1" y="1" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
        <text
          x="8"
          y="11.2"
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize={size}
          fontWeight="700"
          fill="currentColor"
        >
          {text}
        </text>
      </>,
    );
  return Icon;
}

const FileIcon: Glyph = (props) =>
  frame(
    props,
    <>
      <path d="M4 1.5h5l4 4v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 1.5v4h4" stroke="currentColor" strokeWidth="1.2" />
    </>,
  );

const ShellIcon: Glyph = (props) =>
  frame(
    props,
    <>
      <rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 6l2.5 2-2.5 2M8.5 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );

const MarkupIcon: Glyph = (props) =>
  frame(
    props,
    <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5M9 3 7 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />,
  );

const BracesIcon: Glyph = (props) =>
  frame(
    props,
    <path d="M6 2.5c-1.5 0-2 .7-2 2v2c0 .8-.6 1.5-1.5 1.5C3.4 8 4 8.7 4 9.5v2c0 1.3.5 2 2 2M10 2.5c1.5 0 2 .7 2 2v2c0 .8.6 1.5 1.5 1.5-.9 0-1.5.7-1.5 1.5v2c0 1.3-.5 2-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />,
  );

const ICONS: Record<string, Glyph> = {
  ts: letters("TS"),
  typescript: letters("TS"),
  tsx: letters("TSX", 5.5),
  js: letters("JS"),
  javascript: letters("JS"),
  mjs: letters("JS"),
  cjs: letters("JS"),
  jsx: letters("JSX", 5.5),
  json: BracesIcon,
  jsonc: BracesIcon,
  json5: BracesIcon,
  css: letters("CSS", 5.5),
  html: MarkupIcon,
  xml: MarkupIcon,
  svg: MarkupIcon,
  md: letters("MD"),
  markdown: letters("MD"),
  mdx: letters("MDX", 5.5),
  yaml: letters("YML", 5.5),
  yml: letters("YML", 5.5),
  bash: ShellIcon,
  sh: ShellIcon,
  shell: ShellIcon,
  shellscript: ShellIcon,
  zsh: ShellIcon,
  console: ShellIcon,
};

/** Returns the icon component for a language, or the generic file icon. */
export function resolveLangIcon(lang: string | undefined): Glyph {
  if (!lang) return FileIcon;
  return ICONS[lang.toLowerCase()] ?? FileIcon;
}

export function LangIcon({ lang, size = 14, ...rest }: LangIconProps) {
  const Icon = resolveLangIcon(lang);
  return <Icon width={size} height={size} className="pd-lang-icon" data-lang={lang} {...rest} />;
}
