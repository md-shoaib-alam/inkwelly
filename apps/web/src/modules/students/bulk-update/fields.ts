export type FieldGroup = "PROFILE" | "ACADEMIC" | "PARENT INFORMATION";

export type FieldKind = "text" | "tel" | "email" | "date" | "select" | "boolean";

export interface BulkField {
  /** Server whitelist key sent in the POST body. */
  key: string;
  label: string;
  group: FieldGroup;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  /** Shown greyed-out like the reference, but never editable. */
  disabled?: boolean;
}

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((v) => ({
  value: v,
  label: v,
}));

const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain"].map((v) => ({
  value: v,
  label: v,
}));

const CASTES = [
  { value: "general", label: "General" },
  { value: "obc", label: "OBC" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
];

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const BULK_FIELDS: BulkField[] = [
  // ── PROFILE ─
  { key: "firstName", label: "First Name", group: "PROFILE", kind: "text" },
  { key: "middleName", label: "Middle Name", group: "PROFILE", kind: "text" },
  { key: "lastName", label: "Last Name", group: "PROFILE", kind: "text" },
  { key: "admissionNo", label: "Admission No.", group: "PROFILE", kind: "text", disabled: true },
  { key: "admissionDate", label: "Admission Date", group: "PROFILE", kind: "date" },
  { key: "dateOfBirth", label: "Date of Birth", group: "PROFILE", kind: "date" },
  { key: "gender", label: "Gender", group: "PROFILE", kind: "select", options: GENDERS },
  { key: "phone", label: "Mobile", group: "PROFILE", kind: "tel" },
  { key: "email", label: "Email", group: "PROFILE", kind: "email" },
  { key: "bloodGroup", label: "Blood Group", group: "PROFILE", kind: "select", options: BLOOD_GROUPS },
  { key: "religion", label: "Religion", group: "PROFILE", kind: "select", options: RELIGIONS },
  { key: "motherTongue", label: "Mother Tongue", group: "PROFILE", kind: "text" },
  { key: "aadhaarNo", label: "Aadhaar Number", group: "PROFILE", kind: "text" },
  { key: "casteCategory", label: "Caste Category", group: "PROFILE", kind: "select", options: CASTES },
  { key: "peNumber", label: "PE Number", group: "PROFILE", kind: "text" },
  { key: "abcId", label: "ABC ID", group: "PROFILE", kind: "text" },
  { key: "apaarId", label: "APAAR ID", group: "PROFILE", kind: "text" },
  { key: "title", label: "Title", group: "PROFILE", kind: "select", disabled: true },
  { key: "photo", label: "Photo", group: "PROFILE", kind: "text", disabled: true },
  { key: "status", label: "Active Status", group: "PROFILE", kind: "select", options: STATUSES },
  { key: "isRte", label: "RTE Student", group: "PROFILE", kind: "boolean" },

  // ── ACADEMIC ──
  { key: "rollNumber", label: "Roll Number", group: "ACADEMIC", kind: "text" },
  { key: "classId", label: "Class", group: "ACADEMIC", kind: "select" },
  { key: "registrationNo", label: "Registration No.", group: "ACADEMIC", kind: "text" },

  // ── PARENT INFORMATION ──
  { key: "fatherTitle", label: "Father Title", group: "PARENT INFORMATION", kind: "text" },
  { key: "fatherFirstName", label: "Father First Name", group: "PARENT INFORMATION", kind: "text" },
  { key: "fatherMiddleName", label: "Father Middle Name", group: "PARENT INFORMATION", kind: "text" },
  { key: "fatherLastName", label: "Father Last Name", group: "PARENT INFORMATION", kind: "text" },
  { key: "fatherMobile", label: "Father Mobile", group: "PARENT INFORMATION", kind: "tel" },
  { key: "fatherOccupation", label: "Father Occupation", group: "PARENT INFORMATION", kind: "text" },
  { key: "fatherEducation", label: "Father Education", group: "PARENT INFORMATION", kind: "text" },
  { key: "fatherWorkAddress", label: "Father Work Address", group: "PARENT INFORMATION", kind: "text" },
  { key: "motherTitle", label: "Mother Title", group: "PARENT INFORMATION", kind: "text" },
  { key: "motherFirstName", label: "Mother First Name", group: "PARENT INFORMATION", kind: "text" },
  { key: "motherMiddleName", label: "Mother Middle Name", group: "PARENT INFORMATION", kind: "text" },
  { key: "motherLastName", label: "Mother Last Name", group: "PARENT INFORMATION", kind: "text" },
  { key: "motherMobile", label: "Mother Mobile", group: "PARENT INFORMATION", kind: "tel" },
  { key: "motherOccupation", label: "Mother Occupation", group: "PARENT INFORMATION", kind: "text" },
  { key: "motherEducation", label: "Mother Education", group: "PARENT INFORMATION", kind: "text" },
  { key: "motherWorkAddress", label: "Mother Work Address", group: "PARENT INFORMATION", kind: "text" },
];

export const FIELD_GROUPS: FieldGroup[] = ["PROFILE", "ACADEMIC", "PARENT INFORMATION"];

export const editableFields = BULK_FIELDS.filter((f) => !f.disabled);
