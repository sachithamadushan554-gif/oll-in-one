import { useState, useEffect } from 'react';
import type { ShopDetails } from '../types';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useFirebase } from '../contexts/FirebaseContext';

const SHOP_DETAILS_KEY = 'shopDetails';

const EMPTY_SHOP_DETAILS: ShopDetails = {
    name: '',
    address: '',
    phone1: '',
    phone2: '',
    paymentMethod: '',
    logoUrl: ''
};

export const useShopDetails = () => {
  const { user } = useFirebase();
  const [shopDetails, setShopDetails] = useState<ShopDetails>(() => {
    try {
      const saved = localStorage.getItem(SHOP_DETAILS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...EMPTY_SHOP_DETAILS, ...parsed };
      }
    } catch (error) {
      console.error("Error reading shop details from localStorage", error);
    }
    return EMPTY_SHOP_DETAILS;
  });

  // Firestore Sync
  useEffect(() => {
    if (!user) return;

    const shopDocRef = doc(db, 'users', user.uid, 'shopDetails', 'main');
    const unsubscribe = onSnapshot(shopDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ShopDetails;
        setShopDetails(data);
        localStorage.setItem(SHOP_DETAILS_KEY, JSON.stringify(data));
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(SHOP_DETAILS_KEY, JSON.stringify(shopDetails));
      
      // Sync to Firestore if logged in
      if (user) {
        const shopDocRef = doc(db, 'users', user.uid, 'shopDetails', 'main');
        setDoc(shopDocRef, shopDetails, { merge: true }).catch(err => console.error("Firestore shopDetails sync error:", err));
      }
    } catch (error) {
      console.error("Error saving shop details", error);
    }
  }, [shopDetails, user]);

  const updateShopDetails = (newDetails: Partial<ShopDetails>) => {
    setShopDetails(prev => ({ ...prev, ...newDetails }));
  };

  return { shopDetails, updateShopDetails };
};
