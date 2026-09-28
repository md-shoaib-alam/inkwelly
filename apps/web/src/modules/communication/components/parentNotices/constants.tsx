import { Info, AlertTriangle } from "lucide-react";

export const PRIORITY_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  normal: {
    bg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
    text: "Normal",
    border: "border-l-zinc-400 dark:border-l-zinc-600",
    icon: <Info className="size-3.5 text-zinc-500 dark:text-zinc-400" />,
  },
  important: {
    bg: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    text: "Important",
    border: "border-l-orange-500",
    icon: (
      <AlertTriangle className="size-3.5 text-orange-500 dark:text-orange-400" />
    ),
  },
  urgent: {
    bg: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    text: "Urgent",
    border: "border-l-red-500",
    icon: (
      <AlertTriangle className="size-3.5 text-red-500 dark:text-red-400" />
    ),
  },
};

export const ROLE_CONFIG: Record<string, string> = {
  admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  teacher: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  student: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  parent: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  all: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admins",
  teacher: "Teachers",
  student: "Students",
  parent: "Parents",
  all: "Everyone",
};
