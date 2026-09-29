import { Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DASH, Field, SectionCard, display } from "./parts";
import type { FamilyPayload, GuardianCard, SiblingRow } from "./use-student-profile";

export function FamilyTab({
  data,
  onOpenSibling,
}: {
  data: FamilyPayload;
  /** Absent when the host screen cannot resolve an arbitrary student ref; the row still shows. */
  onOpenSibling?: (ref: string) => void;
}) {
  const { guardians, siblings } = data;

  return (
    <div className="space-y-4">
      {guardians.length ? (
        guardians.map((g) => <GuardianCardView key={g.relation} guardian={g} />)
      ) : (
        <SectionCard title="Guardians" icon={Users}>
          <p className="text-[12.5px] text-slate-400 dark:text-zinc-500">
            No guardian is recorded for this student, so the school has nothing on file to
            call. Add it under Family on the edit form.
          </p>
        </SectionCard>
      )}

      <SectionCard
        title="Siblings in this school"
        icon={Users}
        description="Other students under the same family record, in this school only."
      >
        {siblings.length ? (
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {siblings.map((s) => (
              <li key={s.id}>
                <SiblingRowView sibling={s} onOpen={onOpenSibling} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] text-slate-400 dark:text-zinc-500">
            No other student shares this family record.
          </p>
        )}
      </SectionCard>
    </div>
  );
}

function SiblingRowView({ sibling, onOpen }: { sibling: SiblingRow; onOpen?: (ref: string) => void }) {
  const body = (
    <>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-slate-800 dark:text-zinc-100">
          {sibling.name}
        </span>
        <span className="block truncate text-[11.5px] text-slate-400 dark:text-zinc-500">
          {sibling.ref}
        </span>
      </span>
      <span className="shrink-0 text-[12px] font-medium text-slate-500 dark:text-zinc-400">
        {sibling.className ?? DASH}
      </span>
    </>
  );

  const shared = "flex w-full items-center justify-between gap-3 px-2 py-2.5 text-left -mx-2 rounded-lg";

  if (!onOpen) return <div className={shared}>{body}</div>;
  return (
    <button
      type="button"
      onClick={() => onOpen(sibling.ref)}
      className={`${shared} transition-colors hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 cursor-pointer`}
    >
      {body}
    </button>
  );
}

function GuardianCardView({ guardian }: { guardian: GuardianCard }) {
  const label = guardian.relation === "father" ? "Father" : "Mother";

  return (
    <SectionCard
      title={label}
      icon={Star}
      description={
        guardian.isPrimary
          ? "The account this school sends login notifications to."
          : undefined
      }
    >
      <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
        <Field label="Name" value={display(guardian.name)} />
        <Field label="Mobile" value={display(guardian.mobile)} mono />
        <Field label="Occupation" value={display(guardian.occupation)} />
        <Field label="Education" value={display(guardian.education)} />
        <Field label="Work address" value={display(guardian.workAddress)} wide />
      </div>
      {guardian.isPrimary && (
        <Badge variant="secondary" className="mt-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
          Primary contact
        </Badge>
      )}
    </SectionCard>
  );
}
