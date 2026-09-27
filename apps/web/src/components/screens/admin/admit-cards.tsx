'use client';

import { useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from "@/store/use-app-store";
import { useTenantMetadata } from "@/lib/graphql/hooks/platform.hooks";
import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";
import { AdmitCardUpgradeCard } from './subscription/AdmitCardUpgradeCard';
import {
  FileText, Printer, Loader2, School, Download, Crown, Award, Sparkles,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import { api, apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

// Sub-components
import { ClassSelector } from './admit-cards/ClassSelector';
import { ConfigurationCard } from './admit-cards/ConfigurationCard';
import { GeneratedCardsTable } from './admit-cards/GeneratedCardsTable';
import { ViewCardDialog } from './admit-cards/ViewCardDialog';
import { BatchPrintContainers } from './admit-cards/BatchPrintContainers';

// Types
interface StudentInfo {
  id: string;
  rollNumber: string;
  name: string;
  avatar: string | null;
  initials: string;
  dateOfBirth: string | null;
  parentName: string;
}

interface ExamSchedule {
  id: string;
  name: string;
  examType: string;
  subjectName: string;
  subjectCode: string;
  date: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks: number;
  status: string;
  resultPublished?: boolean;
}

interface AdmitCard {
  cardNumber: string;
  student: StudentInfo;
  class: { id: string; name: string; section: string; grade: string };
  school: {
    name: string;
    address: string | null;
    phone: string | null;
    logo: string | null;
  } | null;
  exams: ExamSchedule[];
  generatedAt: string;
}

const examTypeColors: Record<string, string> = {
  unit_test: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
  midterm: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  final: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  quiz: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  practical: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
};

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getExamTypeColor(type: string): string {
  return examTypeColors[type] || 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-400';
}

// Reducer State & Types
interface AdmitCardState {
  selectedClassId: string;
  selectedExamType: string;
  admitCards: AdmitCard[];
  generating: boolean;
  deselectedStudentIds: Set<string>;
  viewCard: AdmitCard | null;
  preparingPrint: boolean;
}

type AdmitCardAction =
  | { type: 'SET_CLASS_ID'; classId: string }
  | { type: 'SET_EXAM_TYPE'; examType: string }
  | { type: 'SET_ADMIT_CARDS'; admitCards: AdmitCard[] }
  | { type: 'SET_GENERATING'; generating: boolean }
  | { type: 'TOGGLE_STUDENT'; id: string }
  | { type: 'TOGGLE_ALL_STUDENTS'; selectAll: boolean; studentIds: string[] }
  | { type: 'SET_VIEW_CARD'; card: AdmitCard | null }
  | { type: 'SET_PREPARING_PRINT'; preparing: boolean };

const initialAdmitCardState: AdmitCardState = {
  selectedClassId: '',
  selectedExamType: '',
  admitCards: [],
  generating: false,
  deselectedStudentIds: new Set<string>(),
  viewCard: null,
  preparingPrint: false,
};

function admitCardReducer(state: AdmitCardState, action: AdmitCardAction): AdmitCardState {
  switch (action.type) {
    case 'SET_CLASS_ID':
      return {
        ...state,
        selectedClassId: action.classId,
        admitCards: [],
        selectedExamType: '',
        deselectedStudentIds: new Set<string>(),
      };
    case 'SET_EXAM_TYPE':
      return {
        ...state,
        selectedExamType: action.examType,
      };
    case 'SET_ADMIT_CARDS':
      return {
        ...state,
        admitCards: action.admitCards,
      };
    case 'SET_GENERATING':
      return {
        ...state,
        generating: action.generating,
      };
    case 'TOGGLE_STUDENT': {
      const next = new Set(state.deselectedStudentIds);
      if (next.has(action.id)) {
        next.delete(action.id);
      } else {
        next.add(action.id);
      }
      return {
        ...state,
        deselectedStudentIds: next,
      };
    }
    case 'TOGGLE_ALL_STUDENTS':
      return {
        ...state,
        deselectedStudentIds: action.selectAll ? new Set<string>(action.studentIds) : new Set<string>(),
      };
    case 'SET_VIEW_CARD':
      return {
        ...state,
        viewCard: action.card,
      };
    case 'SET_PREPARING_PRINT':
      return {
        ...state,
        preparingPrint: action.preparing,
      };
    default:
      return state;
  }
}

function getAvailableCycles(exams: any[], todayDateString: string) {
  if (!exams) return [];
  const activeExams = exams.filter((e: any) => {
    const isScheduled = e.status?.trim().toLowerCase() === 'scheduled';
    const isUpcoming = e.date >= todayDateString;
    return (isScheduled || isUpcoming) && !e.resultPublished;
  });

  const groups: Record<string, { cycleName: string; examType: string; exams: any[] }> = {};
  activeExams.forEach((e: any) => {
    const cycleName = e.name.includes(' - ') ? e.name.split(' - ')[0] : e.name;
    const key = `${cycleName}::${e.examType}`;
    if (!groups[key]) {
      groups[key] = {
        cycleName,
        examType: e.examType,
        exams: []
      };
    }
    groups[key].exams.push(e);
  });

  return Object.values(groups).sort((a, b) => a.cycleName.localeCompare(b.cycleName));
}

export function AdminAdmitCards() {
  const { push } = useRouter();
  const { slug } = useParams();
  const { currentTenantId } = useAppStore();
  const { data: detailData, isLoading: isDetailLoading } = useTenantMetadata(currentTenantId || "");
  const tenant = detailData?.tenant;

  const queryClient = useQueryClient();
  const singleCardRef = useRef<HTMLDivElement>(null);
  const allCardsRef = useRef<HTMLDivElement>(null);
  const todayDateString = useMemo(() => getTodayDateString(), []);

  const [state, dispatch] = useReducer(admitCardReducer, initialAdmitCardState);
  
  // Load Admit Card Preview Preference
  const [enableModalAdmitCardPreview, setEnableModalAdmitCardPreview] = useState<boolean>(false);
  const [enableGradeSelection, setEnableGradeSelection] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('classic_quad');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiFetch("/api/tenant-settings");
        if (res.ok) {
          const data = await res.json();
          setEnableModalAdmitCardPreview(data.enableModalAdmitCardPreview === true);
          setEnableGradeSelection(data.enableGradeSelection === true);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    fetchSettings();
  }, []);
  const {
    selectedClassId,
    selectedExamType,
    admitCards,
    generating,
    deselectedStudentIds,
    viewCard,
    preparingPrint,
  } = state;

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes-min'],
    queryFn: async () => {
      const data = await api.get('/classes?mode=min');
      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        section: c.section,
        grade: c.grade,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: classData, isLoading: loadingClassData, refetch: refetchClassData } = useQuery({
    queryKey: ['admit-card-data', selectedClassId],
    queryFn: () => api.get(`/admit-cards?classId=${selectedClassId}`),
    enabled: !!selectedClassId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const availableCycles = useMemo(() => {
    return getAvailableCycles(classData?.exams, todayDateString);
  }, [classData, todayDateString]);

  const availableExamTypes = useMemo<string[]>(() => {
    return availableCycles.map(c => `${c.cycleName}::${c.examType}`);
  }, [availableCycles]);

  const currentExamType = selectedExamType || availableExamTypes[0] || '';

  const currentCycle = useMemo(() => {
    if (availableCycles.length === 0) return null;
    return availableCycles.find(c => `${c.cycleName}::${c.examType}` === currentExamType) || availableCycles[0];
  }, [availableCycles, currentExamType]);

  const selectedStudentIds = useMemo<Set<string>>(() => {
    if (!classData?.students) return new Set<string>();
    const allIds = classData.students.map((s: any) => s.id as string);
    return new Set<string>(allIds.filter((id) => !deselectedStudentIds.has(id)));
  }, [classData, deselectedStudentIds]);

  const selectAll = useMemo(() => {
    if (!classData?.students || classData.students.length === 0) return false;
    return deselectedStudentIds.size === 0;
  }, [classData, deselectedStudentIds]);

  const handleClassChange = (classId: string) => {
    dispatch({ type: 'SET_CLASS_ID', classId });
  };

  const handleGenerate = async () => {
    if (!selectedClassId) { toast.error('Please select a class'); return; }
    if (selectedStudentIds.size === 0) { toast.error('Please select at least one student'); return; }

    dispatch({ type: 'SET_GENERATING', generating: true });
    try {
      const examIds = currentCycle?.exams.map((e: any) => e.id) || [];
      const res = await apiFetch('/api/admit-cards', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClassId,
          examType: currentCycle?.examType || '',
          examIds,
          studentIds: Array.from(selectedStudentIds),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: 'SET_ADMIT_CARDS', admitCards: data.admitCards });
        toast.success(`${data.totalGenerated} admit card${data.totalGenerated !== 1 ? 's' : ''} generated successfully!`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to generate admit cards');
      }
    } catch { toast.error('Error generating admit cards'); }
    dispatch({ type: 'SET_GENERATING', generating: false });
  };

  const toggleStudent = (id: string) => {
    dispatch({ type: 'TOGGLE_STUDENT', id });
  };

  const handleToggleAll = () => {
    if (!classData) return;
    dispatch({
      type: 'TOGGLE_ALL_STUDENTS',
      selectAll,
      studentIds: classData.students.map((s: any) => s.id),
    });
  };

  const [downloadingSingle, setDownloadingSingle] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handlePrintSingle = useReactToPrint({
    contentRef: singleCardRef,
    documentTitle: "",
  });

  const handleDownloadSingle = async () => {
    if (!viewCard) return;
    setDownloadingSingle(true);
    try {
      const { downloadContainerAsPDF } = await import('@/lib/pdf-export');
      const filename = `Admit_Card_${viewCard.student.name.replace(/\s+/g, '_')}.pdf`;
      
      await downloadContainerAsPDF({
        containerRef: singleCardRef,
        pageClassName: 'single-card-page',
        filename,
        onStart: () => {
          toast.info("Generating PDF, please wait...", { id: 'pdf-progress' });
        },
        onComplete: () => {
          toast.success("PDF downloaded successfully!", { id: 'pdf-progress' });
        },
        onError: (err: any) => {
          toast.error("Failed to generate PDF: " + err.message, { id: 'pdf-progress' });
        }
      });
    } catch (err: any) {
      console.error(err);
      toast.error("An error occurred during PDF generation.", { id: 'pdf-progress' });
    } finally {
      setDownloadingSingle(false);
    }
  };

  const handleDownloadAll = async () => {
    if (admitCards.length === 0) return;
    setDownloadingAll(true);
    dispatch({ type: 'SET_PREPARING_PRINT', preparing: true });
    
    // Give react time to mount the allCardsRef container in the DOM
    setTimeout(async () => {
      try {
        const { downloadContainerAsPDF } = await import('@/lib/pdf-export');
        const activeClass = classes.find((c: any) => c.id === selectedClassId);
        const classNameStr = activeClass?.name || 'Class';
        const classSection = activeClass?.section || '';
        
        await downloadContainerAsPDF({
          containerRef: allCardsRef,
          pageClassName: 'admit-card-page',
          filename: `Admit_Cards_${classNameStr}_${classSection}.pdf`,
          width: 794,
          height: 1123,
          onStart: () => {
            toast.info("Generating PDF, please wait...", { id: 'pdf-progress' });
          },
          onProgress: (current, total) => {
            toast.info(`Generating page ${current} of ${total}...`, { id: 'pdf-progress' });
          },
          onComplete: () => {
            toast.success("PDF downloaded successfully!", { id: 'pdf-progress' });
          },
          onError: (err: any) => {
            toast.error("Failed to generate PDF: " + err.message, { id: 'pdf-progress' });
          }
        });
      } catch (err: any) {
        console.error(err);
        toast.error("An error occurred during PDF generation.", { id: 'pdf-progress' });
      } finally {
        setDownloadingAll(false);
        dispatch({ type: 'SET_PREPARING_PRINT', preparing: false });
      }
    }, 500);
  };

  const handlePrintAllBase = useReactToPrint({
    contentRef: allCardsRef,
    documentTitle: `Admit_Cards_${selectedClassId}`,
    onAfterPrint: () => dispatch({ type: 'SET_PREPARING_PRINT', preparing: false }),
  });

  const handlePrintAll = useCallback(async () => {
    if (enableModalAdmitCardPreview) {
      dispatch({ type: 'SET_PREPARING_PRINT', preparing: true });
      setTimeout(() => {
        handlePrintAllBase();
      }, 500);
    } else {
      const activeClass = classes.find((c: any) => c.id === selectedClassId);
      const classNameStr = activeClass?.name || 'Class';
      const classSection = activeClass?.section || '';
      
      toast.promise(
        (async () => {
          const [
            { handleAdmitCardPreviewNewTab },
            { AdmitCardPrintPreview }
          ] = await Promise.all([
            import('./admit-cards/admitCardPreviewUtils'),
            import('./admit-cards/admitCardPrinter')
          ]);

          await handleAdmitCardPreviewNewTab({
            admitCards,
            classNameStr,
            classSection,
            AdmitCardPrintPreview
          });
        })(),

        {
          loading: 'Loading admit card workspace...',
          success: 'Admit card workspace opened in a new tab!',
          error: 'Failed to load admit card workspace',
        }
      );
    }
  }, [enableModalAdmitCardPreview, handlePrintAllBase, classes, selectedClassId, admitCards]);

  const totalStudents = classData?.students.length || 0;
  const totalExams = currentCycle?.exams.length || 0;

  if (isDetailLoading) {
    return <FullPageSkeleton />;
  }

  if (tenant && tenant.plan.toLowerCase() === 'basic') {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-4 sm:py-8 w-full animate-in fade-in duration-300">
        <AdmitCardUpgradeCard
          className="w-full"
          onUpgrade={() => push(`/${slug}/manage-plan`)}
          onViewPlan={() => push(`/${slug}/manage-plan`)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Admit Cards
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Crown className="size-3 fill-amber-500/20" /> Premium
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Generate exam admit cards (hall tickets) for students
          </p>
        </div>
        {admitCards.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={handlePrintAll} 
              disabled={preparingPrint || downloadingAll}
              className="hidden lg:inline-flex gap-2 bg-zinc-800 hover:bg-zinc-900 text-white w-full sm:w-auto justify-center items-center"
            >
              {preparingPrint ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
              {preparingPrint ? 'Preparing...' : `Print All (${admitCards.length})`}
            </Button>
            
            <Button 
              onClick={handleDownloadAll} 
              disabled={preparingPrint || downloadingAll}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto shadow-md shadow-amber-900/10 justify-center items-center"
            >
              {downloadingAll ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {downloadingAll ? 'Downloading...' : `Download PDF (${admitCards.length})`}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Award className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Official Examination Hall Tickets</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">Generate and batch print standardized student examination admit cards.</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-800/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
          <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Premium Feature</span>
        </div>
      </div>

      <BatchPrintContainers 
        preparingPrint={preparingPrint}
        allCardsRef={allCardsRef}
        singleCardRef={singleCardRef}
        admitCards={admitCards}
        viewCard={viewCard}
        selectedClassId={selectedClassId}
        templateId={selectedTemplate}
      />

      <div className="space-y-6">
        <ClassSelector 
          selectedClassId={selectedClassId}
          onClassChange={handleClassChange}
          classes={classes}
          loadingClasses={loadingClasses}
          loadingClassData={loadingClassData}
          onSyncData={() => { queryClient.invalidateQueries({ queryKey: ['admit-card-data', selectedClassId] }); refetchClassData(); }}
          enableGradeSelection={enableGradeSelection}
        />

        {classData && (
          <ConfigurationCard 
            availableExamTypes={availableExamTypes}
            selectedExamType={currentExamType}
            setSelectedExamType={(examType) => dispatch({ type: 'SET_EXAM_TYPE', examType })}
            classData={classData}
            todayDateString={todayDateString}
            totalStudents={totalStudents}
            totalExams={totalExams}
            selectedStudentIds={selectedStudentIds}
            selectAll={selectAll}
            onToggleAll={handleToggleAll}
            onToggleStudent={toggleStudent}
            onGenerate={handleGenerate}
            generating={generating}
            onPrintAll={handlePrintAll}
            onDownloadAll={handleDownloadAll}
            admitCardsCount={admitCards.length}
            preparingPrint={preparingPrint}
            downloadingAll={downloadingAll}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
          />
        )}

        {loadingClassData && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {admitCards.length > 0 && (
          <GeneratedCardsTable 
            admitCards={admitCards}
            onView={(card) => dispatch({ type: 'SET_VIEW_CARD', card })}
            getExamTypeColor={getExamTypeColor}
          />
        )}

        {!loadingClasses && classes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <School className="size-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No classes found</p>
              <p className="text-sm">Create classes first in the Classes section</p>
            </CardContent>
          </Card>
        )}
      </div>

      <ViewCardDialog 
        card={viewCard}
        onOpenChange={(open) => !open && dispatch({ type: 'SET_VIEW_CARD', card: null })}
        onPrint={() => handlePrintSingle()}
        onDownload={handleDownloadSingle}
        downloading={downloadingSingle}
        templateId={selectedTemplate}
      />
    </div>
  );
}
