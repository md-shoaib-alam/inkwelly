export type RosterGroup = "BASIC" | "PARENTS" | "ADDRESS";

export interface RosterColumn {
  key: string;
  label: string;
  group: RosterGroup;
  /** Photo and Name are pinned on, greyed in the popover, like the reference. */
  alwaysOn?: boolean;
  defaultOn?: boolean;
}

export const COLUMN_GROUPS: RosterGroup[] = ["BASIC", "PARENTS", "ADDRESS"];

export const ROSTER_COLUMNS: RosterColumn[] = [
  // ── BASIC ─
  { key: "photo", label: "Photo", group: "BASIC", alwaysOn: true, defaultOn: true },
  { key: "name", label: "Name", group: "BASIC", alwaysOn: true, defaultOn: true },
  { key: "profile", label: "Profile", group: "BASIC", defaultOn: true },
  { key: "studentId", label: "Student ID", group: "BASIC", defaultOn: true },
  { key: "admissionNo", label: "Admission no.", group: "BASIC" },
  { key: "admissionDate", label: "Admission date", group: "BASIC" },
  { key: "class", label: "Class", group: "BASIC", defaultOn: true },
  { key: "rollNumber", label: "Roll no.", group: "BASIC", defaultOn: true },
  { key: "dob", label: "DOB", group: "BASIC", defaultOn: true },
  { key: "gender", label: "Gender", group: "BASIC", defaultOn: true },
  { key: "email", label: "Email", group: "BASIC" },
  { key: "mobile", label: "Mobile", group: "BASIC", defaultOn: true },
  { key: "category", label: "Category", group: "BASIC", defaultOn: true },
  { key: "status", label: "Status", group: "BASIC" },
  { key: "bloodGroup", label: "Blood group", group: "BASIC" },
  { key: "religion", label: "Religion", group: "BASIC" },
  { key: "nationality", label: "Nationality", group: "BASIC" },
  { key: "motherTongue", label: "Mother tongue", group: "BASIC" },
  { key: "rte", label: "RTE", group: "BASIC" },
  { key: "aadhaarNo", label: "Aadhaar no.", group: "BASIC" },
  { key: "peNumber", label: "PE number", group: "BASIC" },
  { key: "abcId", label: "ABC ID", group: "BASIC" },
  { key: "apaarId", label: "APAAR ID", group: "BASIC" },
  // ── PARENTS ──
  { key: "fatherName", label: "Father name", group: "PARENTS", defaultOn: true },
  { key: "fatherMobile", label: "Father mobile", group: "PARENTS" },
  { key: "motherName", label: "Mother name", group: "PARENTS", defaultOn: true },
  { key: "motherMobile", label: "Mother mobile", group: "PARENTS" },
  { key: "fatherOccupation", label: "Father occupation", group: "PARENTS" },
  { key: "motherOccupation", label: "Mother occupation", group: "PARENTS" },
  // ── ADDRESS ──
  { key: "address", label: "Address", group: "ADDRESS" },
];

export const DEFAULT_VISIBLE: Set<string> = new Set(
  ROSTER_COLUMNS.filter((c) => c.alwaysOn || c.defaultOn).map((c) => c.key),
);

export interface RosterRow {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  address: string | null;
  classId: string;
  className: string | null;
  rollNumber: string;
  admissionNo: string | null;
  admissionDate: string | null;
  title: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string;
  bloodGroup: string | null;
  religion: string | null;
  nationality: string | null;
  motherTongue: string | null;
  casteCategory: string | null;
  peNumber: string | null;
  abcId: string | null;
  apaarId: string | null;
  aadhaarNo: string | null;
  isRte: boolean;
  status: string;
  createdAt: string | null;
  fatherName: string | null;
  fatherMobile: string | null;
  fatherOccupation: string | null;
  motherName: string | null;
  motherMobile: string | null;
  motherOccupation: string | null;
  profileScore: number;
  transport: {
    id: string;
    routeId: string;
    pickupPoint: string | null;
    status: string;
    startDate: string;
  } | null;
}
