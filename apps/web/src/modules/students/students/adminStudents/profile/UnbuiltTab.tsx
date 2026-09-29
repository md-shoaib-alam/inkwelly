import { CircleDashed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ProfileTabDef } from "./tabs";

/**
 * The reference profile has eight tabs and the schema backs four. Rather than render
 * plausible-looking empty tables — which a school reads as "we have none of this" when
 * the truth is "we never asked" — these say what is missing and what would fill it.
 */
const NOT_COLLECTED: Partial<Record<ProfileTabDef["id"], { fields: string[]; needs: string }>> = {
  bank: {
    fields: ["Account number", "IFSC", "Bank name", "Branch", "UPI ID"],
    needs: "a student_bank_details table, plus a section on the admissions form",
  },
  documents: {
    fields: ["Birth certificate", "Transfer certificate", "Previous school report", "Caste certificate"],
    needs: "an uploaded-file record per student and a storage path to put them in",
  },
  requests: {
    fields: ["Leave requests", "Document requests", "Detail corrections"],
    needs: "a request queue a parent can raise and a staff member can close",
  },
  udise: {
    fields: ["UDISE+ code", "Category mapping", "Year-wise enrolment rows"],
    needs: "the UDISE+ identifiers the district office issues, stored per student",
  },
};

export function UnbuiltTab({ tab }: { tab: ProfileTabDef }) {
  const detail = NOT_COLLECTED[tab.id];

  return (
    <Card className="border-dashed border-slate-200 dark:border-zinc-800">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
            <CircleDashed className="size-5" />
          </span>
          <div className="min-w-0 space-y-3">
            <div>
              <h3 className="text-[14px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
                {tab.label} isn&apos;t collected yet
              </h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500 dark:text-zinc-400">
                This school has no {tab.label.toLowerCase()} on file for anyone, because the
                product never asked for it. Nothing here is hidden or lost.
              </p>
            </div>

            {detail && (
              <>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-500">
                    What this tab would hold
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {detail.fields.map((f) => (
                      <li
                        key={f}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11.5px] font-medium text-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-[12px] text-slate-400 dark:text-zinc-500">
                  It needs {detail.needs}.
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
