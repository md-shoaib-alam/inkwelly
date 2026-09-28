"use client";

import { User, Pencil, ChevronUp, ChevronDown, Check, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { TeacherInfo } from "./types";

interface PersonalCardProps {
  currentTeacher: TeacherInfo;
  formData: any;
  setFormData: (data: any) => void;
  displayTeacherId: string;
  displayAddress: string;
  canEdit?: boolean;
  isEditing: boolean;
  isSaving: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  getInitials: (name: string) => string;
}

export function TeacherPersonalCard({
  currentTeacher,
  formData,
  setFormData,
  displayTeacherId,
  displayAddress,
  canEdit,
  isEditing,
  isSaving,
  isCollapsed,
  onToggleCollapse,
  onStartEdit,
  onCancelEdit,
  onSave,
  getInitials,
}: PersonalCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm sm:text-base">
          <User className="size-4 text-emerald-600" />
          Personal & Contact Information
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onCancelEdit}
                disabled={isSaving}
                className="h-8 px-3 text-xs rounded-lg font-medium text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="h-8 px-3 text-xs rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
              >
                {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                Save
              </Button>
            </div>
          ) : (
            canEdit && (
              <button
                onClick={onStartEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
            aria-label="Toggle section"
          >
            {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        isEditing ? (
          /* EDIT FORM */
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Teacher Name"
                  className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="teacher@school.com"
                  className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Phone Number
                </Label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 focus-within:ring-1 focus-within:ring-emerald-500">
                  <span className="inline-flex items-center px-2.5 text-xs text-slate-500 bg-slate-100 dark:bg-zinc-800 border-r border-slate-200 dark:border-zinc-700 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full h-9 px-3 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Address
                </Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="City, State / Full Address"
                  className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Teacher Photo</Label>
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(formData.name)}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs rounded-xl border-slate-200 dark:border-zinc-700 font-medium gap-1.5 hover:bg-slate-50"
                    onClick={() => toast.info("Photo upload will be saved with profile")}
                  >
                    <Upload className="size-3.5" />
                    Upload Photo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW MODE */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-xs sm:text-sm">
            <div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Full Name</p>
              <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">{currentTeacher.name}</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Email Address</p>
              <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5 truncate">{currentTeacher.email}</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Phone Number</p>
              <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">{currentTeacher.phone || "—"}</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Teacher ID</p>
              <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">{displayTeacherId}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Address</p>
              <p className="font-semibold text-slate-800 dark:text-zinc-100 mt-0.5">{displayAddress}</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
