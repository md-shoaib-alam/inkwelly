import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

interface GradesHeaderProps {
  topLevelTab: "exams" | "assessments";
  academicYears: Array<{ id: string; name: string; isCurrent: boolean }>;
  selectedYear: string;
  onSelectedYearChange: (year: string) => void;
}

export function GradesHeader({
  topLevelTab,
  academicYears,
  selectedYear,
  onSelectedYearChange,
}: GradesHeaderProps) {
  const params = useParams();
  const { push } = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  return (
    <div className="flex flex-col gap-4 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-5">
      <div className="flex items-center justify-between w-full">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {topLevelTab === "exams" ? "School Exams" : "Class Assessments"}
          </h2>
        </div>

        {topLevelTab === "exams" && slug && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs font-semibold border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/30 shadow-sm"
            onClick={() => push(`/${slug}/view-marksheet`)}
          >
            <FileText className="size-3.5" />
            View Marksheet
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {topLevelTab === "exams"
            ? "Track your official term examinations and standardized scores"
            : "Monitor your periodic teacher assignments, classwork, and quizzes"}
        </p>

        {topLevelTab === "exams" && academicYears.length > 0 && (
          <Select value={selectedYear} onValueChange={onSelectedYearChange}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((y) => (
                <SelectItem key={y.id} value={y.name}>
                  {y.name}
                  {y.isCurrent ? " (Current)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
