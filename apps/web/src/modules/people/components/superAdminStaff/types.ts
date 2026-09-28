import React from "react";

export interface PlatformRole {
  id: string;
  name: string;
  color: string;
  permissions: string;
}

export interface StaffRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  platformRoleId: string | null;
  platformRole: Pick<PlatformRole, "id" | "name" | "color"> | null;
  createdAt: string;
}

export interface StaffFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  platformRoleId: string;
  isActive: boolean;
}

export const emptyFormData: StaffFormData = {
  name: "",
  email: "",
  password: "",
  phone: "",
  platformRoleId: "none",
  isActive: true,
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function roleBadgeStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: `${color}18`,
    color: color,
    borderColor: `${color}40`,
    borderWidth: 1,
    borderStyle: "solid",
  };
}

export function avatarStyle(color: string): React.CSSProperties {
  return { backgroundColor: color, color: "#fff" };
}

export type StaffViewMode = "grid" | "table";
