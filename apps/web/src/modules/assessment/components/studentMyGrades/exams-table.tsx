import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GraduationCap } from "lucide-react";
import type { GradeRecord } from "@/lib/types";

interface ExamsTableProps {
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  filteredGrades: GradeRecord[];
}

export function ExamsTable({
  activeTab,
  onActiveTabChange,
  filteredGrades,
}: ExamsTableProps) {
  return (
    <Card className="rounded-xl shadow-sm border-zinc-200/60 dark:border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 font-semibold">
          <GraduationCap className="size-4 text-violet-500" />
          All Exam Grades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={onActiveTabChange}
        >
          <TabsList className="mb-4 bg-zinc-50 dark:bg-zinc-900 p-1">
            <TabsTrigger value="all" className="text-xs">
              All Exams
            </TabsTrigger>
            <TabsTrigger value="midterm" className="text-xs">
              Midterm
            </TabsTrigger>
            <TabsTrigger value="final" className="text-xs">
              Finals
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <ScrollArea className="max-h-[500px] w-full">
              <div className="min-w-[600px] sm:min-w-full pb-4">
                {filteredGrades.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 border border-dashed rounded-xl mt-2">
                    <GraduationCap className="size-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No exam grades found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-100 dark:border-zinc-800">
                        <TableHead className="font-semibold">Subject</TableHead>
                        <TableHead className="font-semibold">
                          Exam Type
                        </TableHead>
                        <TableHead className="text-center font-semibold">
                          Marks
                        </TableHead>
                        <TableHead className="text-center font-semibold">
                          Percentage
                        </TableHead>
                        <TableHead className="text-center font-semibold">
                          Grade
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGrades.map((g) => {
                        const pct = Math.round((g.marks / g.maxMarks) * 100);
                        return (
                          <TableRow
                            key={g.id}
                            className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                          >
                            <TableCell className="font-medium">
                              {g.subjectName}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-xs capitalize px-2.5 font-medium bg-zinc-50/50 dark:bg-zinc-900"
                              >
                                {g.examType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                {Number(g.marks)
                                  .toFixed(2)
                                  .replace(/\.00$/, "")}
                              </span>
                              <span className="text-xs text-zinc-400">
                                /{g.maxMarks}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Progress
                                  value={pct}
                                  className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 [&>div]:bg-violet-500"
                                />
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                  {pct}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={`text-xs font-bold border-0 px-2.5 ${
                                  pct >= 80
                                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                                    : pct >= 60
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      : pct >= 50
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                        : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                }`}
                              >
                                {g.grade || "N/A"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
