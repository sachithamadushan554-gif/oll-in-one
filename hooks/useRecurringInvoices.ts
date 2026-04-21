
import { useState, useEffect, useCallback } from 'react';
import type { RecurringInvoice, Invoice, InvoiceItem, Customer, RecurringFrequency } from '../types';
import { InvoiceStatus } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export const useRecurringInvoices = () => {
    const { user } = useFirebase();
    const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>(() => {
        try {
            const saved = localStorage.getItem('recurringInvoices');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Error reading recurringInvoices from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        if (!user) return;

        const path = `users/${user.uid}/recurringInvoices`;
        const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
            const remote = snapshot.docs.map(doc => doc.data() as RecurringInvoice);
            setRecurringInvoices(remote);
            localStorage.setItem('recurringInvoices', JSON.stringify(remote));
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, path);
        });

        return unsubscribe;
    }, [user]);

    const saveToCloud = async (recurring: RecurringInvoice) => {
        if (!user) return;
        const path = `users/${user.uid}/recurringInvoices/${recurring.id}`;
        try {
            await setDoc(doc(db, path), recurring);
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
        }
    };

    const deleteFromCloud = async (id: string) => {
        if (!user) return;
        const path = `users/${user.uid}/recurringInvoices/${id}`;
        try {
            await deleteDoc(doc(db, path));
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, path);
        }
    };

    const addRecurringInvoice = (recurring: RecurringInvoice) => {
        setRecurringInvoices(prev => [...prev, recurring]);
        if (user) saveToCloud(recurring);
    };

    const updateRecurringInvoice = (recurring: RecurringInvoice) => {
        setRecurringInvoices(prev => prev.map(r => r.id === recurring.id ? recurring : r));
        if (user) saveToCloud(recurring);
    };

    const deleteRecurringInvoice = (id: string) => {
        setRecurringInvoices(prev => prev.filter(r => r.id !== id));
        if (user) deleteFromCloud(id);
    };

    const calculateNextDate = (currentDate: string, frequency: RecurringFrequency): string => {
        const date = new Date(currentDate);
        switch (frequency) {
            case 'daily':
                date.setDate(date.getDate() + 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
        }
        return date.toISOString().split('T')[0];
    };

    const processDueCycles = useCallback((addInvoice: (inv: Invoice) => void) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        setRecurringInvoices(prev => {
            let hasChanged = false;
            const updated = prev.map(recurring => {
                if (recurring.status !== 'active') return recurring;

                const nextDate = new Date(recurring.nextGenerationDate);
                if (nextDate <= today) {
                    // Generate Invoice
                    const newInvoice: Invoice = {
                        id: `INV-REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        accountNumber: `ACC-REC-${Date.now().toString().slice(-6)}`,
                        customer: recurring.customer,
                        items: recurring.items,
                        subtotal: recurring.amount,
                        totalAmount: recurring.amount,
                        amountPaid: 0,
                        balance: recurring.amount,
                        installments: [], // Recurring invoices usually don't have installments in this context, or they are single payment
                        payments: [],
                        status: InvoiceStatus.Partial,
                        createdAt: new Date().toISOString(),
                    };

                    addInvoice(newInvoice);

                    const nextGenDate = calculateNextDate(recurring.nextGenerationDate, recurring.frequency);
                    const completedCycles = recurring.completedCycles + 1;
                    const status = (recurring.totalCycles && completedCycles >= recurring.totalCycles) ? 'completed' : 'active';

                    const updatedRecurring: RecurringInvoice = {
                        ...recurring,
                        lastGeneratedDate: recurring.nextGenerationDate,
                        nextGenerationDate: nextGenDate,
                        completedCycles,
                        status
                    };

                    hasChanged = true;
                    if (user) saveToCloud(updatedRecurring);
                    return updatedRecurring;
                }
                return recurring;
            });

            return hasChanged ? updated : prev;
        });
    }, [user]);

    return { recurringInvoices, addRecurringInvoice, updateRecurringInvoice, deleteRecurringInvoice, processDueCycles };
};
