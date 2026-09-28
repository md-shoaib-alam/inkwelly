"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { ClassInfo, SubjectInfo, GradeManagementAction } from "./types";

interface CreateAssessmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dialogClassId: string;
  dialogSubjectId: string;
  newTitle: string;
  newType: string;
  newMode: string;
  newTotalMarks: string;
  newPassingMarks: string;
  isCreating: boolean;
  classes: ClassInfo[];
  subjects: SubjectInfo[];
  dispatch: React.Dispatch<GradeManagementAction>;
  onCreate: () => void;
}

export function CreateAssessmentDialog({
  isOpen,
  onOpenChange,
  dialogClassId,
  dialogSubjectId,
  newTitle,
  newType,
  newMode,
  newTotalMarks,
  newPassingMarks,
  isCreating,
  classes,
  subjects,
  dispatch,
  onCreate,
}: CreateAssessmentDialogProps) {
  const filteredSubjects = React.useMemo(() => {
    if (!dialogClassId) return [];
    return subjects.filter(s => s.classId === dialogClassId);
  }, [subjects, dialogClassId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md font-semibold transition-all hover:translate-y-[-1px] group">
          <Plus className="size-4 mr-2 group-hover:rotate-90 transition-all duration-200" />
          Create Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="size-5 text-blue-500" />
            New Assessment
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          {/* Integrated Class & Subject Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold text-muted-foreground">Class *</Label>
              <Select
                value={dialogClassId}
                onValueChange={(v) => {
                  dispatch({ type: "SET_DIALOG_CLASS_ID", value: v });
                }}
                disabled={classes.length === 0}
              >
                <SelectTrigger className="h-9 focus:ring-blue-500 focus-visible:ring-blue-500">
                  <SelectValue placeholder={classes.length === 0 ? "No classes assigned" : "Select Class"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} - {c.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-semibold text-muted-foreground">Subject *</Label>
              <Select
                value={dialogSubjectId}
                onValueChange={(v) => dispatch({ type: "SET_DIALOG_SUBJECT_ID", value: v })}
                disabled={!dialogClassId || filteredSubjects.length === 0}
              >
                <SelectTrigger className="h-9 focus:ring-blue-500 focus-visible:ring-blue-500">
                  <SelectValue placeholder={!dialogClassId ? "Select Class First" : (filteredSubjects.length === 0 ? "No subjects assigned" : "Select Subject")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title / Name</Label>
            <Input
              id="title"
              placeholder="e.g., Chapter 1 Algebra Quiz"
              value={newTitle}
              onChange={(e) => dispatch({ type: "SET_NEW_TITLE", value: e.target.value })}
              className="focus-visible:ring-blue-500 h-9"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold text-muted-foreground">Category Type</Label>
              <Select value={newType} onValueChange={(v) => dispatch({ type: "SET_NEW_TYPE", value: v })}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit_test">Unit Test</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="practical">Practical / Lab</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-semibold text-muted-foreground">Submission Mode</Label>
              <Select value={newMode} onValueChange={(v) => dispatch({ type: "SET_NEW_MODE", value: v })}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">Offline (Classroom)</SelectItem>
                  <SelectItem value="online" disabled className="text-muted-foreground">
                    Online (🔒 Premium Only)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="total" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total Marks</Label>
              <Input
                id="total"
                type="number"
                value={newTotalMarks}
                onChange={(e) => dispatch({ type: "SET_NEW_TOTAL_MARKS", value: e.target.value })}
                className="focus-visible:ring-blue-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="passing" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Passing Marks</Label>
              <Input
                id="passing"
                type="number"
                value={newPassingMarks}
                onChange={(e) => dispatch({ type: "SET_NEW_PASSING_MARKS", value: e.target.value })}
                className="focus-visible:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button
            onClick={onCreate}
            disabled={isCreating || !newTitle.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isCreating ? <Loader2 className="size-4 animate-spin" /> : "Create Assessment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
