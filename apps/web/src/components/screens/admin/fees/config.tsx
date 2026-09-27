import { CheckCircle2, Clock, AlertTriangle, Banknote, FileText, Building2, Smartphone, CreditCard, Sparkles } from "lucide-react";
import { ReactNode } from "react";

export const feeStatusConfig: Record<string, { bg: string; icon: ReactNode }> = {
  paid: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle2 className="size-3.5" />,
  },
  pending: {
    bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: <Clock className="size-3.5" />,
  },
  overdue: {
    bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    icon: <AlertTriangle className="size-3.5" />,
  },
  partially_paid: {
    bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: <Clock className="size-3.5" />,
  },
  advance: {
    bg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    icon: <Sparkles className="size-3.5" />,
  },
};

export const frequencyConfig: Record<string, { bg: string; label: string }> = {
  monthly: { bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', label: 'Monthly' },
  quarterly: { bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', label: 'Quarterly' },
  yearly: { bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', label: 'Yearly' },
  one_time: { bg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400', label: 'One Time' },
};

export const receiptStatusConfig: Record<string, { bg: string }> = {
  completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  refunded: { bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
};

export const concessionStatusConfig: Record<string, { bg: string }> = {
  active: { bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  expired: { bg: 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-400' },
  revoked: { bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

export const paymentMethodIcons: Record<string, ReactNode> = {
  cash: <Banknote className="size-4" />,
  cheque: <FileText className="size-4" />,
  online: <Building2 className="size-4" />,
  upi: <Smartphone className="size-4" />,
  card: <CreditCard className="size-4" />,
};

export const paymentMethodConfig: Record<string, { icon: ReactNode; color: string }> = {
  cash: { icon: <Banknote className="size-4" />, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  cheque: { icon: <FileText className="size-4" />, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  online: { icon: <Building2 className="size-4" />, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' },
  upi: { icon: <Smartphone className="size-4" />, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  card: { icon: <CreditCard className="size-4" />, color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' },
};
