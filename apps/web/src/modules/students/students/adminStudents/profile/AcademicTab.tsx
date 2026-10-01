import type { ReactNode } from "react";
import {
  BookOpen,  Building2,
  CalendarDays,
  CalendarRange,
  Flag,
  GraduationCap,
  Hash,
  History,
  PenLine,
} from "lucide-react";
import { CardBody, Field, FieldGrid, TabSection, display, formatDate } from "./parts";
import type { AcademicPayload } from "./use-student-profile";

export function AcademicTab({ data }: { data: AcademicPayload }) {
  const { placement, sessions } = data;

  return (
    <div className="space-y-6">
      <TabSection
        title="Current Placement"
        description="Where the student stands in the active session"
        icon={BookOpen}
      >
        <CardBody>
          <FieldGrid>
            <Field icon={CalendarRange} label="Session" value={display(placement.academicYear)} />
            <Field icon={Building2} label="Class" value={display(placement.className)} />
            <Field icon={GraduationCap} label="Class level" value={display(placement.classLevel)} />
            <Field icon={Hash} label="Roll number" value={display(placement.rollNumber)} mono />
            <Field
              icon={PenLine}
              label="Registration"
              value={display(placement.registrationNo)}
              mono
            />
            <Field icon={Flag} label="Status" value={<StatusPill value={placement.status} />} />
            <Field icon={CalendarDays} label="Joining date" value={formatDate(placement.joiningDate)} />
          </FieldGrid>
        </CardBody>
      </TabSection>

      <TabSection
        title="Session History"
        description={`${sessions.length} session${sessions.length === 1 ? "" : "s"} on file`}
        icon={History}
      >
        {sessions.length ? (
          <div className="space-y-2">
            {sessions.map((s) => (
              <CardBody key={`${s.academicYear ?? ""}|${s.className ?? ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-semibold text-slate-900 dark:text-zinc-50">
                        {display(s.academicYear)}
                      </span>
                      {s.isCurrent && <Pill>Current</Pill>}
                      <StatusPill value={s.status} />
                    </div>
                    <p className="mt-1 text-[12.5px] text-slate-500 dark:text-zinc-400">
                      {display(s.className)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12.5px] text-slate-500 dark:text-zinc-400">
                    {formatDate(s.joinedOn)}
                  </span>
                </div>
              </CardBody>
            ))}
            <p className="pt-1 text-[12px] text-slate-400 dark:text-zinc-500">
              Only the session this student sits in is recorded — promotion history has no table
              of its own yet.
            </p>
          </div>
        ) : (
          <CardBody>
            <p className="text-[12.5px] text-slate-400 dark:text-zinc-500">
              This student is not assigned to a class, so no session is on file.
            </p>
          </CardBody>
        )}
      </TabSection>
    </div>
  );
}

const tone = {
  current:
    "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
  active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  neutral: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
};

function Pill({ children, tone: toneKey = "current" }: { children: ReactNode; tone?: keyof typeof tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${tone[toneKey]}`}
    >
      {children}
    </span>
  );
}

function StatusPill({ value }: { value: string | null }) {
  if (!value) return <span className="text-[13px] font-medium text-slate-800 dark:text-zinc-100">—</span>;
  return (
    <Pill tone={value === "active" ? "active" : "neutral"}>
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </Pill>
  );
}
