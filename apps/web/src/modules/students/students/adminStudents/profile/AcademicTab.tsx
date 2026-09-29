import { CalendarDays, GraduationCap } from "lucide-react";
import { Field, FieldGrid, SectionCard, display, formatDate } from "./parts";
import type { AcademicPayload } from "./use-student-profile";

export function AcademicTab({ data }: { data: AcademicPayload }) {
  const { enrolment } = data;

  return (
    <div className="space-y-4">
      <SectionCard
        title="Current enrolment"
        icon={GraduationCap}
        description="Where this student sits today. There is no promotion history table yet, so a year they have left is not listed here."
      >
        <FieldGrid>
          <Field label="Class" value={display(enrolment.className)} />
          <Field label="Grade" value={display(enrolment.grade)} />
          <Field label="Roll number" value={display(enrolment.rollNumber)} mono />
          <Field label="Academic year" value={display(enrolment.academicYear)} />
          <Field label="Status" value={display(enrolment.status)} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Record dates" icon={CalendarDays}>
        <FieldGrid>
          <Field label="Admission no." value={display(enrolment.admissionNo)} mono />
          <Field label="Admission date" value={formatDate(enrolment.admissionDate)} />
          <Field label="Joining date" value={formatDate(enrolment.joiningDate)} />
        </FieldGrid>
      </SectionCard>
    </div>
  );
}
