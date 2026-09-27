"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GraduationCap, Pencil, Trash2, Eye, MoreVertical } from "lucide-react";
import type { StudentInfo } from "./types";

interface StudentTableProps {
  students: StudentInfo[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (student: StudentInfo) => void;
  onDelete: (id: string) => void;
  onView: (student: StudentInfo) => void;
}

export function StudentTable({
  students,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onView,
}: StudentTableProps) {
  return (
    <div className="overflow-x-auto px-2 sm:px-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24 sm:w-32 h-12 text-left pl-3 pr-4 sm:pr-8">Roll No</TableHead>
            <TableHead className="h-12 pl-2 sm:pl-4">Name</TableHead>
            <TableHead className="hidden md:table-cell">Class</TableHead>
            <TableHead className="hidden sm:table-cell">Gender</TableHead>
            <TableHead className="hidden lg:table-cell">Parent</TableHead>
            <TableHead className="hidden lg:table-cell">Phone</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="w-16 sm:w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center py-12 text-muted-foreground"
              >
                <GraduationCap className="size-10 mx-auto mb-2 opacity-30" />
                <p>No students found</p>
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => (
              <TableRow
                key={student.id}
                className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors border-b last:border-none group/row cursor-pointer"
                onClick={() => onView(student)}
              >
                <TableCell className="font-mono text-sm py-4 text-left pl-3 pr-4 sm:pr-8 font-medium text-slate-700 dark:text-zinc-300">
                  {student.rollNumber}
                </TableCell>
                <TableCell className="py-4 pl-2 sm:pl-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-semibold shrink-0">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {student.name}
                      </p>
                      {student.username && (
                        <p className="text-[11px] text-zinc-500 font-mono">
                          ID: {student.username}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell py-4">
                  <Badge variant="secondary" className="font-normal">
                    {student.className}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell capitalize py-4">
                  {student.gender}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm py-4">
                  {student.parentName || "–"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm py-4">
                  {student.phone || "–"}
                </TableCell>
                <TableCell className="hidden md:table-cell py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.status?.toLowerCase() === "inactive"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        student.status?.toLowerCase() === "inactive"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    {student.status
                      ? student.status.charAt(0).toUpperCase() + student.status.slice(1)
                      : "Active"}
                  </span>
                </TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Desktop Actions (xl and up) */}
                    <div className="hidden xl:flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-emerald-600"
                        onClick={() => onView(student)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-emerald-600"
                          onClick={() => onEdit(student)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Student
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete{" "}
                                <strong>{student.name}</strong>? This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => onDelete(student.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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
                          <DropdownMenuItem onClick={() => onView(student)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem onClick={() => onEdit(student)} className="cursor-pointer">
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit Student</span>
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete Record</span>
                                </div>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{student.name}</strong>? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete(student.id);
                                    }}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
  );
}
