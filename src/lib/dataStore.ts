import { Customer, TaxRecord, AppNotification } from '../types';

// ============================================================
// API Data Store - calls server REST API
// ============================================================

const API = '/api';

// ============================================================
// Customers
// ============================================================

export async function getCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API}/customers`);
  return res.json();
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const res = await fetch(`${API}/customers/${id}`);
  if (!res.ok) return undefined;
  return res.json();
}

export async function addCustomer(data: any): Promise<Customer> {
  const res = await fetch(`${API}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | undefined> {
  const res = await fetch(`${API}/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return undefined;
  return res.json();
}

export async function deleteCustomer(id: string): Promise<void> {
  await fetch(`${API}/customers/${id}`, { method: 'DELETE' });
}

// ============================================================
// Tax Records
// ============================================================

export async function getTaxRecords(customerId: string): Promise<TaxRecord[]> {
  const res = await fetch(`${API}/customers/${customerId}/tax-records`);
  return res.json();
}

export async function addTaxRecord(data: any): Promise<TaxRecord> {
  const customerId = data.customerId;
  const res = await fetch(`${API}/customers/${customerId}/tax-records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ============================================================
// Notifications
// ============================================================

export async function getNotifications(): Promise<AppNotification[]> {
  const res = await fetch(`${API}/notifications`);
  return res.json();
}

export async function addNotification(data: Omit<AppNotification, 'id'>): Promise<AppNotification> {
  const res = await fetch(`${API}/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch(`${API}/notifications/${id}/read`, { method: 'PUT' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch(`${API}/notifications/read-all`, { method: 'PUT' });
}

// ============================================================
// Settings
// ============================================================

export interface AppSettings {
  telegramBotToken: string;
  telegramChatId: string;
  enableTelegram: boolean;
}

export async function getSettings(): Promise<AppSettings> {
  const res = await fetch(`${API}/settings`);
  return res.json();
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await fetch(`${API}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
}
