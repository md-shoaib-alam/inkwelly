"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { BulkField } from "../fields";

export interface BulkStudent {
  id: string;
  name: string;
  avatar: string | null;
  className: string | null;
  admissionNo: string | null;
  [key: string]: string | number | boolean | null;
}

export interface ClassOption {
  id: string;
  name: string;
}

interface BulkUpdateTableProps {
  students: BulkStudent[];
  fields: BulkField[];
  classes: ClassOption[];
  edits: Record<string, Record<string, string | boolean>>;
  onEdit: (studentId: string, key: string, value: string | boolean) => void;
  isSelected: (id: string) => boolean;
  onToggle: (student: BulkStudent) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  readOnly: boolean;
}

const cellBase =
  "h-8 w-full min-w-[130px] rounded-md border bg-transparent px-2 text-[13px] text-slate-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60";

function Cell({
  student,
  field,
  value,
  dirty,
  onEdit,
  readOnly,
  classes,
}: {
  student: BulkStudent;
  field: BulkField;
  value: string | boolean;
  dirty: boolean;
  onEdit: (key: string, value: string | boolean) => void;
  readOnly: boolean;
  classes: ClassOption[];
}) {
  const ring = dirty ? " border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/15" : " border-slate-200/80 dark:border-zinc-800";

  if (field.kind === "boolean") {
    return (
      <div className={`flex h-8 items-center ${dirty ? "rounded-md bg-emerald-50/50 dark:bg-emerald-900/15 px-2" : ""}`}>
        <Checkbox
          checked={Boolean(value)}
          disabled={readOnly}
          onCheckedChange={(v) => onEdit(field.key, Boolean(v))}
          className="size-[15px]"
        />
      </div>
    );
  }

  if (field.kind === "select") {
    const options =
      field.key === "classId"
        ? classes.map((c) => ({ value: c.id, label: c.name }))
        : field.options ?? [];
    return (
      <select
        value={String(value ?? "")}
        disabled={readOnly}
        onChange={(e) => onEdit(field.key, e.target.value)}
        className={`${cellBase}${ring}`}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.kind === "date" ? "date" : field.kind === "tel" ? "tel" : field.kind === "email" ? "email" : "text"}
      value={String(value ?? "")}
      disabled={readOnly}
      onChange={(e) => onEdit(field.key, e.target.value)}
      className={`${cellBase}${ring}`}
    />
  );
}

export function BulkUpdateTable({
  students,
  fields,
  classes,
  edits,
  onEdit,
  isSelected,
  onToggle,
  onToggleAll,
  allSelected,
  readOnly,
}: BulkUpdateTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60">
            <th className="w-10 px-4 py-3">
              <Checkbox checked={allSelected && students.length > 0} onCheckedChange={onToggleAll} className="size-[15px]" />
            </th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
              Student
            </th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
              Class
            </th>
            {fields.map((f) => (
              <th
                key={f.key}
                className="px-3 py-3 text-left text-[11px] font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase whitespace-nowrap"
              >
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const rowEdits = edits[student.id] ?? {};
            return (
              <tr
                key={student.id}
                className="border-b border-slate-100/80 dark:border-zinc-800/70 last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30"
              >
                <td className="px-4 py-2.5">
                  <Checkbox checked={isSelected(student.id)} onCheckedChange={() => onToggle(student)} className="size-[15px]" />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    {student.avatar ? (
                      <img src={student.avatar} alt="" className="size-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="size-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-[11px] font-semibold text-slate-500 dark:text-zinc-400 shrink-0">
                        {student.name
                          ?.split(" ")
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="leading-tight">
                      <div className="text-[13px] font-medium text-slate-800 dark:text-zinc-100">{student.name}</div>
                      <div className="text-[11px] text-slate-400 dark:text-zinc-500">{student.admissionNo ?? "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className="inline-flex rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-zinc-300">
                    {student.className ?? "Unassigned"}
                  </span>
                </td>
                {fields.map((f) => {
                  const dirty = f.key in rowEdits;
                  const value = dirty ? rowEdits[f.key] : (student[f.key] as string | boolean | null) ?? "";
                  return (
                    <td key={f.key} className="px-3 py-2.5 min-w-[150px]">
                      <Cell
                        student={student}
                        field={f}
                        value={value}
                        dirty={dirty}
                        onEdit={(key, v) => onEdit(student.id, key, v)}
                        readOnly={readOnly}
                        classes={classes}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {students.length === 0 && (
            <tr>
              <td colSpan={3 + fields.length} className="px-4 py-10 text-center text-[13px] text-slate-400 dark:text-zinc-500">
                No students match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
