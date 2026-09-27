import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintSheetModePreview } from "./print-sheet-preview";
import { StatusToggle } from "./status-toggle";
import { Printer } from "lucide-react";

interface PrintSheetSettingsCardProps {
  enableModalTabulationPreview: boolean;
  onToggleTabulationPreview: (checked: boolean) => void;
}

export function PrintSheetSettingsCard({
  enableModalTabulationPreview,
  onToggleTabulationPreview,
}: PrintSheetSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Printer className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Print Sheet Preference</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-150 dark:border-zinc-800/60 w-full gap-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Print Sheet Mode
                </h4>
                <p className="text-xs text-muted-foreground">
                  Open print sheets in a popup modal
                </p>
              </div>
              
              <StatusToggle 
                enabled={enableModalTabulationPreview} 
                onToggle={onToggleTabulationPreview} 
              />
            </div>
          </div>

          {/* Right Column: Previews - Desktop Only */}
          <div className="hidden lg:block lg:col-span-5 pl-6 border-l border-zinc-100 dark:border-zinc-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-3 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Interactive Preview Demonstration
            </div>
            <PrintSheetModePreview isEnabled={enableModalTabulationPreview} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
