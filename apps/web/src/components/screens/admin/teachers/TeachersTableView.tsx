"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye, MoreVertical } from "lucide-react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
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
import { avatarColors } from "./types";
import type { TeacherInfo } from "./types";

const premiumLayoutTransition = {
  type: "spring",
  stiffness: 280,
  damping: 28,
  mass: 0.7
} as const;

interface TeachersTableViewProps {
  teachers: TeacherInfo[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (t: TeacherInfo) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  onView: (t: TeacherInfo) => void;
}

export function TeachersTableView({
  teachers,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  deletingId,
  setDeletingId,
  onView,
}: TeachersTableViewProps) {
  return (
    <Card className="shadow-sm border-0 overflow-hidden mb-4">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Teacher</th>
                <th className="px-6 py-4 hidden sm:table-cell">Experience</th>
                <th className="px-6 py-4 hidden lg:table-cell">Qualification</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <LazyMotion features={domAnimation}>
                <AnimatePresence mode="popLayout">
                  {teachers.map((teacher, index) => {
                    const initials = teacher.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                    const color = avatarColors[index % avatarColors.length];
                    return (
                      <m.tr 
                        key={teacher.id} 
                        id={`teacher-item-${teacher.id}`}
                        layout="position"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{
                          layout: premiumLayoutTransition,
                          opacity: { duration: 0.2 }
                        }}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8 shrink-0">
                              <AvatarFallback className={`${color} text-white text-[10px] font-bold`}>
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span 
                                onClick={() => onView(teacher)}
                                className="font-bold text-zinc-900 dark:text-zinc-100 truncate cursor-pointer hover:underline hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                              >
                                {teacher.name}
                              </span>
                              <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{teacher.email}</span>
                              <div className="sm:hidden flex flex-wrap gap-1 mt-1">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-1 rounded">
                                  {teacher.experience || 'New'} Exp
                                </span>
                                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium bg-zinc-50 dark:bg-zinc-900/20 px-1 rounded">
                                  {teacher.qualification || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 hidden sm:table-cell text-zinc-600 dark:text-zinc-400 font-medium">
                          {teacher.experience || 'N/A'}
                        </TableCell>
                        <TableCell className="px-6 py-4 hidden lg:table-cell">
                          <Badge variant="outline" className="font-normal text-xs">{teacher.qualification || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Desktop Actions (xl and above) */}
                            <div className="hidden xl:flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-8 text-zinc-400 hover:text-emerald-600" 
                                onClick={() => onView(teacher)}
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              {canEdit && (
                                <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-emerald-600" onClick={() => onEdit(teacher)}>
                                  <Pencil className="size-3.5" />
                                </Button>
                              )}
                              {canDelete && (
                                <AlertDialog
                                  open={deletingId === teacher.id}
                                  onOpenChange={(open) => {
                                    if (!open) setDeletingId(null);
                                  }}
                                >
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-red-600" onClick={() => setDeletingId(teacher.id)}>
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete <strong>{teacher.name}</strong>? This action
                                        cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setDeletingId(null)}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        onClick={() => onDelete(teacher.id)}
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
                                  <DropdownMenuItem onClick={() => onView(teacher)} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span>View Details</span>
                                  </DropdownMenuItem>
                                  {canEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(teacher)} className="cursor-pointer">
                                      <Pencil className="mr-2 h-4 w-4" />
                                      <span>Edit Teacher</span>
                                    </DropdownMenuItem>
                                  )}
                                  {canDelete && (
                                    <AlertDialog
                                      open={deletingId === teacher.id}
                                      onOpenChange={(open) => {
                                        if (!open) setDeletingId(null);
                                      }}
                                    >
                                      <AlertDialogTrigger asChild>
                                        <div 
                                          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingId(teacher.id);
                                          }}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Delete Record</span>
                                        </div>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete <strong>{teacher.name}</strong>? This action
                                            cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDelete(teacher.id);
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
                      </m.tr>
                    );
                  })}
                </AnimatePresence>
              </LazyMotion>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={className}>{children}</td>;
}
