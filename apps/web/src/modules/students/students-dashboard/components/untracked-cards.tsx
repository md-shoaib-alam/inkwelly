"use client";

import { CheckSquare, Languages, Layers, ShieldCheck, Users } from "lucide-react";
import { Card, SoonNote } from "./card";

/**
 * The cards the shipped design shows that this build has no table behind. Each keeps its
 * real frame, its place in the grid and the reason the server gives for the gap, and
 * renders no numbers — an empty bar or a zero would read as a measurement.
 *
 * The field names in `ComplianceCard` are the four the server's own reason names, so
 * they are a promise about what a column would hold, not a claim about this school.
 */

function reasonFor(reasons: Record<string, string>, key: string): string {
  return reasons[key] ?? "This build has no table that records it yet.";
}

export function CategoryCard({ reasons }: { reasons: Record<string, string> }) {
  return (
    <Card
      title="Category"
      subtitle="Reservation mix"
      icon={Layers}
      tint="bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
      bodyClassName="px-5 pb-5 flex-1 flex flex-col justify-center items-center py-6"
    >
      <div className="flex flex-col items-center justify-center text-center">
        <span className="size-10 rounded-full grid place-items-center bg-slate-100 dark:bg-zinc-800 text-slate-400 mb-2">
          <Layers className="size-4" />
        </span>
        <p className="text-[13px] font-semibold text-slate-800 dark:text-zinc-200">
          No category data yet.
        </p>
      </div>
    </Card>
  );
}

export function DocumentsCard({ reasons }: { reasons: Record<string, string> }) {
  return (
    <Card
      title="Document completeness"
      subtitle="Uploads tracked per student"
      icon={CheckSquare}
      tint="bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300"
    >
      <SoonNote reason={reasonFor(reasons, "documents")} />
    </Card>
  );
}

const COMPLIANCE_FIELDS = ["Aadhaar linked", "APAAR ID", "RTE students", "CWSN"];

export function ComplianceCard({ reasons }: { reasons: Record<string, string> }) {
  return (
    <Card
      title="Compliance"
      icon={ShieldCheck}
      tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
      bodyClassName="px-5 pb-5 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        {COMPLIANCE_FIELDS.map((f) => (
          <div
            key={f}
            className="rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 px-4 py-3"
          >
            <p className="text-[15px] font-semibold leading-6 text-slate-400 dark:text-zinc-500">
              Soon
            </p>
            <p className="text-[12px] text-slate-500 dark:text-zinc-400">{f}</p>
          </div>
        ))}
      </div>
      <SoonNote reason={reasonFor(reasons, "compliance")} />
    </Card>
  );
}

export function ReligionCard({ reasons }: { reasons: Record<string, string> }) {
  return (
    <Card
      title="Religion"
      subtitle="Recorded per student"
      icon={Users}
      tint="bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
    >
      <SoonNote reason={reasonFor(reasons, "religion")} />
    </Card>
  );
}

export function MotherTongueCard({ reasons }: { reasons: Record<string, string> }) {
  return (
    <Card
      title="Mother tongue"
      subtitle="Languages spoken at home"
      icon={Languages}
      tint="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
    >
      <SoonNote reason={reasonFor(reasons, "motherTongue")} />
    </Card>
  );
}
