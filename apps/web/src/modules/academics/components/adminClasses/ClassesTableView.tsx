"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UserCheck, Users, Pencil, Trash2 } from "lucide-react";
import type { ClassInfo } from "@/lib/types";

interface ClassesTableViewProps {
  classes: ClassInfo[];
  canEdit: boolean;
  canDelete: boolean;
  onViewStudents: (cls: ClassInfo) => void;
  onEdit: (cls: ClassInfo) => void;
  onDelete: (cls: ClassInfo) => void;
  getProgressColor: (percentage: number) => string;
}

export function ClassesTableView({
  classes,
  canEdit,
  canDelete,
  onViewStudents,
  onEdit,
  onDelete,
  getProgressColor,
}: ClassesTableViewProps) {
  return (
    <Card className="shadow-sm border-0 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Class Details</th>
                <th className="px-6 py-4">Section</th>
                <th className="px-6 py-4">Teacher</th>
                <th className="px-6 py-4">Occupancy</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {classes.map((cls) => {
                const percentage = cls.capacity > 0 ? Math.round((cls.studentCount / cls.capacity) * 100) : 0;
                return (
                  <tr key={cls.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{cls.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-medium">Section {cls.section}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="size-3.5 text-blue-500" />
                        <span className="text-zinc-600 dark:text-zinc-400">{cls.classTeacher || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[150px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[10px] font-medium">
                          <span className="text-muted-foreground">{cls.studentCount}/{cls.capacity} Students</span>
                          <span className={percentage >= 90 ? "text-red-500" : "text-emerald-500"}>{percentage}%</span>
                        </div>
                        <Progress value={percentage} className={`h-1 ${getProgressColor(percentage)}`} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-2 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50"
                          onClick={() => onViewStudents(cls)}
                        >
                          <Users className="size-3.5" />
                          View Students
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-emerald-600" onClick={() => onEdit(cls)}>
                            <Pencil className="size-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-red-600" onClick={() => onDelete(cls)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
