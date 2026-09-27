export type PlanTier = "basic" | "standard" | "premium";

export type ProviderCategory =
  | "accounting"
  | "payments"
  | "communication"
  | "attendance-hardware"
  | "transport"
  | "learning"
  | "finance"
  | "documents"
  | "compliance"
  | "storage";

export type ConnectionStatus =
  | "connected"
  | "pending"
  | "error"
  | "available"
  | "locked"
  | "not-offered";

export type CostModel = "one-time" | "metered" | "licence" | "included" | "commercial";

export interface DocLink {
  label: string;
  url: string;
}

/** Mirrors server/src/lib/integrations/catalog.ts over HTTP. */
export interface IntegrationField {
  key: string;
  label: string;
  type: "text" | "secret" | "url" | "select";
  options?: string[];
  placeholder?: string;
  hint?: string;
  sensitive?: boolean;
  required?: boolean;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  vendor: string;
  category: ProviderCategory;
  summary: string;
  whoPays: string;
  costModel: CostModel;
  costNote: string;
  minPlan: PlanTier | "any";
  setupOwner: "school_admin" | "super_admin" | "platform";
  builtIn?: boolean;
  offered?: boolean;
  notOfferedReason?: string;
  docs: DocLink[];
  setupNote?: string;
  fields: IntegrationField[];
}

export interface ProvidersResponse {
  encryptionConfigured: boolean;
  providers: IntegrationProvider[];
}

/** A saved connection. Secret fields arrive as `{ filled }` only — never a value. */
export interface ConnectionFieldView {
  key: string;
  value?: string | null;
  filled?: boolean;
}

export interface Connection {
  provider: string;
  status: "connected" | "pending" | "error";
  accountLabel: string | null;
  enabled: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  updatedAt: string;
  fields: ConnectionFieldView[];
  hasSecrets: boolean;
  resolvedStatus: ConnectionStatus;
}

export interface SchoolRow {
  tenantId: string;
  name: string;
  slug: string;
  plan: PlanTier;
  status: string;
  maxStudents: number;
  address: string | null;
  needsAttention: number;
  connections: Record<string, Connection>;
}

export interface OverviewResponse {
  schools: number;
  activeConnections: number;
  needsAttention: number;
  schoolsWithIssues: number;
  builtIn: number;
  offered: number;
  encryptionConfigured: boolean;
  tenants: SchoolRow[];
}

export const PLAN_ORDER: Record<PlanTier, number> = { basic: 1, standard: 2, premium: 3 };

export const PLAN_LABEL: Record<PlanTier, string> = {
  basic: "Starter",
  standard: "Growth",
  premium: "Institution",
};

export const CATEGORY_LABEL: Record<ProviderCategory, string> = {
  accounting: "Accounting",
  payments: "Payments",
  communication: "Communication",
  "attendance-hardware": "Attendance hardware",
  transport: "Transport",
  learning: "Teaching",
  finance: "Fee financing",
  documents: "Documents",
  compliance: "Compliance",
  storage: "Storage",
};

export const COST_MODEL_LABEL: Record<CostModel, string> = {
  "one-time": "One-time setup",
  metered: "Metered per use",
  licence: "School's own licence",
  included: "Included in plan",
  commercial: "Business deal",
};

import type { StatusTone } from "@/components/ui/status-badge";

/**
 * Every colour on this screen comes from the shared StatusBadge tones or a theme token,
 * never a bespoke Tailwind palette — the app deliberately avoids blue-tinted grays.
 */
export interface StatusMeta {
  label: string;
  tone: StatusTone;
  /** "Not set up" reads as a placeholder, so it gets a dashed outline instead of a fill. */
  ghost?: boolean;
  struck?: boolean;
}

export const STATUS_META: Record<ConnectionStatus, StatusMeta> = {
  connected: { label: "Connected", tone: "positive" },
  pending: { label: "Pending", tone: "warning" },
  error: { label: "Failing", tone: "negative" },
  available: { label: "Not set up", tone: "neutral", ghost: true },
  locked: { label: "Needs upgrade", tone: "neutral" },
  "not-offered": { label: "Not available", tone: "neutral", struck: true },
};

export function planAllows(plan: PlanTier, minPlan: PlanTier | "any"): boolean {
  if (minPlan === "any") return true;
  return PLAN_ORDER[plan] >= PLAN_ORDER[minPlan];
}

/**
 * Mirrors the server resolver: a row's own status wins, otherwise the answer is derived
 * from the plan and the provider's entitlement — "not set up" is never stored.
 */
export function resolveStatus(
  school: { plan: PlanTier },
  provider: IntegrationProvider,
  storedStatus?: string | null,
): ConnectionStatus {
  if (storedStatus === "connected" || storedStatus === "pending" || storedStatus === "error") {
    return storedStatus;
  }
  if (provider.builtIn) return "connected";
  if (provider.offered === false) return "not-offered";
  if (!planAllows(school.plan, provider.minPlan)) return "locked";
  return "available";
}

export function formatStamp(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }) + " IST";
}
