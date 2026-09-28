export interface CustomRole {
  id: string;
  name: string;
  color: string;
  permissions?: Record<string, unknown>;
  userCount?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  customRole: Pick<CustomRole, "id" | "name" | "color"> | null;
  createdAt: string;
}

export interface StaffFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  customRoleId: string;
  isActive: boolean;
}

export const emptyFormData: StaffFormData = {
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  customRoleId: "",
  isActive: true,
};
