import { CheckCircle2, Clock, XCircle, GraduationCap } from "lucide-react";
import { ClassOption } from "./types";

export const statusConfig: Record<
  string,
  { bg: string; icon: React.ReactNode; label: string }
> = {
  approved: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircle2 className="size-3.5" />,
    label: "Approved",
  },
  pending: {
    bg: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: <Clock className="size-3.5" />,
    label: "Pending",
  },
  rejected: {
    bg: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    icon: <XCircle className="size-3.5" />,
    label: "Rejected",
  },
  graduated: {
    bg: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
    icon: <GraduationCap className="size-3.5" />,
    label: "Graduated",
  },
};

export function getCurrentAcademicYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based
  // Academic year runs Apr–Mar; if before Apr, use prev year
  return m >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export function getNumericGrade(gradeStr: string): number {
  if (!gradeStr) return 0;
  const normalized = gradeStr.trim().toLowerCase();
  if (normalized === "nursery") return -2;
  if (normalized === "lkg") return -1;
  if (normalized === "ukg") return 0;
  const parsed = parseInt(gradeStr);
  return isNaN(parsed) ? 0 : parsed;
}

export const getNextClass = (
  fromClassId: string,
  allClasses: ClassOption[],
): ClassOption | null => {
  const fromClass = allClasses.find((c) => c.id === fromClassId);
  if (!fromClass) return null;

  const fromGrade = getNumericGrade(fromClass.grade);
  const candidates = allClasses.filter((c) => getNumericGrade(c.grade) === fromGrade + 1);
  const nextClass = candidates.length > 0
    ? candidates.reduce((best, current) =>
        current.section.localeCompare(best.section) < 0 ? current : best
      )
    : null;

  return nextClass;
};

export const isLastClass = (
  classId: string,
  classes: ClassOption[],
): boolean => {
  const cls = classes.find((c) => c.id === classId);
  if (!cls) return false;
  const grade = getNumericGrade(cls.grade);
  const maxGrade = Math.max(...classes.map((c) => getNumericGrade(c.grade)));
  return grade >= maxGrade;
};

