import React from "react";

export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  color: string;
  permissions: string;
  userCount: number;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  customRoleId?: string | null;
  customRole?: { id: string; name: string; color: string } | null;
}

export interface PermissionModule {
  key: string;
  label: string;
  icon: React.ReactNode | string;
  desc?: string;
  iconBg?: string;
}

export interface RoleTemplate {
  name: string;
  description: string;
  color: string;
  permissions: Record<string, string[]>;
}
