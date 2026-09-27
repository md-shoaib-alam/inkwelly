import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Eye, Award } from "lucide-react";
import { handleMarksheetPreview } from "./marksheet-preview";
import { MarksheetTemplatePreviewWidget } from "./marksheet-preview-widget";
import { StatusToggle } from "./status-toggle";

interface MarksheetSettingsCardProps {
  defaultMarksheetTemplateId: string;
  enableModalMarksheetPreview: boolean;
  onTemplateChange: (val: string) => void;
  onToggleMarksheetPreview: (checked: boolean) => void;
}

export function MarksheetSettingsCard({
  defaultMarksheetTemplateId,
  enableModalMarksheetPreview,
  onTemplateChange,
  onToggleMarksheetPreview,
}: MarksheetSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Award className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Marksheet Template Preference</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
              <div className="flex-1">
                <Select
                  value={defaultMarksheetTemplateId}
                  onValueChange={onTemplateChange}
                >
                  <SelectTrigger className="w-full h-10 border-violet-200 dark:border-violet-900/50 bg-background text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <Settings className="size-4 text-violet-500" />
                      <SelectValue placeholder="Choose default marksheet…" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="classic">Classic Academy</SelectItem>
                    <SelectItem value="modern">Modern Minimalist</SelectItem>
                    <SelectItem value="royal">Royal Gold Elite</SelectItem>
                    <SelectItem value="creative">Creative Compact</SelectItem>
                    <SelectItem value="cbse">CBSE Public School</SelectItem>
                    <SelectItem value="icse">ICSE Semester Convent</SelectItem>
                    <SelectItem value="stateboard">State Board Green-Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 border-violet-200 dark:border-violet-900/50 hover:bg-violet-50 dark:hover:bg-violet-950/20 text-violet-700 dark:text-violet-400 gap-1.5 font-semibold text-xs shrink-0"
                onClick={() => handleMarksheetPreview(defaultMarksheetTemplateId)}
              >
                <Eye className="size-4" />
                Preview Template
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-150 dark:border-zinc-800/60 w-full gap-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Marksheet Preview Mode
                </h4>
                <p className="text-xs text-muted-foreground">
                  Show previews in a popup modal
                </p>
              </div>
              
              <StatusToggle 
                enabled={enableModalMarksheetPreview} 
                onToggle={onToggleMarksheetPreview} 
              />
            </div>
          </div>

          {/* Right Column: Previews - Desktop Only */}
          <div className="hidden lg:block lg:col-span-5 pl-6 border-l border-zinc-100 dark:border-zinc-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-3 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-violet-500 animate-pulse" />
              Template Preview
            </div>
            <MarksheetTemplatePreviewWidget templateId={defaultMarksheetTemplateId} isEnabled={enableModalMarksheetPreview} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
