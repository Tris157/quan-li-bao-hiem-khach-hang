import React, { useState, useEffect, useRef } from 'react';
import { getCustomers, getNotifications, addNotification, markNotificationRead, markAllNotificationsRead, getSettings } from '../lib/dataStore';
import { AppNotification } from '../types';
import { Bell, BellDot, Check, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';

async function sendTelegramNotification(message: string) {
  try {
    const settings = await getSettings();
    if (settings.enableTelegram && settings.telegramBotToken && settings.telegramChatId) {
      await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: settings.telegramBotToken, chatId: settings.telegramChatId, text: message }),
      });
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    const notifs = await getNotifications();
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.isRead).length);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => { await markNotificationRead(id); loadNotifications(); };
  const handleMarkAllAsRead = async () => { await markAllNotificationsRead(); loadNotifications(); };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all">
        {unreadCount > 0 ? <BellDot className="h-5 w-5 text-emerald-600" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-200/50 overflow-hidden z-50">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <h3 className="font-bold text-stone-900">Thông báo</h3>
            {unreadCount > 0 && <button onClick={handleMarkAllAsRead} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Check className="h-3 w-3" /> Đánh dấu đã đọc</button>}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-stone-50">
            {notifications.length > 0 ? notifications.map((n) => (
              <div key={n.id} className={cn("p-4 transition-colors relative group", !n.isRead ? "bg-emerald-50/30" : "hover:bg-stone-50")}>
                <div className="flex gap-3">
                  <div className={cn("mt-1 p-1.5 rounded-lg", n.type === 'overdue' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600")}>
                    {n.type === 'overdue' ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-stone-900">{n.customerName}</p>
                    <p className="text-xs text-stone-600 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-stone-400 mt-1">{format(parseISO(n.createdAt), 'HH:mm dd/MM/yyyy')}</p>
                  </div>
                  {!n.isRead && <button onClick={() => handleMarkAsRead(n.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-emerald-100 rounded text-emerald-600 transition-all"><Check className="h-3 w-3" /></button>}
                </div>
              </div>
            )) : (<div className="p-8 text-center text-stone-400 italic text-sm">Không có thông báo nào.</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

export async function checkExpirations() {
  try {
    const [customers, existingNotifs] = await Promise.all([getCustomers(), getNotifications()]);
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    
    for (const customer of customers) {
      const diff = differenceInDays(parseISO(customer.nextTaxDate), now);
      let type: 'due-soon' | 'overdue' | null = null;
      let message = '';
      
      if (diff < 0) { type = 'overdue'; message = `Đã quá hạn đóng thuế ${Math.abs(diff)} ngày.`; }
      else if (diff <= 7) { type = 'due-soon'; message = `Sắp đến hạn đóng thuế (còn ${diff} ngày).`; }
      
      if (type) {
        const alreadyNotifiedToday = existingNotifs.some(n =>
          n.customerId === customer.id && n.type === type && format(parseISO(n.createdAt), 'yyyy-MM-dd') === todayStr
        );
        if (!alreadyNotifiedToday) {
          await addNotification({ customerId: customer.id, customerName: customer.fullName, type, message, isRead: false, createdAt: new Date().toISOString() });
          await sendTelegramNotification(`🔔 [TaxPro CRM] ${customer.fullName}\n${message}`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking expirations:', error);
  }
}
