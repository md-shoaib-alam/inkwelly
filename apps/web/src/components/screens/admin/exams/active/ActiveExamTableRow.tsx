'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { MoreVertical, Eye, Pencil, Trash2, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ExamRecord } from '../types';
import { formatMockupDate, renderTypeBadge, renderStatusBadge } from './activeExamsUtils';

export interface ProcessedExamSubject {
  id: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  totalStudents: number;
  marksEnteredCount: number;
  status: 'completed' | 'in_progress' | 'not_started';
  date: string;
  startTime?: string;
  endTime?: string;
  totalMarks: number;
  passingMarks: number;
  fullExam: ExamRecord;
}

/**
 * Represents a unique subject (by name) across all sections in an exam cycle.
 * sectionExamIds maps classSection (e.g. "A", "B") → the exam paper ID for that section.
 * This allows the tabulation preview to look up the correct marks for each student's section.
 */
export interface DistinctSubject {
  subjectName: string;
  totalMarks: number;
  /** classSection -> examId for the paper for that section */
  sectionExamIds: Record<string, string>;
}

export interface ProcessedExam {
  id: string;
  rawIds: string[];
  name: string;
  description: string;
  className: string;
  classSection?: string;
  classId: string;
  examType: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'draft';
  subjectCount: number;
  subjects: ProcessedExamSubject[];
  /** Deduplicated subjects by name — 5 distinct subjects even if exam spans 2 sections (10 papers) */
  distinctSubjects: DistinctSubject[];
  completion: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    percentage: number;
  };
  totalStudents: number;
  totalMarks: number;
  isPublished: boolean;
}

interface ActiveExamTableRowProps {
  exam: ProcessedExam;
  rowNumber: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onViewDetails: (exam: ExamRecord) => void;
  onViewExamDetail?: (exam: ProcessedExam) => void;
  onEdit: (exam: ExamRecord) => void;
  onDelete: (ids: string[]) => void;
  deleting: boolean;
  allExams: ExamRecord[];
}

export function ActiveExamTableRow({
  exam,
  rowNumber,
  isSelected,
  onToggleSelect,
  onViewDetails,
  onViewExamDetail,
  onEdit,
  onDelete,
  deleting,
  allExams,
}: ActiveExamTableRowProps) {
  const primaryId = exam.rawIds[0] ?? exam.id;
  const matchingFullExam = allExams.find((e) => e.id === primaryId) || {
    id: primaryId,
    name: exam.name,
    subjectName: exam.description,
    className: exam.className,
    classSection: exam.classSection || '',
    classId: exam.classId,
    subjectId: '',
    examType: exam.examType,
    date: exam.startDate,
    startTime: '09:00',
    endTime: '12:00',
    status: exam.status === 'in_progress' ? 'scheduled' : (exam.status as any),
    totalMarks: 100,
    passingMarks: 40,
  };

  const handleRowClick = () => {
    if (onViewExamDetail) {
      onViewExamDetail(exam);
    } else {
      onViewDetails(matchingFullExam);
    }
  };

  return (
    <TableRow
      key={exam.id}
      className={`hover:bg-blue-50/40 dark:hover:bg-blue-950/10 transition-colors border-b last:border-none cursor-pointer ${
        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
      }`}
      onClick={handleRowClick}
    >
      <TableCell className="py-4 pl-1 pr-2" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(exam.id)}
          aria-label={`Select ${exam.name}`}
          className="rounded"
        />
      </TableCell>
      <TableCell className="py-4 px-2 text-center font-bold text-foreground/50 text-xs tabular-nums">
        {rowNumber}
      </TableCell>
      <TableCell className="py-4 pl-2 sm:pl-4">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
            {exam.name}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">
            {exam.subjectCount > 1 ? `${exam.subjectCount} subjects` : exam.description}
          </span>
          {/* On mobile show class + status inline under name */}
          <div className="flex items-center gap-2 mt-1 md:hidden">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {exam.className}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            {renderStatusBadge(exam.status)}
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell py-4 font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap text-sm">
        {exam.className}
      </TableCell>
      <TableCell className="hidden sm:table-cell py-4 whitespace-nowrap">
        {renderTypeBadge(exam.examType)}
      </TableCell>
      <TableCell className="hidden lg:table-cell py-4 text-sm text-slate-700 dark:text-zinc-300 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-muted-foreground" />
          {formatMockupDate(exam.startDate)}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell py-4 text-sm text-slate-700 dark:text-zinc-300 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-muted-foreground" />
          {formatMockupDate(exam.endDate)}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell py-4 whitespace-nowrap">
        {renderStatusBadge(exam.status)}
      </TableCell>
      <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          {/* Desktop Actions (xl+) */}
          <div className="hidden xl:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-blue-600"
              onClick={handleRowClick}
              title="View Details"
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-blue-600"
              onClick={() =>
                onEdit({
                  ...matchingFullExam,
                  name: exam.name,
                  rawIds: exam.rawIds,
                  subjects: exam.subjects,
                  subjectCount: exam.subjectCount,
                  className: exam.className,
                  classSection: exam.classSection || '',
                  cleanName: exam.name,
                } as any)
              }
              title="Edit Exam"
            >
              <Pencil className="size-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-red-600"
                  title="Delete Exam"
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{exam.name}&quot;? This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(exam.rawIds)}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Mobile/Tablet Actions (below xl) */}
          <div className="xl:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuItem
                  onClick={handleRowClick}
                  className="cursor-pointer gap-2 font-medium"
                >
                  <Eye className="size-4 text-blue-600" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onEdit({
                      ...matchingFullExam,
                      name: exam.name,
                      rawIds: exam.rawIds,
                      subjects: exam.subjects,
                      subjectCount: exam.subjectCount,
                      className: exam.className,
                      classSection: exam.classSection || '',
                      cleanName: exam.name,
                    } as any)
                  }
                  className="cursor-pointer gap-2 font-medium"
                >
                  <Pencil className="size-4 text-blue-600" />
                  <span>Edit Exam</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-sm">
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{exam.name}&quot;? This action cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(exam.rawIds)}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
