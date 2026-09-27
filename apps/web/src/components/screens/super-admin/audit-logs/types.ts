export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string | null;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
  } | null;
  user: {
    name: string;
    email: string;
  } | null;
}

export interface ActionTypeCount {
  action: string;
  count: number;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
  actionTypes: ActionTypeCount[];
}

export function getActionCategory(action: string): string {
  if (action.startsWith("CREATE")) return "CREATE";
  if (action.startsWith("UPDATE")) return "UPDATE";
  if (action.startsWith("DELETE")) return "DELETE";
  if (action.includes("LOGIN") || action.includes("LOGOUT")) return "LOGIN";
  if (
    action.includes("VIEW") ||
    action.includes("LIST") ||
    action.includes("GET")
  )
    return "VIEW";
  if (action.includes("EXPORT")) return "EXPORT";
  if (action.includes("SUSPEND") || action.includes("DISABLE"))
    return "SUSPEND";
  return "VIEW";
}

export const categoryColors: Record<string, string> = {
  CREATE: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
  UPDATE: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700",
  DELETE: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700",
  LOGIN: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700",
  VIEW: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  EXPORT: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700",
  SUSPEND: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 border-orange-200",
};

export const categoryIcons: Record<string, string> = {
  CREATE: "🟢",
  UPDATE: "🔵",
  DELETE: "🔴",
  LOGIN: "🟣",
  VIEW: "⚪",
  EXPORT: "🟡",
  SUSPEND: "🟠",
};

export function truncateJson(jsonStr: string, maxLen: number = 60): string {
  try {
    const parsed = JSON.parse(jsonStr);
    const formatted = JSON.stringify(parsed);
    if (formatted.length <= maxLen) return formatted;
    return formatted.slice(0, maxLen) + "...";
  } catch {
    if (jsonStr.length <= maxLen) return jsonStr;
    return jsonStr.slice(0, maxLen) + "...";
  }
}

export function formatTimestamp(dateStr: string): string {
  if (!dateStr) return "–";
  const num = Number(dateStr);
  const date = !isNaN(num) && dateStr.length > 10 ? new Date(num) : new Date(dateStr);

  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
