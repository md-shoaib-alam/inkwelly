"use client";

import { useReducer, useEffect } from "react";
import { apiFetch, fetchAllStudents } from "@/lib/api";
import { toast } from "sonner";
import { initialState, gradeManagementReducer, Assessment } from "./types";
import { useAppStore } from "@/store/use-app-store";

export function useGradeManagement() {
  const [state, dispatch] = useReducer(gradeManagementReducer, initialState);
  const { currentUser: user } = useAppStore();

  const {
    classes,
    subjects,
    students,
    assessments,
    selectedAssessmentId,
    confirmCompleteId,
    completingId,
    marks,
    loading,
    saving,
    gradesLoading,
    isDirty,
    activeTab,
    listLoading,
    isDialogOpen,
    newTitle,
    newType,
    newMode,
    newTotalMarks,
    newPassingMarks,
    isCreating,
    dialogClassId,
    dialogSubjectId,
  } = state;

  // 1. Initial bootstrap data (Classes/Subjects)
  useEffect(() => {
    Promise.all([
      apiFetch("/api/classes?all=true").then(r => r.json()),
      apiFetch("/api/subjects?mine=true").then(r => r.json()).then(async data => {
        let items = Array.isArray(data) ? data : (data?.items || data?.data || []);
        if (items.length === 0 && (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'staff')) {
          const fallback = await apiFetch("/api/subjects").then(r => r.json());
          items = Array.isArray(fallback) ? fallback : (fallback?.items || fallback?.data || []);
        }
        return items;
      }),
      apiFetch("/api/timetable?mine=true").catch(() => null).then(r => r ? r.json() : [])
    ])
      .then(([cData, sData, tData]) => {
        const assignedClasses = Array.isArray(cData) ? cData : (cData?.items || cData?.data || []);
        const assignedSubjects = sData;
        const timetableList = Array.isArray(tData) ? tData : (tData?.items || tData?.data || []);

        // Extract subjects/classes from timetable slots
        const timetableSubjects: any[] = [];
        const timetableClasses: any[] = [];
        
        const seenSubjects = new Set(assignedSubjects.map(s => `${s.id}-${s.classId}`));
        const seenClasses = new Set(assignedClasses.map(c => c.id));

        timetableList.forEach((t: any) => {
          if (t.subjectId && t.subjectName) {
            const subKey = `${t.subjectId}-${t.classId}`;
            if (!seenSubjects.has(subKey)) {
              seenSubjects.add(subKey);
              timetableSubjects.push({
                id: t.subjectId,
                name: t.subjectName,
                className: t.className || 'Class',
                classId: t.classId || '',
                teacherId: t.teacherId || '',
              });
            }
          }

          if (t.classId && t.className) {
            const classKey = t.classId;
            if (!seenClasses.has(classKey)) {
              seenClasses.add(classKey);
              const parts = t.className.split('-');
              timetableClasses.push({
                id: t.classId,
                name: parts[0] || t.className,
                section: parts[1] || 'A',
                grade: parts[0] || t.className,
                studentCount: 0,
                classTeacher: t.teacherName || '',
              });
            }
          }
        });

        const combinedClasses = [...assignedClasses, ...timetableClasses];
        const combinedSubjects = [...assignedSubjects, ...timetableSubjects];

        dispatch({ type: "SET_BOOTSTRAP_DATA", classes: combinedClasses, subjects: combinedSubjects });
      })
      .catch((e) => {
        console.error(e);
        dispatch({ type: "SET_LOADING", value: false });
      });
  }, [user?.role]);

  // 1b. Fetch assessments filtered by tab status
  useEffect(() => {
    dispatch({ type: "SET_LIST_LOADING", value: true });
    apiFetch(`/api/assessments?status=${activeTab}`)
      .then((r) => r.json())
      .then((data) => {
        const assessmentArray = Array.isArray(data) ? data : (data?.items || []);
        dispatch({ type: "SET_ASSESSMENTS", assessments: assessmentArray });
      })
      .catch((e) => {
        console.error(e);
        dispatch({ type: "SET_LIST_LOADING", value: false });
      });
  }, [activeTab]);

  // 2. Load students for selected assessment's class
  useEffect(() => {
    if (!selectedAssessmentId) {
      dispatch({ type: "SET_STUDENTS", students: [] });
      dispatch({ type: "SET_MARKS", marks: {} });
      dispatch({ type: "SET_IS_DIRTY", value: false });
      return;
    }
    const assessment = Array.isArray(assessments) ? assessments.find(a => a.id === selectedAssessmentId) : undefined;
    if (!assessment) return;

    fetchAllStudents({ classId: assessment.classId })
      .then((all) => dispatch({ type: "SET_STUDENTS", students: all }))
      .catch(console.error);
  }, [selectedAssessmentId, assessments]);

  // 4. Load existing grades for selected isolated assessment
  useEffect(() => {
    if (!selectedAssessmentId) {
      dispatch({ type: "SET_MARKS", marks: {} });
      dispatch({ type: "SET_IS_DIRTY", value: false });
      return;
    }
    dispatch({ type: "SET_GRADES_LOADING", value: true });
    apiFetch(`/api/assessments/${selectedAssessmentId}/grades`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const initialMarks: Record<string, string> = {};
          data.forEach((g: any) => {
            if (g.studentId && g.marksObtained !== undefined && g.marksObtained !== null) {
              initialMarks[g.studentId] = g.marksObtained.toString();
            }
          });
          dispatch({ type: "SET_MARKS", marks: initialMarks });
          dispatch({ type: "SET_IS_DIRTY", value: false });
        } else {
          dispatch({ type: "SET_MARKS", marks: {} });
          dispatch({ type: "SET_IS_DIRTY", value: false });
        }
      })
      .catch((e) => {
        console.error(e);
        dispatch({ type: "SET_MARKS", marks: {} });
        dispatch({ type: "SET_IS_DIRTY", value: false });
      })
      .finally(() => dispatch({ type: "SET_GRADES_LOADING", value: false }));
  }, [selectedAssessmentId]);

  const activeAssessment = Array.isArray(assessments) ? assessments.find(a => a.id === selectedAssessmentId) : undefined;

  // CREATE ASSESSMENT
  const handleCreateAssessment = async () => {
    if (!newTitle.trim()) {
      toast.error("Please enter an assessment title!");
      return;
    }
    if (!dialogClassId || !dialogSubjectId) {
      toast.error("Please select both a Class and a Subject!");
      return;
    }
    dispatch({ type: "SET_IS_CREATING", value: true });
    try {
      const res = await apiFetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: dialogClassId,
          subjectId: dialogSubjectId,
          title: newTitle,
          type: newType,
          totalMarks: parseFloat(newTotalMarks),
          passingMarks: parseFloat(newPassingMarks),
        }),
      });

      if (!res.ok) throw new Error("Failed to create");
      const created = await res.json();

      toast.success(`Created assessment "${newTitle}"!`);
      dispatch({ type: "SET_IS_DIALOG_OPEN", value: false });
      dispatch({ type: "SET_NEW_TITLE", value: "" });
      dispatch({ type: "SET_NEW_MODE", value: "offline" });
      
      dispatch({ type: "ADD_ASSESSMENT", assessment: created });
    } catch (e) {
      console.error(e);
      toast.error("Could not create assessment");
    }
    dispatch({ type: "SET_IS_CREATING", value: false });
  };

  // COMPLETE ASSESSMENT PERMANENTLY
  const handleCompleteAssessment = async (assessmentId: string) => {
    dispatch({ type: "SET_COMPLETING_ID", id: assessmentId });
    try {
      const res = await apiFetch(`/api/assessments/${assessmentId}/complete`, {
        method: "PUT",
      });
      if (res.ok) {
        toast.success("Assessment finalized successfully!");
        dispatch({ type: "SET_ASSESSMENTS", assessments: assessments.filter((item) => item.id !== assessmentId) });
        if (selectedAssessmentId === assessmentId) {
          dispatch({ type: "SET_SELECTED_ASSESSMENT_ID", id: "" });
        }
      } else {
        toast.error("Could not complete assessment.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete assessment.");
    } finally {
      dispatch({ type: "SET_COMPLETING_ID", id: null });
    }
  };

  // BULK SAVE GRADES
  const handleSave = async () => {
    if (!selectedAssessmentId) return;
    dispatch({ type: "SET_SAVING", value: true });
    try {
      const records = Object.entries(marks).reduce((acc, [studentId, val]) => {
        if (val.trim() !== "") {
          acc.push({
            studentId,
            marksObtained: parseFloat(val),
            remarks: "",
          });
        }
        return acc;
      }, [] as any[]);

      if (records.length === 0) {
        toast.error("No marks entered to save!");
        dispatch({ type: "SET_SAVING", value: false });
        return;
      }

      const res = await apiFetch("/api/assessments/bulk-grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: selectedAssessmentId,
          records,
        }),
      });

      if (!res.ok) throw new Error("Bulk save failed");

      toast.success(`Saved marks for ${records.length} students successfully!`);
      dispatch({ type: "SET_IS_DIRTY", value: false });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save marks");
    }
    dispatch({ type: "SET_SAVING", value: false });
  };

  return {
    classes,
    subjects,
    students,
    assessments,
    selectedAssessmentId,
    confirmCompleteId,
    completingId,
    marks,
    loading,
    saving,
    gradesLoading,
    isDirty,
    activeTab,
    listLoading,
    isDialogOpen,
    newTitle,
    newType,
    newMode,
    newTotalMarks,
    newPassingMarks,
    isCreating,
    dialogClassId,
    dialogSubjectId,
    activeAssessment,
    dispatch,
    handleCreateAssessment,
    handleCompleteAssessment,
    handleSave,
  };
}
