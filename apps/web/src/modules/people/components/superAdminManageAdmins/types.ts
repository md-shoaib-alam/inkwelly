export interface PlatformRoleOption {
  id: string;
  name: string;
  color: string;
}

export interface AdminRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  platformRoleId: string | null;
  platformRole: PlatformRoleOption | null;
  createdAt: string;
}

export interface AdminFormData {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
}

export const emptyFormData: AdminFormData = {
  name: "",
  email: "",
  password: "",
  isActive: true,
};

export function getInitials(name: string): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export type AdminViewMode = "grid" | "table";
