"use client";

import { apiFetch } from "@/lib/api";
import React, { useEffect, useCallback, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";

// Import modular types, cards, and reducers from school-settings/ subfolder
import {
  DayKey,
  TenantSettings,
  initialState,
  settingsReducer,
} from "./school-settings/types";
import { WorkingDaysSettingsCard } from "./school-settings/working-days-card";
import { MarksheetSettingsCard } from "./school-settings/marksheet-settings-card";
import { PrintSheetSettingsCard } from "./school-settings/print-sheet-settings-card";
import { AdmitCardSettingsCard } from "./school-settings/admit-card-settings-card";
import { ClassSettingsCard } from "./school-settings/class-settings-card";

export function AdminSchoolSettings() {
  const { currentTenantId } = useAppStore();
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  const fetchSettings = useCallback(async () => {
    if (!currentTenantId) return;
    dispatch({ type: "FETCH_START" });
    try {
      const res = await apiFetch("/api/tenant-settings");
      if (!res.ok) throw new Error();
      const data: TenantSettings = await res.json();
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch {
      dispatch({ type: "FETCH_ERROR" });
      toast.error("Failed to load settings. Using default configuration.");
    }
  }, [currentTenantId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const toggleDay = (dayKey: DayKey) => {
    if (state.workingDays.has(dayKey) && state.workingDays.size <= 1) {
      toast.error("At least one working day must be selected.");
      return;
    }
    dispatch({ type: "TOGGLE_DAY", dayKey });
  };

  const quickSelect = (days: DayKey[]) => {
    dispatch({ type: "QUICK_SELECT_DAYS", days });
  };

  const handleTemplateChange = (val: string) => {
    dispatch({ type: "SET_MARKSHEET_TEMPLATE", templateId: val });
  };

  const handleToggleMarksheetPreview = (checked: boolean) => {
    dispatch({ type: "TOGGLE_MARKSHEET_PREVIEW", checked });
  };

  const handleToggleTabulationPreview = (checked: boolean) => {
    dispatch({ type: "TOGGLE_TABULATION_PREVIEW", checked });
  };

  const handleToggleAdmitCardPreview = (checked: boolean) => {
    dispatch({ type: "TOGGLE_ADMIT_CARD_PREVIEW", checked });
  };

  const handleToggleGradeSelection = (checked: boolean) => {
    dispatch({ type: "TOGGLE_GRADE_SELECTION", checked });
  };

  const handleSave = async () => {
    if (!currentTenantId) return;
    if (state.workingDays.size === 0) {
      toast.error("At least one working day must be selected.");
      return;
    }

    dispatch({ type: "SAVE_START" });
    try {
      const settings = {
        ...(state.initialSettings || {}),
        workingDays: Array.from(state.workingDays),
        defaultMarksheetTemplateId: state.defaultMarksheetTemplateId,
        enableModalTabulationPreview: state.enableModalTabulationPreview,
        enableModalMarksheetPreview: state.enableModalMarksheetPreview,
        enableModalAdmitCardPreview: state.enableModalAdmitCardPreview,
        enableGradeSelection: state.enableGradeSelection,
      };

      const res = await apiFetch("/api/tenant-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save settings");
      }

      dispatch({
        type: "SAVE_SUCCESS",
        payload: {
          workingDays: Array.from(state.workingDays),
          defaultMarksheetTemplateId: state.defaultMarksheetTemplateId,
          enableModalTabulationPreview: state.enableModalTabulationPreview,
          enableModalMarksheetPreview: state.enableModalMarksheetPreview,
          enableModalAdmitCardPreview: state.enableModalAdmitCardPreview,
          enableGradeSelection: state.enableGradeSelection,
        },
      });
      toast.success("School settings saved successfully.");
    } catch (err) {
      dispatch({ type: "SAVE_ERROR" });
      toast.error(
        err instanceof Error ? err.message : "Failed to save settings",
      );
    }
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-zinc-500 dark:text-zinc-400">
          Loading settings...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          School Settings
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Configure school preferences and template defaults
        </p>
      </div>

      {/* Working Days Card */}
      <WorkingDaysSettingsCard
        workingDays={state.workingDays}
        onToggleDay={toggleDay}
        onQuickSelect={quickSelect}
      />

      {/* Marksheet Settings Card */}
      <MarksheetSettingsCard
        defaultMarksheetTemplateId={state.defaultMarksheetTemplateId}
        enableModalMarksheetPreview={state.enableModalMarksheetPreview}
        onTemplateChange={handleTemplateChange}
        onToggleMarksheetPreview={handleToggleMarksheetPreview}
      />

      {/* Print Sheet Settings Card */}
      <PrintSheetSettingsCard
        enableModalTabulationPreview={state.enableModalTabulationPreview}
        onToggleTabulationPreview={handleToggleTabulationPreview}
      />

      {/* Admit Card Settings Card */}
      <AdmitCardSettingsCard
        enableModalAdmitCardPreview={state.enableModalAdmitCardPreview}
        onToggleAdmitCardPreview={handleToggleAdmitCardPreview}
      />

      {/* Class Settings Card */}
      <ClassSettingsCard
        enableGradeSelection={state.enableGradeSelection}
        onToggleGradeSelection={handleToggleGradeSelection}
      />

      {/* Summary and Save - Dashboard Page Level Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-card border border-zinc-100 dark:border-zinc-800/80 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <CheckCircle2
            className={`size-4 ${
              state.hasChanges ? "text-amber-500" : "text-emerald-500"
            }`}
          />
          {state.hasChanges ? (
            <span>You have unsaved changes.</span>
          ) : (
            <span>All changes saved.</span>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={state.saving || !state.hasChanges}
          className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
        >
          {state.saving ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="size-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
