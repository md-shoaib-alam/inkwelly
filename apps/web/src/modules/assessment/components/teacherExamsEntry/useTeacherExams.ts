"use client";

import { useEffect, useMemo, useReducer } from "react";
import { apiFetch, fetchAllStudents } from "@/lib/api";
import { toast } from "sonner";
import { ClassInfo, ExamRecord, StudentResultRow } from "./types";
import { useAppStore } from "@/store/use-app-store";

// Reducer State & Types
interface ExamsState {
  classes: ClassInfo[];
  exams: ExamRecord[];
  selectedClass: string;
  selectedExamId: string;
  resultRows: StudentResultRow[];
  loadingClasses: boolean;
  loadingExams: boolean;
  loadingStudents: boolean;
  savingResults: boolean;
  isPublishing: boolean;
}

type ExamsAction =
  | { type: "SET_CLASSES"; payload: ClassInfo[] }
  | { type: "SET_EXAMS"; payload: ExamRecord[] }
  | { type: "SET_SELECTED_CLASS"; payload: string }
  | { type: "SET_SELECTED_EXAM_ID"; payload: string }
  | { type: "SET_RESULT_ROWS"; payload: StudentResultRow[] }
  | { type: "SET_LOADING_CLASSES"; payload: boolean }
  | { type: "SET_LOADING_EXAMS"; payload: boolean }
  | { type: "SET_LOADING_STUDENTS"; payload: boolean }
  | { type: "SET_SAVING_RESULTS"; payload: boolean }
  | { type: "SET_IS_PUBLISHING"; payload: boolean };

const initialState: ExamsState = {
  classes: [],
  exams: [],
  selectedClass: "",
  selectedExamId: "",
  resultRows: [],
  loadingClasses: true,
  loadingExams: false,
  loadingStudents: false,
  savingResults: false,
  isPublishing: false,
};

function examsReducer(state: ExamsState, action: ExamsAction): ExamsState {
  switch (action.type) {
    case "SET_CLASSES":
      return { ...state, classes: action.payload };
    case "SET_EXAMS":
      return { ...state, exams: action.payload };
    case "SET_SELECTED_CLASS":
      return { ...state, selectedClass: action.payload };
    case "SET_SELECTED_EXAM_ID":
      return { ...state, selectedExamId: action.payload };
    case "SET_RESULT_ROWS":
      return { ...state, resultRows: action.payload };
    case "SET_LOADING_CLASSES":
      return { ...state, loadingClasses: action.payload };
    case "SET_LOADING_EXAMS":
      return { ...state, loadingExams: action.payload };
    case "SET_LOADING_STUDENTS":
      return { ...state, loadingStudents: action.payload };
    case "SET_SAVING_RESULTS":
      return { ...state, savingResults: action.payload };
    case "SET_IS_PUBLISHING":
      return { ...state, isPublishing: action.payload };
    default:
      return state;
  }
}

export function useTeacherExams() {
  const [state, dispatch] = useReducer(examsReducer, initialState);
  const { currentUser: user } = useAppStore();
  const {
    classes,
    exams,
    selectedClass,
    selectedExamId,
    resultRows,
    loadingClasses,
    loadingExams,
    loadingStudents,
    savingResults,
    isPublishing,
  } = state;

  const selectedExam = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId) || null;
  }, [exams, selectedExamId]);

  // 1. Load classes assigned to teacher
  useEffect(() => {
    dispatch({ type: "SET_LOADING_CLASSES", payload: true });
    apiFetch("/api/classes?all=true")
      .then((r) => r.json())
      .then((data) => {
        const classes = Array.isArray(data) ? data : (data?.items || data?.data || []);
        dispatch({ type: "SET_CLASSES", payload: classes });
      })
      .catch((err) => console.error("Load classes failed:", err))
      .finally(() => dispatch({ type: "SET_LOADING_CLASSES", payload: false }));
  }, []);

  // 2. Load teacher's specific exams when class changes
  useEffect(() => {
    if (!selectedClass) {
      dispatch({ type: "SET_EXAMS", payload: [] });
      dispatch({ type: "SET_SELECTED_EXAM_ID", payload: "" });
      dispatch({ type: "SET_RESULT_ROWS", payload: [] });
      return;
    }

    dispatch({ type: "SET_LOADING_EXAMS", payload: true });
    dispatch({ type: "SET_SELECTED_EXAM_ID", payload: "" });
    dispatch({ type: "SET_RESULT_ROWS", payload: [] });

    apiFetch(`/api/exams?classId=${selectedClass}&mine=true&limit=100`)
      .then((r) => r.json())
      .then(async (data) => {
        let examsList = data?.data || data?.items || (Array.isArray(data) ? data : []);
        if (examsList.length === 0 && (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'staff')) {
           const fallback = await apiFetch(`/api/exams?classId=${selectedClass}&limit=100`).then(r => r.json());
           examsList = fallback?.data || fallback?.items || (Array.isArray(fallback) ? fallback : []);
        }
        dispatch({
          type: "SET_EXAMS",
          payload: examsList.filter(
            (e: ExamRecord) =>
              e.status !== "cancelled" &&
              e.status !== "completed" &&
              (e.examType === "midterm" || e.examType === "final"),
          ),
        });
      })
      .catch((err) => console.error("Load exams failed:", err))
      .finally(() => dispatch({ type: "SET_LOADING_EXAMS", payload: false }));
  }, [selectedClass, user?.role]);

  // 3. Load student list and existing scores for selected exam
  useEffect(() => {
    if (!selectedExamId || !selectedClass) {
      dispatch({ type: "SET_RESULT_ROWS", payload: [] });
      return;
    }

    dispatch({ type: "SET_LOADING_STUDENTS", payload: true });

    Promise.all([
      fetchAllStudents({ classId: selectedClass }),
      apiFetch(`/api/exams/results?examId=${selectedExamId}`),
    ])
      .then(async ([studentsList, resultsRes]) => {
        const resultsData = await resultsRes.json();
        const resultsList = resultsData.results || [];

        const rows = studentsList.map((s: any) => {
          const match = resultsList.find((r: any) => r.studentId === s.id);
          return {
            studentId: s.id,
            studentName: s.name,
            rollNumber: s.rollNumber || "N/A",
            marksObtained: match ? String(match.marksObtained) : "",
            remarks: match?.remarks || "",
            status: match ? match.status : "pending",
          };
        });
        dispatch({ type: "SET_RESULT_ROWS", payload: rows });
      })
      .catch((err) => {
        console.error("Failed loading entry rows:", err);
        toast.error("Failed to load class students");
      })
      .finally(() => dispatch({ type: "SET_LOADING_STUDENTS", payload: false }));
  }, [selectedExamId, selectedClass]);

  const handleUpdateMark = (studentId: string, val: string) => {
    if (!selectedExam) return;

    const updatedRows: StudentResultRow[] = resultRows.map((row) => {
      if (row.studentId !== studentId) return row;

      if (val === "") {
        return { ...row, marksObtained: "", status: "pending" };
      }

      const num = parseFloat(val);
      if (num < 0) return row;
      if (num > selectedExam.totalMarks) {
        toast.error(`Marks cannot exceed total (${selectedExam.totalMarks})!`);
        return row;
      }

      const isPass = num >= selectedExam.passingMarks;
      return {
        ...row,
        marksObtained: val,
        status: isPass ? "pass" : "fail",
      };
    });

    dispatch({ type: "SET_RESULT_ROWS", payload: updatedRows });
  };

  const handleSaveDraft = async () => {
    if (!selectedExam) return;
    dispatch({ type: "SET_SAVING_RESULTS", payload: true });
    try {
      // Only persist rows where marks have actually been entered
      const rowsToSave = resultRows
        .filter((r) => r.marksObtained != null && String(r.marksObtained).trim() !== "")
        .map((r) => ({
          studentId: r.studentId,
          marksObtained: parseFloat(r.marksObtained),
          status: r.status === "pending"
            ? (parseFloat(r.marksObtained) >= (selectedExam.passingMarks || 40) ? "pass" : "fail")
            : r.status,
          remarks: r.remarks || null,
        }));

      if (rowsToSave.length === 0) {
        toast.info("No marks have been entered yet to save.");
        dispatch({ type: "SET_SAVING_RESULTS", payload: false });
        return;
      }

      const res = await apiFetch("/api/exams/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExam.id,
          results: rowsToSave,
        }),
      });

      if (res.ok) {
        toast.success("Exam marks draft saved successfully!");
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Failed to save marks draft");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save marks draft");
    }
    dispatch({ type: "SET_SAVING_RESULTS", payload: false });
  };

  const handlePublish = async () => {
    if (!selectedExam) return;

    // Check if any students don't have marks entered
    const unentered = resultRows.filter(
      (r) => r.marksObtained == null || String(r.marksObtained).trim() === ""
    );
    if (unentered.length > 0) {
      toast.error("All students must have marks entered before marking as complete.");
      return;
    }

    dispatch({ type: "SET_IS_PUBLISHING", payload: true });
    try {
      const saveRes = await apiFetch("/api/exams/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExam.id,
          results: resultRows.map((r) => {
            const marks = parseFloat(r.marksObtained);
            const passThreshold = selectedExam.passingMarks || 40;
            const status =
              r.status && r.status !== "pending"
                ? r.status
                : marks >= passThreshold
                  ? "pass"
                  : "fail";
            return {
              studentId: r.studentId,
              marksObtained: marks,
              status,
              remarks: r.remarks || null,
            };
          }),
        }),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        toast.error(errData.error || "Failed to commit final results");
        dispatch({ type: "SET_IS_PUBLISHING", payload: false });
        return;
      }

      const updateRes = await apiFetch("/api/exams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedExam.id,
          status: "completed",
        }),
      });

      if (updateRes.ok) {
        toast.success("Exam marked as complete successfully!");
        // Remove completed exam from local list and clear selection so bottom view clears immediately
        dispatch({
          type: "SET_EXAMS",
          payload: exams.filter((e) => e.id !== selectedExam.id),
        });
        dispatch({ type: "SET_SELECTED_EXAM_ID", payload: "" });
        dispatch({ type: "SET_RESULT_ROWS", payload: [] });
      } else {
        const errData = await updateRes.json().catch(() => ({}));
        toast.error(errData.error || "Failed to mark exam as complete");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to mark exam as complete");
    }
    dispatch({ type: "SET_IS_PUBLISHING", payload: false });
  };

  const resultSummary = useMemo(() => {
    return {
      total: resultRows.length,
      pass: resultRows.filter((r) => r.status === "pass").length,
      fail: resultRows.filter((r) => r.status === "fail").length,
      pending: resultRows.filter(
        (r) => r.marksObtained == null || String(r.marksObtained).trim() === ""
      ).length,
    };
  }, [resultRows]);

  return {
    classes,
    exams,
    selectedClass,
    selectedExamId,
    selectedExam,
    resultRows,
    loadingClasses,
    loadingExams,
    loadingStudents,
    savingResults,
    isPublishing,
    resultSummary,
    handleClassChange: (val: string) => dispatch({ type: "SET_SELECTED_CLASS", payload: val }),
    handleExamChange: (val: string) => dispatch({ type: "SET_SELECTED_EXAM_ID", payload: val }),
    handleUpdateMark,
    handleSaveDraft,
    handlePublish,
  };
}
