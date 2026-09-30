"use client";

import { useState } from "react";
import {
  Check,
  ChevronLeft,
  Copy,
  FileDown,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  SearchX,
  Shield,
  Target,
  Trash2,
  UserX,
} from "lucide-react";
import { downloadAdmissionFormPDF } from "./admissionFormPrinter";
import { useAppStore } from "@/store/use-app-store";
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
import { PROFILE_TABS, PROFILE_QUERY_KEY, tabDefOf, type ProfileTabId } from "./tabs";
import { formatDate } from "./parts";
import { isForbidden, isNotFound, useProfileHeader, useProfileTab } from "./use-student-profile";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { SummaryTab } from "./SummaryTab";
import { FamilyTab } from "./FamilyTab";
import { AcademicTab } from "./AcademicTab";
import { AddressesTab } from "./AddressesTab";
import { BankTab } from "./BankTab";
import { DocumentsTab } from "./DocumentsTab";
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
  const [confirmStatusAction, setConfirmStatusAction] = useState<"graduate" | "suspend" | "deactivate" | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { data: profile, isLoading, error } = useProfileHeader(studentRef);

  const def = tabDefOf(tab);
  const tabQuery = useProfileTab(studentRef, tab, def.live);

  const handleStatusAction = async () => {
    if (!profile || !confirmStatusAction) return;
    setStatusSubmitting(true);
    try {
      let newStatus = "active";
      let successMessage = "";
      if (confirmStatusAction === "graduate") {
        newStatus = "graduated";
        successMessage = `${profile.header.name} marked as graduated`;
      } else if (confirmStatusAction === "suspend") {
        newStatus = profile.header.status === "suspended" ? "active" : "suspended";
        successMessage = profile.header.status === "suspended" ? `${profile.header.name} reactivated` : `${profile.header.name} suspended`;
      } else if (confirmStatusAction === "deactivate") {
        newStatus = profile.header.status === "inactive" ? "active" : "inactive";
        successMessage = profile.header.status === "inactive" ? `${profile.header.name} activated` : `${profile.header.name} deactivated`;
      }

      const res = await apiFetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profile.header.id,
          status: newStatus,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.success === false) {
        throw new Error(body?.error || "Failed to update student status");
      }

      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(successMessage);
      setConfirmStatusAction(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleDownloadAdmissionForm = async () => {
    if (!profile) return;
    try {
      toast.loading("Generating admission form PDF...", { id: "adm-form" });

      // Primary: Generate vector PDF on server via Playwright (Headless Chromium Skia engine)
      const res = await apiFetch(`/api/student-profile/${encodeURIComponent(studentRef)}/admission-form-pdf`);

      if (res.ok) {
        const blob = await res.blob();
        const disposition = res.headers.get("Content-Disposition");
        let filename = `Admission-Form-${profile.header?.admissionNo || profile.header?.studentId || "Record"}.pdf`;
        if (disposition && disposition.includes("filename=")) {
          const match = /filename=["']?([^"']+)["']?/.exec(disposition);
          if (match?.[1]) filename = match[1];
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);

        toast.success("Admission form downloaded successfully!", { id: "adm-form" });
        return;
      }

      // Fallback: Client-side @react-pdf/renderer
      const [summaryRes, familyRes] = await Promise.all([
        tab === "summary" && tabQuery.data
          ? Promise.resolve({ ok: true, json: async () => tabQuery.data })
          : apiFetch(`/api/student-profile/${encodeURIComponent(studentRef)}?tab=summary`),
        tab === "family" && tabQuery.data
          ? Promise.resolve({ ok: true, json: async () => tabQuery.data })
          : apiFetch(`/api/student-profile/${encodeURIComponent(studentRef)}?tab=family`),
      ]);

      const summaryData = summaryRes.ok ? await summaryRes.json() : null;
      const familyData  = familyRes.ok  ? await familyRes.json()  : null;

      const tenantState = useAppStore.getState();
      const school = {
        name:    tenantState.currentTenantName || "Delhi Public School Delhi",
        logo:    tenantState.currentTenantLogo || undefined,
        address: tenantState.currentUser?.address || undefined,
      };

      await downloadAdmissionFormPDF({
        student: {
          ...profile.header,
          admissionNo: profile.header?.admissionNo || summaryData?.identifiers?.admissionNo,
          studentId: profile.header?.studentId || summaryData?.identifiers?.studentId,
        },
        summary: summaryData,
        family:  familyData,
        school,
      });

      toast.success("Admission form downloaded successfully!", { id: "adm-form" });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate admission form: " + (err?.message || "Unknown error"), { id: "adm-form" });
    }
  };

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
      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
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
  // The reference carries every identifier the school has issued on one dotted line,
  // rather than labelling each one. A school that issues none of them has no line.
  const idLine = [header.admissionNo, studentId, header.rollNumber].filter(Boolean).join(" · ");
  const enrolledIn = [
    header.className,
    header.academicYear ? `Session ${header.academicYear}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h1 className="text-[20px] sm:text-[22px] leading-tight font-bold font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
            Student Information Profile
          </h1>
          <p className="mt-0.5 truncate text-[13px] text-[#64748B] dark:text-zinc-400">
            Personal details, family, academic history, and records for {header.name}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onSwitch && (
            <ProfileSwitcher currentRef={studentRef} onPick={onSwitch} onAllStudents={onBack} />
          )}

          <Button
            type="button"
            onClick={() => onTabChange("summary")}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-3.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Target className="size-4" />
            Full 360 view
          </Button>

          {canEdit && onEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Pencil className="size-3.5 text-slate-700 dark:text-zinc-300" />
              Edit
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="More options"
                className="size-9 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800 shadow-xs flex items-center justify-center cursor-pointer"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <DropdownMenuItem
                onClick={() => setConfirmStatusAction("graduate")}
                className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-zinc-200 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <GraduationCap className="size-4 text-slate-500 dark:text-zinc-400" />
                <span>Graduate</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setConfirmStatusAction("suspend")}
                className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-zinc-200 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <Shield className="size-4 text-slate-500 dark:text-zinc-400" />
                <span>{header.status === "suspended" ? "Reactivate" : "Suspend"}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setConfirmStatusAction("deactivate")}
                className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-zinc-200 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <UserX className="size-4 text-slate-500 dark:text-zinc-400" />
                <span>{header.status === "inactive" ? "Activate" : "Deactivate"}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-zinc-800" />

              <DropdownMenuItem
                onClick={handleDownloadAdmissionForm}
                className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-zinc-200 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <FileDown className="size-4 text-slate-500 dark:text-zinc-400" />
                <span>Download admission form</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-zinc-800" />

              <DropdownMenuItem
                onClick={() => {
                  if (!canDelete) {
                    toast.error("You do not have permission to delete students");
                    return;
                  }
                  setConfirmTrash(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-red-600 dark:text-red-400 rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/40 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40"
              >
                <Trash2 className="size-4 text-red-600 dark:text-red-400" />
                <span>Delete student</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Identity card */}
      <section className="rounded-lg border border-slate-200/90 bg-white px-5 py-5 sm:px-6 sm:py-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:border-zinc-800/80 dark:bg-zinc-900">
        <div className="flex items-start gap-4">
          {header.avatar ? (
            <img
              src={header.avatar}
              alt=""
              className="size-20 shrink-0 rounded-xl object-cover ring-1 ring-slate-100 dark:ring-zinc-800 sm:size-24"
            />
          ) : (
            <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-emerald-50 text-2xl font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 sm:size-24 sm:text-3xl">
              {initials(header.name)}
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[22px] sm:text-[24px] leading-tight font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
                {header.name}
              </h2>
              {(() => {
                const s = (header.status || "active").toLowerCase();
                const isInactive = s === "inactive" || s === "suspended";
                const isGraduated = s === "graduated";

                const badgeClasses = isInactive
                  ? "border-red-200/80 bg-red-50 text-red-700 dark:border-red-800/80 dark:bg-red-950/50 dark:text-red-400"
                  : isGraduated
                  ? "border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-800/80 dark:bg-sky-950/50 dark:text-sky-400"
                  : "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/50 dark:text-emerald-400";

                const dotClasses = isInactive
                  ? "bg-red-500"
                  : isGraduated
                  ? "bg-sky-500"
                  : "bg-emerald-500";

                return (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeClasses}`}>
                    <span className={`size-1.5 rounded-full ${dotClasses}`} />
                    {header.status ? header.status.charAt(0).toUpperCase() + header.status.slice(1) : "Active"}
                  </span>
                );
              })()}
            </div>

            {idLine && (
              <div className="flex flex-wrap items-center gap-1 text-[12.5px] text-[#64748B] dark:text-zinc-400">
                <span className="font-mono">{idLine}</span>
                {studentId && (
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
                )}
              </div>
            )}

            <p className="text-[13px] font-medium text-slate-700 dark:text-zinc-200">
              {enrolledIn || "Not assigned to a class"}
            </p>

            {header.joiningDate && (
              <p className="text-[12.5px] text-[#64748B] dark:text-zinc-400">
                Joined {formatDate(header.joiningDate)}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Tab rail */}
      <div className="no-scrollbar overflow-x-auto border-b border-slate-200/80 dark:border-zinc-800">
        <div className="flex min-w-max items-center gap-7 sm:min-w-0">
          {PROFILE_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === tab;
            const count = t.countKey ? counts[t.countKey] : null;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                aria-current={isActive ? "page" : undefined}
                className={`-mb-px flex cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-0.5 pb-3 pt-1 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? "" : "text-slate-400 dark:text-zinc-500"}`} />
                <span>{t.label}</span>
                {count !== null && count > 0 && (
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive
                        ? "bg-[#dff8f1] text-[#0d9488] dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
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
      {tab === "bank" ? (
        <BankTab studentRef={studentRef} />
      ) : tab === "documents" ? (
        <DocumentsTab studentRef={studentRef} />
      ) : def.live ? (
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
          <TabBody tab={tab} data={tabQuery.data} studentRef={studentRef} onSwitch={onSwitch} />
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

      <Dialog open={Boolean(confirmStatusAction)} onOpenChange={(open) => !open && setConfirmStatusAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmStatusAction === "graduate" && `Graduate ${header.name}?`}
              {confirmStatusAction === "suspend" && (header.status === "suspended" ? `Reactivate ${header.name}?` : `Suspend ${header.name}?`)}
              {confirmStatusAction === "deactivate" && (header.status === "inactive" ? `Activate ${header.name}?` : `Deactivate ${header.name}?`)}
            </DialogTitle>
            <DialogDescription>
              {confirmStatusAction === "graduate" && "This will change the student's status to Graduated. They will be marked as passed out from the institution."}
              {confirmStatusAction === "suspend" && (header.status === "suspended" ? "This will restore the student's status to Active." : "This will mark the student as Suspended.")}
              {confirmStatusAction === "deactivate" && (header.status === "inactive" ? "This will reactivate the student's profile to Active." : "This will mark the student as Inactive.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStatusAction(null)} disabled={statusSubmitting}>
              Cancel
            </Button>
            <Button
              variant={confirmStatusAction === "graduate" ? "default" : "destructive"}
              onClick={handleStatusAction}
              disabled={statusSubmitting}
              className={confirmStatusAction === "graduate" ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
            >
              {statusSubmitting ? "Updating..." : confirmStatusAction === "graduate" ? "Mark as Graduated" : confirmStatusAction === "suspend" ? (header.status === "suspended" ? "Reactivate" : "Suspend") : (header.status === "inactive" ? "Activate" : "Deactivate")}
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
  studentRef,
  onSwitch,
}: {
  tab: ProfileTabId;
  data: unknown;
  studentRef: string;
  onSwitch?: (ref: string) => void;
}) {
  if (!data) return null;
  switch (tab) {
    case "summary":
      return <SummaryTab data={data as never} />;
    case "family":
      return <FamilyTab data={data as never} studentRef={studentRef} onOpenSibling={onSwitch} />;
    case "academic":
      return <AcademicTab data={data as never} />;
    case "addresses":
      return <AddressesTab studentRef={studentRef} data={data as never} />;
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
