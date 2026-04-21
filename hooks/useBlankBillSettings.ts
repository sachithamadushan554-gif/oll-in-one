import { useState, useEffect } from 'react';
import type { BlankBillSettings } from '../types';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useFirebase } from '../contexts/FirebaseContext';

const SETTINGS_KEY = 'blankBillSettings';
const DEFAULT_SETTINGS: BlankBillSettings = {
  paymentMethod: 'Cash',
  termsAndConditions: '6 Months Company Warranty. Conditions Apply.',
  footerMessage: 'Thank You! Come Again!',
  templateStyle: 'vibrant',
  quickActionPaymentUrl: '',
  quickActionWebsiteUrl: '',
  paperSize: 'A6',
  logoOpacity: 0.08,
  viewMode: 'pc',
};

export const useBlankBillSettings = () => {
  const { user } = useFirebase();
  const [settings, setSettings] = useState<BlankBillSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.warrantyText && !parsed.termsAndConditions) {
            parsed.termsAndConditions = parsed.warrantyText;
            delete parsed.warrantyText;
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Error reading blank bill settings from localStorage", error);
      return DEFAULT_SETTINGS;
    }
  });

  // Firestore Sync
  useEffect(() => {
    if (!user) return;

    const settingsDocRef = doc(db, 'users', user.uid, 'blankBillSettings', 'main');
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as BlankBillSettings;
        setSettings(prev => ({ ...prev, ...data }));
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, ...data }));
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      
      // Sync to Firestore if logged in
      if (user) {
        const settingsDocRef = doc(db, 'users', user.uid, 'blankBillSettings', 'main');
        setDoc(settingsDocRef, settings, { merge: true }).catch(err => console.error("Firestore blankBillSettings sync error:", err));
      }
    } catch (error) {
      console.error("Error saving blank bill settings", error);
    }
  }, [settings, user]);

  const updateBlankBillSettings = (newSettings: Partial<BlankBillSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return { blankBillSettings: settings, updateBlankBillSettings };
};
