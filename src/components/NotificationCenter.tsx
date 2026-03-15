import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, getDocs, where, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AppNotification, Customer } from '../types';
import { Bell, BellDot, Check, Clock, AlertCircle, X } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';

async function sendTelegramNotification(message: string) {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'notifications'));
    if (docSnap.exists()) {
      const settings = docSnap.data();
      if (settings.enableTelegram && settings.telegramBotToken && settings.telegramChatId) {
        await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: settings.telegramBotToken,
            chatId: settings.telegramChatId,
            text: message,
          }),
        });
      }
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

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      setNotifications(docs);
      setUnreadCount(docs.filter(n => !n.isRead).length);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
      >
        {unreadCount > 0 ? <BellDot className="h-5 w-5 text-emerald-600" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-200/50 overflow-hidden z-50">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <h3 className="font-bold text-stone-900">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-stone-50">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-4 transition-colors relative group",
                    !n.isRead ? "bg-emerald-50/30" : "hover:bg-stone-50"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "mt-1 p-1.5 rounded-lg",
                      n.type === 'overdue' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {n.type === 'overdue' ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-stone-900">{n.customerName}</p>
                      <p className="text-xs text-stone-600 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-stone-400 mt-1">
                        {format(parseISO(n.createdAt), 'HH:mm dd/MM/yyyy')}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-emerald-100 rounded text-emerald-600 transition-all"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-stone-400 italic text-sm">
                Không có thông báo nào.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to check and generate notifications
export async function checkExpirations() {
  try {
    const customersSnap = await getDocs(collection(db, 'customers'));
    const customers = customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    const now = new Date();
    
    for (const customer of customers) {
      const nextDate = parseISO(customer.nextTaxDate);
      const diff = differenceInDays(nextDate, now);
      
      let type: 'due-soon' | 'overdue' | null = null;
      let message = '';
      
      if (diff < 0) {
        type = 'overdue';
        message = `Đã quá hạn đóng thuế ${Math.abs(diff)} ngày.`;
      } else if (diff <= 7) {
        type = 'due-soon';
        message = `Sắp đến hạn đóng thuế (còn ${diff} ngày).`;
      }
      
      if (type) {
        // Check if notification already exists for this customer today
        const todayStr = format(now, 'yyyy-MM-dd');
        const existingQ = query(
          collection(db, 'notifications'), 
          where('customerId', '==', customer.id),
          where('type', '==', type)
        );
        const existingSnap = await getDocs(existingQ);
        
        const alreadyNotifiedToday = existingSnap.docs.some(doc => {
          const createdAt = parseISO(doc.data().createdAt);
          return format(createdAt, 'yyyy-MM-dd') === todayStr;
        });

        if (!alreadyNotifiedToday) {
          const fullMessage = `🔔 [TaxPro CRM] ${customer.fullName}\n${message}`;
          await addDoc(collection(db, 'notifications'), {
            customerId: customer.id,
            customerName: customer.fullName,
            type,
            message,
            isRead: false,
            createdAt: new Date().toISOString()
          });
          await sendTelegramNotification(fullMessage);
        }
      }
    }
  } catch (error) {
    console.error('Error checking expirations:', error);
  }
}
