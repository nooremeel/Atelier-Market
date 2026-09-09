import type { ReactNode } from 'react';

type Column = { key: string; header: string };
type Row = Record<string, ReactNode> & { id: string };

export function AdminTable({ columns, rows }: { columns: Column[]; rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-sans text-step-0">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className="border-b border-hairline px-3 py-2 text-left text-stone">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {columns.map((c) => (
                <td key={c.key} className="border-b border-hairline px-3 py-3 align-middle">{r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
