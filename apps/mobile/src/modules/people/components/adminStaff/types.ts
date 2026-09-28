export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  isActive: boolean;
  customRole?: {
    id: string;
    name: string;
    color: string;
    permissions?: any;
  } | null;
}

export interface CustomRole {
  id: string;
  name: string;
  color: string;
  description?: string;
}
