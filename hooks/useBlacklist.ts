import { useState, useEffect, useCallback } from 'react';
import type { BlacklistedCustomer } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

const BLACKLIST_KEY = 'customerBlacklist';

export const useBlacklist = () => {
    const { user } = useFirebase();
    const [blacklist, setBlacklist] = useState<BlacklistedCustomer[]>(() => {
        try {
            const saved = localStorage.getItem(BLACKLIST_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Error reading blacklist from storage", e);
            return [];
        }
    });

    // Sync from Firestore
    useEffect(() => {
        if (!user) return;

        const path = `users/${user.uid}/blacklist`;
        const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
            const remoteBlacklist = snapshot.docs.map(doc => doc.data() as BlacklistedCustomer);
            setBlacklist(remoteBlacklist);
            localStorage.setItem(BLACKLIST_KEY, JSON.stringify(remoteBlacklist));
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, path);
        });

        return unsubscribe;
    }, [user]);

    // Save to Firestore helper
    const saveBlacklistToCloud = async (customer: BlacklistedCustomer) => {
        if (!user) return;
        const path = `users/${user.uid}/blacklist/${customer.id}`;
        try {
            await setDoc(doc(db, path), customer);
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
        }
    };

    const deleteBlacklistFromCloud = async (customerId: string) => {
        if (!user) return;
        const path = `users/${user.uid}/blacklist/${customerId}`;
        try {
            await deleteDoc(doc(db, path));
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, path);
        }
    };

    useEffect(() => {
        if (!user) {
            localStorage.setItem(BLACKLIST_KEY, JSON.stringify(blacklist));
        }
    }, [blacklist, user]);

    const addToBlacklist = (customer: Omit<BlacklistedCustomer, 'id' | 'createdAt'>) => {
        const newEntry: BlacklistedCustomer = {
            id: `BL-${crypto.randomUUID()}`,
            createdAt: new Date().toISOString(),
            ...customer
        };
        setBlacklist(prev => [newEntry, ...prev]);
        if (user) saveBlacklistToCloud(newEntry);
    };

    const removeFromBlacklist = (id: string) => {
        setBlacklist(prev => prev.filter(c => c.id !== id));
        if (user) deleteBlacklistFromCloud(id);
    };

    const checkIsBlacklisted = useCallback((phone: string, name?: string) => {
        if (!phone && !name) return null;
        
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        
        return blacklist.find(c => {
            const matchPhone = cleanPhone && c.phone.replace(/[^0-9]/g, '') === cleanPhone;
            const matchName = name && name.toLowerCase().trim() === c.name.toLowerCase().trim();
            return matchPhone || matchName;
        });
    }, [blacklist]);

    return { blacklist, addToBlacklist, removeFromBlacklist, checkIsBlacklisted };
};
