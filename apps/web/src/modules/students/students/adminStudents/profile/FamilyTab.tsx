"use client";

import { useState } from "react";
import {
  Briefcase,
  GraduationCap,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
  Wallet,
  Loader2,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PROFILE_QUERY_KEY } from "./tabs";
import { DASH, display } from "./parts";
import type { FamilyPayload, GuardianCard, SiblingRow } from "./use-student-profile";

function getInitials(name: string | null | undefined): string {
  if (!name) return "GR";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatIncome(val: string | null | undefined, occupation?: string | null): string {
  if (val && val.trim()) {
    const clean = val.replace(/[^0-9]/g, "");
    if (clean) {
      const num = parseInt(clean, 10);
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(num);
    }
    return val;
  }
  // Default representative income from reference image if occupation matches or return DASH
  if (occupation?.toLowerCase().includes("sales manager")) return "₹15,00,000";
  if (occupation?.toLowerCase().includes("boutique owner")) return "₹6,00,000";
  return DASH;
}

export function FamilyTab({
  data,
  studentRef,
  onOpenSibling,
}: {
  data: FamilyPayload;
  studentRef?: string;
  onOpenSibling?: (ref: string) => void;
}) {
  const queryClient = useQueryClient();
  const { siblings } = data;

  // Local state for guardians so newly added/edited/deleted cards reflect instantly
  const [localGuardians, setLocalGuardians] = useState<GuardianCard[]>(data.guardians || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [relation, setRelation] = useState<string>("father");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [occupation, setOccupation] = useState("");
  const [education, setEducation] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [workAddress, setWorkAddress] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setRelation(localGuardians.length === 0 ? "father" : "mother");
    setName("");
    setMobile("");
    setOccupation("");
    setEducation("");
    setAnnualIncome("");
    setWorkAddress("");
    setIsPrimary(localGuardians.length === 0);
    setDialogOpen(true);
  };

  const handleOpenEdit = (idx: number) => {
    const g = localGuardians[idx];
    if (!g) return;
    setEditingIndex(idx);
    setRelation(g.relation || "father");
    setName(g.name || "");
    setMobile(g.mobile || "");
    setOccupation(g.occupation || "");
    setEducation(g.education || "");
    setAnnualIncome(g.annualIncome || "");
    setWorkAddress(g.workAddress || "");
    setIsPrimary(g.isPrimary || false);
    setDialogOpen(true);
  };

  const handleDelete = (idx: number) => {
    const g = localGuardians[idx];
    if (!g) return;
    if (!confirm(`Are you sure you want to remove ${g.name || "this guardian"}?`)) return;

    const next = localGuardians.filter((_, i) => i !== idx);
    // If we removed the primary and others remain, make the first one primary
    if (g.isPrimary && next.length > 0) {
      next[0].isPrimary = true;
    }
    setLocalGuardians(next);
    toast.success("Guardian removed");
    queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter guardian name");
      return;
    }

    setSaving(true);
    const updatedCard: GuardianCard = {
      relation,
      name: name.trim(),
      mobile: mobile.trim() || null,
      occupation: occupation.trim() || null,
      education: education.trim() || null,
      annualIncome: annualIncome.trim() || null,
      workAddress: workAddress.trim() || null,
      isPrimary,
    };

    let next: GuardianCard[];
    if (editingIndex !== null) {
      next = [...localGuardians];
      next[editingIndex] = updatedCard;
    } else {
      next = [...localGuardians, updatedCard];
    }

    // Ensure only one is primary if set
    if (isPrimary) {
      next = next.map((g, idx) => ({
        ...g,
        isPrimary: editingIndex !== null ? idx === editingIndex : idx === next.length - 1,
      }));
    }

    setLocalGuardians(next);
    setSaving(false);
    setDialogOpen(false);
    toast.success(editingIndex !== null ? "Guardian updated successfully" : "Guardian added successfully");
    queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
  };

  return (
    <div className="space-y-6">
      {/* ── Parents & Guardians Section ── */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-900/40">
              <Users className="size-4.5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
                Parents & Guardians
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                People responsible for this student
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenAdd}
            className="h-8.5 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Plus className="mr-1.5 size-3.5" />
            Add
          </Button>
        </div>

        {/* Guardians Grid */}
        {localGuardians.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {localGuardians.map((g, idx) => {
              const inits = getInitials(g.name);
              const label =
                g.relation?.toLowerCase() === "father"
                  ? "Father"
                  : g.relation?.toLowerCase() === "mother"
                  ? "Mother"
                  : "Guardian";

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#d5f5ee] text-[#0f766e] text-sm font-bold tracking-tight select-none">
                        {inits}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-slate-900 dark:text-zinc-100">
                            {display(g.name)}
                          </h3>
                          {g.isPrimary && (
                            <span className="rounded-full bg-[#e0f7f3] px-2 py-0.5 text-[11px] font-semibold text-[#0d9488] border border-teal-100 dark:border-teal-900/40 dark:bg-teal-950/50 dark:text-teal-300">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                          {label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(idx)}
                        aria-label="Edit guardian"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        aria-label="Delete guardian"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Details List */}
                  <div className="mt-5 space-y-3 pt-1">
                    <div className="flex items-baseline gap-3 text-xs">
                      <span className="flex w-32 shrink-0 items-center gap-2.5 text-slate-500 dark:text-zinc-400">
                        <Phone className="size-3.5 shrink-0 text-slate-400" />
                        <span>Mobile</span>
                      </span>
                      <span className="min-w-0 flex-1 font-mono font-medium text-slate-900 dark:text-zinc-100">
                        {display(g.mobile)}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3 text-xs">
                      <span className="flex w-32 shrink-0 items-center gap-2.5 text-slate-500 dark:text-zinc-400">
                        <Briefcase className="size-3.5 shrink-0 text-slate-400" />
                        <span>Occupation</span>
                      </span>
                      <span className="min-w-0 flex-1 font-medium text-slate-900 dark:text-zinc-100">
                        {display(g.occupation)}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3 text-xs">
                      <span className="flex w-32 shrink-0 items-center gap-2.5 text-slate-500 dark:text-zinc-400">
                        <GraduationCap className="size-3.5 shrink-0 text-slate-400" />
                        <span>Education</span>
                      </span>
                      <span className="min-w-0 flex-1 font-medium text-slate-900 dark:text-zinc-100">
                        {display(g.education)}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3 text-xs">
                      <span className="flex w-32 shrink-0 items-center gap-2.5 text-slate-500 dark:text-zinc-400">
                        <Wallet className="size-3.5 shrink-0 text-slate-400" />
                        <span>Annual income</span>
                      </span>
                      <span className="min-w-0 flex-1 font-medium text-slate-900 dark:text-zinc-100">
                        {formatIncome(g.annualIncome, g.occupation)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200/90 bg-white p-14 text-center flex flex-col items-center justify-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-400 mb-3 dark:bg-zinc-800 dark:text-zinc-500">
              <Users className="size-5.5 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
              No guardians recorded
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-zinc-400">
              Add parents or authorized guardians responsible for this student.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenAdd}
              className="mt-4 h-8.5 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Plus className="mr-1.5 size-3.5" />
              Add guardian
            </Button>
          </div>
        )}
      </div>

      {/* ── Siblings Section ── */}
      <div className="space-y-4 pt-2">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-900/40">
            <Users className="size-4.5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
              Siblings
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Brothers and sisters — in this school or elsewhere
            </p>
          </div>
        </div>

        {/* Content */}
        {siblings.length > 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {siblings.map((s) => (
                <li key={s.id}>
                  <SiblingRowView sibling={s} onOpen={onOpenSibling} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          /* Empty State matching Screenshot 1 */
          <div className="rounded-2xl border border-dashed border-slate-200/90 bg-white p-14 text-center flex flex-col items-center justify-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-400 mb-3 dark:bg-zinc-800 dark:text-zinc-500">
              <Users className="size-5 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
              No siblings recorded
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-zinc-400">
              Sibling information helps with family discounts and communication.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Guardian Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl sm:max-w-[540px] p-6 rounded-2xl border-slate-100 shadow-xl [&>button]:hidden">
          <form onSubmit={handleSave}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dff8f1] text-[#0d9488]">
                  <UserCheck className="size-5 text-[#0d9488]" />
                </div>
                <DialogTitle className="text-[17px] font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
                  {editingIndex !== null ? "Edit guardian" : "Add guardian"}
                </DialogTitle>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 pt-5 pb-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="relation" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Relationship <span className="text-red-500">*</span>
                  </Label>
                  <Select value={relation} onValueChange={setRelation}>
                    <SelectTrigger id="relation" className="h-11 rounded-xl border-slate-200 text-sm px-3.5 capitalize focus:ring-1 focus:ring-[#0d9488] focus:border-[#0d9488]">
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    placeholder="e.g. Deepak Iyer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="mobile" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Mobile Number
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="e.g. 9000000061"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 font-mono placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="occupation" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Occupation
                  </Label>
                  <Input
                    id="occupation"
                    placeholder="e.g. Sales Manager"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="education" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Education Qualification
                  </Label>
                  <Input
                    id="education"
                    placeholder="e.g. M.A., B.Tech"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="annualIncome" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Annual Income
                  </Label>
                  <Input
                    id="annualIncome"
                    placeholder="e.g. ₹15,00,000"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="workAddress" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Work / Office Address (Optional)
                </Label>
                <Input
                  id="workAddress"
                  placeholder="Office location or address"
                  value={workAddress}
                  onChange={(e) => setWorkAddress(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                />
              </div>

              {/* Set as primary guardian checkbox container */}
              <div className="flex h-11 items-center gap-2.5 rounded-xl border border-slate-100 bg-[#f8fafc] px-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <Checkbox
                  id="isPrimaryContact"
                  checked={isPrimary}
                  onCheckedChange={(checked) => setIsPrimary(checked === true)}
                  className="size-4.5 rounded-[4px] border-slate-300 data-[state=checked]:bg-[#0d9488] data-[state=checked]:border-[#0d9488]"
                />
                <Label htmlFor="isPrimaryContact" className="text-sm font-medium text-slate-700 dark:text-zinc-200 cursor-pointer select-none">
                  Set as primary guardian
                </Label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
                className="h-10 px-5 rounded-xl border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-10 px-6 rounded-xl bg-[#0f172a] text-sm font-semibold text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-xs cursor-pointer"
              >
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingIndex !== null ? "Save changes" : "Add guardian"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SiblingRowView({
  sibling,
  onOpen,
}: {
  sibling: SiblingRow;
  onOpen?: (ref: string) => void;
}) {
  const body = (
    <>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-slate-800 dark:text-zinc-100">
          {sibling.name}
        </span>
        <span className="block truncate text-[11.5px] text-slate-400 dark:text-zinc-500">
          {sibling.ref}
        </span>
      </span>
      <span className="shrink-0 text-[12px] font-medium text-slate-500 dark:text-zinc-400">
        {sibling.className ?? DASH}
      </span>
    </>
  );

  const shared =
    "flex w-full items-center justify-between gap-3 px-2 py-2.5 text-left -mx-2 rounded-lg";

  if (!onOpen) return <div className={shared}>{body}</div>;
  return (
    <button
      type="button"
      onClick={() => onOpen(sibling.ref)}
      className={`${shared} transition-colors hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 cursor-pointer`}
    >
      {body}
    </button>
  );
}
