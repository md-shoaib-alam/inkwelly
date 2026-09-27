import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface SubjectLegendProps {
  subjectColorMap: Record<string, string>;
}

export function SubjectLegend({ subjectColorMap }: SubjectLegendProps) {
  if (Object.keys(subjectColorMap).length === 0) return null;

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="size-4 text-violet-500" />
          Subjects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {Object.entries(subjectColorMap).map(([subject, colorClass]) => (
            <div
              key={subject}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${colorClass}`}
            >
              <div className="size-2 rounded-full bg-current opacity-60" />
              {subject}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
