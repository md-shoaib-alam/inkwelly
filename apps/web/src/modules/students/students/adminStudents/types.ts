export interface StudentInfo {
  id: string;
  name: string;
  email: string;
  username?: string;
  phone: string | null;
  classId: string;
  className: string;
  rollNumber: string;
  gender: string;
  status?: string;
  dateOfBirth: string | null;
  admissionDate?: string | null;
  createdAt?: string | null;
  bloodGroup?: string | null;
  emergencyContact?: string | null;
  address?: string | null;
  house?: string | null;
  parentName?: string;
  parentPhone?: string | null;
  parentEmail?: string | null;
  transport?: {
    id: string;
    routeId: string;
    pickupPoint: string | null;
    status: string;
    startDate: string;
  } | null;
  siblings?: {
    id: string;
    name: string;
    className: string;
  }[];
}

export interface ClassInfo {
  id: string;
  name: string;
  section: string;
  grade: string;
}

export interface StudentFormData {
  name: string;
  email: string;
  username?: string;
  phone: string;
  rollNumber: string;
  classId: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup?: string;
  house?: string;
  password?: string;
  transportEnabled?: boolean;
  routeId?: string;
  pickupPoint?: string;
  newPickupPointFee?: number;
}
