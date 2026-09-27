"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface GeneratedCardsTableProps {
  admitCards: any[];
  onView: (card: any) => void;
  getExamTypeColor: (type: string) => string;
}

export function GeneratedCardsTable({
  admitCards,
  onView,
  getExamTypeColor,
}: GeneratedCardsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="size-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">3</div>
          Generated Admit Cards
        </CardTitle>
        <CardDescription>
          {admitCards.length} admit card{admitCards.length !== 1 ? 's' : ''} ready, view, print, or download
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Card No</TableHead>
                <TableHead className="hidden sm:table-cell">Roll No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="hidden sm:table-cell">Class</TableHead>
                <TableHead className="hidden md:table-cell">Exams</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admitCards.map((card) => (
                <TableRow key={card.cardNumber} className="hover:bg-muted/50">
                  <TableCell className="hidden sm:table-cell">
                    <span className="font-mono text-xs text-muted-foreground">{card.cardNumber}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell font-mono text-sm">{card.student.rollNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {card.student.initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm truncate">{card.student.name}</span>
                        <div className="flex items-center gap-2 sm:hidden mt-0.5">
                          <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded font-mono">#{card.student.rollNumber}</span>
                          <span className="text-[10px] text-muted-foreground bg-amber-50 dark:bg-amber-900/20 px-1 rounded font-mono">{card.cardNumber}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {card.class.grade}, {card.class.name} ({card.class.section})
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {card.exams.slice(0, 2).map((exam: any) => (
                        <Badge key={exam.id} variant="outline" className={`text-[10px] gap-0.5 ${getExamTypeColor(exam.examType)}`}>
                          {exam.subjectName}
                        </Badge>
                      ))}
                      {card.exams.length > 2 && (
                        <Badge variant="secondary" className="text-[10px]">+{card.exams.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(card)}
                      className="gap-1.5 text-amber-600 hover:text-amber-700"
                    >
                      <Eye className="size-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
