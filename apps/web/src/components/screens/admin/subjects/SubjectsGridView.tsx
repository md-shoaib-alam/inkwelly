"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";

interface SubjectsGridViewProps {
  filtered: any[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (s: any) => void;
  onDelete: (s: any) => void;
}

export function SubjectsGridView({
  filtered,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: SubjectsGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      <LazyMotion features={domAnimation}>
        <AnimatePresence mode="popLayout">
          {filtered.map((subject) => (
            <m.div
              key={subject.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group"
            >
              <Card className="h-full border-0 shadow-sm hover:shadow-md transition-all duration-300 group-hover:ring-1 group-hover:ring-emerald-500/30">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                      <BookOpen className="size-5" />
                    </div>
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          onClick={() => onEdit(subject)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                          onClick={() => onDelete(subject)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {subject.name}
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      {subject.code}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-tighter">Class</span>
                      <Badge variant="secondary" className="text-[10px] px-2 py-0">
                        {subject.className}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-tighter">Teacher</span>
                      {subject.teacherName && subject.teacherName !== "Not Assigned" ? (
                        <div className="flex items-center gap-1.5">
                          <div className="size-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[8px] font-bold">
                            {subject.teacherName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 max-w-[100px] truncate">
                            {subject.teacherName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-500 font-medium italic">Unassigned</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </m.div>
          ))}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
}
