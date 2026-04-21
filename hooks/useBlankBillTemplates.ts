import { useState, useEffect } from 'react';
import type { BlankBillTemplate } from '../types';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useFirebase } from '../contexts/FirebaseContext';

const TEMPLATES_KEY = 'blankBillTemplates';

export const useBlankBillTemplates = () => {
  const { user } = useFirebase();
  const [templates, setTemplates] = useState<BlankBillTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error reading blank bill templates from localStorage", error);
      return [];
    }
  });

  // Firestore Sync
  useEffect(() => {
    if (!user) return;

    const templatesRef = collection(db, 'users', user.uid, 'blankBillTemplates');
    const unsubscribe = onSnapshot(templatesRef, (snapshot) => {
      const firestoreTemplates = snapshot.docs.map(doc => doc.data() as BlankBillTemplate);
      if (firestoreTemplates.length > 0) {
        setTemplates(firestoreTemplates);
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(firestoreTemplates));
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error("Error saving blank bill templates to localStorage", error);
    }
  }, [templates]);

  const addTemplate = async (templateData: Omit<BlankBillTemplate, 'id'>) => {
    const newTemplate: BlankBillTemplate = {
      id: `BBT-${crypto.randomUUID()}`,
      ...templateData,
    };
    setTemplates(prev => [...prev, newTemplate]);

    if (user) {
      const templateDocRef = doc(db, 'users', user.uid, 'blankBillTemplates', newTemplate.id);
      await setDoc(templateDocRef, newTemplate).catch(err => console.error("Firestore blankBillTemplate add error:", err));
    }
  };
  
  const updateTemplate = async (updatedTemplate: BlankBillTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));

    if (user) {
      const templateDocRef = doc(db, 'users', user.uid, 'blankBillTemplates', updatedTemplate.id);
      await setDoc(templateDocRef, updatedTemplate, { merge: true }).catch(err => console.error("Firestore blankBillTemplate update error:", err));
    }
  };
  
  const deleteTemplate = async (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));

    if (user) {
      const templateDocRef = doc(db, 'users', user.uid, 'blankBillTemplates', templateId);
      await deleteDoc(templateDocRef).catch(err => console.error("Firestore blankBillTemplate delete error:", err));
    }
  };

  return { templates, addTemplate, updateTemplate, deleteTemplate };
};
