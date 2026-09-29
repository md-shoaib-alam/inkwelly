"use client";

import { useState } from "react";
import {
  Check,
  ChevronLeft,
  Copy,
  Printer,
  Pencil,
  MoreVertical,
  SearchX,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { StudentSkeleton } from "../StudentSkeleton";
import { PROFILE_TABS, tabDefOf, type ProfileTabId } from "./tabs";
import { isForbidden, isNotFound, useProfileHeader, useProfileTab } from "./use-student-profile";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { SummaryTab } from "./SummaryTab";
import { FamilyTab } from "./FamilyTab";
import { AcademicTab } from "./AcademicTab";
import { AddressesTab } from "./AddressesTab";
import { UnbuiltTab } from "./UnbuiltTab";

interface StudentProfileViewProps {
  /** Whatever the school calls this student by: the ID on the card, the roll no., or the internal id. */
  studentRef: string;
  tab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
  onBack: () => void;
  /** The list this profile was opened from, so Back names where it actually goes. */
  backLabel?: string;
  /**
   * Move to another student's profile. Optional because a screen that embeds the profile
   * without a full-school roster on hand cannot resolve an arbitrary ref; without it the
   * switcher is simply not offered rather than offered and broken.
   */
  onSwitch?: (ref: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
}

function initials(name: string): string {
  return (
    (name || "")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "ST"
  );
}

export function StudentProfileView({
  studentRef,
  tab,
  onTabChange,
  onBack,
  backLabel = "All students",
  onSwitch,
  canEdit = true,
  canDelete = false,
  onEdit,
}: StudentProfileViewProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [trashing, setTrashing] = useState(false);
  const queryClient = useQueryClient();
  const { data: profile, isLoading, error } = useProfileHeader(studentRef);

  const def = tabDefOf(tab);
  const tabQuery = useProfileTab(studentRef, tab, def.live);

  const handleCopy = (value: string, label: string) => {
    copyToClipboard(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  // Soft delete: the row moves to Trash, where the students screen already lists it.
  const handleTrash = async () => {
    if (!profile) return;
    setTrashing(true);
    try {
      const res = await apiFetch(`/api/students?id=${encodeURIComponent(profile.header.id)}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Could not move this student to trash");
      // The profile and the roster both hold copies of this student.
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      toast.success(`${profile.header.name} moved to trash`);
      setConfirmTrash(false);
      onBack();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setTrashing(false);
    }
  };

  if (isLoading) return <StudentSkeleton />;

  if (error && isNotFound(error)) {
    return (
      <NotFoundFrame
        title="No student with that ID"
        body={`${studentRef} isn't a student in this school. The link may be from an older session, or the student may have been moved to trash.`}
        onBack={onBack}
        backLabel={backLabel}
      />
    );
  }
  if (error && isForbidden(error)) {
    return (
      <NotFoundFrame
        title="This profile isn't yours to open"
        body="You don't have permission to read this student."
        onBack={onBack}
        backLabel={backLabel}
      />
    );
  }
  if (!profile) {
    return (
      <NotFoundFrame
        title="Couldn't load this profile"
        body={error instanceof Error ? error.message : "The server didn't answer."}
        onBack={onBack}
        backLabel={backLabel}
        retry
      />
    );
  }

  const { header, counts } = profile;
  // Only an issued ID is called a Student ID; the roll number is its own field, and the
  // profile URL is built from whichever of the two the school actually uses.
  const studentId = header.studentId;

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-emerald-50/70 px-3.5 py-1.5 text-slate-800 shadow-xs transition-all hover:bg-emerald-100/70 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
          >
            <ChevronLeft className="size-4 stroke-[2.5] text-slate-700 dark:text-zinc-300" />
            <span className="text-[13px] font-semibold tracking-tight">{backLabel}</span>
          </button>
          {onSwitch && (
            <ProfileSwitcher currentRef={studentRef} onPick={onSwitch} onAllStudents={onBack} />
          )}
        </div>

        <div className="flex items-center gap-2">
          {canEdit && onEdit && (
            <Button
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="More options"
                className="size-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => window.print()} className="gap-2 text-[12.5px]">
                <Printer className="size-3.5" />
                Print profile
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setConfirmTrash(true)}
                    className="gap-2 text-[12.5px] text-red-600 focus:text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="size-3.5" />
                    Move to trash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Identity card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:border-zinc-800/80 dark:bg-zinc-900 sm:p-6">
        <div className="flex items-start gap-4">
          {header.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={header.avatar}
              alt=""
              className="size-16 shrink-0 rounded-full object-cover ring-2 ring-slate-100 dark:ring-zinc-800 sm:size-20"
            />
          ) : (
            <div className="grid size-16 shrink-0 place-items-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-800 ring-2 ring-slate-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-zinc-800 sm:size-20 sm:text-2xl">
              {initials(header.name)}
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {header.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/50 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {header.status ? header.status.charAt(0).toUpperCase() + header.status.slice(1) : "Active"}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              {header.className ?? "Unassigned"}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-xs font-medium text-slate-500 dark:text-zinc-400 sm:text-[13px]">
              {studentId && (
                <>
                  <span className="flex items-center gap-1.5">
                    Student ID:
                    <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">{studentId}</span>
                    <button
                      onClick={() => handleCopy(studentId, "Student ID")}
                      className="rounded p-1 text-slate-400 transition-colors hover:text-emerald-600"
                      aria-label="Copy Student ID"
                    >
                      {copied === "Student ID" ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </span>
                  <span className="hidden text-slate-300 dark:text-zinc-700 sm:inline">|</span>
                </>
              )}
              <span>
                Roll no.:{" "}
                <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                  {header.rollNumber || "—"}
                </span>
              </span>
              {header.academicYear && (
                <>
                  <span className="hidden text-slate-300 dark:text-zinc-700 sm:inline">|</span>
                  <span>Session: {header.academicYear}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab rail */}
      <div className="no-scrollbar overflow-x-auto rounded-xl border border-slate-200/80 bg-white px-2 py-2 dark:border-zinc-800/70 dark:bg-zinc-900">
        <div className="flex min-w-max items-center gap-1.5 sm:min-w-0">
          {PROFILE_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === tab;
            const count = t.countKey ? counts[t.countKey] : null;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{t.label}</span>
                {count !== null && count > 0 && (
                  <span
                    className={`grid min-w-[18px] place-items-center rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* One tab, one request */}
      {def.live ? (
        tabQuery.isLoading ? (
          <TabLoading label={def.label} />
        ) : tabQuery.error ? (
          <NotFoundFrame
            title={`Couldn't load ${def.label.toLowerCase()}`}
            body={tabQuery.error instanceof Error ? tabQuery.error.message : "The server didn't answer."}
            onBack={onBack}
            backLabel={backLabel}
            retry
          />
        ) : (
          <TabBody tab={tab} data={tabQuery.data} onSwitch={onSwitch} />
        )
      ) : (
        <UnbuiltTab tab={def} />
      )}

      <Dialog open={confirmTrash} onOpenChange={setConfirmTrash}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move {header.name} to trash?</DialogTitle>
            <DialogDescription>
              Their attendance, fees and results stay in place and can be restored from
              Students &rarr; Trash. Nothing is erased.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTrash(false)} disabled={trashing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleTrash} disabled={trashing}>
              {trashing ? "Moving..." : "Move to trash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabBody({
  tab,
  data,
  onSwitch,
}: {
  tab: ProfileTabId;
  data: unknown;
  onSwitch?: (ref: string) => void;
}) {
  if (!data) return null;
  switch (tab) {
    case "summary":
      return <SummaryTab data={data as never} />;
    case "family":
      return <FamilyTab data={data as never} onOpenSibling={onSwitch} />;
    case "academic":
      return <AcademicTab data={data as never} />;
    case "addresses":
      return <AddressesTab data={data as never} />;
    default:
      return null;
  }
}

function TabLoading({ label }: { label: string }) {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 h-4 w-36 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />
                <div className="h-3.5 w-24 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="sr-only">Loading {label}</p>
    </div>
  );
}

function NotFoundFrame({
  title,
  body,
  onBack,
  backLabel = "All students",
  retry,
}: {
  title: string;
  body: string;
  onBack: () => void;
  backLabel?: string;
  retry?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <SearchX className="mx-auto mb-3 size-9 text-slate-300 dark:text-zinc-600" />
      <h3 className="text-[15px] font-semibold text-slate-900 dark:text-zinc-50">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-slate-500 dark:text-zinc-400">
        {body}
      </p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack} className="h-9 rounded-xl text-xs font-semibold">
          Back to {backLabel}
        </Button>
        {retry && (
          <Button
            size="sm"
            onClick={() => window.location.reload()}
            className="h-9 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
