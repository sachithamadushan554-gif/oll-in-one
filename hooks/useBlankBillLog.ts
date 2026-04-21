import { useState, useEffect } from 'react';
import type { BlankBillRecord } from '../types';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useFirebase } from '../contexts/FirebaseContext';

const BLANK_BILLS_KEY = 'blankBillLog';

export const useBlankBillLog = () => {
    const { user } = useFirebase();
    const [log, setLog] = useState<BlankBillRecord[]>(() => {
        try {
            const saved = localStorage.getItem(BLANK_BILLS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Error reading blank bill log from localStorage", error);
            return [];
        }
    });

    // Firestore Sync
    useEffect(() => {
        if (!user) return;

        const logRef = collection(db, 'users', user.uid, 'blankBillLog');
        const q = query(logRef, orderBy('date', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const firestoreLog = snapshot.docs.map(doc => doc.data() as BlankBillRecord);
            if (firestoreLog.length > 0) {
                setLog(firestoreLog);
                localStorage.setItem(BLANK_BILLS_KEY, JSON.stringify(firestoreLog));
            }
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        try {
            const sortedLog = [...log].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            localStorage.setItem(BLANK_BILLS_KEY, JSON.stringify(sortedLog));
        } catch (error) {
            console.error("Error saving blank bill log to localStorage", error);
        }
    }, [log]);

    const addBillToLog = async (record: BlankBillRecord) => {
        setLog(prevLog => [record, ...prevLog]);
        
        if (user) {
            const logDocRef = doc(db, 'users', user.uid, 'blankBillLog', record.invoiceNumber);
            await setDoc(logDocRef, record).catch(err => console.error("Firestore blankBillLog add error:", err));
        }
    };
    
    const deleteBillFromLog = async (invoiceNumber: string) => {
        setLog(prevLog => prevLog.filter(record => record.invoiceNumber !== invoiceNumber));

        if (user) {
            const logDocRef = doc(db, 'users', user.uid, 'blankBillLog', invoiceNumber);
            await deleteDoc(logDocRef).catch(err => console.error("Firestore blankBillLog delete error:", err));
        }
    };

    return { log, addBillToLog, deleteBillFromLog };
};
