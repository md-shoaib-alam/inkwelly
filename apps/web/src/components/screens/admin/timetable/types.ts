import type { ClassInfo, TimetableSlot as BaseTimetableSlot } from "@/lib/types";

export type ViewMode = "grid" | "list" | "day";

export interface FormSlot {
  id: string;
  day: string;
  subjectId?: string;
  teacherId?: string;
  startTime: string;
  endTime: string;
  label?: string; // e.g. "Lunch Break"
}

export interface TimetableSlot extends BaseTimetableSlot {
  label?: string;
}

export interface AvailableSubject {
  id: string;
  name: string;
  code: string;
  className: string;
  teacherName?: string;
  teacherId?: string;
}

export interface AvailableTeacher {
  id: string;
  name: string;
  email: string;
}
