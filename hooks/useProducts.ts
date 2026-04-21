
import { useState, useEffect } from 'react';
import type { Product, InvoiceItem } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

const INITIAL_PRODUCTS: Product[] = [];

export const useProducts = () => {
  const { user } = useFirebase();
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem('products');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        const productsWithDefaults = parsed.map((p: Product) => {
            let updated = { ...p };
            if (updated.stock === undefined) updated.stock = 0;
            return updated;
        });
        return productsWithDefaults;
      }
      return INITIAL_PRODUCTS;
    } catch (error) {
      console.error("Error reading products from localStorage", error);
      return INITIAL_PRODUCTS;
    }
  });

  // Sync from Firestore
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/products`;
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const remoteProducts = snapshot.docs.map(doc => doc.data() as Product);
      setProducts(remoteProducts);
      localStorage.setItem('products', JSON.stringify(remoteProducts));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [user]);

  // Save to Firestore helper
  const saveProductToCloud = async (product: Product) => {
    if (!user) return;
    const path = `users/${user.uid}/products/${product.id}`;
    try {
      await setDoc(doc(db, path), product);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteProductFromCloud = async (productId: number) => {
    if (!user) return;
    const path = `users/${user.uid}/products/${productId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('products', JSON.stringify(products));
      } catch (e) {
        console.error("Error saving products to localStorage", e);
      }
    }
  }, [products, user]);

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now() };
    setProducts(prev => [...prev, newProduct]);
    if (user) saveProductToCloud(newProduct);
  };
  
  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    if (user) saveProductToCloud(updatedProduct);
  };
  
  const deleteProduct = (productId: number) => {
    setProducts(prev => prev.filter(p => String(p.id) !== String(productId)));
    if (user) deleteProductFromCloud(productId);
  };

  const deductStock = (items: InvoiceItem[]) => {
      setProducts(prevProducts => {
          const updatedProducts = prevProducts.map(product => {
              const item = items.find(i => i.productId === product.id);
              if (item) {
                  const updated = { ...product, stock: product.stock - item.quantity };
                  if (user) saveProductToCloud(updated);
                  return updated;
              }
              return product;
          });
          return updatedProducts;
      });
  };

  return { products, addProduct, updateProduct, deleteProduct, deductStock };
};
