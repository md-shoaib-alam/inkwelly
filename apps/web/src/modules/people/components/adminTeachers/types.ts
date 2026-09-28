export interface TeacherInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  qualification?: string;
  experience?: string;
  status?: string;
  subjects?: string[];
  classes?: string[];
  joiningDate?: string;
  teacherId?: string;
  address?: string;
  role?: string;
}

export const avatarColors = [
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-orange-500",
  "bg-lime-500",
];
