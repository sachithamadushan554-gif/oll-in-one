import React, { useState, useMemo } from 'react';
import type { Product } from '../types';
import Modal from './Modal';

interface ProductSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    onAddProduct: (product: Product) => void;
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ isOpen, onClose, products, onAddProduct }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = useMemo(() => {
        if (!searchQuery) {
            return products;
        }
        return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [products, searchQuery]);

    const handleAdd = (product: Product) => {
        onAddProduct(product);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select a Product">
            <div className="space-y-4">
                <input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-stone-700 dark:border-stone-600 dark:text-stone-200"
                    aria-label="Search products"
                    autoFocus
                />
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <div key={product.id} className="flex justify-between items-center p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={product.imageUrl || 'https://via.placeholder.com/48/E2E8F0/94A3B8?text=No+Img'} 
                                        alt={product.name} 
                                        className="h-12 w-12 object-cover rounded-md bg-stone-200 dark:bg-stone-700" 
                                    />
                                    <div>
                                        <p className="font-semibold text-stone-800 dark:text-stone-100">{product.name}</p>
                                        <div className="flex gap-2 text-xs">
                                            <p className="text-stone-500 dark:text-stone-400">Rs. {product.price.toFixed(2)}</p>
                                            <span className="text-stone-300 dark:text-stone-600">|</span>
                                            <p className={`${product.stock <= 5 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-teal-600 dark:text-teal-400'}`}>
                                                Stock: {product.stock}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAdd(product)}
                                    className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-stone-500 dark:text-stone-400 py-4">No products found.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ProductSelectionModal;