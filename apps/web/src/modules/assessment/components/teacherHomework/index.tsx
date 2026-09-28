"use client";

import { apiFetch } from "@/lib/api";
import { useReducer, useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { reducer, initialState, Assignment } from "./reducer";
import { HomeworkCreateDialog } from "./components/HomeworkCreateDialog";
import { OverdueHomeworkCard } from "./components/OverdueHomeworkCard";
import { AssignmentGrid } from "./components/AssignmentGrid";
import { SubmissionsDialog } from "./components/SubmissionsDialog";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppStore } from "@/store/use-app-store";
import { 
  History, Calendar as CalendarIcon, ArrowLeft, ArrowRight, ShieldAlert,
  HelpCircle, ChevronLeft, ChevronRight, Lock
} from "lucide-react";
import { differenceInDays, parseISO, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";

export function TeacherAssignments({ showCompleted = false }: { showCompleted?: boolean }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    assignments,
    subjects,
    loading,
    dialogOpen,
    form,
    subDialogOpen,
    selectedAssignment,
    submissions,
    subLoading,
    editedGrades,
    bulkSaving,
    completingId,
    confirmCompleteId,
  } = state;

  const { currentTenantSlug, currentUser: user } = useAppStore();
  const [tenantPlan, setTenantPlan] = useState<string>("basic");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [cachedAssignments, setCachedAssignments] = useState<Record<string, Assignment[]>>({});

  const ITEMS_PER_PAGE = 15;
  const getStatusParam = () => showCompleted ? "completed" : "active";

  // Fetch plan info
  useEffect(() => {
    if (currentTenantSlug) {
      apiFetch(`/api/tenants/resolve/${currentTenantSlug}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.plan) {
            setTenantPlan(data.plan.toLowerCase());
          }
        })
        .catch(() => {});
    }
  }, [currentTenantSlug]);

  // Caching Fetch Layer
  useEffect(() => {
    if (!user) return;

    const statusParam = getStatusParam();
    const cacheKey = `${statusParam}-${user.role}`;
    
    // Check local cache first
    if (cachedAssignments[cacheKey]) {
      dispatch({ type: "SET_ASSIGNMENTS", payload: cachedAssignments[cacheKey] });
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });
    Promise.all([
      apiFetch(`/api/homework?mine=true&status=${statusParam}`).then(async r => {
        const data = await r.json();
        let items = Array.isArray(data) ? data : (data?.items || data?.data || []);
        if (items.length === 0 && (user?.role === 'admin' || user?.role === 'super_admin')) {
          const fallback = await apiFetch(`/api/homework?status=${statusParam}`).then(fr => fr.json());
          items = Array.isArray(fallback) ? fallback : (fallback?.items || fallback?.data || []);
        }
        return items;
      }),
      apiFetch("/api/subjects?mine=true").then(async r => {
        const data = await r.json();
        let items = Array.isArray(data) ? data : (data?.items || data?.data || []);
        if (items.length === 0 && (user?.role === 'admin' || user?.role === 'super_admin')) {
          const fallback = await apiFetch("/api/subjects").then(fr => fr.json());
          items = Array.isArray(fallback) ? fallback : (fallback?.items || fallback?.data || []);
        }
        return items;
      }),
      apiFetch("/api/timetable?mine=true").catch(() => null).then(r => r ? r.json() : [])
    ])
      .then(([aData, sData, tData]) => {
        // Cache assignments
        setCachedAssignments(prev => ({ ...prev, [cacheKey]: aData }));
        dispatch({ type: "SET_ASSIGNMENTS", payload: aData });

        // Merge subjects/classes from timetable
        const timetableList = Array.isArray(tData) ? tData : [];
        const subjectList = Array.isArray(sData) ? sData : [];
        
        const combinedSubjects = [...subjectList];
        const seenCombined = new Set(subjectList.map(s => `${s.id}-${s.classId}`));
        
        timetableList.forEach((t: any) => {
          if (t.subjectId && t.subjectName) {
            const key = `${t.subjectId}-${t.classId}`;
            if (!seenCombined.has(key)) {
              seenCombined.add(key);
              combinedSubjects.push({
                id: t.subjectId,
                name: t.subjectName,
                className: t.className || 'Class',
                classId: t.classId || '',
                teacherId: t.teacherId || '',
              });
            }
          }
        });

        dispatch({ type: "SET_SUBJECTS", payload: combinedSubjects });
        dispatch({ type: "SET_LOADING", payload: false });
      });
  }, [showCompleted, user, user?.role]);

  const handleCreate = async () => {
    if (!form.title || !form.subjectId || !form.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    const selectedSub = subjects.find((s) => s.id === form.subjectId);
    if (!selectedSub) {
      toast.error("Selected subject not found");
      return;
    }

    try {
      const res = await apiFetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dueDate: form.dueDate ? format(form.dueDate, "yyyy-MM-dd") : "",
          teacherId: selectedSub.teacherId,
        }),
      });
      if (res.ok) {
        toast.success("Assignment created successfully!");
        dispatch({ type: "RESET_FORM" });
        let data = await apiFetch(`/api/homework?mine=true&status=${getStatusParam()}`).then((r) => r.json());
        let items = Array.isArray(data) ? data : (data?.items || data?.data || []);
        if (items.length === 0 && (user?.role === 'admin' || user?.role === 'super_admin')) {
          const fallback = await apiFetch(`/api/homework?status=${getStatusParam()}`).then((r) => r.json());
          items = Array.isArray(fallback) ? fallback : (fallback?.items || fallback?.data || []);
        }
        
        // Invalidate cache
        setCachedAssignments({});
        dispatch({ type: "SET_ASSIGNMENTS", payload: items });
      }
    } catch {
      toast.error("Failed to create assignment");
    }
  };

  const handleCompleteAssignment = async (assignmentId: string) => {
    dispatch({ type: "SET_COMPLETING_ID", payload: assignmentId });
    try {
      const res = await apiFetch(`/api/homework/${assignmentId}/complete`, {
        method: "PUT",
      });
      if (res.ok) {
        toast.success("Assignment marked as completed!");
        let data = await apiFetch(`/api/homework?mine=true&status=${getStatusParam()}`).then((r) => r.json());
        let items = Array.isArray(data) ? data : (data?.items || data?.data || []);
        if (items.length === 0 && (user?.role === 'admin' || user?.role === 'super_admin')) {
          const fallback = await apiFetch(`/api/homework?status=${getStatusParam()}`).then((r) => r.json());
          items = Array.isArray(fallback) ? fallback : (fallback?.items || fallback?.data || []);
        }
        
        // Invalidate cache
        setCachedAssignments({});
        dispatch({ type: "SET_ASSIGNMENTS", payload: items });
      } else {
        toast.error("Failed to complete assignment");
      }
    } catch {
      toast.error("Failed to complete assignment");
    } finally {
      dispatch({ type: "SET_COMPLETING_ID", payload: null });
    }
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    dispatch({ type: "OPEN_SUBMISSIONS", payload: assignment });
    try {
      const res = await apiFetch(`/api/submissions?assignmentId=${assignment.id}`);
      if (res.ok) {
        const json = await res.json();
        dispatch({ type: "SET_SUBMISSIONS", payload: json.data || [] });
      }
    } catch {
      toast.error("Failed to load submissions");
      dispatch({ type: "SET_SUBMISSIONS", payload: [] });
    } finally {
      dispatch({ type: "SET_SUB_LOADING", payload: false });
    }
  };

  const refreshSubmissionsAndAssignments = async () => {
    if (!selectedAssignment) return;
    try {
      const res = await apiFetch(`/api/submissions?assignmentId=${selectedAssignment.id}`);
      if (res.ok) {
        const json = await res.json();
        dispatch({ type: "SET_SUBMISSIONS", payload: json.data || [] });
      }
    } catch {}

    try {
      const statusParam = getStatusParam();
      const aRes = await apiFetch(`/api/homework?mine=true&status=${statusParam}`);
      if (aRes.ok) {
        let aData = await aRes.json();
        let items = Array.isArray(aData) ? aData : (aData?.items || aData?.data || []);
        if (items.length === 0) {
          const fallback = await apiFetch(`/api/homework?status=${statusParam}`).then(r => r.json());
          items = Array.isArray(fallback) ? fallback : (fallback?.items || fallback?.data || []);
        }
        setCachedAssignments((prev) => ({ ...prev, [statusParam]: items }));
        dispatch({ type: "SET_ASSIGNMENTS", payload: items });
      }
    } catch {}
  };

  const handleBulkSave = async () => {
    const updates = Object.entries(editedGrades)
      .filter(([_, val]) => val.grade.trim() !== "")
      .map(([id, val]) => ({
        id,
        grade: val.grade.trim(),
        feedback: val.feedback.trim() || undefined,
        status: "graded",
      }));

    if (updates.length === 0) {
      toast.error("No grades entered yet");
      return;
    }

    dispatch({ type: "SET_BULK_SAVING", payload: true });
    try {
      const res = await apiFetch("/api/submissions/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedAssignment?.id,
          updates,
        }),
      });
      if (res.ok) {
        toast.success(`Bulk saved ${updates.length} grades!`);
        dispatch({
          type: "BULK_UPDATE_GRADES",
          payload: updates.map((u) => ({ id: u.id, grade: u.grade, feedback: u.feedback || null })),
        });
      } else {
        toast.error("Failed to bulk save grades");
      }
    } catch {
      toast.error("Failed to bulk save grades");
    } finally {
      dispatch({ type: "SET_BULK_SAVING", payload: false });
    }
  };

  // Subscription calendar-month range limits helper
  const isDateWithinSubscriptionLimit = (date: Date) => {
    const today = new Date();
    
    let limitMonths = 1; // Default basic (Starter): Current month only
    if (tenantPlan === "standard") {
      limitMonths = 3; // Growth: 3 calendar months (current + 2 previous)
    } else if (tenantPlan === "premium") {
      limitMonths = 6; // Institution: 6 calendar months (current + 5 previous)
    }
    
    // Earliest permitted date is the 1st of (limitMonths - 1) months ago
    const earliestDate = new Date(today.getFullYear(), today.getMonth() - (limitMonths - 1), 1);
    
    const targetDate = startOfDay(date);
    const comparisonEarliest = startOfDay(earliestDate);
    const comparisonLatest = startOfDay(today);
    
    return targetDate >= comparisonEarliest && targetDate <= comparisonLatest;
  };

  const isAssignmentLocked = (dueDateStr: string) => {
    try {
      const dueDate = parseISO(dueDateStr);
      return !isDateWithinSubscriptionLimit(dueDate);
    } catch {
      return false;
    }
  };

  const [isCalendarFilterOpen, setIsCalendarFilterOpen] = useState(false);

  // Filter completed assignments by selected date and subscription age limits
  const filteredAssignments = useMemo(() => {
    let list = Array.isArray(assignments) ? assignments : [];

    // Filter by subscription timeline limits
    if (showCompleted) {
      list = list.filter((a) => {
        try {
          const dueDate = parseISO(a.dueDate);
          return isDateWithinSubscriptionLimit(dueDate);
        } catch {
          return true;
        }
      });
    }

    // Filter by selected calendar date
    if (showCompleted && selectedCalendarDate) {
      const dateStr = format(selectedCalendarDate, "yyyy-MM-dd");
      list = list.filter((a) => a.dueDate === dateStr);
    }

    return list;
  }, [assignments, selectedCalendarDate, showCompleted, tenantPlan]);

  // Paginated Assignments
  const paginatedAssignments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssignments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAssignments, currentPage]);

  const totalPages = Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE) || 1;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {showCompleted ? (
              <>
                <History className="size-5 text-zinc-500" />
                Old Homework
              </>
            ) : (
              "My Homework"
            )}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {showCompleted ? (
              "Showing finalized homework logs"
            ) : (
              `${assignments.length} homework items total`
            )}
          </p>
        </div>
        {!showCompleted && (
          <HomeworkCreateDialog
            dialogOpen={dialogOpen}
            onOpenChange={(v) => dispatch({ type: "SET_DIALOG_OPEN", payload: v })}
            form={form}
            subjects={subjects}
            dispatch={dispatch}
            handleCreate={handleCreate}
          />
        )}
      </div>

      {showCompleted ? (
        <div className="space-y-6">
          {/* Horizontal Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Filter:</span>
              <Popover open={isCalendarFilterOpen} onOpenChange={setIsCalendarFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-xs font-medium border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 hover:bg-zinc-100/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/80 rounded-lg"
                  >
                    <CalendarIcon className="size-3.5 text-blue-500" />
                    {selectedCalendarDate ? format(selectedCalendarDate, "PPP") : <span>Filter by Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedCalendarDate}
                    onSelect={(d) => {
                      setSelectedCalendarDate(d);
                      setCurrentPage(1);
                      setIsCalendarFilterOpen(false);
                    }}
                    disabled={(date) => {
                      return !isDateWithinSubscriptionLimit(date);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {selectedCalendarDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCalendarDate(undefined);
                    setCurrentPage(1);
                  }}
                  className="h-9 text-xs font-semibold text-red-600 hover:text-white border-red-200 hover:border-red-600 hover:bg-red-600 dark:border-red-900/50 dark:hover:bg-red-900 dark:hover:border-red-700 px-3.5 rounded-lg transition-all shadow-sm"
                >
                  Clear Date
                </Button>
              )}
            </div>
            <div className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              {filteredAssignments.length} logs found
            </div>
          </div>

          {/* Assignments full width List */}
          <div className="space-y-6">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400">
                <CalendarIcon className="size-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No old homework logs found</p>
                <p className="text-sm mt-1">Try selecting a different date or clearing the filter</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedAssignments.map((assignment) => {
                    return (
                      <div
                        key={assignment.id}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border shadow-sm border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                              {assignment.title}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                              {assignment.subjectName} • {assignment.className}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="size-3" /> Concluded: {assignment.dueDate}
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-1.5"
                            onClick={() => handleViewSubmissions(assignment)}
                          >
                            View Submissions ({assignment.submissions})
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white dark:bg-zinc-900 px-5 py-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm mt-4">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredAssignments.length)} of{" "}
                      {filteredAssignments.length} logs
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="size-8 p-0"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="text-xs font-semibold px-3 py-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="size-8 p-0"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Overdue */}
          {!showCompleted && <OverdueHomeworkCard assignments={assignments} />}

          {/* Assignment Grid */}
          <AssignmentGrid
            assignments={assignments}
            completingId={completingId}
            dispatch={dispatch}
            handleViewSubmissions={handleViewSubmissions}
            showCompleted={showCompleted}
          />
        </>
      )}

      {/* Submissions Dialog */}
      <SubmissionsDialog
        subDialogOpen={subDialogOpen}
        selectedAssignment={selectedAssignment}
        subLoading={subLoading}
        submissions={submissions}
        editedGrades={editedGrades}
        bulkSaving={bulkSaving}
        dispatch={dispatch}
        handleBulkSave={handleBulkSave}
        showCompleted={showCompleted}
        refreshData={refreshSubmissionsAndAssignments}
      />

      <AlertDialog
        open={!!confirmCompleteId}
        onOpenChange={(open) => !open && dispatch({ type: "SET_CONFIRM_COMPLETE_ID", payload: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500 fill-amber-500/10" /> Mark homework as
              complete?
            </AlertDialogTitle>
            <AlertDialogDescription className="py-1 text-sm">
              Once you mark this homework as complete, it indicates all work is finished and
              finalized. This action will conclude submissions for students. Are you sure you want to
              continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmCompleteId) {
                  handleCompleteAssignment(confirmCompleteId);
                  dispatch({ type: "SET_CONFIRM_COMPLETE_ID", payload: null });
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Yes, Complete it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

