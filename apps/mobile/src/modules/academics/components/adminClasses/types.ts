export interface Class {
  id: string;
  name: string;
  section: string;
  grade: string;
  capacity: number;
  studentCount: number;
  classTeacher: string;
  classTeacherId: string | null;
}

export interface TeacherInfo {
  id: string;
  name: string;
}

export const getMappedGradeFromName = (val: string): string => {
  if (!val) return "";
  const normalized = val.trim().toLowerCase();
  if (normalized === "pre-nursery" || normalized === "prenursery" || normalized === "pre nursery") return "Pre-Nursery";
  if (normalized === "nursery") return "Nursery";
  if (normalized === "lkg") return "LKG";
  if (normalized === "ukg") return "UKG";
  const numMatch = val.match(/\d+/);
  return numMatch ? numMatch[0] : "";
};
