
import React, { useState, useMemo, useRef } from 'react';
import type { Product } from '../types';
import Modal, { ConfirmationModal } from './Modal';
import { optimizeImage } from '../utils/imageOptimizer';
import BarcodeScannerModal from './BarcodeScannerModal';
import { QrCode, Printer, Plus, Search, Edit2, Trash2 } from 'lucide-react';

const MONTH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const ProductForm = ({ product, onSave, onCancel }: { 
    product: Omit<Product, 'id' | 'imageUrl'> & { imageUrl?: string } | Product, 
    onSave: (data: {name: string, price: number, stock: number, imageUrl?: string, barcode?: string, imei?: string, defaultDownPayment?: number, allowedInstallmentMonths?: number[], interestRates?: Record<number, number>}) => void, 
    onCancel: () => void,
}) => {
    const [name, setName] = useState(product.name);
    const [price, setPrice] = useState(product.price);
    const [stock, setStock] = useState(product.stock || 0);
    const [barcode, setBarcode] = useState(product.barcode || '');
    const [imei, setImei] = useState(product.imei || '');
    const [imageUrl, setImageUrl] = useState(product.imageUrl || '');
    const [downPayment, setDownPayment] = useState<number | ''>(product.defaultDownPayment || '');
    const [allowedMonths, setAllowedMonths] = useState<number[]>(product.allowedInstallmentMonths || []);
    const [interestRates, setInterestRates] = useState<Record<number, number>>(product.interestRates || {});
    
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    
    const formInputStyle = "w-full px-4 py-3 border border-stone-300 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-500 dark:bg-stone-700 dark:border-stone-600 dark:text-stone-200 transition-all font-bold";

    const toggleMonth = (m: number) => {
        setAllowedMonths(prev => 
            prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b)
        );
    };

    const handleInterestChange = (month: number, value: number) => {
        setInterestRates(prev => ({ ...prev, [month]: value }));
    };

    const calculateMonthly = (months: number) => {
        const principal = Math.max(0, price - (Number(downPayment) || 0));
        const interest = Number(interestRates[months]) || 0;
        return (principal + interest) / months;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name, 
            price, 
            stock, 
            imageUrl, 
            barcode, 
            imei,
            defaultDownPayment: downPayment === '' ? undefined : Number(downPayment), 
            allowedInstallmentMonths: allowedMonths,
            interestRates
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1 ml-1">Product Name / නම</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className={formInputStyle} required placeholder="iPhone 15 Pro..." />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1 ml-1">Cash Price / මිල</label>
                  <input type="number" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} className={`${formInputStyle} text-indigo-600`} required />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1 ml-1">Stock / තොගය</label>
                  <input type="number" value={stock} onChange={e => setStock(parseInt(e.target.value) || 0)} className={formInputStyle} required />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1 ml-1">Barcode / කේතය</label>
                  <div className="relative">
                    <input type="text" value={barcode} onChange={e => setBarcode(e.target.value)} className={formInputStyle} placeholder="Scan or type..." />
                    <button type="button" onClick={() => setIsScannerOpen(true)} className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg">
                        <QrCode className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1 ml-1">Serial / IMEI</label>
                  <input type="text" value={imei} onChange={e => setImei(e.target.value)} className={formInputStyle} placeholder="IMEI number..." />
                </div>
            </div>

            {/* Installment Planner */}
            <div className="p-6 bg-slate-900 rounded-[2rem] border border-white/5 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Interest Plans (මාස 1-8)</h4>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Default Down Payment</label>
                        <input type="number" value={downPayment} onChange={e => setDownPayment(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-slate-800 border-0 rounded-xl px-4 py-2 text-white font-bold" placeholder="0" />
                    </div>
                </div>

                <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-2">Allowed Installment Plans (Select Months)</label>
                    <div className="flex flex-wrap gap-2">
                        {MONTH_OPTIONS.map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => toggleMonth(m)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${
                                    allowedMonths.includes(m) 
                                    ? 'bg-indigo-600 text-white border-indigo-500' 
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                                }`}
                            >
                                {m}M
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-h-64 overflow-y-auto custom-scroll pr-2">
                    {MONTH_OPTIONS.filter(m => allowedMonths.includes(m)).map(m => (
                        <div key={m} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                            <div className="w-20"><span className="text-[10px] font-black text-indigo-400 uppercase">{m} Months</span></div>
                            <div className="flex-1">
                                <input 
                                    type="number" 
                                    value={interestRates[m] || ''} 
                                    onChange={e => handleInterestChange(m, Number(e.target.value))}
                                    placeholder="Int. Amount"
                                    className="w-full bg-transparent border-b border-slate-700 outline-none text-white text-xs font-bold py-1 focus:border-indigo-500"
                                />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-emerald-400">Rs. {Math.round(calculateMonthly(m)).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-3">
                <button type="button" onClick={onCancel} className="flex-1 py-4 text-[10px] font-black uppercase rounded-2xl text-stone-500 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-4 text-[10px] font-black uppercase rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all">Authorize Record</button>
            </div>
            
            <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={(code) => setBarcode(code)} />
        </form>
    )
}

interface ManageProductsProps {
    products: Product[];
    addProduct: (product: Omit<Product, 'id'>) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (productId: number) => void;
    onPrintReport: (products: Product[]) => void;
    viewMode?: 'pc' | 'mobile';
}

const ManageProducts: React.FC<ManageProductsProps> = ({ products, addProduct, updateProduct, deleteProduct, onPrintReport, viewMode = 'pc' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Omit<Product, 'id'> | Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const isMobile = viewMode === 'mobile';

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.toLowerCase().includes(q)) || (p.imei && p.imei.toLowerCase().includes(q)));
  }, [products, searchQuery]);

  const handleSave = (data: any) => {
    if (currentProduct && 'id' in currentProduct) updateProduct({ ...currentProduct, ...data });
    else addProduct(data);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  return (
    <div className={`space-y-6 ${isMobile ? 'px-2 pb-32' : 'space-y-10 animate-fade-in pb-40'}`}>
      <div className={`${isMobile ? 'p-4 rounded-2xl' : 'bg-slate-900/60 p-8 rounded-[3rem] border border-white/5 backdrop-blur-xl'} flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl`}>
        <div className="flex items-center gap-3">
            <div className={`bg-indigo-500 rounded-full ${isMobile ? 'w-1 h-8' : 'w-1.5 h-12'}`} />
            <div>
                <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-black text-white uppercase tracking-tighter leading-none`}>Inventory Vault</h2>
                <p className="text-slate-500 font-bold uppercase text-[8px] tracking-[0.3em] mt-1">තොග සහ මිල ගණන් (Assets Control)</p>
            </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => onPrintReport(products)} className={`flex-1 md:flex-none ${isMobile ? 'px-3 py-3' : 'px-6 py-4'} bg-white/5 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2`}>
                <Printer className="w-3.5 h-3.5" strokeWidth={2.5} />
                {isMobile ? 'Report' : 'Full Price List'}
            </button>
            <button onClick={() => { setCurrentProduct({ name: '', price: 0, stock: 0, interestRates: {} }); setIsModalOpen(true); }} className={`flex-[1.5] md:flex-none ${isMobile ? 'px-4 py-3' : 'px-8 py-4'} bg-indigo-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2`}>
                <Plus className="w-3.5 h-3.5" strokeWidth={3.5} />
                {isMobile ? 'Add New' : 'New Entry'}
            </button>
        </div>
      </div>

      <div className={`relative max-w-xl ${isMobile ? 'mx-0' : ''}`}>
        <Search className={`absolute ${isMobile ? 'left-4' : 'left-5'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} strokeWidth={3} />
        <input 
            type="search" 
            placeholder={isMobile ? "Search assets..." : "Search assets, barcodes or serials..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full ${isMobile ? 'pl-10 pr-4 py-3.5 rounded-2xl' : 'pl-14 pr-6 py-5 rounded-[2rem]'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg focus:ring-4 focus:ring-indigo-600/10 outline-none font-bold text-xs`}
        />
      </div>
      
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isMobile ? 'gap-3' : 'gap-6'}`}>
        {filteredProducts.map(product => (
          <div key={product.id} className={`group bg-white dark:bg-[#0b0e14]/60 ${isMobile ? 'p-4 rounded-2xl' : 'p-6 rounded-[2.5rem]'} border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all duration-500 shadow-lg relative overflow-hidden backdrop-blur-md`}>
            <div className={`absolute top-4 right-4 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity flex gap-2`}>
                 <button onClick={() => { setCurrentProduct(product); setIsModalOpen(true); }} className={`${isMobile ? 'p-1.5' : 'p-2'} bg-indigo-600 text-white rounded-lg shadow-lg`}>
                    <Edit2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                 </button>
                 <button onClick={() => setProductToDelete(product)} className={`${isMobile ? 'p-1.5' : 'p-2'} bg-rose-500 text-white rounded-lg shadow-lg`}>
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                 </button>
            </div>

            <div className="flex items-start gap-4">
                <div className={`${isMobile ? 'w-14 h-14 rounded-xl' : 'w-20 h-20 rounded-2xl'} bg-indigo-50 dark:bg-indigo-900/20 overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-800`}>
                    <img src={product.imageUrl || 'https://via.placeholder.com/150?text=IMG'} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[7px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">{product.barcode || 'NO BARCODE'}</p>
                    <p className={`font-black text-slate-800 dark:text-white uppercase truncate ${isMobile ? 'text-sm' : 'text-base'} leading-none`}>{product.name}</p>
                    <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-black text-indigo-600 mt-1 font-mono tabular-nums`}>Rs. {Math.round(product.price).toLocaleString()}</p>
                    <p className={`text-[9px] font-black uppercase mt-1 ${product.stock <= 3 ? 'text-rose-500' : 'text-slate-400'}`}>Stock: {product.stock}</p>
                </div>
            </div>

            {product.interestRates && product.allowedInstallmentMonths && product.allowedInstallmentMonths.length > 0 && (
                <div className={`mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50`}>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-2">Installment Quick View</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {product.allowedInstallmentMonths.map(m => (
                            <div key={m} className={`flex-shrink-0 bg-slate-50 dark:bg-slate-900 ${isMobile ? 'p-2' : 'p-2.5'} rounded-xl border border-slate-100 dark:border-slate-800 min-w-[75px]`}>
                                <p className="text-[7px] font-black text-indigo-500 uppercase">{m} Months</p>
                                <p className={`text-[10px] font-bold text-slate-800 dark:text-white mt-0.5`}>Rs. {Math.round((product.price - (product.defaultDownPayment || 0) + (product.interestRates?.[m] || 0)) / m).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentProduct && 'id' in currentProduct ? 'Update Record' : 'Vault Entry'} variant="focus">
          {currentProduct && <ProductForm product={currentProduct} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />}
      </Modal>
      
      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Destroy Record"
        message={productToDelete ? `Remove "${productToDelete.name}" from the inventory permanently?` : ''}
      />
    </div>
  );
};

export default ManageProducts;
