'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Search, Filter, MoreVertical, Edit2, Trash2, Calendar, Clock, 
  FileText, Pencil, ClipboardList, RefreshCw, Eye
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ExamRecord } from './types';

interface ExamTableProps {
  exams: ExamRecord[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  onOpenEdit: (exam: ExamRecord) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
  formatDate: (date: string) => string;
  formatTime: (time: string | null | undefined) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  getExamTypeBadge: (type: string) => React.ReactNode;
  onViewResults?: (exam: ExamRecord) => void;
  
  // Filter props
  classFilter: string;
  setClassFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  classes: any[];
  hideClassFilter?: boolean;
  flat?: boolean;
  hideSearchAndFilter?: boolean;
}

export function ExamTable({
  exams,
  loading,
  searchTerm,
  setSearchTerm,
  onOpenEdit,
  onDelete,
  deleting,
  formatDate,
  formatTime,
  getStatusBadge,
  getExamTypeBadge,
  onViewResults,
  classFilter,
  setClassFilter,
  statusFilter,
  setStatusFilter,
  classes,
  hideClassFilter = false,
  flat = false,
  hideSearchAndFilter = false,
}: ExamTableProps) {
  const Container = flat ? 'div' : Card;
  const containerProps = flat 
    ? { className: "overflow-hidden border-none bg-transparent shadow-none" }
    : { className: "border-none shadow-sm overflow-hidden bg-card" };
  
  const ContentContainer = flat ? 'div' : CardContent;
  const contentProps = { className: "p-0" };

  return (
    // @ts-ignore
    <Container {...containerProps}>
      {!hideSearchAndFilter && (
        <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800 bg-card flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 h-8 sm:h-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!hideClassFilter && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 sm:h-9 gap-1.5 px-2 sm:px-3">
                    <Filter className="size-3.5" />
                    <span className="hidden xs:inline">Filters</span>
                    {(classFilter !== 'all' || statusFilter !== 'all') && (
                      <div className="size-1.5 rounded-full bg-blue-600" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-[80vh] overflow-y-auto">
                  <DropdownMenuLabel>Filter by Class</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[200px] overflow-y-auto">
                    <DropdownMenuItem onClick={() => setClassFilter('all')} className={classFilter === 'all' ? 'bg-accent' : ''}>
                      All Classes
                    </DropdownMenuItem>
                    {classes.map((c) => (
                      <DropdownMenuItem key={c.id} onClick={() => setClassFilter(c.id)} className={classFilter === c.id ? 'bg-accent' : ''}>
                        {c.name}-{c.section}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}
      
      {/* @ts-ignore */}
      <ContentContainer {...contentProps}>
        <div className="overflow-x-auto w-full">
          <Table className="w-full min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-transparent">
                <TableHead className="px-2 sm:px-4">Exam & Subject</TableHead>
                <TableHead className="hidden sm:table-cell">Subject</TableHead>
                {!hideClassFilter && (
                  <TableHead className="hidden md:table-cell">Class</TableHead>
                )}
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell text-center">Timing</TableHead>
                <TableHead className="text-center px-2 hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right px-2 sm:px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'].map((rowId) => (
                  <TableRow key={rowId} className="hover:bg-transparent">
                    {Array.from({ length: hideClassFilter ? 6 : 7 }).map((_, i) => (
                      <TableCell key={`${rowId}-col-${i}`}><div className="h-4 w-full bg-muted animate-pulse rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : exams.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={hideClassFilter ? 6 : 7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ClipboardList className="size-12 mb-2 opacity-20" />
                      <p>No exams found matching your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.id} className="group hover:bg-transparent">
                    <TableCell className="px-2 sm:px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm whitespace-nowrap">{exam.name}</span>
                          <div className="scale-[0.8] origin-left hidden sm:block whitespace-nowrap">{getExamTypeBadge(exam.examType)}</div>
                        </div>
                        <div className="sm:hidden flex flex-col">
                           <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{exam.subjectName}</span>
                           <div className="mt-1 whitespace-nowrap">{getExamTypeBadge(exam.examType)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium whitespace-nowrap">{exam.subjectName}</span>
                        <span className="text-[9px] text-muted-foreground font-mono leading-none uppercase whitespace-nowrap">CODE: {exam.id.slice(-4)}</span>
                      </div>
                    </TableCell>
                    {!hideClassFilter && (
                      <TableCell className="hidden md:table-cell whitespace-nowrap">
                        <Badge variant="secondary" className="font-normal text-xs">
                          {exam.className}-{exam.classSection}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="hidden lg:table-cell text-sm whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        {formatDate(exam.date)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-center text-sm text-muted-foreground whitespace-nowrap">
                      {formatTime(exam.startTime)} – {formatTime(exam.endTime)}
                    </TableCell>
                    <TableCell className="text-center px-2 hidden sm:table-cell whitespace-nowrap">{getStatusBadge(exam.status)}</TableCell>
                    <TableCell className="text-right px-2 sm:px-4 whitespace-nowrap w-[1%]">
                      <div className="flex items-center justify-end gap-1">
                        {/* Desktop Actions (xl and above) */}
                        <div className="hidden xl:flex items-center gap-1">
                          {onViewResults && (exam.status === 'completed' || exam.status === 'published') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => onViewResults(exam)}
                              title="View Results"
                            >
                              <Eye className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => onOpenEdit(exam)}
                            title="Edit Exam"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                title="Delete Exam"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{exam.name}"? This will also delete all student results for this exam.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(exam.id)}
                                  disabled={deleting}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deleting ? 'Deleting...' : 'Delete Permanently'}
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
                            <DropdownMenuContent align="end" className="w-[160px]">
                              {onViewResults && (exam.status === 'completed' || exam.status === 'published') && (
                                <DropdownMenuItem onClick={() => onViewResults(exam)} className="cursor-pointer text-blue-600 focus:text-blue-600 focus:bg-blue-50">
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>View Results</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => onOpenEdit(exam)} className="cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50">
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit Exam</span>
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <div 
                                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete Exam</span>
                                  </div>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{exam.name}"? This will also delete all student results for this exam.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onDelete(exam.id)}
                                      disabled={deleting}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {deleting ? 'Deleting...' : 'Delete Permanently'}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ContentContainer>
    </Container>
  );
}
