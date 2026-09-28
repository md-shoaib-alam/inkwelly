export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
    avatar: string | null;
  } | null;
}

export interface TicketItem {
  id: string;
  tenantId: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    role: string;
    avatar: string | null;
  } | null;
  assignee: {
    id: string;
    name: string;
    role: string;
    avatar: string | null;
  } | null;
  _count: {
    messages: number;
  };
}

export interface TicketDetail extends Omit<TicketItem, "_count"> {
  messages: TicketMessage[];
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface CreateFormData {
  title: string;
  description: string;
  priority: string;
  category: string;
}
