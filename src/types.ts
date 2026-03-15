export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export type CustomerType = 'individual' | 'business';
export type CustomerStatus = 'normal' | 'due-soon' | 'overdue';

export interface Customer {
  id: string;
  fullName: string;
  pass: string;
  cccd: string;
  taxCode: string;
  address: string;
  customerType: CustomerType;
  taxCycle: string;
  startDate: string;
  nextTaxDate: string;
  status: CustomerStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxRecord {
  id: string;
  customerId: string;
  period: string;
  amount: number;
  paymentDate: string;
  note: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  customerId: string;
  customerName: string;
  type: 'due-soon' | 'overdue';
  message: string;
  isRead: boolean;
  createdAt: string;
}
