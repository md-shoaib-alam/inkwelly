import { Bus, Fingerprint, IdCard, ShieldCheck, User } from "lucide-react";
import { DASH, Field, FieldGrid, SectionCard, display, formatDate, ageFrom, hasValue } from "./parts";
import type { SummaryPayload } from "./use-student-profile";

export function SummaryTab({ data }: { data: SummaryPayload }) {
  const { personal, contact, identifiers, compliance, transport } = data;
  const age = ageFrom(personal.dateOfBirth);

  return (
    <div className="space-y-4">
      <SectionCard title="Personal details" icon={User}>
        <FieldGrid>
          <Field label="Date of birth" value={formatDate(personal.dateOfBirth)} />
          <Field label="Age" value={age ?? DASH} />
          <Field label="Gender" value={display(personal.gender)} />
          <Field label="Blood group" value={display(personal.bloodGroup)} />
          <Field label="Religion" value={display(personal.religion)} />
          <Field label="Nationality" value={display(personal.nationality)} />
          <Field label="Mother tongue" value={display(personal.motherTongue)} />
          <Field label="Category" value={display(personal.category)} />
          <Field label="Admission date" value={formatDate(personal.admissionDate)} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Contact" icon={IdCard}>
        <FieldGrid>
          <Field label="Mobile" value={display(contact.mobile)} mono />
          <Field label="Email" value={display(contact.email)} />
          <Field label="Address" value={display(contact.address)} wide />
        </FieldGrid>
      </SectionCard>

      <SectionCard
        title="Identifiers"
        icon={Fingerprint}
        description="The numbers a school is audited against. A blank here means the department never issued one, not that it was missed."
      >
        <FieldGrid>
          <Field label="Student ID" value={display(identifiers.studentId)} mono />
          <Field label="Admission no." value={display(identifiers.admissionNo)} mono />
          <Field label="Registration no." value={display(identifiers.registrationNo)} mono />
          <Field label="Aadhaar no." value={display(identifiers.aadhaarNo)} mono />
          <Field label="PE number" value={display(identifiers.peNumber)} mono />
          <Field label="APAAR ID" value={display(identifiers.apaarId)} mono />
          <Field label="ABC ID" value={display(identifiers.abcId)} mono />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Compliance" icon={ShieldCheck}>
        <FieldGrid>
          <Field label="RTE seat" value={hasValue(compliance.isRte) ? display(compliance.isRte) : "Not recorded"} />
          <Field label="Status" value={display(compliance.status)} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Transport" icon={Bus}>
        {transport ? (
          <FieldGrid>
            <Field label="Route" value={display(transport.routeName)} />
            <Field label="Pickup point" value={display(transport.pickupPoint)} />
            <Field label="Status" value={display(transport.status)} />
            <Field label="From" value={formatDate(transport.startDate)} />
          </FieldGrid>
        ) : (
          <NotCollectedLine what="This student doesn't travel by school bus." />
        )}
      </SectionCard>
    </div>
  );
}

function NotCollectedLine({ what }: { what: string }) {
  return <p className="text-[12.5px] text-slate-400 dark:text-zinc-500">{what}</p>;
}
