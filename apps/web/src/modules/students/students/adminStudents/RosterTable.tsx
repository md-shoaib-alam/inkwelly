"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GraduationCap, Pencil, Trash2, Eye, MoreVertical } from "lucide-react";
import type { RosterColumn, RosterRow } from "./columns";
import type { StudentInfo } from "./types";

interface RosterTableProps {
  rows: RosterRow[];
  columns: RosterColumn[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (student: StudentInfo) => void;
  onDelete: (id: string, reason?: string) => void;
  onView: (student: StudentInfo) => void;
}

// "2020-12-28" -> "28 Dec 2020"; anything unparseable shows as-is.
function fmtDate(value: string | null): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mon = months[Number(m[2]) - 1];
  if (!mon) return value;
  return `${Number(m[3])} ${mon} ${m[1]}`;
}

const cap = (v: string | null) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : null);

function ProfileRing({ pct }: { pct: number }) {
  const r = 13;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-8 shrink-0" title={`${pct}% profile complete`}>
      <svg viewBox="0 0 32 32" className="size-8 -rotate-90">
        <circle cx="16" cy="16" r={r} fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <circle
          cx="16"
          cy="16"
          r={r}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-slate-600 dark:text-zinc-300">
        {pct}
      </span>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Cell({ col, row }: { col: RosterColumn; row: RosterRow }) {
  const dash = <span className="text-slate-300 dark:text-zinc-600">—</span>;
  switch (col.key) {
    case "photo":
      return row.avatar ? (
        <img src={row.avatar} alt="" className="size-9 rounded-full object-cover shrink-0" />
      ) : (
        <div className="size-9 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center text-[11px] font-semibold shrink-0">
          {initials(row.name)}
        </div>
      );
    case "name":
      return <span className="font-medium text-[13px] text-slate-800 dark:text-zinc-100 whitespace-nowrap">{row.name}</span>;
    case "profile":
      return <ProfileRing pct={row.profileScore} />;
    case "studentId":
      return <span className="text-[13px] text-slate-600 dark:text-zinc-300 whitespace-nowrap">{row.username || "—"}</span>;
    case "class":
      return <span className="text-[13px] text-slate-600 dark:text-zinc-300 whitespace-nowrap">{row.className || dash}</span>;
    case "rollNumber":
      return <span className="text-[13px] text-slate-600 dark:text-zinc-300">{row.rollNumber || "—"}</span>;
    case "dob":
      return <span className="text-[13px] text-slate-600 dark:text-zinc-300 whitespace-nowrap">{fmtDate(row.dateOfBirth) ?? dash}</span>;
    case "admissionDate":
      return <span className="text-[13px] text-slate-600 dark:text-zinc-300 whitespace-nowrap">{fmtDate(row.admissionDate) ?? dash}</span>;
    case "gender":
      return <span className="text-[13px] text-slate-600 dark:text-zinc-300">{cap(row.gender) ?? dash}</span>;
    case "status":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.status?.toLowerCase() === "inactive"
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              row.status?.toLowerCase() === "inactive" ? "bg-amber-500" : "bg-emerald-500"
            }`}
          />
          {cap(row.status) ?? "Active"}
        </span>
      );
    case "rte":
      return <span className="text-[13px] text-slate-600 dark:text-zinc-300">{row.isRte ? "Yes" : "No"}</span>;
    case "mobile":
      return <span className="text-[13px] text-slate-600 dark:text-zinc-300 whitespace-nowrap">{row.phone || dash}</span>;
    case "address":
      return (
        <span className="text-[13px] text-slate-600 dark:text-zinc-300 block max-w-[260px] truncate" title={row.address ?? undefined}>
          {row.address || dash}
        </span>
      );
    default: {
      const v = (row as unknown as Record<string, unknown>)[col.key];
      return <span className="text-[13px] text-slate-600 dark:text-zinc-300 whitespace-nowrap">{typeof v === "string" && v ? v : dash}</span>;
    }
  }
}

function DeleteStudentDialog({
  student,
  onDelete,
  trigger,
}: {
  student: RosterRow;
  onDelete: (id: string, reason?: string) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReason("");
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Student</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{student.name}</strong> will be moved to Trash. You can
            restore them later, or delete them permanently from Trash.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <label htmlFor={`delete-reason-${student.id}`} className="text-sm font-medium">
            Reason <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            id={`delete-reason-${student.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this student being deleted?"
            rows={2}
            maxLength={500}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(student.id, reason.trim() || undefined);
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RosterTable({
  rows,
  columns,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onView,
}: RosterTableProps) {
  return (
    <div className="overflow-x-auto px-2 sm:px-6">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={`h-12 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 ${
                  col.key === "photo" || col.key === "name" ? "sticky left-0 bg-white dark:bg-zinc-950" : ""
                } ${col.key === "name" ? "min-w-[160px]" : ""}`}
              >
                {col.label}
              </TableHead>
            ))}
            <TableHead className="w-16 sm:w-24 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center py-12 text-muted-foreground">
                <GraduationCap className="size-10 mx-auto mb-2 opacity-30" />
                <p>No students found</p>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors border-b last:border-none cursor-pointer"
                onClick={() => onView(row as unknown as StudentInfo)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className="py-3.5">
                    <Cell col={col} row={row} />
                  </TableCell>
                ))}
                <TableCell className="text-right py-3.5">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <div className="hidden xl:flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-emerald-600"
                        onClick={() => onView(row as unknown as StudentInfo)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-emerald-600"
                          onClick={() => onEdit(row as unknown as StudentInfo)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <DeleteStudentDialog
                          student={row}
                          onDelete={onDelete}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          }
                        />
                      )}
                    </div>
                    <div className="xl:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => onView(row as unknown as StudentInfo)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem onClick={() => onEdit(row as unknown as StudentInfo)} className="cursor-pointer">
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit Student</span>
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DeleteStudentDialog
                              student={row}
                              onDelete={onDelete}
                              trigger={
                                <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete Record</span>
                                </div>
                              }
                            />
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
