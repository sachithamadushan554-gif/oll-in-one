
import { useState, useEffect } from 'react';
import type { AppSettings } from '../types';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useFirebase } from '../contexts/FirebaseContext';

const SETTINGS_KEY = 'appSettings';
const DEFAULT_SETTINGS: AppSettings = {
  reminderLeadTime: 0,
  invoicePaperSize: 'A4',
  lockCode: '',
  autoLockTimeout: 5,
  viewMode: 'pc',
  autoBackupEnabled: false,
  autoBackupFrequency: 'manual',
  isAutoSyncEnabled: true,
};

export const useSettings = () => {
  const { user } = useFirebase();
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Error reading settings from localStorage", error);
      return DEFAULT_SETTINGS;
    }
  });

  // Firestore Sync
  useEffect(() => {
    if (!user) return;

    const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'main');
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppSettings;
        // Don't overwrite local viewMode with remote one
        const { viewMode, ...remoteSettings } = data;
        setSettings(prev => ({ ...prev, ...remoteSettings }));
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      
      // Sync to Firestore if logged in
      if (user) {
        const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'main');
        // Filter out viewMode before syncing to Firestore
        const { viewMode, ...syncableSettings } = settings;
        setDoc(settingsDocRef, syncableSettings, { merge: true }).catch(err => console.error("Firestore settings sync error:", err));
      }
    } catch (error) {
      console.error("Error saving settings", error);
    }
  }, [settings, user]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return { settings, updateSettings };
};
