'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, ClipboardList, ChevronDown, Printer, Loader2, Download
} from 'lucide-react';
import { ExamTable } from './ExamTable';
import { getGroupedExams } from './utils';
import { ExamRecord, ClassOption } from './types';

interface PublishedResultsViewProps {
  exams: ExamRecord[];
  classes: ClassOption[];
  academicYears: any[];
  currentAcademicYear: string;
  publishedAcademicYearFilter: string;
  setPublishedAcademicYearFilter: React.Dispatch<React.SetStateAction<string>>;
  publishedClassFilter: string;
  setPublishedClassFilter: React.Dispatch<React.SetStateAction<string>>;
  printingLedgerClassId: string | null;
  handlePrintTabularLedger: (classId: string, className: string, classSection: string, templateId: string, examName?: string, isDownload?: boolean) => Promise<void>;
  loadingExams: boolean;
  deleting: boolean;
  handleDelete: (id: string | string[]) => Promise<void>;
  setEditForm: (form: any) => void;
  setEditOpen: (open: boolean) => void;
  handleOpenViewResults: (exam: ExamRecord) => Promise<void>;
  formatDate: (d: string) => string;
  formatTime: (t: any) => string;
  getStatusBadge: (s: string) => React.ReactNode;
  getExamTypeBadge: (t: string) => React.ReactNode;
}

export function PublishedResultsView({
  exams,
  classes,
  academicYears,
  currentAcademicYear,
  publishedAcademicYearFilter,
  setPublishedAcademicYearFilter,
  publishedClassFilter,
  setPublishedClassFilter,
  printingLedgerClassId,
  handlePrintTabularLedger,
  loadingExams,
  deleting,
  handleDelete,
  setEditForm,
  setEditOpen,
  handleOpenViewResults,
  formatDate,
  formatTime,
  getStatusBadge,
  getExamTypeBadge,
}: PublishedResultsViewProps) {
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

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

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl flex items-center gap-3">
        <Trophy className="size-5 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Finalized Results</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">These exams have been officially published and results are visible to students.</p>
        </div>
      </div>
      
      {exams.filter(e => e.status === 'published' || e.isPublished === true).length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-card text-center text-muted-foreground animate-in fade-in duration-300">
          <Trophy className="size-16 mb-4 text-emerald-500/40" />
          <h3 className="text-lg font-semibold text-foreground">No Published Results</h3>
          <p className="text-sm mt-1 max-w-md">There are no finalized or published exams to view results for yet.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Dual Filter Selectors for Published Results */}
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
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-card text-center text-muted-foreground animate-in fade-in duration-300">
              <Trophy className="size-12 mb-3 text-zinc-300 dark:text-zinc-700" />
              <h3 className="text-base font-semibold text-foreground">No matching published exams found</h3>
              <p className="text-xs mt-1 max-w-md">No finalized exams match your selected filters. Try clearing or modifying your selections.</p>
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
                <h3 className="text-sm font-semibold tracking-tight text-foreground/80">Select a Class to View Published Results</h3>
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
                                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                    <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                                      {group.exams.length} subject{group.exams.length !== 1 ? 's' : ''}
                                    </span>
                                    {(() => {
                                      const isPrintingLedger = printingLedgerClassId === c.id;
                                      return (
                                        <div className="flex items-center gap-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            disabled={isPrintingLedger}
                                            onClick={() => {
                                              handlePrintTabularLedger(c.id, c.name, c.section, 'classic', group.cycleName, false);
                                            }}
                                            className="h-7 border-emerald-200 hover:border-emerald-300 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 gap-1.5 rounded-lg text-[11px] font-semibold px-2.5 shadow-sm transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                                          >
                                            {isPrintingLedger ? (
                                              <Loader2 className="size-3.5 animate-spin" />
                                            ) : (
                                              <ClipboardList className="size-3.5" />
                                            )}
                                            <span>Generate Result Sheet</span>
                                          </Button>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <div className="p-0">
                                  <ExamTable
                                    exams={group.exams} loading={loadingExams} searchTerm="" setSearchTerm={() => {}}
                                    onOpenEdit={(e) => { setEditForm({ ...e, totalMarks: String(e.totalMarks), passingMarks: String(e.passingMarks) }); setEditOpen(true); }}
                                    onDelete={handleDelete} deleting={deleting} formatDate={formatDate} formatTime={formatTime}
                                    getStatusBadge={getStatusBadge} getExamTypeBadge={getExamTypeBadge}
                                    onViewResults={handleOpenViewResults}
                                    classFilter={c.id} setClassFilter={() => {}}
                                    statusFilter="all" setStatusFilter={() => {}}
                                    classes={classes}
                                    hideClassFilter={true}
                                    flat={true}
                                    hideSearchAndFilter={true}
                                  />
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
