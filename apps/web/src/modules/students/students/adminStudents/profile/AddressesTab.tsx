import { MapPin } from "lucide-react";
import { SectionCard } from "./parts";
import type { AddressesPayload } from "./use-student-profile";

export function AddressesTab({ data }: { data: AddressesPayload }) {
  return (
    <SectionCard
      title="Address book"
      icon={MapPin}
      description="The schema stores one address per student, so this is that one. There is no separate permanent/current pair yet."
    >
      {data.entries.length ? (
        <ul className="space-y-3">
          {data.entries.map((e) => (
            <li key={e.label} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-500">
                {e.label}
              </p>
              {/* An address wraps; truncating it would hide the line a courier needs. */}
              <p className="mt-1.5 whitespace-pre-line text-[13px] font-medium leading-relaxed text-slate-800 dark:text-zinc-100">
                {e.value}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12.5px] text-slate-400 dark:text-zinc-500">
          No address has been recorded for this student.
        </p>
      )}
    </SectionCard>
  );
}
