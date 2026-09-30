"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * How a column's body cell is built, so the placeholder has the real cells'
 * silhouettes: a badge is a short pill, the first cell carries an icon tile over
 * two lines of text.
 */
type CellKind = "name" | "pill" | "text" | "actions";

export interface SkeletonColumn {
  label: string;
  kind: CellKind;
  /** Width class for the bar; defaults per kind. */
  width?: string;
}

/** Academics > Classes — the editable roster, ending in the action buttons. */
export const CLASS_TABLE_COLUMNS: SkeletonColumn[] = [
  { label: "Class", kind: "name" },
  { label: "Class Level", kind: "pill", width: "w-14" },
  { label: "Section", kind: "pill", width: "w-9" },
  { label: "Class teacher", kind: "text", width: "w-24" },
  { label: "Medium", kind: "pill", width: "w-16" },
  { label: "Capacity", kind: "text", width: "w-10" },
  { label: "Vocational", kind: "pill", width: "w-11" },
  { label: "Status", kind: "pill", width: "w-16" },
  { label: "", kind: "actions" },
];

const CELL_PAD = "px-4 py-3.5";

function Cell({ column }: { column: SkeletonColumn }) {
  const width = column.width ?? "w-12";
  switch (column.kind) {
    case "name":
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
      );
    case "pill":
      return <Skeleton className={`h-5 ${width} rounded-full`} />;
    case "actions":
      return (
        <div className="flex justify-end gap-1.5">
          <Skeleton className="size-5 rounded-md" />
          <Skeleton className="size-5 rounded-md" />
          <Skeleton className="size-5 rounded-md" />
        </div>
      );
    default:
      return <Skeleton className={`h-3.5 ${width}`} />;
  }
}

/**
 * The Academics roster's loading shape. Students > Classes has its own skeleton in
 * its own module folder, because the two screens are not the same table.
 */
export function ClassesTableSkeleton({
  columns,
  rows = 8,
}: {
  columns: SkeletonColumn[];
  rows?: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F8FAFC] dark:bg-zinc-800/40 border-b border-slate-200/70 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 uppercase text-[11px] font-bold tracking-wider">
            <tr>
              {columns.map((column, i) => (
                <th
                  key={column.label + i}
                  className={
                    i === 0 ? "pl-6 pr-4 py-3.5" : i === columns.length - 1 ? "pr-6 pl-4 py-3.5" : CELL_PAD
                  }
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                {columns.map((column, i) => (
                  <td
                    key={column.label + i}
                    className={
                      i === 0 ? "pl-6 pr-4 py-3.5" : i === columns.length - 1 ? "pr-6 pl-4 py-3.5" : CELL_PAD
                    }
                  >
                    <Cell column={column} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
