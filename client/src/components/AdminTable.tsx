import type { ReactNode } from 'react';

type Column = { key: string; header: string };
type Row = Record<string, ReactNode> & { id: string };

export function AdminTable({ columns, rows }: { columns: Column[]; rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-sans text-[0.875rem] bg-canvas/80 rounded-sm border border-hairline/60 shadow-subtle overflow-hidden transition-colors">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-medium text-stone border-b border-hairline/60 px-5 py-3.5 text-start bg-silk/40">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-sand/15 transition-colors">
              {columns.map((c) => (
                <td key={c.key} className="border-b border-hairline/40 px-5 py-4 align-middle text-ink font-normal text-start">
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
