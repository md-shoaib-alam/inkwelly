import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Users, Loader2, CheckCircle2, XCircle, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Assignment, Submission, Action } from "../reducer";

export interface SubmissionsDialogProps {
  subDialogOpen: boolean;
  selectedAssignment: Assignment | null;
  subLoading: boolean;
  submissions: Submission[];
  editedGrades?: Record<string, { grade: string; feedback: string }>;
  bulkSaving?: boolean;
  dispatch: React.Dispatch<Action>;
  handleBulkSave?: () => void;
  showCompleted?: boolean;
  refreshData?: () => void;
}

export function SubmissionsDialog({
  subDialogOpen,
  selectedAssignment,
  subLoading,
  submissions,
  dispatch,
  refreshData,
}: SubmissionsDialogProps) {
  // Store local toggles here before bulk saving
  const [editedStatuses, setEditedStatuses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset local state when dialog closes or loads new submissions
  useEffect(() => {
    if (!subDialogOpen) {
      setEditedStatuses({});
    }
  }, [subDialogOpen, submissions]);

  const handleToggleLocalStatus = (sub: Submission) => {
    const currentStatus = editedStatuses[sub.id] || sub.status;
    const isCurrentlySubmitted = currentStatus === "submitted" || currentStatus === "graded";
    const nextStatus = isCurrentlySubmitted ? "not_submitted" : "submitted";

    setEditedStatuses((prev) => ({
      ...prev,
      [sub.id]: nextStatus,
    }));
  };

  const handleSaveBulkChanges = async () => {
    if (!refreshData || !selectedAssignment) return;
    const entries = Object.entries(editedStatuses);
    if (entries.length === 0) return;

    setSaving(true);
    try {
      const updates = entries.map(([id, status]) => {
        return {
          id,
          status,
          assignmentId: selectedAssignment.id,
        };
      });

      const res = await apiFetch("/api/submissions/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          updates,
        }),
      });

      if (res.ok) {
        toast.success(`Successfully saved ${updates.length} changes!`);
        setEditedStatuses({});
        refreshData();
      } else {
        toast.error("Failed to save changes");
      }
    } catch {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(editedStatuses).length > 0;

  return (
    <Dialog
      open={subDialogOpen}
      onOpenChange={(open) => {
        dispatch({ type: "SET_SUB_DIALOG_OPEN", payload: open });
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-4 text-blue-600" />
            {selectedAssignment?.title}
          </DialogTitle>
          <DialogDescription>
            {selectedAssignment?.subjectName} • {selectedAssignment?.className} • Due:{" "}
            {selectedAssignment?.dueDate}
          </DialogDescription>
        </DialogHeader>

        {subLoading ? (
          <div className="space-y-3 py-4 flex-1">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 flex-1">
            <Users className="size-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No students assigned</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto pr-2 space-y-3 py-2 custom-scrollbar flex-1">
              {submissions.map((sub) => {
                const currentStatus = editedStatuses[sub.id] || sub.status;
                const isSubmitted = currentStatus === "submitted" || currentStatus === "graded";
                const isChanged = editedStatuses[sub.id] !== undefined && editedStatuses[sub.id] !== sub.status;

                return (
                  <div
                    key={sub.id}
                    className={`p-4 rounded-lg border flex items-center justify-between gap-4 transition-all ${
                      isSubmitted
                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10"
                        : "border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 opacity-90"
                    } ${isChanged ? "ring-2 ring-blue-500/50" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {sub.studentName}
                        </p>
                        <Badge
                          variant={isSubmitted ? "default" : "outline"}
                          className={`text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-extrabold ${
                            isSubmitted
                              ? "bg-emerald-600 hover:bg-emerald-600 text-white border-0"
                              : "bg-zinc-100 hover:bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {isSubmitted ? "Submitted" : "Pending"}
                        </Badge>
                        {isChanged && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold italic">
                            (Unsaved)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        Roll No: {sub.studentRollNumber || 'N/A'} • Class: {sub.studentClass}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={isSubmitted ? "destructive" : "default"}
                      onClick={() => handleToggleLocalStatus(sub)}
                      className={`h-8 px-3 text-xs gap-1.5 font-bold transition-all shadow-none ${
                        isSubmitted
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-450 dark:border-rose-900/50"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isSubmitted ? (
                        <>
                          <XCircle className="size-3.5" />
                          Mark Pending
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          Mark Submitted
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            {hasChanges && (
              <div className="mt-2 pt-4 border-t border-zinc-150 dark:border-zinc-800 bg-background sticky bottom-0 animate-in fade-in slide-in-from-bottom-3 duration-200">
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-md py-5 text-sm transition-all flex items-center justify-center"
                  onClick={handleSaveBulkChanges}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving changes…
                    </>
                  ) : (
                    <>
                      <Save className="size-4 mr-1" />
                      Save Changes ({Object.keys(editedStatuses).length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
