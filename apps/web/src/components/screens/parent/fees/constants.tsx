import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  paid: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    text: "Paid",
    icon: <CheckCircle2 className="size-3.5" />,
  },
  pending: {
    bg: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    text: "Pending",
    icon: <Clock className="size-3.5" />,
  },
  overdue: {
    bg: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    text: "Overdue",
    icon: <AlertTriangle className="size-3.5" />,
  },
};

export const TYPE_ICONS: Record<string, string> = {
  tuition: "📚",
  exam: "📝",
  library: "📖",
  transport: "🚌",
};
