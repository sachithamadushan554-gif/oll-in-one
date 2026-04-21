
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { AppNotification, Invoice } from '../types';
import { InvoiceStatus } from '../types';
import { useSettings } from './useSettings';

const NOTIFICATIONS_KEY = 'appNotifications';
const MAX_NOTIFICATIONS = 50;

export const useAppNotifications = (invoices: Invoice[], submissions: any[]) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error reading notifications from localStorage", error);
      return [];
    }
  });

  const { settings } = useSettings();

  useEffect(() => {
    try {
      const sortedNotifications = notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(sortedNotifications.slice(0, MAX_NOTIFICATIONS)));
    } catch (error) {
      console.error("Error saving notifications to localStorage", error);
    }
  }, [notifications]);

  useEffect(() => {
    const newNotifications: AppNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    invoices.forEach(invoice => {
      if (invoice.status === InvoiceStatus.Partial || invoice.status === InvoiceStatus.Overdue) {
        invoice.installments.forEach(installment => {
          if (!installment.paid) {
            const dueDate = new Date(installment.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            const notificationId = `notif-${invoice.id}-${installment.installmentNumber}-${installment.dueDate}`;
            const existingNotification = notifications.find(n => n.id === notificationId);

            if (!existingNotification) {
              const reminderDate = new Date(dueDate);
              reminderDate.setDate(reminderDate.getDate() - settings.reminderLeadTime);

              if (dueDate < today) {
                newNotifications.push({
                  id: notificationId,
                  type: 'invoice-overdue',
                  title: 'Payment Overdue',
                  message: `Payment for ${invoice.customer.name} (Rs. ${installment.amount.toFixed(2)}) was due on ${installment.dueDate}.`,
                  relatedId: invoice.id,
                  createdAt: new Date().toISOString(),
                  isRead: false,
                });
              } else if (reminderDate <= today) {
                newNotifications.push({
                  id: notificationId,
                  type: 'invoice-reminder',
                  title: 'Payment Reminder',
                  message: `Payment for ${invoice.customer.name} (Rs. ${installment.amount.toFixed(2)}) is due on ${installment.dueDate}.`,
                  relatedId: invoice.id,
                  createdAt: new Date().toISOString(),
                  isRead: false,
                });
              }
            }
          }
        });
      }
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
    }

  }, [invoices, settings.reminderLeadTime, notifications]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
  
  const addSystemNotification = useCallback((type: 'system-backup' | 'utility-submission', title: string, message: string) => {
      const newNotif: AppNotification = {
          id: `sys-${Date.now()}`,
          type: type as any,
          title,
          message,
          relatedId: 'system',
          createdAt: new Date().toISOString(),
          isRead: false
      };
      setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const clearAll = () => {
    setNotifications([]);
  };

  return { notifications, unreadCount, markAllAsRead, clearAll, addSystemNotification, markAsRead };
};
