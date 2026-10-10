import type { ReactNode } from "react";

export interface TypeTableEntry {
  description?: ReactNode;
  type: string;
  default?: string;
  required?: boolean;
}

export interface TypeTableProps {
  /** Property name to its definition, rendered in insertion order. */
  type: Record<string, TypeTableEntry>;
  className?: string;
}

/** Props or options reference table with Name, Type and Default columns. */
export function TypeTable({ type, className }: TypeTableProps) {
  const entries = Object.entries(type);
  return (
    <div className={["pd-table-wrapper", "pd-type-table", className].filter(Boolean).join(" ")}>
      <table className="pd-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, entry]) => (
            <tr key={name}>
              <td className="pd-type-table-name">
                <code>{name}</code>
                {entry.required ? (
                  <span className="pd-type-table-required" title="Required">
                    *
                  </span>
                ) : null}
              </td>
              <td className="pd-type-table-type-cell">
                <code className="pd-type-table-type">{entry.type}</code>
              </td>
              <td className="pd-type-table-default">{entry.default !== undefined ? <code>{entry.default}</code> : <span className="pd-type-table-none">-</span>}</td>
              <td className="pd-type-table-description">{entry.description ?? <span className="pd-type-table-none">-</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
