"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";

interface SubjectsTableViewProps {
  filtered: any[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (s: any) => void;
  onDelete: (s: any) => void;
}

export function SubjectsTableView({
  filtered,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: SubjectsTableViewProps) {
  return (
    <Card className="shadow-sm border-0 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Subject List</CardTitle>
        <CardDescription>{filtered.length} subjects found</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="hidden sm:table-cell">Class</TableHead>
                <TableHead className="hidden md:table-cell">Teacher</TableHead>
                <TableHead className="w-20 text-center">Status</TableHead>
                <TableHead className="w-20 text-center">
                  {(canEdit || canDelete) && "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <LazyMotion features={domAnimation}>
                <AnimatePresence mode="popLayout">
                  {filtered.map((subject) => (
                    <m.tr
                      key={subject.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                      className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors border-b last:border-none"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <BookOpen className="size-4" />
                          </div>
                          <span className="font-medium text-sm">{subject.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono">
                          {subject.code}
                        </code>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="font-normal">
                          {subject.className}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {subject.teacherName && subject.teacherName !== "Not Assigned" ? (
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                              {subject.teacherName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                            </div>
                            {subject.teacherName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Not Assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {subject.teacherName && subject.teacherName !== "Not Assigned" ? (
                          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px]">
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {(canEdit || canDelete) && (
                          <div className="flex items-center justify-center gap-1">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                onClick={() => onEdit(subject)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                onClick={() => onDelete(subject)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </m.tr>
                  ))}
                </AnimatePresence>
              </LazyMotion>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
