export interface PersonRef {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type TicketStatus   = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Ticket {
  id: string;
  created_email: string;
  assigned_email: string;
  projectName: string;       // lo que muestras en la tabla
  projectSlug?: string;      // lo que llega como value del combo
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: PersonRef;
  createdDate: Date | string;
  time_spent: number;
  estimated_time: number;
}

export interface SelectOption {
  id?: number;
  label: string;
  value: string;
}

export interface TicketFilters {
  proyecto?: string;
  estado?: TicketStatus | '';
  prioridad?: TicketPriority | '';
  busqueda?: string;
}

export interface UserRol {
  email: string;
  role_id: number;
}
