import { GradeRecord, AttendanceRecord } from "@/lib/types";

export const getAttendanceForStudent = (studentId: string, attendance: AttendanceRecord[]) => {
  const records = attendance.filter((a) => a.studentId === studentId);
  if (records.length === 0)
    return { percentage: 0, present: 0, absent: 0, total: 0 };
  const present = records.filter((a) => a.status === "present").length;
  const absent = records.filter((a) => a.status === "absent").length;
  return {
    percentage: Math.round((present / records.length) * 100),
    present,
    absent,
    total: records.length,
  };
};

export const getGradesForStudent = (studentId: string, grades: GradeRecord[]) => {
  return grades.filter((g) => g.studentId === studentId);
};

export const getSubjectPerformance = (studentId: string, grades: GradeRecord[]) => {
  const studentGrades = getGradesForStudent(studentId, grades);
  const subjectMap = new Map<
    string,
    { marks: number[]; maxMarks: number[]; grades: string[] }
  >();

  studentGrades.forEach((g) => {
    if (!subjectMap.has(g.subjectName)) {
      subjectMap.set(g.subjectName, { marks: [], maxMarks: [], grades: [] });
    }
    const entry = subjectMap.get(g.subjectName)!;
    entry.marks.push(g.marks);
    entry.maxMarks.push(g.maxMarks);
    if (g.grade) entry.grades.push(g.grade);
  });

  return Array.from(subjectMap.entries()).map(([subject, data]) => {
    const avgPct =
      data.marks.reduce(
        (sum, m, i) => sum + (m / data.maxMarks[i]) * 100,
        0,
      ) / data.marks.length;
    const bestGrade = (() => {
      const order = ["A+", "A", "B+", "B", "C", "D"];
      return data.grades.length > 0
        ? data.grades.reduce((best, current) => {
            const currentIdx = order.indexOf(current);
            const bestIdx = order.indexOf(best);
            const validCurrent = currentIdx === -1 ? Infinity : currentIdx;
            const validBest = bestIdx === -1 ? Infinity : bestIdx;
            return validCurrent < validBest ? current : best;
          })
        : "N/A";
    })();
    return {
      subject,
      avgPct: Math.round(avgPct),
      bestGrade,
      exams: data.marks.length,
    };
  });
};

export const getOverallAvg = (studentId: string, grades: GradeRecord[]) => {
  const studentGrades = getGradesForStudent(studentId, grades);
  if (studentGrades.length === 0) return { avg: 0, grade: "N/A" };
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
  return { avg: Math.round(avg), grade };
};
