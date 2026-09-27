'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { 
  FileText, Trophy, ChevronDown, Award, ClipboardList, Printer, Crown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { api, apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicYears } from '@/hooks/use-academic-years';
import { MarksheetPreviewPage } from './exams/MarksheetPreviewPage';
import { Badge } from '@/components/ui/badge';
import { getGroupedExams } from './exams/utils';
import { ExamRecord } from './exams/types';
import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";
import { useTenantMetadata } from "@/lib/graphql/hooks/platform.hooks";
import { PremiumUpgradeCard } from './subscription/PremiumUpgradeCard';

const LoadingScreen = () => <FullPageSkeleton />;

export function AdminPrintMarksheetContent() {
  const { push } = useRouter();
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get('classId') || '';

  // Subscription Plan check
  const { currentTenantId } = useAppStore();
  const { data: detailData, isLoading: isDetailLoading } = useTenantMetadata(currentTenantId || "");
  const tenant = detailData?.tenant;

  // Academic Years
  const { academicYears } = useAcademicYears();
  const currentAcademicYear = useMemo(() => {
    return academicYears.find((ay: any) => ay.isCurrent)?.name || '2024-2025';
  }, [academicYears]);

  // Settings for inline vs tab preview
  const [enableModalMarksheetPreview, setEnableModalMarksheetPreview] = useState<boolean>(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiFetch("/api/tenant-settings");
        if (res.ok) {
          const data = await res.json();
          setEnableModalMarksheetPreview(data.enableModalMarksheetPreview === true);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // Filters
  const [publishedAcademicYearFilter, setPublishedAcademicYearFilter] = useState(currentAcademicYear);
  const [publishedClassFilter, setPublishedClassFilter] = useState('all');
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (currentAcademicYear) {
      queueMicrotask(() => {
        setPublishedAcademicYearFilter(prev => prev === 'all' ? currentAcademicYear : prev);
      });
    }
  }, [currentAcademicYear]);

  // Queries
  const { data: examsData } = useQuery({
    queryKey: ['exams-print'],
    queryFn: async () => {
      const res = await apiFetch('/api/exams');
      return res.json();
    }
  });

  const { data: metadata } = useQuery({
    queryKey: ['classes-subjects-min-print'],
    queryFn: async () => {
      const [classes, subjects] = await Promise.all([
        api.get('/classes?mode=min'),
        api.get('/subjects?mode=min')
      ]);
      return { classes, subjects };
    },
    staleTime: 10 * 60 * 1000,
  });

  const exams = useMemo(() => {
    const data = examsData?.data || (Array.isArray(examsData) ? examsData : []);
    return (data as ExamRecord[]).filter(
      (e) => e.examType === "midterm" || e.examType === "final"
    );
  }, [examsData]);

  const classes = metadata?.classes || [];

  const publishedFiltered = useMemo(() => {
    return exams.filter(exam => {
      const isPublished = exam.status === 'published' || exam.isPublished === true;
      if (!isPublished) return false;
      const matchAcademicYear = !publishedAcademicYearFilter || exam.academicYear === publishedAcademicYearFilter;
      const matchClass = publishedClassFilter === 'all' || exam.classId === publishedClassFilter;
      return matchAcademicYear && matchClass;
    });
  }, [exams, publishedAcademicYearFilter, publishedClassFilter]);

  const classesWithCompletedExams = useMemo(() => {
    return classes.filter(c => 
      publishedFiltered.some(e => e.classId === c.id)
    );
  }, [classes, publishedFiltered]);

  const examNameParam = searchParams.get('examName') || '';

  if (isDetailLoading) {
    return <LoadingScreen />;
  }

  if (tenant && tenant.plan.toLowerCase() === 'basic') {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-4 sm:py-8 w-full animate-in fade-in duration-300">
        <PremiumUpgradeCard
          className="w-full"
          onUpgrade={() => push(`/${slug}/manage-plan`)}
          onViewPlan={() => push(`/${slug}/manage-plan`)}
        />
      </div>
    );
  }

  if (classIdParam) {
    const activeClass = classes.find((c: any) => c.id === classIdParam);
    return (
      <MarksheetPreviewPage
        classId={classIdParam}
        classNameStr={activeClass?.name || 'Class'}
        classSection={activeClass?.section || ''}
        academicYear={publishedAcademicYearFilter || currentAcademicYear}
        examName={examNameParam}
        onBack={() => push(`/${slug}/print-marksheet`)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            <span className="truncate">Print Marksheets</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1 sm:line-clamp-none">
            Select a class to generate, preview, and print high-fidelity student marksheets.
          </p>
        </div>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl flex items-center gap-3">
        <Trophy className="size-5 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Official Grade Reports</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">Generate A4-formatted midterm or final grade sheets for students.</p>
        </div>
      </div>

      {exams.filter(e => e.status === 'published' || e.isPublished === true).length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-card text-center text-muted-foreground">
          <Trophy className="size-16 mb-4 text-emerald-500/40" />
          <h3 className="text-lg font-semibold text-foreground">No Published Exams</h3>
          <p className="text-sm mt-1 max-w-md">There are no published or finalized exams to print marksheets for yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Dual Filter Selectors */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-card p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 shadow-sm">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="w-full sm:w-[260px]">
                <Select value={publishedAcademicYearFilter} onValueChange={setPublishedAcademicYearFilter}>
                  <SelectTrigger className="w-full h-9 border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-normal">Academic Year:</span>
                      <SelectValue placeholder="Select Academic Year" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {academicYears.map((ay: any) => (
                      <SelectItem key={ay.id} value={ay.name} className="text-xs font-medium">
                        {ay.name} {ay.isCurrent ? '(Current)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-[220px]">
                <Select value={publishedClassFilter} onValueChange={setPublishedClassFilter}>
                  <SelectTrigger className="w-full h-9 border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-normal">Class:</span>
                      <SelectValue placeholder="All Classes" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="all" className="text-xs font-medium">All Classes</SelectItem>
                    {classes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                        {c.name} - {c.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(publishedAcademicYearFilter !== currentAcademicYear || publishedClassFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setPublishedAcademicYearFilter(currentAcademicYear); setPublishedClassFilter('all'); }}
                className="text-xs text-muted-foreground hover:text-foreground h-9 px-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors shrink-0"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {classesWithCompletedExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-card text-center text-muted-foreground">
              <Trophy className="size-12 mb-3 text-zinc-300 dark:text-zinc-700" />
              <h3 className="text-base font-semibold text-foreground">No matching classes found</h3>
              <p className="text-xs mt-1 max-w-md">No classes with completed exams match your filters.</p>
              <Button 
                onClick={() => { setPublishedAcademicYearFilter(currentAcademicYear); setPublishedClassFilter('all'); }}
                variant="outline" 
                size="sm" 
                className="mt-4 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-tight text-foreground/80">Select a Class to Preview Marksheets</h3>
              </div>
              <div className="flex flex-col gap-4">
                {classesWithCompletedExams.map((c: any) => {
                  const isExpanded = !!expandedClasses[c.id];
                  const classExams = publishedFiltered.filter(e => e.classId === c.id);
                  
                  return (
                    <Card 
                      key={c.id} 
                      className={`border dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md bg-card relative py-0 gap-0 ${isExpanded ? 'border-l-4 border-l-emerald-600 dark:border-l-emerald-500 border-zinc-200' : 'border-zinc-100'}`}
                    >
                      <button 
                        type="button"
                        onClick={() => setExpandedClasses(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                        className={`w-full text-left py-2.5 px-4 flex items-center justify-between cursor-pointer hover:bg-accent/40 transition-colors select-none ${isExpanded ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setExpandedClasses(prev => ({ ...prev, [c.id]: !prev[c.id] }));
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg transition-all duration-300 ${isExpanded ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'}`}>
                            <Trophy className="size-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-foreground leading-tight">
                              {c.name} - {c.section}
                            </h3>
                            <p className="text-[11px] text-muted-foreground mt-0 font-medium">
                              {classExams.length} published exam{classExams.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-full transition-all duration-300 ${isExpanded ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-50 dark:bg-zinc-900 text-muted-foreground'}`}>
                            <ChevronDown className={`size-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </button>

                      {/* Collapsible Content */}
                      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2500px] border-t border-zinc-100 dark:border-zinc-800' : 'max-h-0'}`}>
                        <div className="p-4 bg-zinc-50/30 dark:bg-zinc-950/10 space-y-4">
                          {getGroupedExams(classExams).map((group) => {
                            const groupKey = `${group.cycleName}::${group.academicYear}`;
                            return (
                              <Card key={groupKey} className="border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden bg-card">
                                <div className="px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <ClipboardList className="size-4.5 text-blue-500" />
                                    <span className="font-bold text-sm text-foreground">{group.cycleName}</span>
                                    <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0 border-zinc-200 dark:border-zinc-800 text-muted-foreground bg-zinc-100/50 dark:bg-zinc-900/50">
                                      {group.academicYear}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground font-medium">
                                      {group.exams.length} subject{group.exams.length !== 1 ? 's' : ''}
                                    </span>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (enableModalMarksheetPreview) {
                                          push(`/${slug}/print-marksheet?classId=${c.id}&examName=${encodeURIComponent(group.cycleName)}`);
                                        } else {
                                          toast.promise(
                                            (async () => {
                                              const { handleMarksheetPreviewNewTab } = await import('./exams/marksheetPrinter');
                                              await handleMarksheetPreviewNewTab({
                                                classId: c.id,
                                                classNameStr: c.name,
                                                classSection: c.section,
                                                academicYear: publishedAcademicYearFilter || currentAcademicYear,
                                                examName: group.cycleName
                                              });
                                            })(),
                                            {
                                              loading: 'Loading marksheet workspace...',
                                              success: 'Marksheet workspace opened in a new tab!',
                                              error: 'Failed to load marksheet workspace',
                                            }
                                          );
                                        }
                                      }}
                                      className="h-7 border-emerald-200 hover:border-emerald-300 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 gap-1.5 rounded-lg text-[11px] font-semibold px-2.5 shadow-sm transition-colors flex items-center justify-center font-sans"
                                    >
                                      <Printer className="size-3.5" />
                                      <span>Generate Marksheets</span>
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminPrintMarksheet() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AdminPrintMarksheetContent />
    </Suspense>
  );
}
