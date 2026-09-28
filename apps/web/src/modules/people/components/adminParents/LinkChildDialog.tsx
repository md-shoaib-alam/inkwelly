"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  X,
  GraduationCap,
  Link2,
  Loader2,
  Search,
  Mail,
  Phone,
  Check,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ParentInfo, StudentInfo, getInitials } from "./types";

interface LinkChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedParent: ParentInfo | null;
  selectedClass: string;
  setSelectedClass: (cls: string) => void;
  classes: { id: string; name: string; section: string }[];
  filteredStudents: StudentInfo[];
  linking: boolean;
  loading?: boolean;
  onLinkChild: (studentId: string) => void;
  onUnlinkChild: (parentId: string, studentId: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
  unlinkedOnly?: boolean;
  onUnlinkedOnlyChange?: (val: boolean) => void;
}

const STUDENT_AVATAR_COLORS = [
  "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60",
  "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60",
  "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
  "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
  "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
  "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60",
  "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60",
];

const getStudentColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return STUDENT_AVATAR_COLORS[Math.abs(hash) % STUDENT_AVATAR_COLORS.length];
};

export function LinkChildDialog({
  open,
  onOpenChange,
  selectedParent,
  selectedClass,
  setSelectedClass,
  classes,
  filteredStudents,
  linking,
  loading = false,
  onLinkChild,
  onUnlinkChild,
  searchQuery,
  onSearchQueryChange: setSearchQuery,
  hasNextPage = false,
  fetchNextPage,
  isFetchingNextPage = false,
  unlinkedOnly = true,
  onUnlinkedOnlyChange: setUnlinkedOnly,
}: LinkChildDialogProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [linkingStudentId, setLinkingStudentId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll trigger using IntersectionObserver
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !fetchNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    const target = triggerRef.current;
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Reset selection and search on modal toggle
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedStudentIds([]);
      setLinkingStudentId(null);
    }
  }, [open]);

  useEffect(() => {
    if (!linking) {
      setLinkingStudentId(null);
    }
  }, [linking]);

  const searchedStudents = useMemo(() => {
    let list = filteredStudents;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.className && s.className.toLowerCase().includes(q))
    );
  }, [filteredStudents, searchQuery]);

  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
      if (nameCompare !== 0) return nameCompare;
      return a.section.localeCompare(b.section, undefined, { sensitivity: "base" });
    });
  }, [classes]);

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLinkSelected = async () => {
    if (selectedStudentIds.length === 0) return;
    for (const id of selectedStudentIds) {
      await onLinkChild(id);
    }
    setSelectedStudentIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] sm:w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl max-h-[92vh] flex flex-col focus:outline-none"
        data-lenis-prevent
        showCloseButton={false}
      >
        {/* Top Header Section with mint gradient aura and linkchilderntop.avif illustration */}
        <div className="relative px-5 sm:px-8 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-slate-100 dark:border-zinc-800/80 bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-zinc-900 dark:to-zinc-900 shrink-0 overflow-hidden">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors z-20"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          <div className="flex items-start justify-between gap-3 sm:gap-6 pr-8">
            <div className="space-y-1 z-10 max-w-lg">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded-md bg-emerald-600 text-white">
                  <Link2 className="size-3" />
                </span>
                <p className="text-[11px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                  LINK CHILD TO PARENT
                </p>
              </div>
              <DialogTitle className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                Link Child to {selectedParent?.name || "Parent"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Select a student to link as a child for this parent.
              </DialogDescription>
            </div>

            {/* Top Right Decorative Illustration Image (linkchilderntop.avif) - visible on mobile and desktop */}
            <div className="relative w-20 h-16 sm:w-36 sm:h-24 shrink-0 -mr-4 sm:-mr-2 select-none pointer-events-none">
              <Image
                src="/assets/admin/linkchilderntop.avif"
                alt="Link child graphic"
                fill
                className="object-contain drop-shadow-sm opacity-95"
                priority
              />
            </div>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-5 space-y-4 sm:space-y-5 overscroll-contain touch-pan-y"
          data-lenis-prevent
        >
          {/* Parent Summary Card matching the screenshot */}
          {selectedParent && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-3.5 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3 sm:gap-4">
              {/* Vibrant Orange Avatar with Initials */}
              <div className="size-14 sm:size-18 rounded-full bg-amber-500 text-white font-bold text-lg sm:text-2xl flex items-center justify-center shrink-0 shadow-sm">
                {getInitials(selectedParent.name)}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {selectedParent.name}
                  </h3>
                  {selectedParent.occupation && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
                      {selectedParent.occupation}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-500 dark:text-zinc-400">
                  {selectedParent.email && (
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3.5 text-slate-400 shrink-0" />
                      {selectedParent.email}
                    </span>
                  )}
                  {selectedParent.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-slate-400 shrink-0" />
                      {selectedParent.phone.startsWith("+") ? selectedParent.phone : `+91 ${selectedParent.phone}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Currently Linked Children List (if any) */}
          {selectedParent && selectedParent.children && selectedParent.children.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                Currently Linked Children ({selectedParent.children.length})
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedParent.children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-950/20"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(child.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {child.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {child.className || "Class"} • Roll {child.rollNumber || "–"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUnlinkChild(selectedParent.id, child.id)}
                      className="size-7 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-slate-400 flex items-center justify-center transition-colors shrink-0"
                      title="Unlink child"
                      disabled={linking}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Find Student Section Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            {/* Find Student Header Row with Class Select and Unlinked Toggle */}
            <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800/60">
              <div className="hidden sm:flex items-center gap-2">
                <GraduationCap className="size-5 text-emerald-600" />
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Find Student
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Search and select a student to link with this parent.
                  </p>
                </div>
              </div>

              {/* Class Select and Unlinked Toggle: full-width / spread on mobile matching screenshot */}
              <div className="flex items-center justify-between gap-3 w-full">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-10 sm:h-9 flex-1 sm:flex-initial sm:w-[160px] text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {sortedClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} - {c.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Unlinked Only toggle */}
                {setUnlinkedOnly && (
                  <div className="flex items-center gap-2.5 h-10 sm:h-9 px-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 select-none shrink-0">
                    <Switch
                      id="unlinked-only-toggle"
                      checked={unlinkedOnly}
                      onCheckedChange={setUnlinkedOnly}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                    <Label
                      htmlFor="unlinked-only-toggle"
                      className="text-xs text-slate-700 dark:text-zinc-300 font-semibold cursor-pointer"
                    >
                      Unlinked Only
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Search by name, roll number or class..."
                className="pl-9 h-10 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Students List */}
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="size-8 animate-spin mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs text-slate-500">Searching students...</p>
                </div>
              ) : searchedStudents.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 dark:bg-zinc-800/20 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                  <p className="text-slate-500 dark:text-zinc-400 text-xs font-semibold">
                    No students found
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Try changing the class filter or searching with a different keyword.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchedStudents.map((student, idx) => {
                    const isChecked = selectedStudentIds.includes(student.id);
                    const colorClasses = getStudentColor(student.name);

                    return (
                      <div
                        key={student.id ? `${student.id}-${idx}` : idx}
                        onClick={() => toggleStudentSelection(student.id)}
                        className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-xs"
                            : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50/80 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                          {/* Custom Checkbox */}
                          <div
                            className={`size-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                              isChecked
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                            }`}
                          >
                            {isChecked && <Check className="size-3.5 stroke-[3]" />}
                          </div>

                          {/* Colored Student Initials Avatar */}
                          <div
                            className={`size-9 sm:size-10 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${colorClasses}`}
                          >
                            {getInitials(student.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium truncate">
                              {student.className || "Class"} • Roll {student.rollNumber || "–"}
                              {student.parentName && ` • Parent: ${student.parentName}`}
                            </p>
                          </div>
                        </div>

                        {/* Right side: Chevron arrow on mobile, Link button or badge on desktop */}
                        <div className="shrink-0 flex items-center">
                          {/* Mobile: subtle chevron arrow matching the mobile screenshot */}
                          <div className="sm:hidden text-slate-400 dark:text-zinc-500 pl-2">
                            <ChevronRight className="size-4" />
                          </div>

                          {/* Desktop: Link button or Linked badge */}
                          <div className="hidden sm:block">
                            {student.parentId ? (
                              <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-zinc-700">
                                Linked
                              </span>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLinkingStudentId(student.id);
                                  onLinkChild(student.id);
                                }}
                                disabled={linking}
                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-3.5 gap-1.5 shadow-xs"
                              >
                                {linking && linkingStudentId === student.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Link2 className="size-3.5" />
                                )}
                                Link
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {hasNextPage && (
                    <div ref={triggerRef} className="py-4 flex justify-center items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-emerald-600" />
                      <span className="text-xs text-slate-500">Loading more students...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Action Footer matching the screenshot */}
        <div className="px-6 sm:px-8 py-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl px-5 h-10"
          >
            Cancel
          </Button>

          <Button
            onClick={handleLinkSelected}
            disabled={selectedStudentIds.length === 0 || linking}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl px-6 h-10 gap-2 shadow-sm"
          >
            {linking ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Link2 className="size-4" />
                Link Selected {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ""}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
