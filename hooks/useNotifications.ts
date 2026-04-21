

import { useState, useEffect, useCallback } from 'react';
// FIX: Corrected import path for types
import type { Invoice } from '../types';
import { InvoiceStatus } from '../types';
import { useSettings } from './useSettings';

export const useNotifications = (invoices: Invoice[]) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { settings } = useSettings();

  useEffect(() => {
    setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    const status = await Notification.requestPermission();
    setPermission(status);
  }, []);

  const showNotification = useCallback((title: string, options: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, options);
    }
  }, [permission]);
  
  const checkAndSendReminders = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    invoices.forEach(invoice => {
      if (invoice.status === InvoiceStatus.Partial || invoice.status === InvoiceStatus.Overdue) {
        invoice.installments.forEach(installment => {
          if (!installment.paid) {
            // Check if snoozed
            if (installment.snoozedUntil && new Date(installment.snoozedUntil) >= today) {
                return; // Skip if snoozed until today or a future date
            }

            const dueDate = new Date(installment.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            if (dueDate.getTime() < today.getTime()) {
               showNotification(
                `Payment OVERDUE for ${invoice.customer.name}`,
                {
                  body: `Installment #${installment.installmentNumber} of ${invoice.installments.length} (Rs. ${installment.amount.toFixed(2)}) was due on ${installment.dueDate}. Please pay ASAP.`,
                  icon: '/vite.svg'
                }
              );
            } else {
                // Check for upcoming reminders based on settings
                const reminderDate = new Date(dueDate);
                reminderDate.setDate(reminderDate.getDate() - settings.reminderLeadTime);
                reminderDate.setHours(0, 0, 0, 0);

                if (reminderDate.getTime() === today.getTime()) {
                    const dueMessage = settings.reminderLeadTime === 0
                        ? "is due today"
                        : `is due in ${settings.reminderLeadTime} day${settings.reminderLeadTime > 1 ? 's' : ''}`;
                    
                    showNotification(
                        `Payment Reminder for ${invoice.customer.name}`,
                        {
                            body: `Installment #${installment.installmentNumber} of ${invoice.installments.length} (Rs. ${installment.amount.toFixed(2)}) ${dueMessage} (${installment.dueDate}). Invoice ID: ${invoice.id.substring(0, 8)}`,
                            icon: '/vite.svg'
                        }
                    );
                }
            }
          }
        });
      }
    });
  }, [invoices, showNotification, settings.reminderLeadTime]);

  return { permission, requestPermission, checkAndSendReminders };
};