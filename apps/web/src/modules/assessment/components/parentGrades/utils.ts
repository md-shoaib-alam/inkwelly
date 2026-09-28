import { GradeRecord } from "@/lib/types";

export function getGradesForStudent(studentId: string, grades: GradeRecord[]) {
  return grades.filter((g) => g.studentId === studentId);
}

export function getSubjectChartData(studentId: string, grades: GradeRecord[]) {
  const studentGrades = getGradesForStudent(studentId, grades);
  const subjectMap = new Map<string, { totalPct: number; count: number }>();

  studentGrades.forEach((g) => {
    const pct = (g.marks / g.maxMarks) * 100;
    if (!subjectMap.has(g.subjectName)) {
      subjectMap.set(g.subjectName, { totalPct: 0, count: 0 });
    }
    const entry = subjectMap.get(g.subjectName)!;
    entry.totalPct += pct;
    entry.count++;
  });

  return Array.from(subjectMap.entries()).map(([subject, data]) => ({
    subject,
    percentage: Math.round(data.totalPct / data.count),
  }));
}

export function getOverallStats(studentId: string, grades: GradeRecord[]) {
  const studentGrades = getGradesForStudent(studentId, grades);
  if (studentGrades.length === 0)
    return {
      avg: 0,
      grade: "N/A",
      highest: { subject: "N/A", pct: 0 },
      lowest: { subject: "N/A", pct: 0 },
      totalExams: 0,
    };

  const avg =
    studentGrades.reduce((sum, g) => sum + (g.marks / g.maxMarks) * 100, 0) /
    studentGrades.length;
  const grade =
    avg >= 90
      ? "A+"
      : avg >= 80
        ? "A"
        : avg >= 70
          ? "B+"
          : avg >= 60
            ? "B"
            : avg >= 50
              ? "C"
              : "D";

  let highest = { subject: "", pct: 0 };
  let lowest = { subject: "", pct: 100 };
  studentGrades.forEach((g) => {
    const pct = (g.marks / g.maxMarks) * 100;
    if (pct > highest.pct) highest = { subject: g.subjectName, pct };
    if (pct < lowest.pct) lowest = { subject: g.subjectName, pct };
  });

  return {
    avg: Math.round(avg),
    grade,
    highest,
    lowest,
    totalExams: studentGrades.length,
  };
}

export const gradeBadgeClasses = (grade?: string) =>
  grade?.startsWith("A")
    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
    : grade?.startsWith("B")
      ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
      : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
