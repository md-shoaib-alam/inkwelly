"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GraduationCap, RefreshCw } from "lucide-react";

interface ClassSelectorProps {
  selectedClassId: string;
  onClassChange: (id: string) => void;
  classes: any[];
  loadingClasses: boolean;
  loadingClassData: boolean;
  onSyncData: () => void;
  enableGradeSelection?: boolean;
}

export function ClassSelector({
  selectedClassId,
  onClassChange,
  classes,
  loadingClasses,
  loadingClassData,
  onSyncData,
  enableGradeSelection = true,
}: ClassSelectorProps) {
  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="size-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-sm font-bold">1</div>
          Select Class
        </CardTitle>
        <CardDescription>Choose the class for which you want to generate admit cards</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Select value={selectedClassId} onValueChange={onClassChange}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder={loadingClasses ? 'Loading classes...' : 'Select a class'} />
            </SelectTrigger>
            <SelectContent className="max-h-70">
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <GraduationCap className="size-3.5" />
                    {enableGradeSelection ? `${c.grade}, ${c.name}` : c.name} (Section {c.section})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedClassId && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSyncData}
              className="gap-2 text-xs h-9"
              disabled={loadingClassData}
            >
              <RefreshCw className={`size-3.5 ${loadingClassData ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
