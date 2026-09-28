"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UserCheck, Users, Pencil, Trash2 } from "lucide-react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import type { ClassInfo } from "@/lib/types";

interface ClassesGridViewProps {
  classes: ClassInfo[];
  canEdit: boolean;
  canDelete: boolean;
  onViewStudents: (cls: ClassInfo) => void;
  onEdit: (cls: ClassInfo) => void;
  onDelete: (cls: ClassInfo) => void;
  getProgressColor: (percentage: number) => string;
}

export function ClassesGridView({
  classes,
  canEdit,
  canDelete,
  onViewStudents,
  onEdit,
  onDelete,
  getProgressColor,
}: ClassesGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <LazyMotion features={domAnimation}>
        <AnimatePresence mode="popLayout">
          {classes.map((cls) => {
            const percentage = cls.capacity > 0 ? Math.round((cls.studentCount / cls.capacity) * 100) : 0;

            return (
              <m.div
                key={cls.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden border-0 shadow-sm">
                  <CardContent className="p-6">
                    {/* Action buttons - top right */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 transition-opacity">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          onClick={() => onEdit(cls)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          onClick={() => onDelete(cls)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Class name and grade badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          {cls.name}
                        </h3>
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0">
                          Section {cls.section}
                        </Badge>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-3 mb-6 mt-6">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-emerald-500" />
                          <span className="text-zinc-500 font-medium text-xs">Students</span>
                        </div>
                        <span className="font-bold">{cls.studentCount}<span className="text-zinc-400 font-normal ml-0.5">/{cls.capacity}</span></span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <UserCheck className="size-4 text-blue-500" />
                          <span className="text-zinc-500 font-medium text-xs">Teacher</span>
                        </div>
                        <span className="text-zinc-700 dark:text-zinc-300 font-semibold truncate max-w-[120px]">
                          {cls.classTeacher || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-tighter text-zinc-400">
                        <span>Capacity</span>
                        <span className={percentage >= 90 ? "text-red-500" : "text-emerald-500"}>{percentage}% Full</span>
                      </div>
                      <Progress
                        value={percentage}
                        className={`h-1.5 ${getProgressColor(percentage)}`}
                      />
                    </div>

                    <Button 
                      className="w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white border-0 shadow-none transition-all duration-300 font-bold text-xs h-9"
                      onClick={() => onViewStudents(cls)}
                    >
                      <Users className="size-3.5 mr-2" />
                      View Students
                    </Button>
                  </CardContent>
                </Card>
              </m.div>
            );
          })}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
}
