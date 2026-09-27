import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, School, Loader2, BookOpen } from "lucide-react";
import { ClassSelect } from "@/components/ui/class-select";
import { ClassInfo, ExamRecord } from "./types";

interface ExamsSelectorProps {
  classes: ClassInfo[];
  selectedClass: string;
  onClassChange: (val: string) => void;
  exams: ExamRecord[];
  selectedExamId: string;
  onExamChange: (val: string) => void;
  loadingExams: boolean;
  hasSelectedExam: boolean;
}

export function ExamsSelector({
  classes,
  selectedClass,
  onClassChange,
  exams,
  selectedExamId,
  onExamChange,
  loadingExams,
  hasSelectedExam,
}: ExamsSelectorProps) {
  return (
    <Card className="border-orange-500/20 dark:border-orange-500/10 shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base flex items-center gap-3">
          <div className="size-7 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 flex items-center justify-center text-sm font-bold">
            {hasSelectedExam ? <CheckCircle2 className="size-4" /> : "1"}
          </div>
          Select Class & Subject
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-72">
            <ClassSelect
              value={selectedClass}
              onValueChange={onClassChange}
              placeholder="Choose a class..."
              className="w-full h-10"
              classes={classes}
            />
          </div>

          <div className="w-full sm:w-80">
            <Select
              value={selectedExamId}
              onValueChange={onExamChange}
              disabled={!selectedClass || loadingExams}
            >
              <SelectTrigger
                className={`w-full h-10 ${
                  selectedClass
                    ? "border-orange-200 dark:border-orange-900/50"
                    : "opacity-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {loadingExams ? (
                    <Loader2 className="size-4 animate-spin text-blue-500" />
                  ) : (
                    <BookOpen className="size-4 text-emerald-500" />
                  )}
                  <SelectValue
                    placeholder={
                      loadingExams ? "Fetching exams..." : "Select Subject/Exam..."
                    }
                  />
                </div>
              </SelectTrigger>
              <SelectContent>
                {exams.length > 0 ? (
                  exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.subjectName})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No scheduled exams
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
