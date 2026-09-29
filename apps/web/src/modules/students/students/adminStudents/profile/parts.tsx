import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * The pieces every profile tab is made of. Kept here rather than in each tab because the
 * reference draws all eight with the same card, the same label size and the same em dash
 * for a value the school never recorded.
 */

export const DASH = "—";

export const hasValue = (v: unknown) =>
  typeof v === "string" ? v.trim().length > 0 : v !== null && v !== undefined;

export const display = (v: unknown): string => {
  if (v === null || v === undefined) return DASH;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  const asText = String(v).trim();
  return asText || DASH;
};

export function formatDate(value: string | null | undefined): string {
  if (!value) return DASH;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function ageFrom(dob: string | null | undefined): string | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) years -= 1;
  return years > 0 && years < 120 ? `${years} yrs` : null;
}

export function SectionCard({
  title,
  icon: Icon,
  description,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-slate-200/80 dark:border-zinc-800 shadow-xs", className)}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-start gap-2.5">
          {Icon && (
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
              <Icon className="size-4" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-[13.5px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-[12px] text-slate-500 dark:text-zinc-400">{description}</p>
            )}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-3">{children}</dl>;
}

export function Field({
  label,
  value,
  mono,
  wide,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={cn("min-w-0", wide && "col-span-full")}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-500">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 truncate text-[13px] font-medium text-slate-800 dark:text-zinc-100",
          mono && "font-mono text-[12.5px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Used when the school has the tab but not the column: the reference shows a value, and
 * inventing one would put words in a school's mouth that a parent may later read.
 */
export function NotRecorded({ what }: { what: string }) {
  return (
    <p className="text-[12.5px] text-slate-400 dark:text-zinc-500">
      {what} isn&apos;t recorded for this student.
    </p>
  );
}
