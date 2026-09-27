import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { StudentResultRow } from "./types";

interface ResultsTableProps {
  loadingStudents: boolean;
  resultRows: StudentResultRow[];
  onUpdateMark: (studentId: string, val: string) => void;
  selectedExamStatus: string;
  savingResults: boolean;
  isPublishing: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export function ResultsTable({
  loadingStudents,
  resultRows,
  onUpdateMark,
  selectedExamStatus,
  savingResults,
  isPublishing,
  onSaveDraft,
  onPublish,
}: ResultsTableProps) {
  const hasPending =
    resultRows.length === 0 ||
    resultRows.some((r) => r.marksObtained == null || String(r.marksObtained).trim() === "");

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base">Enter Results</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter marks for each student. Save as draft anytime, or mark as complete when all marks are entered.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={onSaveDraft}
            disabled={savingResults || isPublishing || resultRows.length === 0}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            {savingResults ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button
            onClick={onPublish}
            disabled={
              savingResults ||
              isPublishing ||
              hasPending ||
              selectedExamStatus === "completed"
            }
            title={
              hasPending
                ? "All students must have marks entered before marking as complete"
                : "Mark exam as complete"
            }
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {selectedExamStatus === "completed" ? "Completed" : "Mark as Complete"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loadingStudents ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : resultRows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="size-10 mx-auto mb-2 opacity-30" />
            <p>No students found for this class</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="hidden sm:table-cell w-20">Roll No</TableHead>
                  <TableHead className="w-28">Marks</TableHead>
                  <TableHead className="w-20 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultRows.map((row, idx) => (
                  <TableRow key={row.studentId}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-sm">{row.studentName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">
                      {row.rollNumber}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.marksObtained}
                        onChange={(e) => onUpdateMark(row.studentId, e.target.value)}
                        placeholder="-"
                        disabled={selectedExamStatus === "completed"}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {row.marksObtained.trim() === "" ? (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2 py-0 h-5">
                          <AlertCircle className="size-3 mr-1" /> Pending
                        </Badge>
                      ) : row.status === "pass" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2 py-0 h-5">
                          <CheckCircle2 className="size-3 mr-1" /> Pass
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-2 py-0 h-5">
                          <XCircle className="size-3 mr-1" /> Fail
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
