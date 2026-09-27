export interface Transport {
  routeId: string;
  pickupPoint: string;
  fee?: number;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  classId: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  parentId: string;
  parentName: string;
  transport?: Transport;
  username?: string;
  status?: 'active' | 'inactive';
}
