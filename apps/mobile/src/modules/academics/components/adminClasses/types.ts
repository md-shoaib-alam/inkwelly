export interface Class {
  id: string;
  /** Read-only: the server derives the name from `classLevel`. Never send it back. */
  name: string;
  section: string;
  classLevel: string;
  capacity: number;
  studentCount: number;
  classTeacher: string;
  classTeacherId: string | null;
}

export interface TeacherInfo {
  id: string;
  name: string;
}
