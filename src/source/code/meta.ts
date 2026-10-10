export interface CodeMeta {
  /** Header label, usually a filename. */
  title?: string;
  /** Tab label. `true` means the bare `tab` flag was used and the label falls back to the title or language. */
  tab?: string | true;
  /** Shared key so several tab groups switch together. */
  tabGroup?: string;
  noCopy: boolean;
  lineNumbers: boolean;
  /** First line number, defaults to 1. */
  lineStart: number;
  /** Every other `key=value` pair or bare flag, kept for custom consumers. */
  attributes: Record<string, string | true>;
}

const TOKEN = /([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;

/**
 * Parses a fence meta string such as `title="file.ts" lineNumbers=10 tab`.
 * Values may be quoted with single or double quotes or left bare.
 */
export function parseCodeMeta(meta: string | undefined): CodeMeta {
  const result: CodeMeta = { noCopy: false, lineNumbers: false, lineStart: 1, attributes: {} };
  if (!meta) return result;

  for (const match of meta.matchAll(TOKEN)) {
    const key = match[1];
    if (!key) continue;
    const value = match[2] ?? match[3] ?? match[4];

    switch (key) {
      case "title":
        if (value) result.title = value;
        break;
      case "tab":
        result.tab = value ? value : true;
        break;
      case "tab-group":
      case "tabGroup":
        if (value) result.tabGroup = value;
        break;
      case "noCopy":
      case "no-copy":
        result.noCopy = true;
        break;
      case "lineNumbers":
      case "showLineNumbers": {
        result.lineNumbers = true;
        const start = value === undefined ? Number.NaN : Number.parseInt(value, 10);
        if (Number.isFinite(start)) result.lineStart = start;
        break;
      }
      default:
        result.attributes[key] = value ?? true;
    }
  }

  return result;
}
