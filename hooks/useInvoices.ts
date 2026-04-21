
import { useState, useEffect } from 'react';
import type { Invoice, Payment, Installment } from '../types';
import { InvoiceStatus } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export const useInvoices = () => {
  const { user } = useFirebase();
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const savedInvoices = localStorage.getItem('invoices');
      return savedInvoices ? JSON.parse(savedInvoices) : [];
    } catch (error) {
      console.error("Error reading invoices from localStorage", error);
      return [];
    }
  });

  // Sync from Firestore
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/invoices`;
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const remoteInvoices = snapshot.docs.map(doc => doc.data() as Invoice);
      setInvoices(remoteInvoices);
      localStorage.setItem('invoices', JSON.stringify(remoteInvoices));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [user]);

  // Save to Firestore helper
  const saveInvoiceToCloud = async (invoice: Invoice) => {
    if (!user) return;
    const path = `users/${user.uid}/invoices/${invoice.id}`;
    try {
      await setDoc(doc(db, path), invoice);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteInvoiceFromCloud = async (invoiceId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/invoices/${invoiceId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('invoices', JSON.stringify(invoices));
      } catch (error) {
        console.error("Error saving invoices to localStorage", error);
      }
    }
  }, [invoices, user]);
  
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkOverdue = (invoice: Invoice) => {
        if (invoice.status === InvoiceStatus.Partial) {
            const isOverdue = invoice.installments.some(inst => !inst.paid && new Date(inst.dueDate) < today);
            if (isOverdue) {
                return { ...invoice, status: InvoiceStatus.Overdue };
            }
        }
        return invoice;
    };
    
    const intervalId = setInterval(() => {
        setInvoices(prevInvoices => {
            let hasChanged = false;
            const updatedInvoices = prevInvoices.map(inv => {
                const updated = checkOverdue(inv);
                if (updated.status !== inv.status) {
                    hasChanged = true;
                    if (user) saveInvoiceToCloud(updated);
                }
                return updated;
            });
            return hasChanged ? updatedInvoices : prevInvoices;
        });
    }, 1000 * 60 * 60);

    return () => clearInterval(intervalId);
  }, [user]);

  const addInvoice = (invoice: Invoice) => {
    setInvoices(prevInvoices => [...prevInvoices, invoice]);
    if (user) saveInvoiceToCloud(invoice);
  };
  
  const deleteInvoice = (invoiceId: string) => {
    setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== invoiceId));
    if (user) deleteInvoiceFromCloud(invoiceId);
  };

  const updateInvoice = (updatedInvoice: Invoice) => {
    setInvoices(prevInvoices => prevInvoices.map(inv => 
      inv.id === updatedInvoice.id ? updatedInvoice : inv
    ));
    if (user) saveInvoiceToCloud(updatedInvoice);
  };

  const updateCustomerPhoto = (invoiceId: string, photoUrl: string) => {
    setInvoices(prevInvoices => prevInvoices.map(inv => {
        if (inv.id === invoiceId) {
            const updated = { ...inv, customer: { ...inv.customer, photoUrl } };
            if (user) saveInvoiceToCloud(updated);
            return updated;
        }
        return inv;
    }));
  };

  const updateCustomerDetails = (invoiceId: string, updates: { name?: string; phone?: string }) => {
    setInvoices(prevInvoices => prevInvoices.map(inv => {
        if (inv.id === invoiceId) {
            const updated = { ...inv, customer: { ...inv.customer, ...updates } };
            if (user) saveInvoiceToCloud(updated);
            return updated;
        }
        return inv;
    }));
  };
  
  const addPaymentToInvoice = (invoiceId: string, paymentData: { amount: number; date: string; note?: string }) => {
    setInvoices(prevInvoices => prevInvoices.map(invoice => {
        if (invoice.id === invoiceId) {
            const newPayment: Payment = {
                id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                ...paymentData
            };
            
            const updatedPayments = [...(invoice.payments || []), newPayment];
            const newAmountPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
            const newBalance = Math.max(0, invoice.totalAmount - newAmountPaid);
            const isFullyPaid = newBalance <= 0;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isOverdue = invoice.installments.some(inst => !inst.paid && new Date(inst.dueDate) < today);

            const updated = {
                ...invoice,
                payments: updatedPayments,
                amountPaid: newAmountPaid,
                balance: newBalance,
                status: isFullyPaid ? InvoiceStatus.Paid : (isOverdue ? InvoiceStatus.Overdue : InvoiceStatus.Partial)
            };
            if (user) saveInvoiceToCloud(updated);
            return updated;
        }
        return invoice;
    }));
  };

  const updatePayment = (invoiceId: string, paymentId: string, updatedData: { date?: string; note?: string }) => {
    setInvoices(prevInvoices => prevInvoices.map(invoice => {
        if (invoice.id === invoiceId) {
            const updatedPayments = (invoice.payments || []).map(p => 
                p.id === paymentId ? { ...p, ...updatedData } : p
            );
            const updated = { ...invoice, payments: updatedPayments };
            if (user) saveInvoiceToCloud(updated);
            return updated;
        }
        return invoice;
    }));
  };

  const markInstallmentAsPaid = (invoiceId: string, installmentNumber: number, actualAmount: number, paymentDate: string, paymentNote: string, nextDueDate?: string) => {
    setInvoices(prevInvoices => prevInvoices.map(invoice => {
        if (invoice.id === invoiceId) {
            const installmentIndex = invoice.installments.findIndex(inst => Number(inst.installmentNumber) === Number(installmentNumber));
            if (installmentIndex === -1 || invoice.installments[installmentIndex].paid) {
                return invoice;
            }

            const installment = invoice.installments[installmentIndex];
            const expectedAmount = installment.amount;
            const difference = expectedAmount - actualAmount; // Positive if underpaid
            
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const timestamp = `${paymentDate || localDateStr} @ ${timeStr}`;

            const newPayment: Payment = {
                id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                amount: actualAmount,
                date: paymentDate || localDateStr,
                note: paymentNote || `Settlement Point #${installment.installmentNumber}`
            };
            
            const updatedPayments = [...(invoice.payments || []), newPayment];
            const newAmountPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
            const newBalance = Math.max(0, invoice.totalAmount - newAmountPaid);
            const isFullyPaid = newBalance <= 0;

            let updatedInstallments = invoice.installments.map((inst, idx) => 
                idx === installmentIndex 
                ? { 
                    ...inst, 
                    paid: true, 
                    paymentId: newPayment.id,
                    paidAmount: actualAmount,
                    paidAt: timestamp
                  } 
                : inst
            );

            if (!isFullyPaid) {
                const nextUnpaidIndex = updatedInstallments.findIndex((inst, idx) => !inst.paid && idx > installmentIndex);
                if (nextUnpaidIndex !== -1) {
                    updatedInstallments[nextUnpaidIndex] = {
                        ...updatedInstallments[nextUnpaidIndex],
                        amount: Math.max(0, updatedInstallments[nextUnpaidIndex].amount + difference)
                    };
                } else if (difference > 0) {
                    const lastInst = updatedInstallments[updatedInstallments.length - 1];
                    const newInstNum = lastInst.installmentNumber + 1;
                    
                    let finalNextDate = nextDueDate;
                    if (!finalNextDate) {
                        const d = new Date();
                        d.setDate(d.getDate() + 30);
                        finalNextDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    }

                    const newInst: Installment = {
                        installmentNumber: newInstNum,
                        amount: difference,
                        dueDate: finalNextDate,
                        paid: false
                    };
                    updatedInstallments.push(newInst);
                }
            } else {
                updatedInstallments = updatedInstallments.map(inst => ({ 
                    ...inst, 
                    paid: true,
                    paidAmount: inst.paid ? inst.paidAmount : inst.amount,
                    paidAt: inst.paidAt || timestamp
                }));
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const stillOverdue = updatedInstallments.some(inst => !inst.paid && new Date(inst.dueDate) < today);

            const updated = {
                ...invoice,
                installments: updatedInstallments,
                payments: updatedPayments,
                amountPaid: newAmountPaid,
                balance: newBalance,
                status: isFullyPaid ? InvoiceStatus.Paid : (stillOverdue ? InvoiceStatus.Overdue : InvoiceStatus.Partial)
            };
            if (user) saveInvoiceToCloud(updated);
            return updated;
        }
        return invoice;
    }));
  };

  const snoozeInstallmentReminder = (invoiceId: string, installmentNumber: number) => {
    setInvoices(prevInvoices => prevInvoices.map(invoice => {
        if (invoice.id === invoiceId) {
            const updatedInstallments = invoice.installments.map(inst => {
                if (inst.installmentNumber === installmentNumber) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
                    return { ...inst, snoozedUntil: tomorrowStr };
                }
                return inst;
            });
            const updated = { ...invoice, installments: updatedInstallments };
            if (user) saveInvoiceToCloud(updated);
            return updated;
        }
        return invoice;
    }));
  };

  return { invoices, addInvoice, updateInvoice, markInstallmentAsPaid, deleteInvoice, addPaymentToInvoice, updatePayment, snoozeInstallmentReminder, updateCustomerPhoto, updateCustomerDetails };
};
