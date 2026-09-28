import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { parseLocalDate } from '@/lib/utils';
import { ClassOption, SubjectOption } from '../types';
import { GradeGroup, BulkSubjectRow, CreatedExamSummary } from './wizardTypes';

interface UseCreateExamWizardProps {
  classes: ClassOption[];
  subjects: SubjectOption[];
  currentAcademicYear: string;
  teachers?: any[];
  onSuccess: () => void;
  initialExam?: any;
}

export function useCreateExamWizard({
  classes,
  subjects,
  currentAcademicYear,
  teachers = [],
  onSuccess,
  initialExam,
}: UseCreateExamWizardProps) {
  const isEdit = !!initialExam;
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Selection Mode: default to 'section' if editing an existing class exam, else 'grade'
  const [selectionMode, setSelectionMode] = useState<'section' | 'grade'>(() => {
    if (initialExam?.selectionMode) return initialExam.selectionMode;
    if (initialExam?.classId) return 'section';
    return 'grade';
  });
  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    if (initialExam?.className) {
      return initialExam.className.replace(/^Class\s*/i, '');
    }
    return classes[0]?.grade || classes[0]?.name || '';
  });

  // Group classes by grade/level
  const gradeGroups: GradeGroup[] = useMemo(() => {
    const map = new Map<string, ClassOption[]>();
    classes.forEach((c) => {
      const key = c.grade || c.name || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return Array.from(map.entries()).map(([gradeName, classList]) => ({
      gradeName,
      classList,
    }));
  }, [classes]);

  // Default selected classes
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(() => {
    if (initialExam?.classId) return [initialExam.classId];
    if (classes.length === 0) return [];
    const firstKey = classes[0]?.grade || classes[0]?.name || '';
    const matching = classes.filter((c) => (c.grade || c.name || '') === firstKey);
    return matching.length > 0 ? matching.map((c) => c.id) : [classes[0].id];
  });

  // Form State
  const [examName, setExamName] = useState(() => initialExam?.name || initialExam?.cleanName || '');
  const [examType, setExamType] = useState(() => initialExam?.examType || 'midterm');
  const [academicYear, setAcademicYear] = useState(() => {
    if (initialExam?.academicYear) return initialExam.academicYear;
    if (currentAcademicYear) return currentAcademicYear;
    const y = new Date().getFullYear();
    return `${y}-${y + 1}`;
  });
  const [startDate, setStartDate] = useState(
    () => initialExam?.startDate || initialExam?.date || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    () =>
      initialExam?.endDate ||
      initialExam?.date ||
      new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(() => initialExam?.description || '');

  const handleSelectGrade = (gradeName: string) => {
    setSelectedGrade(gradeName);
    const targetGroup = gradeGroups.find((g) => g.gradeName === gradeName);
    if (targetGroup) {
      setSelectedClassIds(targetGroup.classList.map((c) => c.id));
    }
  };

  const handleSelectSectionClass = (cid: string) => {
    setSelectedClassIds([cid]);
  };

  const selectedClasses = useMemo(() => {
    return classes.filter((c) => selectedClassIds.includes(c.id));
  }, [classes, selectedClassIds]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isPastDate = useMemo(
    () => (date: Date) => {
      return date < today;
    },
    [today]
  );

  const isEndDateDisabled = useMemo(
    () => (date: Date) => {
      if (date < today) return true;
      if (startDate) {
        const parsedStart = parseLocalDate(startDate);
        if (parsedStart) {
          parsedStart.setHours(0, 0, 0, 0);
          return date < parsedStart;
        }
      }
      return false;
    },
    [today, startDate]
  );

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (endDate && newStart > endDate) {
      setEndDate(newStart);
    }
  };

  const isSubjectDateDisabled = useMemo(
    () => (date: Date) => {
      if (date < today) return true;
      if (startDate) {
        const parsedStart = parseLocalDate(startDate);
        if (parsedStart) {
          parsedStart.setHours(0, 0, 0, 0);
          if (date < parsedStart) return true;
        }
      }
      if (endDate) {
        const parsedEnd = parseLocalDate(endDate);
        if (parsedEnd) {
          parsedEnd.setHours(23, 59, 59, 999);
          if (date > parsedEnd) return true;
        }
      }
      return false;
    },
    [today, startDate, endDate]
  );

  // Subjects belonging to all selected classes
  const selectedClassesSubjects = useMemo(() => {
    return subjects.filter((s: any) => selectedClassIds.includes(s.classId));
  }, [subjects, selectedClassIds]);

  // Distinct subjects by name/code for step 2 schedule config
  const distinctSubjects = useMemo(() => {
    const map = new Map<string, { key: string; name: string; code?: string; sampleId: string }>();
    selectedClassesSubjects.forEach((s) => {
      const key = s.name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: s.name.trim(),
          code: s.code,
          sampleId: s.id,
        });
      }
    });

    if (initialExam?.subjects && Array.isArray(initialExam.subjects)) {
      initialExam.subjects.forEach((s: any) => {
        const key = (s.subjectName || s.name || '').trim().toLowerCase();
        if (key && !map.has(key)) {
          map.set(key, {
            key,
            name: s.subjectName || s.name || 'Subject',
            code: s.code,
            sampleId: s.subjectId || s.id,
          });
        }
      });
    }

    return Array.from(map.values());
  }, [selectedClassesSubjects, initialExam]);

  const [selectedSubjectKeys, setSelectedSubjectKeys] = useState<Set<string>>(() => {
    if (initialExam?.subjects && Array.isArray(initialExam.subjects) && initialExam.subjects.length > 0) {
      return new Set(
        initialExam.subjects.map((s: any) => (s.subjectName || s.name || '').trim().toLowerCase())
      );
    }
    return new Set(distinctSubjects.map((d) => d.key));
  });

  const [subjectConfig, setSubjectConfig] = useState<
    Record<
      string,
      {
        date: string;
        startTime: string;
        endTime: string;
        totalMarks: string;
        passingMarks: string;
      }
    >
  >(() => {
    const initialConfig: Record<string, any> = {};
    if (initialExam?.subjects && Array.isArray(initialExam.subjects)) {
      initialExam.subjects.forEach((s: any) => {
        const key = (s.subjectName || s.name || '').trim().toLowerCase();
        if (key) {
          initialConfig[key] = {
            date: s.date || initialExam.startDate || initialExam.date || '',
            startTime: s.startTime || '09:00',
            endTime: s.endTime || '11:00',
            totalMarks: String(s.totalMarks || initialExam.totalMarks || 100),
            passingMarks: String(s.passingMarks || initialExam.passingMarks || 40),
          };
        }
      });
    }
    return initialConfig;
  });

  const [classTeacherAssignments, setClassTeacherAssignments] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (initialExam?.subjects && initialExam.classId) {
      initialExam.subjects.forEach((s: any) => {
        const key = `${initialExam.classId}_${(s.subjectName || s.name || '').trim().toLowerCase()}`;
        if (s.teacherId || s.fullExam?.teacherId) {
          map[key] = s.teacherId || s.fullExam?.teacherId;
        }
      });
    }
    return map;
  });

  const currentBulkRows: BulkSubjectRow[] = useMemo(() => {
    return distinctSubjects.map((s) => {
      const existing = subjectConfig[s.key];
      const defaultDate = existing?.date || startDate;
      return {
        key: s.key,
        subjectName: s.name,
        code: s.code,
        selected: selectedSubjectKeys.has(s.key),
        date: defaultDate,
        startTime: existing?.startTime || '09:00',
        endTime: existing?.endTime || '11:00',
        totalMarks: existing?.totalMarks || '100',
        passingMarks: existing?.passingMarks || '40',
      };
    });
  }, [distinctSubjects, selectedSubjectKeys, subjectConfig, startDate]);

  const updateSubjectField = (key: string, field: string, val: string) => {
    setSubjectConfig((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {
          date: startDate,
          startTime: '09:00',
          endTime: '11:00',
          totalMarks: '100',
          passingMarks: '40',
        }),
        [field]: val,
      },
    }));
  };

  const toggleSelectSubject = (key: string) => {
    setSelectedSubjectKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllSubjects = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedSubjectKeys(new Set(distinctSubjects.map((s) => s.key)));
    } else {
      setSelectedSubjectKeys(new Set());
    }
  };

  const selectedCount = selectedSubjectKeys.size;

  const validateStep1 = () => {
    if (!examName.trim()) {
      toast.error('Please enter an exam name');
      return false;
    }
    if (selectedClassIds.length === 0) {
      toast.error('Please select at least one class');
      return false;
    }
    if (startDate && endDate && startDate > endDate) {
      toast.error('End date cannot be earlier than start date');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (selectedCount === 0) {
      toast.error('Please select at least one subject for the exam');
      return false;
    }
    const missingDate = currentBulkRows.some((r) => r.selected && !r.date);
    if (missingDate) {
      toast.error('Please specify examination dates for all selected subjects');
      return false;
    }
    return true;
  };

  const [createdSummary, setCreatedSummary] = useState<CreatedExamSummary | null>(null);

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const chosenUniversalRows = currentBulkRows.filter((r) => r.selected);

      if (initialExam) {
        // EDIT MODE: Update existing exam cycle or single exam
        const targetClassId = selectedClasses[0]?.id || initialExam.classId;
        const rawIds = initialExam.rawIds || (initialExam.id ? [initialExam.id] : []);

        const subjectUpdates = chosenUniversalRows
          .map((row) => {
            const matchedSub = (initialExam.subjects || []).find(
              (s: any) => (s.subjectName || s.name || '').trim().toLowerCase() === row.key
            );
            return {
              id: matchedSub?.id || matchedSub?.fullExam?.id,
              date: row.date,
              startTime: row.startTime,
              endTime: row.endTime,
              totalMarks: Number(row.totalMarks) || 100,
              passingMarks: Number(row.passingMarks) || 40,
            };
          })
          .filter((s: any) => !!s.id);

        const payload: any = {
          id: initialExam.id,
          rawIds,
          name: examName.trim(),
          examType,
          academicYear: academicYear || currentAcademicYear,
          description: description.trim() || undefined,
          startDate,
          endDate,
          classId: targetClassId,
          applyToAllSubjects: false,
          subjectUpdates,
        };

        if (chosenUniversalRows.length > 0) {
          payload.date = chosenUniversalRows[0].date;
          payload.startTime = chosenUniversalRows[0].startTime;
          payload.endTime = chosenUniversalRows[0].endTime;
          payload.totalMarks = Number(chosenUniversalRows[0].totalMarks) || 100;
          payload.passingMarks = Number(chosenUniversalRows[0].passingMarks) || 40;
        }

        const res = await apiFetch('/api/exams', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to update examination schedule');
        }

        toast.success(`Successfully updated examination "${examName.trim()}"!`);

        const classLabel =
          selectionMode === 'grade'
            ? selectedGrade.toLowerCase().startsWith('grade') ||
              selectedGrade.toLowerCase().startsWith('class')
              ? selectedGrade
              : `Class ${selectedGrade}`
            : selectedClasses[0]
            ? `${selectedClasses[0].name} - ${selectedClasses[0].section}`
            : initialExam.className || 'Selected Class';

        setCreatedSummary({
          examName: examName.trim(),
          className: classLabel,
          totalSubjects: chosenUniversalRows.length,
          startDate,
          endDate,
          isEdit: true,
        });
        return;
      }

      let totalCreatedCount = 0;

      for (const cls of selectedClasses) {
        const clsSubs = subjects.filter((s) => s.classId === cls.id);
        const examsPayload = chosenUniversalRows
          .map((row) => {
            const matchedSub = clsSubs.find((s) => s.name.trim().toLowerCase() === row.key);
            if (!matchedSub) return null;

            const teacherKey = `${cls.id}_${row.key}`;
            const assignedTeacherId = classTeacherAssignments[teacherKey] ?? matchedSub.teacherId;

            return {
              subjectId: matchedSub.id,
              subjectName: matchedSub.name,
              date: row.date,
              startTime: row.startTime,
              endTime: row.endTime,
              totalMarks: Number(row.totalMarks) || 100,
              passingMarks: Number(row.passingMarks) || 40,
              teacherId: assignedTeacherId || undefined,
            };
          })
          .filter(Boolean);

        if (examsPayload.length > 0) {
          const payload = {
            classId: cls.id,
            examType,
            name: examName.trim(),
            academicYear: academicYear || currentAcademicYear,
            description: description.trim() || undefined,
            startDate,
            endDate,
            exams: examsPayload,
          };

          const res = await apiFetch('/api/exams/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || `Failed to create exams for ${cls.name} - ${cls.section}`);
          }
          totalCreatedCount += examsPayload.length;
        }
      }

      toast.success(
        `Successfully created ${totalCreatedCount} exam papers across ${selectedClasses.length} class(es)!`
      );

      const classLabel =
        selectionMode === 'grade'
          ? selectedGrade.toLowerCase().startsWith('grade') ||
            selectedGrade.toLowerCase().startsWith('class')
            ? selectedGrade
            : `Class ${selectedGrade}`
          : selectedClasses[0]
          ? `${selectedClasses[0].name} - ${selectedClasses[0].section}`
          : 'Selected Class';

      setCreatedSummary({
        examName: examName.trim(),
        className: classLabel,
        totalSubjects: chosenUniversalRows.length,
        startDate,
        endDate,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error creating examination schedule');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isEdit,
    currentStep,
    setCurrentStep,
    submitting,
    selectionMode,
    setSelectionMode,
    selectedGrade,
    handleSelectGrade,
    selectedClassIds,
    handleSelectSectionClass,
    gradeGroups,
    selectedClasses,
    examName,
    setExamName,
    examType,
    setExamType,
    academicYear,
    setAcademicYear,
    startDate,
    handleStartDateChange,
    endDate,
    setEndDate,
    description,
    setDescription,
    isPastDate,
    isEndDateDisabled,
    isSubjectDateDisabled,
    distinctSubjects,
    currentBulkRows,
    selectedCount,
    updateSubjectField,
    toggleSelectSubject,
    toggleAllSubjects,
    classTeacherAssignments,
    setClassTeacherAssignments,
    validateStep1,
    validateStep2,
    createdSummary,
    handleFinalSubmit,
  };
}
