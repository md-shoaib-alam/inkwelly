import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, School } from "lucide-react";
import { StatusToggle } from "./status-toggle";

interface ClassSettingsCardProps {
  enableGradeSelection: boolean;
  onToggleGradeSelection: (checked: boolean) => void;
}

export function ClassSettingsCard({
  enableGradeSelection,
  onToggleGradeSelection,
}: ClassSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <School className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Class Creation Mode</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-150 dark:border-zinc-800/60 w-full gap-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Separate Grade Selection
                </h4>
                <p className="text-xs text-muted-foreground">
                  Choose to map grades manually when creating classes
                </p>
              </div>
              
              <StatusToggle 
                enabled={enableGradeSelection} 
                onToggle={onToggleGradeSelection} 
              />
            </div>
          </div>

          {/* Right Column: Visual Form Demo - Desktop Only */}
          <div className="hidden lg:block lg:col-span-5 pl-6 border-l border-zinc-100 dark:border-zinc-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-3 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Form Layout Demonstration
            </div>
            
            <div className="w-full max-w-[280px] bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-4 space-y-3.5 shadow-sm relative overflow-hidden select-none mx-auto">
              <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-2">
                <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Add Class Form</div>
                <Layers className="size-3.5 text-zinc-400" />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-zinc-500">Class Name</div>
                <div className="h-7 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center px-2 text-[11px] text-zinc-700 dark:text-zinc-300 shadow-sm">Class 1</div>
              </div>
              <div className={`space-y-1 transition-all duration-500 ${enableGradeSelection ? "opacity-100" : "opacity-30"}`}>
                <div className="text-[10px] font-semibold text-zinc-500">Grade</div>
                <div className="h-7 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center px-2 text-[11px] text-zinc-700 dark:text-zinc-300 shadow-sm border-dashed">1</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
