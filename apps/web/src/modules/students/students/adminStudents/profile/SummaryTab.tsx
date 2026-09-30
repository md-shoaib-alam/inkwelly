import {
  Activity,
  BadgeCheck,
  Bus,
  Calendar,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Droplet,
  FileText,
  Fingerprint,
  Globe,
  Hash,
  IdCard,
  Languages,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShieldCheck,
  Tag,
  User,
  Users,
} from "lucide-react";
import { DASH, Field, FieldGrid, SectionCard, ageFrom, display, formatDate, hasValue } from "./parts";
import type { SummaryPayload } from "./use-student-profile";

export function SummaryTab({ data }: { data: SummaryPayload }) {
  const { personal, contact, identifiers, compliance, transport } = data;
  const age = ageFrom(personal.dateOfBirth);
  const dateOfBirth = personal.dateOfBirth
    ? `${formatDate(personal.dateOfBirth)}${age ? ` (${age})` : ""}`
    : DASH;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Personal" icon={User} titleUppercase>
          <FieldGrid>
            <Field icon={CalendarDays} label="Date of birth" value={dateOfBirth} />
            <Field icon={Calendar} label="Admission date" value={formatDate(personal.admissionDate)} />
            <Field icon={User} label="Gender" value={display(personal.gender)} />
            <Field icon={Droplet} label="Blood group" value={display(personal.bloodGroup)} />
            <Field icon={FileText} label="Religion" value={display(personal.religion)} />
            <Field icon={Tag} label="Category" value={display(personal.category)} />
            <Field icon={Globe} label="Nationality" value={display(personal.nationality)} />
            <Field icon={Languages} label="Mother tongue" value={display(personal.motherTongue)} />
            {/* Nothing in this schema records a guardianship type; the reference shows a dash too. */}
            <Field icon={Shield} label="Guardianship" value={DASH} />
          </FieldGrid>
        </SectionCard>

        <SectionCard title="Contact" icon={Phone} titleUppercase>
          <FieldGrid>
            <Field icon={Phone} label="Mobile" value={display(contact.mobile)} mono />
            <Field icon={Mail} label="Email" value={display(contact.email)} />
            <Field
              icon={Users}
              label="Primary contact"
              wide
              value={
                contact.primaryContact ? (
                  <span className="block">
                    <span className="block">{display(contact.primaryContact.name)}</span>
                    <span className="block text-[11.5px] font-normal text-slate-400 dark:text-zinc-500">
                      {[contact.primaryContact.relation, contact.primaryContact.mobile]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                ) : (
                  DASH
                )
              }
            />
          </FieldGrid>
        </SectionCard>
      </div>

      <SectionCard
        title="Identifiers"
        icon={Fingerprint}
        titleUppercase
        description="The numbers a school is audited against. A blank here means the department never issued one, not that it was missed."
      >
        <FieldGrid>
          <Field icon={IdCard} label="Student ID" value={display(identifiers.studentId)} mono />
          <Field icon={FileText} label="Admission no." value={display(identifiers.admissionNo)} mono />
          <Field icon={ClipboardList} label="Registration no." value={display(identifiers.registrationNo)} mono />
          <Field icon={Fingerprint} label="Aadhaar no." value={display(identifiers.aadhaarNo)} mono />
          <Field icon={Hash} label="PE number" value={display(identifiers.peNumber)} mono />
          <Field icon={BadgeCheck} label="APAAR ID" value={display(identifiers.apaarId)} mono />
          <Field icon={CreditCard} label="ABC ID" value={display(identifiers.abcId)} mono />
        </FieldGrid>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Compliance" icon={ShieldCheck} titleUppercase>
          <FieldGrid>
            <Field
              icon={ShieldCheck}
              label="RTE seat"
              value={hasValue(compliance.isRte) ? display(compliance.isRte) : "Not recorded"}
            />
            <Field icon={Activity} label="Status" value={display(compliance.status)} />
          </FieldGrid>
        </SectionCard>

        <SectionCard title="Transport" icon={Bus} titleUppercase>
          {transport ? (
            <FieldGrid>
              <Field icon={Bus} label="Route" value={display(transport.routeName)} />
              <Field icon={MapPin} label="Pickup point" value={display(transport.pickupPoint)} />
              <Field icon={Activity} label="Status" value={display(transport.status)} />
              <Field icon={CalendarDays} label="From" value={formatDate(transport.startDate)} />
            </FieldGrid>
          ) : (
            <p className="text-[12.5px] text-slate-400 dark:text-zinc-500">
              This student doesn&apos;t travel by school bus.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
