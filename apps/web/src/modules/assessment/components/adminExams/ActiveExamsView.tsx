'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ExamRecord, ClassOption } from './types';
import { ActiveExamsTabs, TabType } from './active/ActiveExamsTabs';
import { ActiveExamsPagination } from './active/ActiveExamsPagination';
import { ActiveExamsSkeleton } from './active/ActiveExamsSkeleton';
import { ActiveExamsEmptyState } from './active/ActiveExamsEmptyState';
import { ActiveExamTableRow, ProcessedExam } from './active/ActiveExamTableRow';
import { useActiveExamsData } from './active/useActiveExamsData';
import { ExamDetailView } from './detail/ExamDetailView';

interface ActiveExamsViewProps {
  exams: ExamRecord[];
  classes: ClassOption[];
  loadingExams: boolean;
  deleting: boolean;
  handleDelete: (id: string | string[]) => Promise<void>;
  setEditForm: (form: any) => void;
  setEditOpen: (open: boolean) => void;
  handleOpenViewResults: (exam: ExamRecord) => Promise<void>;
  onOpenResultsEntry?: (exam: ExamRecord | null) => Promise<void>;
  formatDate: (d: string) => string;
  formatTime: (t: any) => string;
  getStatusBadge: (s: string) => React.ReactNode;
  getExamTypeBadge: (t: string) => React.ReactNode;
  classFilter: string;
  setClassFilter: (c: string) => void;
  onNewExamClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onRefreshData?: () => void;
}

export function ActiveExamsView({
  exams,
  classes,
  loadingExams,
  deleting,
  handleDelete,
  setEditForm,
  setEditOpen,
  handleOpenViewResults,
  onOpenResultsEntry,
  onNewExamClick,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  onRefreshData,
}: ActiveExamsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  const [selectedExamDetail, setSelectedExamDetail] = useState<ProcessedExam | null>(null);

  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const { processedExams, filteredExams, paginatedExams, totalPages } = useActiveExamsData({
    exams,
    activeTab,
    searchQuery,
    currentPage,
    pageSize,
  });

  // Keep selected exam detail synchronized with latest exams data
  const currentDetailExam = useMemo(() => {
    if (!selectedExamDetail) return null;
    return (
      processedExams.find(
        (e) =>
          e.id === selectedExamDetail.id ||
          (e.name.toLowerCase() === selectedExamDetail.name.toLowerCase() &&
            e.classId === selectedExamDetail.classId)
      ) || selectedExamDetail
    );
  }, [processedExams, selectedExamDetail]);

  const allCurrentSelected =
    paginatedExams.length > 0 && paginatedExams.every((e) => selectedExamIds.includes(e.id));

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedExamIds((prev) => prev.filter((id) => !paginatedExams.some((e) => e.id === id)));
    } else {
      const idsToAdd = paginatedExams.map((e) => e.id);
      setSelectedExamIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedExamIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteExamIds = (ids: string[]) => {
    if (ids.length > 0) {
      handleDelete(ids);
    }
  };

  // If user clicked into an exam, display the full ExamDetailHub (Overview, Subjects, Preview, Publish)
  if (currentDetailExam) {
    return (
      <ExamDetailView
        exam={currentDetailExam}
        onBack={() => setSelectedExamDetail(null)}
        onEditExam={(fullExam) => {
          setEditForm(fullExam);
          setEditOpen(true);
        }}
        onEnterMarks={(examRecord) => {
          if (onOpenResultsEntry) {
            onOpenResultsEntry(examRecord);
          } else {
            handleOpenViewResults(examRecord);
          }
        }}
        onViewResults={handleOpenViewResults}
        onRefreshData={onRefreshData}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Tab Filter Navigation with integrated search */}
      <ActiveExamsTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
        }}
        searchQuery={searchQuery}
        onSearchChange={externalOnSearchChange || setInternalSearchQuery}
      />

      {/* Main Table Card — displays single row per exam cycle (Image 1) */}
      <div className="bg-white dark:bg-zinc-900 border border-border/70 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto px-2 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 h-12 pl-1 pr-2">
                  <Checkbox
                    checked={allCurrentSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all exams"
                    className="rounded"
                  />
                </TableHead>
                <TableHead className="w-8 h-12 text-center px-2">#</TableHead>
                <TableHead className="h-12 pl-2 sm:pl-4">Exam Name</TableHead>
                <TableHead className="hidden md:table-cell">Class</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Start Date</TableHead>
                <TableHead className="hidden lg:table-cell">End Date</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="w-16 sm:w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingExams ? (
                <ActiveExamsSkeleton />
              ) : paginatedExams.length === 0 ? (
                <ActiveExamsEmptyState onNewExamClick={onNewExamClick} />
              ) : (
                paginatedExams.map((exam, idx) => (
                  <ActiveExamTableRow
                    key={exam.id}
                    exam={exam}
                    rowNumber={(currentPage - 1) * pageSize + idx + 1}
                    isSelected={selectedExamIds.includes(exam.id)}
                    onToggleSelect={toggleSelectRow}
                    onViewDetails={handleOpenViewResults}
                    onViewExamDetail={(detailExam) => setSelectedExamDetail(detailExam)}
                    onEdit={(fullExam) => {
                      setEditForm(fullExam);
                      setEditOpen(true);
                    }}
                    onDelete={handleDeleteExamIds}
                    deleting={deleting}
                    allExams={exams}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <ActiveExamsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredExams.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
