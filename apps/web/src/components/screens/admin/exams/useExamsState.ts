'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { api, apiFetch, fetchAllStudents } from '@/lib/api';
import { toast } from "sonner";
import { useAcademicYears } from '@/hooks/use-academic-years';
import { 
  ExamRecord, ExamFormData, StudentResultRow, 
  ClassOption, SubjectOption 
} from './types';
import { emptyExamForm } from './utils';

export function useExamsState(initialTab = 'exams') {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { slug } = useParams();
  const searchParams = useSearchParams();

  // Academic Years
  const { academicYears } = useAcademicYears();
  const currentAcademicYear = useMemo(() => {
    const y = new Date().getFullYear();
    return academicYears.find((ay: any) => ay.isCurrent)?.name || `${y}-${y + 1}`;
  }, [academicYears]);

  // Filters & Tabs
  const [classFilter, setClassFilter] = useState('all');
  const [publishedAcademicYearFilter, setPublishedAcademicYearFilter] = useState(currentAcademicYear);
  const [publishedClassFilter, setPublishedClassFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(() => initialTab);

  // Dialog States
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<ExamFormData>({ ...emptyExamForm, academicYear: currentAcademicYear });
  const [adding, setAdding] = useState(false);
  
  useEffect(() => {
    if (currentAcademicYear) {
      queueMicrotask(() => {
        setAddForm(prev => ({ ...prev, academicYear: prev.academicYear || currentAcademicYear }));
        setPublishedAcademicYearFilter(prev => prev === 'all' ? currentAcademicYear : prev);
      });
    }
  }, [currentAcademicYear]);
  
  const [editingExam, setEditingExam] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<ExamFormData & { id: string }>({ ...emptyExamForm, id: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Results State
  const [selectedExam, setSelectedExam] = useState<ExamRecord | null>(null);
  const [resultRows, setResultRows] = useState<StudentResultRow[]>([]);
  const [resultsClassId, setResultsClassId] = useState<string>('');
  const [savingResults, setSavingResults] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setActiveTab(initialTab);
      if (initialTab !== 'results' && !searchParams.get('examId')) {
        setSelectedExam(null);
        setResultRows([]);
      }
    });
  }, [initialTab, searchParams]);

  // Track exams marked complete in this session so URL effects don't revive them
  const completedExamIdsRef = useRef<Set<string>>(new Set());

  // Sync state from URL params if present (e.g. results-entry?examId=...&classId=...)
  useEffect(() => {
    const urlClassId = searchParams.get('classId');
    const urlExamId = searchParams.get('examId');

    if (urlClassId && urlClassId !== resultsClassId) {
      setResultsClassId(urlClassId);
    }

    if (urlExamId && !completedExamIdsRef.current.has(urlExamId)) {
      if (!selectedExam || selectedExam.id !== urlExamId) {
        apiFetch(`/api/exams?id=${urlExamId}`).then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
          const found = data.exam || list.find((e: any) => e.id === urlExamId);
          if (found && !completedExamIdsRef.current.has(found.id)) {
            if (found.status === 'completed' || found.status === 'published') {
              completedExamIdsRef.current.add(found.id);
              return;
            }
            openResultsEntry(found);
          }
        }).catch(console.error);
      }
    }
  }, [searchParams, resultsClassId, selectedExam]);

  // View Results Dialog State
  const [viewResultsOpen, setViewResultsOpen] = useState(false);
  const [viewResultsExam, setViewResultsExam] = useState<ExamRecord | null>(null);
  const [viewResultsData, setViewResultsData] = useState<any[]>([]);
  const [loadingViewResults, setLoadingViewResults] = useState(false);

  // Bulk Mode Helpers
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkOverrides, setBulkOverrides] = useState<Record<string, Partial<ExamFormData>>>({});
  
  const [printingLedgerClassId] = useState<string | null>(null);
  const [enableModalTabulationPreview, setEnableModalTabulationPreview] = useState<boolean>(true);

  useEffect(() => {
    const fetchTenantSettings = async () => {
      try {
        const res = await apiFetch('/api/tenant-settings');
        if (res.ok) {
          const data = await res.json();
          setEnableModalTabulationPreview(data.enableModalTabulationPreview === true);
        }
      } catch (err) {
        console.error("Failed to load tenant settings", err);
      }
    };
    fetchTenantSettings();
  }, []);

  const [previewingLedgerClass, setPreviewingLedgerClass] = useState<{
    id: string;
    name: string;
    section: string;
    templateId: string;
    examName?: string;
  } | null>(null);

  const handlePrintTabularLedger = async (
    classId: string, 
    className: string, 
    classSection: string, 
    templateId: string = 'classic',
    examName?: string,
    isDownload: boolean = false
  ) => {
    if (enableModalTabulationPreview) {
      setPreviewingLedgerClass({
        id: classId,
        name: className,
        section: classSection,
        templateId,
        examName
      });
    } else {
      toast.promise(
        (async () => {
          const { handleTabulationLedgerPreview } = await import('./tabulationLedgerPrinter');
          await handleTabulationLedgerPreview({
            classId,
            classNameStr: className,
            classSection,
            academicYear: publishedAcademicYearFilter || currentAcademicYear,
            templateId,
            examName,
            isDownload
          });
        })(),
        {
          loading: isDownload ? 'Generating PDF...' : 'Compiling tabulation ledger...',
          success: isDownload ? 'PDF generated!' : 'Tabulation ledger compiled and preview opened!',
          error: isDownload ? 'Failed to generate PDF' : 'Failed to compile tabulation ledger',
        }
      );
    }
  };

  // Queries
  const { data: examsData, isLoading: loadingExams } = useQuery({
    queryKey: ['exams', classFilter],
    queryFn: async () => {
      const url = classFilter && classFilter !== 'all' 
        ? `/api/exams?classId=${classFilter}&limit=50` 
        : '/api/exams?limit=50';
      const res = await apiFetch(url);
      return res.json();
    }
  });

  const { data: resultsExamsData } = useQuery({
    queryKey: ['results-exams', resultsClassId],
    queryFn: async () => {
      const res = await apiFetch(`/api/exams?classId=${resultsClassId}&limit=100`);
      return res.json();
    },
    enabled: !!resultsClassId
  });

  const { data: metadata } = useQuery({
    queryKey: ['classes-subjects-teachers-min'],
    queryFn: async () => {
      const [classes, subjects, teachers] = await Promise.all([
        api.get('/classes?mode=min'),
        api.get('/subjects?mode=min'),
        api.get('/teachers?mode=min')
      ]);
      return { classes, subjects, teachers };
    },
    staleTime: 10 * 60 * 1000,
  });

  const exams = useMemo(() => {
    const data = examsData?.data || (Array.isArray(examsData) ? examsData : []);
    return data as ExamRecord[];
  }, [examsData]);

  const classes = (metadata?.classes || []) as ClassOption[];
  const subjects = (metadata?.subjects || []) as SubjectOption[];

  // Logic Handlers
  const handleCreate = async () => {
    setAdding(true);
    try {
      const selectedSubjects = subjects.filter(s => bulkSelected.has(s.id));
      const examsPayload = selectedSubjects.map(s => ({
        subjectId: s.id,
        subjectName: s.name,
        date: bulkOverrides[s.id]?.date || addForm.date,
        startTime: bulkOverrides[s.id]?.startTime || addForm.startTime || '09:00',
        endTime: bulkOverrides[s.id]?.endTime || addForm.endTime || '10:00',
        totalMarks: Number(bulkOverrides[s.id]?.totalMarks || addForm.totalMarks || 100),
        passingMarks: Number(bulkOverrides[s.id]?.passingMarks || addForm.passingMarks || 40),
      }));

      const payload = {
        classId: addForm.classId,
        examType: addForm.examType,
        name: addForm.name,
        academicYear: addForm.academicYear || currentAcademicYear,
        exams: examsPayload
      };

      const res = await apiFetch('/api/exams/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Exams created successfully!');
        setAddOpen(false);
        queryClient.invalidateQueries({ queryKey: ['exams'] });
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create exams');
      }
    } catch (err) { 
      console.error('Error creating exams:', err);
      toast.error('Error creating exams'); 
    }
    setAdding(false);
  };

  const handleUpdate = async (customPayload?: any) => {
    setSaving(true);
    try {
      const payload = customPayload || {
        ...editForm,
        totalMarks: Number(editForm.totalMarks),
        passingMarks: Number(editForm.passingMarks),
      };
      const res = await apiFetch('/api/exams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Exam details updated successfully!');
        setEditOpen(false);
        queryClient.invalidateQueries({ queryKey: ['exams'] });
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Update failed');
      }
    } catch {
      toast.error('Update failed');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string | string[]) => {
    setDeleting(true);
    try {
      const idParam = Array.isArray(id) ? id.filter(Boolean).join(',') : id;
      if (!idParam) return;
      const res = await apiFetch(`/api/exams?id=${encodeURIComponent(idParam)}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Exam deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['exams'] });
        queryClient.invalidateQueries({ queryKey: ['results-exams'] });
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to delete exam');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const openResultsEntry = async (exam: ExamRecord | null) => {
    setSelectedExam(exam);
    if (!exam) {
      setResultRows([]);
      return;
    }
    setResultsClassId(exam.classId);
    if (activeTab !== 'results' || searchParams.get('examId') !== exam.id) {
      router.push(`/${slug}/results-entry?examId=${exam.id}&classId=${exam.classId}`);
    }
    setActiveTab('results');
    setLoadingStudents(true);
    try {
      const [students, rRes] = await Promise.all([
        fetchAllStudents({ classId: exam.classId }),
        apiFetch(`/api/exams/results?examId=${exam.id}`)
      ]);
      const results = (await rRes.json()).results || [];
      
      setResultRows(students.map((s: any) => {
        const res = results.find((r: any) => r.studentId === s.id);
        const marksStr = res ? String(res.marksObtained) : '';
        const passThreshold = exam.passingMarks || 40;
        const autoStatus = marksStr !== '' 
          ? (Number(marksStr) >= passThreshold ? 'pass' : 'fail')
          : 'pending';
        return {
          studentId: s.id, studentName: s.name, rollNumber: s.rollNumber || '',
          marksObtained: marksStr,
          remarks: res?.remarks || '',
          status: res?.status && res.status !== 'pending' ? res.status : autoStatus
        };
      }));
    } catch { toast.error('Failed to load results'); }
    setLoadingStudents(false);
  };

  const handleResultsClassChange = (classId: string) => {
    setResultsClassId(classId);
    setSelectedExam(null);
    setResultRows([]);
  };

  const handleOpenViewResults = async (exam: ExamRecord) => {
    setViewResultsExam(exam);
    setViewResultsOpen(true);
    setLoadingViewResults(true);
    try {
      const [students, rRes] = await Promise.all([
        fetchAllStudents({ classId: exam.classId }),
        apiFetch(`/api/exams/results?examId=${exam.id}`)
      ]);
      const results = (await rRes.json()).results || [];
      
      setViewResultsData(students.map((s: any) => {
        const res = results.find((r: any) => r.studentId === s.id);
        return {
          studentId: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber || '',
          marksObtained: res ? String(res.marksObtained) : '-',
          status: res ? res.status : 'pending',
          remarks: res?.remarks || ''
        };
      }));
    } catch {
      toast.error('Failed to load results');
    }
    setLoadingViewResults(false);
  };

  const handleSaveResults = async () => {
    if (!selectedExam) return;
    setSavingResults(true);
    try {
      // Only persist rows where marks have actually been entered
      const rowsToSave = resultRows
        .filter(r => r.marksObtained != null && String(r.marksObtained).trim() !== '')
        .map(r => ({
          studentId: r.studentId,
          marksObtained: Number(r.marksObtained),
          status: r.status === 'pending'
            ? (Number(r.marksObtained) >= (selectedExam.passingMarks || 40) ? 'pass' : 'fail')
            : r.status,
          remarks: r.remarks || null
        }));

      if (rowsToSave.length === 0) {
        toast.info('No marks have been entered yet to save.');
        setSavingResults(false);
        return;
      }

      const res = await apiFetch('/api/exams/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam.id,
          results: rowsToSave
        }),
      });

      if (res.ok) {
        toast.success('Draft saved successfully!');
        queryClient.invalidateQueries({ queryKey: ['exams'] });
        queryClient.invalidateQueries({ queryKey: ['results-exams'] });
      } else {
        toast.error('Failed to save draft');
      }
    } catch {
      toast.error('Save failed');
    }
    setSavingResults(false);
  };

  const handlePublish = async () => {
    if (!selectedExam) return;

    // Check if any students don't have marks entered
    const unentered = resultRows.filter(r => r.marksObtained == null || String(r.marksObtained).trim() === '');
    if (unentered.length > 0) {
      toast.error('All students must have marks entered before marking as complete.');
      return;
    }

    setIsPublishing(true);
    try {
      // 1. Save Results
      const res = await apiFetch('/api/exams/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam.id,
          results: resultRows.map(r => {
            const marks = Number(r.marksObtained);
            const passThreshold = selectedExam.passingMarks || 40;
            const status = r.status && r.status !== 'pending'
              ? r.status
              : (marks >= passThreshold ? 'pass' : 'fail');
            return {
              studentId: r.studentId,
              marksObtained: marks,
              status,
              remarks: r.remarks || null
            };
          })
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to save results');
        setIsPublishing(false);
        return;
      }

      // 2. Update Exam Status to 'completed'
      const statusRes = await apiFetch('/api/exams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedExam.id,
          status: 'completed'
        }),
      });

      if (statusRes.ok) {
        toast.success('Exam marked as complete successfully!');
        const justCompletedId = selectedExam.id;
        completedExamIdsRef.current.add(justCompletedId);

        // Immediately strip examId from URL so query params don't revive it
        if (searchParams.get('examId')) {
          router.replace(`/${slug}/results-entry${selectedExam.classId ? `?classId=${selectedExam.classId}` : ''}`, { scroll: false });
        }

        setSelectedExam(null);
        setResultRows([]);

        queryClient.invalidateQueries({ queryKey: ['exams'] });
        queryClient.invalidateQueries({ queryKey: ['results-exams'] });
      } else {
        const errData = await statusRes.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to update exam status');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Publishing failed');
    }
    setIsPublishing(false);
  };

  const backToExams = () => { 
    setSelectedExam(null); 
    if (activeTab !== 'exams') {
      router.push(`/${slug}/exams`);
    }
    setActiveTab('exams'); 
  };

  // Bulk Mode Helpers
  const bulkSubjectsForClass = useMemo(() => {
    return subjects.filter((s: any) => s.classId === addForm.classId);
  }, [subjects, addForm.classId]);

  const bulkRows = useMemo(() => {
    return bulkSubjectsForClass.map(s => ({
      ...addForm, 
      ...bulkOverrides[s.id],
      subjectId: s.id, 
      subjectName: s.name, 
      selected: bulkSelected.has(s.id),
    }));
  }, [bulkSubjectsForClass, addForm, bulkOverrides, bulkSelected]);

  const toggleBulkSubject = (id: string) => {
    const next = new Set(bulkSelected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setBulkSelected(next);
  };

  const updateBulkField = (id: string, field: string, value: string) => {
    setBulkOverrides(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  return {
    academicYears,
    currentAcademicYear,
    classFilter,
    setClassFilter,
    publishedAcademicYearFilter,
    setPublishedAcademicYearFilter,
    publishedClassFilter,
    setPublishedClassFilter,
    activeTab,
    setActiveTab,
    addOpen,
    setAddOpen,
    addForm,
    setAddForm,
    adding,
    editingExam,
    setEditingExam,
    editOpen,
    setEditOpen,
    editForm,
    setEditForm,
    saving,
    deleting,
    selectedExam,
    setSelectedExam,
    resultRows,
    setResultRows,
    savingResults,
    loadingStudents,
    isPublishing,
    viewResultsOpen,
    setViewResultsOpen,
    viewResultsExam,
    viewResultsData,
    loadingViewResults,
    bulkSelected,
    setBulkSelected,
    bulkOverrides,
    resultsClassId,
    previewingLedgerClass,
    setPreviewingLedgerClass,
    printingLedgerClassId,
    handlePrintTabularLedger,
    loadingExams,
    exams,
    classes,
    subjects,
    teachers: (metadata?.teachers || []) as any[],
    resultsExams: resultsExamsData?.data || [],
    handleCreate,
    handleUpdate,
    handleDelete,
    openResultsEntry,
    handleResultsClassChange,
    handleOpenViewResults,
    handleSaveResults,
    handlePublish,
    backToExams,
    bulkSubjectsForClass,
    bulkRows,
    toggleBulkSubject,
    updateBulkField,
  };
}
