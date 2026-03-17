import fs from 'fs';
import path from 'path';

// ============================================================
// Server-side JSON File Data Store
// ============================================================

interface DbSchema {
  customers: any[];
  taxRecords: any[];
  notifications: any[];
  settings: {
    telegramBotToken: string;
    telegramChatId: string;
    enableTelegram: boolean;
  };
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function ensureDbExists(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const defaultDb: DbSchema = {
      customers: [],
      taxRecords: [],
      notifications: [],
      settings: { telegramBotToken: '', telegramChatId: '', enableTelegram: false },
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
  }
}

function readDb(): DbSchema {
  ensureDbExists();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(db: DbSchema): void {
  ensureDbExists();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ============================================================
// Customers
// ============================================================

export function getCustomers() {
  const db = readDb();
  return db.customers.sort((a: any, b: any) =>
    new Date(a.nextTaxDate).getTime() - new Date(b.nextTaxDate).getTime()
  );
}

export function getCustomerById(id: string) {
  const db = readDb();
  return db.customers.find((c: any) => c.id === id);
}

export function addCustomer(data: any) {
  const db = readDb();
  const newCustomer = {
    ...data,
    id: generateId(),
    status: 'normal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.customers.push(newCustomer);
  writeDb(db);
  return newCustomer;
}

export function updateCustomer(id: string, data: any) {
  const db = readDb();
  const index = db.customers.findIndex((c: any) => c.id === id);
  if (index === -1) return null;
  db.customers[index] = { ...db.customers[index], ...data, updatedAt: new Date().toISOString() };
  writeDb(db);
  return db.customers[index];
}

export function deleteCustomer(id: string) {
  const db = readDb();
  db.customers = db.customers.filter((c: any) => c.id !== id);
  db.taxRecords = db.taxRecords.filter((r: any) => r.customerId !== id);
  writeDb(db);
}

// ============================================================
// Tax Records
// ============================================================

export function getTaxRecords(customerId: string) {
  const db = readDb();
  return db.taxRecords
    .filter((r: any) => r.customerId === customerId)
    .sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
}

export function addTaxRecord(data: any) {
  const db = readDb();
  const newRecord = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  db.taxRecords.push(newRecord);
  writeDb(db);
  return newRecord;
}

// ============================================================
// Notifications
// ============================================================

export function getNotifications() {
  const db = readDb();
  return db.notifications
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);
}

export function addNotification(data: any) {
  const db = readDb();
  const newNotif = { ...data, id: generateId() };
  db.notifications.push(newNotif);
  writeDb(db);
  return newNotif;
}

export function markNotificationRead(id: string) {
  const db = readDb();
  const index = db.notifications.findIndex((n: any) => n.id === id);
  if (index !== -1) {
    db.notifications[index].isRead = true;
    writeDb(db);
  }
}

export function markAllNotificationsRead() {
  const db = readDb();
  db.notifications.forEach((n: any) => n.isRead = true);
  writeDb(db);
}

// ============================================================
// Settings
// ============================================================

export function getSettings() {
  const db = readDb();
  return db.settings || { telegramBotToken: '', telegramChatId: '', enableTelegram: false };
}

export function saveSettings(settings: any) {
  const db = readDb();
  db.settings = settings;
  writeDb(db);
}
