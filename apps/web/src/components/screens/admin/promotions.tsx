"use client";

import { useEffect, useCallback, useReducer, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  GraduationCap,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, fetchAllStudents } from "@/lib/api";
import { useAcademicYears } from "@/hooks/use-academic-years";

import {
  PromotionRecord,
  ClassOption,
  StudentOption,
  PromotionFormData,
  emptyForm,
  getInitialState,
  promotionsReducer,
} from "./promotions/types";
import { getCurrentAcademicYear, getNextClass } from "./promotions/utils";
import { PromotionsTable } from "./promotions/PromotionsTable";
import { BulkPromoteTab } from "./promotions/BulkPromoteTab";
import { GraduatedTab } from "./promotions/GraduatedTab";
import { NewPromotionDialog } from "./promotions/PromotionDialogs";
import { BulkPromotionDialog } from "./promotions/BulkPromotionDialog";
import { RejectPromotionDialog } from "./promotions/RejectPromotionDialog";

export function AdminPromotions({ initialTab: propTab }: { initialTab?: "individual" | "bulk" | "graduated" }) {
  const { academicYears: dbAcademicYears = [] } = useAcademicYears();

  const currentAcademicYear = useMemo(() => {
    const currentObj = dbAcademicYears.find((ay: any) => ay.isCurrent);
    if (currentObj?.name) return currentObj.name;
    if (dbAcademicYears.length > 0) return dbAcademicYears[0].name;
    return getCurrentAcademicYear();
  }, [dbAcademicYears]);

  const [state, dispatch] = useReducer(
    promotionsReducer,
    getInitialState(propTab, getCurrentAcademicYear()),
  );

  const {
    activeTab,
    promotions,
    graduations,
    classes,
    students,
    loading,
    academicYearFilter,
    classFilter,
    statusFilter,
    dialogOpen,
    form,
    submitting,
    bulkDialogOpen,
    bulkFromClass,
    bulkToClass,
    bulkAcademicYear,
    bulkRemarks,
    bulkSubmitting,
    gradClassId,
    gradAcademicYear,
    gradRemarks,
    gradSelectedIds,
    gradSubmitting,
    rejectDialogOpen,
    rejectingPromotion,
    rejectRemarks,
    rejecting,
    approvingId,
  } = state;

  // Sync tab if prop changes (e.g. clicking sidebar while already on page)
  useEffect(() => {
    if (propTab) queueMicrotask(() => dispatch({ type: "SET_ACTIVE_TAB", tab: propTab }));
  }, [propTab]);

  /* ---- Fetch helpers ---- */

  const fetchPromotions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ type: "promotion", limit: "50" });
      if (academicYearFilter && academicYearFilter !== "all")
        params.set("academicYear", academicYearFilter);
      if (classFilter && classFilter !== "all")
        params.set("classId", classFilter);
      if (statusFilter && statusFilter !== "all")
        params.set("status", statusFilter);
      const res = await apiFetch(`/api/promotions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        dispatch({ type: "FETCH_PROMOTIONS_SUCCESS", payload: json.items || [] });
      }
    } catch {
      /* silent */
    }
  }, [academicYearFilter, classFilter, statusFilter]);

  const fetchGraduations = useCallback(async () => {
    try {
      const params = new URLSearchParams({ type: "graduation", limit: "50" });
      if (academicYearFilter && academicYearFilter !== "all")
        params.set("academicYear", academicYearFilter);
      const res = await apiFetch(`/api/promotions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        dispatch({ type: "FETCH_GRADUATIONS_SUCCESS", payload: json.items || [] });
      }
    } catch {
      /* silent */
    }
  }, [academicYearFilter]);

  const fetchClassesAndStudents = useCallback(async () => {
    try {
      const classesRes = await apiFetch("/api/classes?mode=min");
      const classesData = classesRes.ok ? await classesRes.json() : [];
      dispatch({ type: "FETCH_CLASSES_STUDENTS_SUCCESS", classes: classesData, students: [] });
    } catch {
      /* silent */
    }
  }, []);

  // Fetch graduations: include in init and on tab change
  useEffect(() => {
    async function init() {
      dispatch({ type: "FETCH_START" });
      await Promise.all([
        fetchPromotions(),
        fetchGraduations(),
        fetchClassesAndStudents(),
      ]);
      dispatch({ type: "FETCH_END" });
    }
    init();
  }, [fetchPromotions, fetchGraduations, fetchClassesAndStudents]);

  // Dynamic student fetching when a class selection changes in different tabs/dialogs
  const targetClassId = form.fromClassId || bulkFromClass || gradClassId;
  useEffect(() => {
    if (!targetClassId || targetClassId === "all") {
      if (students.length > 0) {
        dispatch({ type: "FETCH_CLASSES_STUDENTS_SUCCESS", classes: classes, students: [] });
      }
      return;
    }

    let active = true;
    async function loadStudents() {
      try {
        const studentItems = await fetchAllStudents({ classId: targetClassId });
        if (!active) return;
        const studentsData = studentItems.map(
          (s: {
            id: string;
            name: string;
            rollNumber: string;
            className: string;
            classId: string;
          }) => ({
            id: s.id,
            name: s.name,
            rollNumber: s.rollNumber,
            className: s.className,
            classId: s.classId,
          })
        );
        dispatch({ type: "FETCH_CLASSES_STUDENTS_SUCCESS", classes: classes, students: studentsData });
      } catch (err) {
        console.error("Failed to load students for promotion:", err);
      }
    }
    loadStudents();
    return () => { active = false; };
  }, [targetClassId, classes, students.length]);

  // Sync academic year fields when currentAcademicYear resolves from database
  useEffect(() => {
    if (currentAcademicYear) {
      dispatch({ type: "SET_BULK_ACADEMIC_YEAR", value: currentAcademicYear });
      dispatch({ type: "SET_GRAD_ACADEMIC_YEAR", value: currentAcademicYear });
      dispatch({ type: "SET_FORM", form: { ...form, academicYear: currentAcademicYear } });
    }
  }, [currentAcademicYear]);

  /* ---- Derived data ---- */

  const academicYears = useMemo(() => {
    if (dbAcademicYears.length > 0) {
      return dbAcademicYears.map((ay: any) => ay.name).filter(Boolean);
    }
    const names = new Set<string>();
    promotions.forEach((p) => {
      if (p.academicYear) names.add(p.academicYear);
    });
    graduations.forEach((g) => {
      if (g.academicYear) names.add(g.academicYear);
    });
    return Array.from(names).filter(Boolean).sort().reverse();
  }, [dbAcademicYears, promotions, graduations]);

  const summary = {
    total: promotions.length,
    pending: promotions.filter((p) => p.status === "pending").length,
    approved: promotions.filter((p) => p.status === "approved").length,
    graduated: graduations.length,
  };

  /* ---- Handlers ---- */

  // Individual promotion
  const handleStudentChange = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      dispatch({
        type: "SET_FORM",
        form: {
          ...form,
          studentId,
          fromClassId: student.classId,
          toClassId: "",
        },
      });
    }
  };

  const handleCreatePromotion = async () => {
    if (
      !form.studentId ||
      !form.fromClassId ||
      !form.toClassId ||
      !form.academicYear
    ) {
      toast.error("Validation Error", {
        description: "Please fill all required fields",
      });
      return;
    }

    dispatch({ type: "SET_SUBMITTING", value: true });
    const promise = (async () => {
      const res = await apiFetch("/api/promotions", {
        method: "POST",
        body: JSON.stringify({
          studentId: form.studentId,
          fromClassId: form.fromClassId,
          toClassId: form.toClassId,
          academicYear: form.academicYear,
          remarks: form.remarks || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create promotion");
      }

      dispatch({ type: "CLOSE_NEW_PROMOTION_DIALOG" });
      await fetchPromotions();
    })();

    toast.promise(promise, {
      loading: "Creating promotion request...",
      success: "Promotion request created successfully",
      error: (err: any) => err.message || "Error creating promotion",
    });

    try {
      await promise;
    } catch {
      /* handled by toast */
    }
    dispatch({ type: "SET_SUBMITTING", value: false });
  };

  // Bulk promote preview
  const openBulkDialog = () => {
    dispatch({ type: "OPEN_BULK_DIALOG", academicYear: getCurrentAcademicYear() });
  };

  // Compute bulk preview as derived state
  const bulkPreview = bulkFromClass
    ? students.filter((s) => s.classId === bulkFromClass)
    : [];

  // Handle bulk from class change with auto-detect
  const handleBulkFromClassChange = (classId: string) => {
    const autoTo = classId ? getNextClass(classId, classes) : null;
    dispatch({ type: "SET_BULK_FROM_CLASS", classId, toClassId: autoTo ? autoTo.id : "" });
  };

  const handleBulkPromote = async () => {
    if (!bulkFromClass || !bulkToClass || !bulkAcademicYear) {
      toast.error("Validation Error", {
        description: "Please fill all required fields",
      });
      return;
    }
    if (bulkPreview.length === 0) {
      toast.error("Validation Error", {
        description: "No students found in the selected class",
      });
      return;
    }

    dispatch({ type: "SET_BULK_SUBMITTING", value: true });
    const promise = (async () => {
      const res = await apiFetch("/api/promotions", {
        method: "POST",
        body: JSON.stringify({
          bulk: true,
          fromClassId: bulkFromClass,
          toClassId: bulkToClass,
          academicYear: bulkAcademicYear,
          remarks: bulkRemarks || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Bulk promotion failed");
      }

      const data = await res.json();
      dispatch({ type: "CLOSE_BULK_DIALOG" });
      await Promise.all([fetchPromotions(), fetchClassesAndStudents()]);
      return data;
    })();

    toast.promise(promise, {
      loading: "Bulk promoting students...",
      success: (data: any) =>
        `${data.created} promotion(s) created successfully`,
      error: (err: any) => err.message || "Error during bulk promotion",
    });

    try {
      await promise;
    } catch {
      /* handled by toast */
    }
    dispatch({ type: "SET_BULK_SUBMITTING", value: false });
  };

  // Graduation
  const openGradDialog = () => {
    dispatch({ type: "OPEN_GRAD_DIALOG", academicYear: getCurrentAcademicYear() });
  };

  // Compute grad preview as derived state
  const gradPreview = gradClassId
    ? students.filter((s) => s.classId === gradClassId)
    : [];

  // Handle grad class change - select all by default
  const handleGradClassChange = (classId: string) => {
    const previewStudents = classId
      ? students.filter((s) => s.classId === classId)
      : [];
    dispatch({ type: "SET_GRAD_CLASS_ID", classId, selectedIds: new Set(previewStudents.map((s) => s.id)) });
  };

  const toggleGradStudent = (id: string) => {
    dispatch({ type: "TOGGLE_GRAD_STUDENT", id });
  };

  const handleGraduate = async () => {
    if (!gradClassId || !gradAcademicYear) {
      toast.error("Validation Error", {
        description: "Please fill all required fields",
      });
      return;
    }
    if (gradSelectedIds.size === 0) {
      toast.error("Validation Error", {
        description: "No students selected for graduation",
      });
      return;
    }

    dispatch({ type: "SET_GRAD_SUBMITTING", value: true });
    const promise = (async () => {
      const body: Record<string, unknown> = {
        graduation: true,
        fromClassId: gradClassId,
        academicYear: gradAcademicYear,
        remarks: gradRemarks || undefined,
        studentIds: Array.from(gradSelectedIds),
      };
      const res = await apiFetch("/api/promotions", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Graduation failed");
      }

      await Promise.all([fetchClassesAndStudents(), fetchGraduations()]);
    })();

    toast.promise(promise, {
      loading: "Graduating students...",
      success: "Students graduated successfully",
      error: (err: any) => err.message || "Error during graduation",
    });

    try {
      await promise;
    } catch {
      /* handled by toast */
    }
    dispatch({ type: "SET_GRAD_SUBMITTING", value: false });
  };

  // Approve / Reject
  const handleApprove = async (promotion: PromotionRecord) => {
    dispatch({ type: "SET_APPROVING_ID", id: promotion.id });
    const promise = (async () => {
      const res = await apiFetch("/api/promotions", {
        method: "PUT",
        body: JSON.stringify({ id: promotion.id, status: "approved" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve promotion");
      }

      await Promise.all([fetchPromotions(), fetchClassesAndStudents()]);
    })();

    toast.promise(promise, {
      loading: `Approving promotion for ${promotion.studentName}...`,
      success: "Promotion approved successfully",
      error: (err: any) => err.message || "Error approving promotion",
    });

    try {
      await promise;
    } catch {
      /* handled by toast */
    }
    dispatch({ type: "SET_APPROVING_ID", id: null });
  };

  const openRejectDialog = (promotion: PromotionRecord) => {
    dispatch({ type: "OPEN_REJECT_DIALOG", promotion });
  };

  const handleReject = async () => {
    if (!rejectingPromotion) return;
    dispatch({ type: "SET_REJECTING", value: true });
    try {
      const res = await apiFetch("/api/promotions", {
        method: "PUT",
        body: JSON.stringify({
          id: rejectingPromotion.id,
          status: "rejected",
          remarks: rejectRemarks || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Rejected", {
          description: `Promotion for ${rejectingPromotion.studentName} rejected`,
        });
        dispatch({ type: "CLOSE_REJECT_DIALOG" });
        await fetchPromotions();
      } else {
        const data = await res.json();
        toast.error("Error", {
          description: data.error || "Failed to reject promotion",
        });
      }
    } catch {
      toast.error("System Error", {
        description: "Error rejecting promotion",
      });
    }
    dispatch({ type: "SET_REJECTING", value: false });
  };

  /* ---- Render ---- */

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Student Promotion
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage student promotions and graduations.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {/* Action buttons removed as they are now in the sidebar */}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-3 md:pb-0 scrollbar-none snap-x snap-mandatory">
        {[
          {
            label: "Total Promotions",
            value: summary.total,
            icon: <Users className="size-5" />,
            color:
              "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
            border: "border-blue-200 dark:border-blue-800",
          },
          {
            label: "Pending Review",
            value: summary.pending,
            icon: <Clock className="size-5" />,
            color:
              "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
            border: "border-amber-200 dark:border-amber-800",
          },
          {
            label: "Approved",
            value: summary.approved,
            icon: <CheckCircle2 className="size-5" />,
            color:
              "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-200 dark:border-emerald-800",
          },
          {
            label: "Graduated",
            value: summary.graduated,
            icon: <GraduationCap className="size-5" />,
            color:
              "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
            border: "border-violet-200 dark:border-violet-800",
          },
        ].map((card) => (
          <Card
            key={card.label}
            className={`hover:shadow-md transition-shadow border ${card.border} min-w-[240px] md:min-w-0 snap-start flex-1 md:flex-initial`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}
              >
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {card.label}
                </p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs removed as sidebar now handles navigation */}

      {/* ═══════ INDIVIDUAL PROMOTIONS TAB ═══════ */}
      {activeTab === "individual" && (
        <>
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto">
              <Select
                value={academicYearFilter}
                onValueChange={(val) => dispatch({ type: "SET_ACADEMIC_YEAR_FILTER", value: val })}
              >
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={classFilter} onValueChange={(val) => dispatch({ type: "SET_CLASS_FILTER", value: val })}>
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}-{c.section} (Grade {c.grade})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(val) => dispatch({ type: "SET_STATUS_FILTER", value: val })}>
              <SelectTrigger className="w-full md:w-40 col-span-2 md:col-span-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />
          
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full md:w-auto rounded-xl shadow-xs font-medium cursor-pointer"
            onClick={() => dispatch({ type: "OPEN_NEW_PROMOTION_DIALOG", academicYear: currentAcademicYear })}
          >
            <Plus className="size-4" />
            <span>New Promotion</span>
          </Button>
        </div>

          <PromotionsTable
            promotions={promotions}
            loading={loading}
            approvingId={approvingId}
            handleApprove={handleApprove}
            openRejectDialog={openRejectDialog}
          />
        </>
      )}

      {/* ═══════ BULK PROMOTE TAB ═══════ */}
      {activeTab === "bulk" && (
        <BulkPromoteTab
          classes={classes}
          bulkFromClass={bulkFromClass}
          handleBulkFromClassChange={handleBulkFromClassChange}
          bulkToClass={bulkToClass}
          setBulkToClass={(val) => dispatch({ type: "SET_BULK_TO_CLASS", classId: val })}
          bulkAcademicYear={bulkAcademicYear}
          setBulkAcademicYear={(val) => dispatch({ type: "SET_BULK_ACADEMIC_YEAR", value: val })}
          bulkRemarks={bulkRemarks}
          setBulkRemarks={(val) => dispatch({ type: "SET_BULK_REMARKS", value: val })}
          bulkPreview={bulkPreview}
          handleBulkPromote={handleBulkPromote}
          bulkSubmitting={bulkSubmitting}
          academicYearOptions={academicYears}
        />
      )}

      {/* ═══════ GRADUATED TAB ═══════ */}
      {activeTab === "graduated" && (
        <GraduatedTab
          classes={classes}
          gradClassId={gradClassId}
          handleGradClassChange={handleGradClassChange}
          gradAcademicYear={gradAcademicYear}
          setGradAcademicYear={(val) => dispatch({ type: "SET_GRAD_ACADEMIC_YEAR", value: val })}
          gradRemarks={gradRemarks}
          setGradRemarks={(val) => dispatch({ type: "SET_GRAD_REMARKS", value: val })}
          gradPreview={gradPreview}
          gradSelectedIds={gradSelectedIds}
          setGradSelectedIds={(ids) => dispatch({ type: "SET_GRAD_SELECTED_IDS", ids })}
          toggleGradStudent={toggleGradStudent}
          handleGraduate={handleGraduate}
          gradSubmitting={gradSubmitting}
          graduations={graduations}
          academicYearOptions={academicYears}
        />
      )}

      {/* ═══════ DIALOGS ═══════ */}
      <NewPromotionDialog
        open={dialogOpen}
        onOpenChange={(val) => !val && dispatch({ type: "CLOSE_NEW_PROMOTION_DIALOG" })}
        form={form}
        setForm={(val) => dispatch({ type: "SET_FORM", form: val })}
        students={students}
        classes={classes}
        submitting={submitting}
        handleCreatePromotion={handleCreatePromotion}
        handleStudentChange={handleStudentChange}
        academicYearOptions={academicYears}
      />

      <BulkPromotionDialog
        open={bulkDialogOpen}
        onOpenChange={(val) => !val && dispatch({ type: "CLOSE_BULK_DIALOG" })}
        classes={classes}
        bulkFromClass={bulkFromClass}
        handleBulkFromClassChange={handleBulkFromClassChange}
        bulkToClass={bulkToClass}
        setBulkToClass={(val) => dispatch({ type: "SET_BULK_TO_CLASS", classId: val })}
        bulkAcademicYear={bulkAcademicYear}
        setBulkAcademicYear={(val) => dispatch({ type: "SET_BULK_ACADEMIC_YEAR", value: val })}
        bulkRemarks={bulkRemarks}
        setBulkRemarks={(val) => dispatch({ type: "SET_BULK_REMARKS", value: val })}
        bulkPreview={bulkPreview}
        handleBulkPromote={handleBulkPromote}
        bulkSubmitting={bulkSubmitting}
        academicYearOptions={academicYears}
      />

      <RejectPromotionDialog
        open={rejectDialogOpen}
        onOpenChange={(val) => !val && dispatch({ type: "CLOSE_REJECT_DIALOG" })}
        rejectingPromotion={rejectingPromotion}
        rejectRemarks={rejectRemarks}
        setRejectRemarks={(val) => dispatch({ type: "SET_REJECT_REMARKS", value: val })}
        handleReject={handleReject}
        rejecting={rejecting}
      />
    </div>
  );
}
