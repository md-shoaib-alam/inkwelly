import { FileText, Globe, GraduationCap, Inbox, Landmark, MapPin, User, Users, type LucideIcon } from "lucide-react";

export type ProfileTabId =
  | "summary"
  | "family"
  | "academic"
  | "addresses"
  | "bank"
  | "documents"
  | "requests"
  | "udise";

export interface ProfileTabDef {
  id: ProfileTabId;
  label: string;
  icon: LucideIcon;
  /**
   * Whether the server has a payload behind this tab. The four that do are exactly the
   * four the profile route answers for; the rest have no columns in the schema yet, so
   * they render a "not collected" frame and fire no request. A tab marked live by
   * mistake would 400 against an endpoint nobody wrote.
   */
  live: boolean;
  /** The header badge this tab carries a count from, if it carries one at all. */
  countKey?: "family" | "academic" | "addresses";
}

export const PROFILE_TABS: ProfileTabDef[] = [
  { id: "summary", label: "Summary", icon: User, live: true },
  { id: "family", label: "Family", icon: Users, live: true, countKey: "family" },
  { id: "academic", label: "Academic", icon: GraduationCap, live: true, countKey: "academic" },
  { id: "addresses", label: "Addresses", icon: MapPin, live: true, countKey: "addresses" },
  { id: "bank", label: "Bank Details", icon: Landmark, live: false },
  { id: "documents", label: "Documents", icon: FileText, live: false },
  { id: "requests", label: "Requests", icon: Inbox, live: false },
  { id: "udise", label: "UDISE+", icon: Globe, live: false },
];

export const DEFAULT_TAB: ProfileTabId = "summary";

const BY_ID = new Map(PROFILE_TABS.map((t) => [t.id, t]));

export const tabDefOf = (id: ProfileTabId): ProfileTabDef => BY_ID.get(id) ?? BY_ID.get(DEFAULT_TAB)!;

/**
 * A hand-typed or stale `?tab=` must not request a tab that does not exist, so an
 * unknown value falls back to the default rather than reaching the server.
 */
export function tabFromParam(raw: string | null | undefined): ProfileTabId {
  return raw && BY_ID.has(raw as ProfileTabId) ? (raw as ProfileTabId) : DEFAULT_TAB;
}

/** Summary is the tab you get with no parameter, so it never writes one to the URL. */
export function tabParamOf(id: ProfileTabId): string | null {
  return id === DEFAULT_TAB ? null : id;
}
