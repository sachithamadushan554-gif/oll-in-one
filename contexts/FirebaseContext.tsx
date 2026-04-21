import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../src/firebase';
import { doc, onSnapshot, setDoc, collection, query, getDocs } from 'firebase/firestore';

import { Toaster, toast } from 'sonner';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
      toast.success("Signed in successfully!");
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error("Sign-in cancelled. The popup window was closed before completion.");
      } else if (error.code === 'auth/popup-blocked') {
        toast.error("Sign-in blocked. Please allow popups for this site in your browser settings.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // This happens if multiple sign-in attempts are made quickly
        toast.info("Sign-in request was replaced by a newer one.");
      } else {
        toast.error(`Sign-in failed: ${error.message || "Unknown error"}`);
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success("Signed out successfully.");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out.");
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
      <Toaster position="top-center" richColors />
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
