"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Students > Classes — the read-only roster's loading shape, and nothing else's.
 *
 * The Academics screen of the same name has its own skeleton under
 * `components/shared/classes/`. They are two files on purpose: this table reports how
 * full and how complete each class is, that one edits the rows, and a placeholder that
 * previews the wrong layout is worse than a spinner — the admin braces for one screen
 * and gets the other.
 */
type CellKind = "name" | "pill" | "text" | "meter" | "avatars" | "chevron";

interface RosterColumn {
  label: string;
  kind: CellKind;
  width?: string;
}

const COLUMNS: RosterColumn[] = [
  { label: "Class", kind: "name" },
  { label: "Grade", kind: "text", width: "w-20" },
  { label: "Section", kind: "pill", width: "w-7" },
  { label: "Teacher", kind: "avatars" },
  { label: "Medium", kind: "text", width: "w-16" },
  { label: "Enrolled", kind: "text", width: "w-10" },
  { label: "Completion", kind: "meter" },
  { label: "Status", kind: "pill", width: "w-16" },
  { label: "", kind: "chevron" },
];

const CELL_PAD = "px-4 py-3.5";

function Cell({ column }: { column: RosterColumn }) {
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
    case "meter":
      return <Skeleton className="h-1.5 w-24 rounded-full" />;
    case "avatars":
      return (
        <div className="flex items-center -space-x-1.5">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="size-7 rounded-full" />
        </div>
      );
    case "chevron":
      return <Skeleton className="ml-auto h-3.5 w-3.5 rounded-full" />;
    default:
      return <Skeleton className={`h-3.5 ${width}`} />;
  }
}

export function RosterTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F8FAFC] dark:bg-zinc-800/40 border-b border-slate-200/70 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 uppercase text-[11px] font-bold tracking-wider">
            <tr>
              {COLUMNS.map((column, i) => (
                <th
                  key={column.label + i}
                  className={
                    i === 0 ? "pl-6 pr-4 py-3.5" : i === COLUMNS.length - 1 ? "pr-6 pl-4 py-3.5" : CELL_PAD
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
                {COLUMNS.map((column, i) => (
                  <td
                    key={column.label + i}
                    className={
                      i === 0 ? "pl-6 pr-4 py-3.5" : i === COLUMNS.length - 1 ? "pr-6 pl-4 py-3.5" : CELL_PAD
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
