import type { ChartConfig } from "@/components/ui/chart";

export interface DashboardData {
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
  };
  users: {
    total: number;
    students: number;
    teachers: number;
    parents: number;
    admins: number;
  };
  revenue: {
    total: number;
    mrr: number;
  };
  subscriptions: {
    active: number;
  };
  classes: number;
  monthlyData: {
    month: string;
    newTenants: number;
    newUsers: number;
    revenue: number;
  }[];
  topTenants: {
    id: string;
    name: string;
    plan: string;
    logo: string | null;
    status?: string;
    address?: string | null;
    createdAt?: string;
    totalRevenue: number;
    studentCount: number;
    _count: {
      users: number;
      classes: number;
    };
  }[];
  planDistribution: {
    plan: string;
    count: number;
  }[];
  activityLogs: {
    id: string;
    action: string;
    metadata: string;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
    tenant: {
      name: string;
    } | null;
  }[];
}

export const userChartConfig: ChartConfig = {
  students: { label: "Students", color: "var(--chart-1)" },
  teachers: { label: "Teachers", color: "var(--chart-2)" },
  parents: { label: "Parents", color: "var(--chart-3)" },
  admins: { label: "Admins", color: "var(--chart-4)" },
};

export const growthChartConfig: ChartConfig = {
  newTenants: { label: "New Schools", color: "var(--chart-1)" },
  newUsers: { label: "New Users", color: "var(--chart-2)" },
  revenue: { label: "Revenue ($)", color: "var(--chart-3)" },
};

export const planChartConfig: ChartConfig = {
  count: { label: "Schools", color: "var(--chart-1)" },
};

export const USER_CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export const PLAN_COLORS: Record<string, string> = {
  basic: "var(--muted-foreground)",
  standard: "var(--chart-1)",
  premium: "var(--chart-3)",
  enterprise: "var(--chart-5)",
};

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
