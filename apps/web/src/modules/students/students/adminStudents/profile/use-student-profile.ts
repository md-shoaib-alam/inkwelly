import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";
import { PROFILE_QUERY_KEY, type ProfileTabId } from "./tabs";

/**
 * The profile is read one tab per request, so the header and the visible tab are two
 * separate queries. A tab the user never opens never reaches the network, which is the
 * whole reason the server answers `?tab=` instead of one fat object.
 */

export interface ProfileHeader {
  id: string;
  name: string;
  avatar: string | null;
  status: string | null;
  studentId: string | null;
  rollNumber: string | null;
  admissionNo: string | null;
  className: string | null;
  academicYear: string | null;
  admissionDate: string | null;
  joiningDate: string | null;
}

export interface ProfileCounts {
  family: number;
  academic: number;
  addresses: number;
}

export interface GuardianCard {
  relation: "father" | "mother" | "guardian" | string;
  name: string | null;
  mobile: string | null;
  occupation: string | null;
  education: string | null;
  workAddress: string | null;
  annualIncome?: string | null;
  isPrimary: boolean;
}

export interface SiblingRow {
  id: string;
  name: string;
  ref: string;
  className: string | null;
}

export interface SummaryPayload {
  personal: {
    dateOfBirth: string | null;
    gender: string | null;
    bloodGroup: string | null;
    religion: string | null;
    nationality: string | null;
    motherTongue: string | null;
    category: string | null;
    admissionDate: string | null;
  };
  contact: {
    mobile: string | null;
    email: string | null;
    address: string | null;
    primaryContact: { name: string | null; relation: string; mobile: string | null } | null;
  };
  identifiers: {
    studentId: string | null;
    admissionNo: string | null;
    registrationNo: string | null;
    aadhaarNo: string | null;
    peNumber: string | null;
    apaarId: string | null;
    abcId: string | null;
  };
  compliance: { isRte: boolean | null; status: string | null };
  transport: {
    routeName: string | null;
    pickupPoint: string | null;
    status: string | null;
    startDate: string | null;
  } | null;
}

export interface FamilyPayload {
  guardians: GuardianCard[];
  siblings: SiblingRow[];
}

export interface AcademicPlacement {
  academicYear: string | null;
  className: string | null;
  grade: string | null;
  rollNumber: string | null;
  registrationNo: string | null;
  status: string | null;
  joiningDate: string | null;
}

export interface SessionRow {
  academicYear: string | null;
  className: string | null;
  status: string | null;
  joinedOn: string | null;
  isCurrent: boolean;
}

export interface AcademicPayload {
  placement: AcademicPlacement;
  sessions: SessionRow[];
}

export interface AddressesPayload {
  entries: { label: string; value: string }[];
}

export type ProfilePayload = SummaryPayload | FamilyPayload | AcademicPayload | AddressesPayload;

// The route answers 404 for a ref that is not this school's student, and the shell has
// to say "no student here" rather than "something went wrong".
class ProfileRequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "ProfileRequestError";
  }
}

async function fetchProfile(ref: string, tab?: ProfileTabId): Promise<ProfilePayload | { header: ProfileHeader; counts: ProfileCounts }> {
  const url = tab
    ? `/api/student-profile/${encodeURIComponent(ref)}?tab=${tab}`
    : `/api/student-profile/${encodeURIComponent(ref)}`;
  const res = await apiFetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ProfileRequestError(res.status, body?.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function useProfileHeader(ref: string | null) {
  const { currentTenantId } = useAppStore();
  return useQuery({
    queryKey: [PROFILE_QUERY_KEY, currentTenantId, ref, "header"],
    enabled: Boolean(ref && currentTenantId),
    staleTime: 60_000,
    queryFn: () => fetchProfile(ref as string) as Promise<{ header: ProfileHeader; counts: ProfileCounts }>,
  });
}

export function useProfileTab(ref: string | null, tab: ProfileTabId, live: boolean) {
  const { currentTenantId } = useAppStore();
  return useQuery({
    queryKey: [PROFILE_QUERY_KEY, currentTenantId, ref, tab],
    enabled: Boolean(ref && currentTenantId && live),
    staleTime: 60_000,
    queryFn: () => fetchProfile(ref as string, tab) as Promise<ProfilePayload>,
  });
}

export const isNotFound = (error: unknown) => error instanceof ProfileRequestError && error.status === 404;
export const isForbidden = (error: unknown) => error instanceof ProfileRequestError && error.status === 403;
