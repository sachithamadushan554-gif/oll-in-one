import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Invoice, Customer, InvoiceItem, Installment, Product, Payment } from '../types';
import { 
  InvoiceStatus,
  Customer as CustomerType,
  InvoiceItem as InvoiceItemType,
  Product as ProductType
} from '../types';
import ProductSelectionModal from './ProductSelectionModal';
import LegalStepModal from './LegalStepModal';
import BarcodeScannerModal from './BarcodeScannerModal';
import { ConfirmationModal } from './Modal';
import { useBlacklist } from '../hooks/useBlacklist';
import { useLanguage } from '../contexts/LanguageContext';
import { optimizeImage } from '../utils/imageOptimizer';
import { 
    Camera, 
    User, 
    Clock, 
    Package, 
    QrCode, 
    Plus, 
    Trash2, 
    History,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    Search
} from 'lucide-react';

interface NewInvoiceFormProps {
  onAddInvoice?: (invoice: Invoice, shouldPrint: boolean) => void;
  onUpdateInvoice?: (invoice: Invoice) => void;
  products: Product[];
  invoices: Invoice[];
  onDeductStock: (items: InvoiceItem[]) => void;
  viewMode?: 'pc' | 'mobile';
  initialInvoice?: Invoice;
  onCancel?: () => void;
}

const createEmptyItem = (): InvoiceItem => ({
    description: '',
    imei: '',
    quantity: 1,
    price: 0,
    amount: 0,
});

const NewInvoiceForm: React.FC<NewInvoiceFormProps> = ({ 
  onAddInvoice, 
  onUpdateInvoice,
  products, 
  invoices, 
  onDeductStock, 
  viewMode = 'pc',
  initialInvoice,
  onCancel
}) => {
  const isEditMode = !!initialInvoice;
  const { t } = useLanguage();
  const { checkIsBlacklisted } = useBlacklist();
  const [customer, setCustomer] = useState<Customer>(initialInvoice?.customer || { name: '', phone: '', address: '', photoUrl: '', nickname: '' });
  const [items, setItems] = useState<InvoiceItem[]>(initialInvoice?.items || [createEmptyItem()]);
  const [amountPaid, setAmountPaid] = useState<number | ''>(initialInvoice?.amountPaid || '');
  const [discountValue, setDiscountValue] = useState<number | ''>(initialInvoice?.totalAmount && initialInvoice?.subtotal ? (initialInvoice.subtotal - initialInvoice.totalAmount) : '');
  const [installmentsCount, setInstallmentsCount] = useState<number>(initialInvoice?.installments.filter(i => i.installmentNumber > 0).length || 0);
  const [paymentMode, setPaymentMode] = useState<'full' | 'installment'>(initialInvoice?.paymentMode || 'installment');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const ALL_MONTH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
  const allowedMonthOptions = useMemo(() => {
      if (selectedProduct && selectedProduct.allowedInstallmentMonths && selectedProduct.allowedInstallmentMonths.length > 0) {
          return selectedProduct.allowedInstallmentMonths;
      }
      return ALL_MONTH_OPTIONS;
  }, [selectedProduct]);

  const [isOldBill, setIsOldBill] = useState(isEditMode);
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [customDate, setCustomDate] = useState(initialInvoice?.createdAt.split(' @ ')[0] || getTodayStr());
  const [firstInstDate, setFirstInstDate] = useState(initialInvoice?.installments[0]?.dueDate || getTodayStr());
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalData, setLegalData] = useState<{ idNumber: string; signature: string; idPhotoFront: string; idPhotoBack: string } | null>(initialInvoice?.legalData || null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<'name' | 'phone' | 'nickname' | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validatePhoneNumber = (phone: string) => {
    const clean = phone.replace(/\s/g, '');
    if (!clean) return null;
    
    const validPrefixes = ['078', '075', '077', '076', '074', '070', '071', '072'];
    const isValidPrefix = validPrefixes.some(prefix => clean.startsWith(prefix));
    
    if (clean.length >= 3 && !isValidPrefix) {
        return "අවලංගු දුරකථන අංකයකි. දුරකථන අංකය 078, 075, 077, 076, 074, 070, 071, 072 යන අංකයකින් ආරම්භ විය යුතුය.";
    }
    
    if (clean.length > 10) {
        return "අවලංගු දුරකථන අංකයකි. දුරකථන අංකය සඳහා ඉලක්කම් 10ක් තිබිය යුතුය.";
    }
    
    return null;
  };

  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, Customer>();
    invoices.forEach(inv => {
        if (inv.customer?.phone) {
            map.set(inv.customer.phone, inv.customer);
        }
    });
    return Array.from(map.values());
  }, [invoices]);

  const handleCustomerChange = (field: keyof Customer, value: string) => {
    const newCustomer = { ...customer, [field]: value };
    setCustomer(newCustomer);

    if (field === 'phone') {
        setPhoneError(validatePhoneNumber(value));
    }

    if (value.length > 1) {
        const filtered = uniqueCustomers.filter(c => {
            if (field === 'name') return c.name.toLowerCase().includes(value.toLowerCase());
            if (field === 'nickname') return c.nickname?.toLowerCase().includes(value.toLowerCase());
            if (field === 'phone') return c.phone.includes(value);
            return false;
        });
        setSuggestions(filtered.slice(0, 5));
        setShowSuggestions(field as 'name' | 'phone' | 'nickname');
    } else {
        setSuggestions([]);
        setShowSuggestions(null);
    }
  };

  const selectCustomer = (c: Customer) => {
    setCustomer(c);
    setPhoneError(validatePhoneNumber(c.phone));
    setSuggestions([]);
    setShowSuggestions(null);
  };

  const blacklistedInfo = useMemo(() => checkIsBlacklisted(customer.phone, customer.name), [customer.name, customer.phone, checkIsBlacklisted]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
  const netSaleTotal = useMemo(() => Math.max(0, subtotal - (Number(discountValue) || 0)), [subtotal, discountValue]);

  const deposit = useMemo(() => (typeof amountPaid === 'number' ? amountPaid : 0), [amountPaid]);

  const totalInterest = useMemo(() => {
      if (paymentMode === 'full' || !selectedProduct?.interestRates) return 0;
      return Number(selectedProduct.interestRates[installmentsCount]) || 0;
  }, [selectedProduct, installmentsCount, paymentMode]);

  useEffect(() => {
      if (paymentMode === 'full') {
          setAmountPaid(netSaleTotal);
          setInstallmentsCount(0);
      }
  }, [paymentMode, netSaleTotal]);

  const finalTotalWithInterest = netSaleTotal + totalInterest;
  const totalDueIncludingInterest = Math.max(0, finalTotalWithInterest - deposit);
  const installmentAmt = useMemo(() => installmentsCount > 0 ? totalDueIncludingInterest / installmentsCount : 0, [totalDueIncludingInterest, installmentsCount]);

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    if (field === 'quantity' || field === 'price') newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].price || 0);
    setItems(newItems);
  };

  const handleProductSelect = (p: Product) => {
    const cleanItems = items.filter(i => i.description);
    setItems([...cleanItems, { productId: p.id, description: p.name, imei: p.imei || '', quantity: 1, price: p.price, amount: p.price }, createEmptyItem()]);
    setSelectedProduct(p);
    if (p.defaultDownPayment) setAmountPaid(p.defaultDownPayment);
    
    // Set installment count if default exists and is allowed, or pick first allowed
    if (p.defaultInstallmentCount && p.allowedInstallmentMonths?.includes(p.defaultInstallmentCount)) {
        setInstallmentsCount(p.defaultInstallmentCount);
    } else if (p.allowedInstallmentMonths && p.allowedInstallmentMonths.length > 0) {
        setInstallmentsCount(p.allowedInstallmentMonths[0]);
    } else {
        setInstallmentsCount(0);
    }
    setIsProductModalOpen(false);
  };

  const handleBarcodeScanSuccess = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode || p.imei === barcode);
    if (product) {
      handleProductSelect(product);
    } else {
      alert(`Product with barcode/IMEI "${barcode}" not found in Vault.`);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeImage(file);
        setCustomer(prev => ({ ...prev, photoUrl: optimized }));
      } catch (err) { console.error(err); }
    }
  };

  const nextInvoiceId = useMemo(() => {
    const prefix = 'INV-';
    const numericIds = invoices
        .map(inv => {
            if (isEditMode && initialInvoice.id === inv.id) return null;
            if (inv.id && inv.id.startsWith(prefix)) {
                const numPart = inv.id.substring(prefix.length);
                const num = parseInt(numPart, 10);
                // Date.now() is > 1.7e12, so anything less than 1e9 is likely sequential
                if (!isNaN(num) && num < 1000000000) return num;
            }
            return null;
        })
        .filter((n): n is number => n !== null);
    
    const nextNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1001;
    return `${prefix}${nextNum}`;
  }, [invoices]);

  const nextAccountNumber = useMemo(() => {
    const prefix = 'ACC-';
    const numericIds = invoices
        .map(inv => {
            if (isEditMode && initialInvoice.accountNumber === inv.accountNumber) return null;
            if (inv.accountNumber && inv.accountNumber.startsWith(prefix)) {
                const numPart = inv.accountNumber.substring(prefix.length);
                const num = parseInt(numPart, 10);
                if (!isNaN(num) && num < 1000000000) return num;
            }
            return null;
        })
        .filter((n): n is number => n !== null);
    
    const nextNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 5001;
    return `${prefix}${nextNum}`;
  }, [invoices]);

  const handleAddInvoice = (overrideLegalData?: any) => {
    // If called from onClick, the first arg is the event. We should ignore it.
    const isEvent = overrideLegalData && (overrideLegalData.nativeEvent || overrideLegalData.target);
    const activeLegalData = isEvent ? legalData : (overrideLegalData || legalData || (nicNumber ? { idNumber: nicNumber, signature, idPhotoFront, idPhotoBack } : null));
    
    const filteredItems = items.filter(i => i.description && i.quantity > 0);
    if (filteredItems.length === 0 || !customer.name.trim()) return alert("කරුණාකර පාරිභෝගික නම සහ අවම වශයෙන් එක් භාණ්ඩයක් ඇතුළත් කරන්න.");
    
    // Phone Validation (Warning only)
    const cleanPhone = customer.phone.replace(/\s/g, '');
    const error = validatePhoneNumber(cleanPhone) || (cleanPhone.length !== 10 ? "දුරකථන අංකය සඳහා ඉලක්කම් 10ක් තිබිය යුතුය." : null);
    if (error && !pendingInvoiceData) {
        setPendingInvoiceData(overrideLegalData);
        setShowPhoneWarning(true);
        return;
    }

    if (paymentMode === 'installment' && installmentsCount === 0) return alert("කරුණාකර වාරික සැලසුමක් (Month Plan) තෝරන්න.");

    // Trigger Legal Step for Installments (Desktop & Mobile)
    if (paymentMode === 'installment' && !activeLegalData) {
        setIsLegalModalOpen(true);
        return;
    }

    const installments: Installment[] = [];
    const payments: Payment[] = [];
    const getTodayStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const billDate = isOldBill ? customDate : getTodayStr();
    
    if (deposit > 0) payments.push({ id: `P-${Date.now()}`, amount: deposit, date: billDate, note: paymentMode === 'full' ? 'Full Payment' : 'Down Payment' });

    if (paymentMode === 'installment') {
        const existingPaidInstallments = initialInvoice?.installments.filter(i => i.paid) || [];
        const existingPaidAmount = existingPaidInstallments.reduce((sum, inst) => sum + (inst.paidAmount || inst.amount), 0);

        for (let i = 1; i <= installmentsCount; i++) {
            const d = new Date(isOldBill ? firstInstDate : billDate);
            if (!isOldBill) d.setMonth(d.getMonth() + i);
            else d.setMonth(d.getMonth() + i - 1);
            
            const dueDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            const existingPaid = existingPaidInstallments.find(inst => inst.installmentNumber === i);
            if (existingPaid) {
                installments.push(existingPaid);
            } else {
                installments.push({ installmentNumber: i, dueDate: dueDateStr, amount: installmentAmt, paid: false });
            }
        }
    }

    const payload: Invoice = {
      id: isEditMode ? initialInvoice.id : nextInvoiceId, 
      accountNumber: isEditMode ? initialInvoice.accountNumber : nextAccountNumber,
      customer, items: filteredItems, subtotal,
      totalAmount: finalTotalWithInterest, amountPaid: deposit, balance: totalDueIncludingInterest,
      status: totalDueIncludingInterest < 1 ? InvoiceStatus.Paid : InvoiceStatus.Partial,
      createdAt: isEditMode ? initialInvoice.createdAt : billDate, installments, 
      payments: isEditMode ? initialInvoice.payments : payments,
      paymentMode,
      legalData: activeLegalData,
      ...activeLegalData
    } as any;

    if (isEditMode && onUpdateInvoice) {
        onUpdateInvoice(payload);
    } else if (onAddInvoice) {
        onAddInvoice(payload, true);
        onDeductStock(filteredItems);
    }
    
    setLegalData(null); // Reset after adding
  };

  const handleLegalComplete = (data: { idNumber: string; signature: string; idPhotoFront: string; idPhotoBack: string }) => {
    setLegalData(data);
    setIsLegalModalOpen(false);
    handleAddInvoice(data);
  };

  const [activeStep, setActiveStep] = useState<number>(1);
  const [nicNumber, setNicNumber] = useState('');
  const [signature, setSignature] = useState('');
  const [idPhotoFront, setIdPhotoFront] = useState('');
  const [idPhotoBack, setIdPhotoBack] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPhoneWarning, setShowPhoneWarning] = useState(false);
  const [pendingInvoiceData, setPendingInvoiceData] = useState<any>(null);

  const isMobile = viewMode === 'mobile';
  const inputStyles = "w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-600/10 text-slate-800 dark:text-white";
  const labelStyles = "text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1";

  return (
    <div className={`max-w-6xl mx-auto grid grid-cols-1 ${isMobile ? '' : 'xl:grid-cols-12'} gap-8 pb-40 px-2`}>
        <div className={`${isMobile ? '' : 'xl:col-span-8'} space-y-6`}>
            {/* Mobile Step Indicator & Balance */}
            {isMobile && (
                <div className="space-y-4 mb-2">
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-900 rounded-[2rem] border border-white/5 shadow-xl">
                        <div className="flex flex-col">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Current Balance</p>
                            <p className="text-xl font-black text-rose-500 font-mono tracking-tighter">Rs. {Math.round(totalDueIncludingInterest).toLocaleString()}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-2" />
                        <div className="flex flex-col items-end">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Invoice ID</p>
                            <p className="text-[10px] font-black text-indigo-400">#{nextInvoiceId}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 rounded-3xl border border-white/5">
                        {[1, 2, 3, 4].map((step) => {
                            if (step === 4 && paymentMode === 'full') return null;
                            return (
                                <button 
                                    key={step}
                                    onClick={() => setActiveStep(step)}
                                    className={`flex items-center gap-2 transition-all ${activeStep === step ? 'text-indigo-400' : 'text-slate-600'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${activeStep === step ? 'bg-indigo-600/20 border-indigo-600' : 'border-slate-800'}`}>
                                        {step}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                        {step === 1 ? 'Client' : step === 2 ? 'Items' : step === 3 ? 'Plan' : 'Legal'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 1: Customer Identity */}
            {(!isMobile || activeStep === 1) && (
                <div className="space-y-6 animate-fade-in">
                    {/* Logic Mode Ribbon - Moved here for better flow */}
                    <div className={`bg-slate-950 p-2 rounded-[2.5rem] shadow-2xl flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2 border border-white/5`}>
                        <div className="flex flex-1 gap-2">
                            <button onClick={() => setPaymentMode('full')} className={`flex-1 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${paymentMode === 'full' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Full Payment</button>
                            <button onClick={() => setPaymentMode('installment')} className={`flex-1 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${paymentMode === 'installment' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Installments</button>
                        </div>
                        {!isMobile && <div className="h-px md:h-auto md:w-px bg-white/10 mx-2" />}
                        <button 
                            onClick={() => setIsOldBill(!isOldBill)} 
                            className={`flex-1 md:flex-none px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${isOldBill ? 'bg-amber-500 text-white shadow-xl' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                        >
                            <Clock className="w-4 h-4" strokeWidth={2.5} />
                            Legacy Entry Mode
                        </button>
                    </div>

                    {/* Legacy Date Controls */}
                    {isOldBill && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2.5rem] animate-fade-in-up grid grid-cols-1 md:grid-cols-2 gap-6 shadow-xl shadow-amber-500/5">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1 ml-1 block">Original Bill Date</label>
                                <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-xl font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-amber-500/10" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1 ml-1 block">First Installment Due Date</label>
                                <input type="date" value={firstInstDate} onChange={e => setFirstInstDate(e.target.value)} className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-xl font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-amber-500/10" />
                            </div>
                        </div>
                    )}

                    <div className={`bg-white dark:bg-slate-950 ${isMobile ? 'p-6' : 'p-8'} rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl`}>
                        <div className="flex items-center gap-3 mb-6"><div className="w-1.5 h-6 rounded-full bg-indigo-600" /> <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Customer Identity</h3></div>
                        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-6`}>
                            <div className={`flex-shrink-0 flex ${isMobile ? 'flex-row' : 'flex-col'} items-center gap-4`}>
                                <div className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-3xl bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center relative group shadow-inner uppercase`}>
                                    {customer.photoUrl ? <img src={customer.photoUrl} className="w-full h-full object-cover" alt="" /> : <User className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-slate-300`} strokeWidth={1.5} />}
                                    <button onClick={() => cameraInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase">
                                        <Camera className="w-5 h-5 mb-1" />
                                        Snapshot
                                    </button>
                                </div>
                                {isMobile && (
                                    <div className="flex-1 space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Photo</p>
                                        <button 
                                            onClick={() => cameraInputRef.current?.click()}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                                        >
                                            Take Photo
                                        </button>
                                    </div>
                                )}
                                <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
                            </div>
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className={labelStyles}>Name</label>
                                    <input 
                                        type="text" 
                                        value={customer.name} 
                                        onChange={e => handleCustomerChange('name', e.target.value)} 
                                        onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                                        className={inputStyles} 
                                        placeholder="Full Name..." 
                                    />
                                    {showSuggestions === 'name' && suggestions.length > 0 && (
                                        <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                                            {suggestions.map((s, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={() => selectCustomer(s)}
                                                    className="w-full px-5 py-4 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                                                >
                                                    <p className="font-black text-sm text-slate-800 dark:text-white">{s.name} {s.nickname ? `(${s.nickname})` : ''}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.phone}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <label className={labelStyles}>Nickname (සොයාගැනීමේ නම)</label>
                                    <input 
                                        type="text" 
                                        value={customer.nickname || ''} 
                                        onChange={e => handleCustomerChange('nickname', e.target.value)} 
                                        onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                                        className={inputStyles} 
                                        placeholder="Nickname..." 
                                    />
                                    {showSuggestions === 'nickname' && suggestions.length > 0 && (
                                        <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                                            {suggestions.map((s, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={() => selectCustomer(s)}
                                                    className="w-full px-5 py-4 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                                                >
                                                    <p className="font-black text-sm text-slate-800 dark:text-white">{s.nickname || s.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.name} - {s.phone}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <label className={labelStyles}>Phone</label>
                                    <input 
                                        type="tel" 
                                        value={customer.phone} 
                                        onChange={e => handleCustomerChange('phone', e.target.value)} 
                                        onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                                        className={`${inputStyles} ${phoneError ? 'border-rose-500 ring-rose-500/10' : ''}`} 
                                        placeholder="07XXXXXXXX" 
                                    />
                                    {phoneError && (
                                        <p className="text-[9px] font-bold text-rose-500 uppercase mt-1.5 ml-1 animate-pulse">
                                            {phoneError}
                                        </p>
                                    )}
                                    {showSuggestions === 'phone' && suggestions.length > 0 && (
                                        <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                                            {suggestions.map((s, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={() => selectCustomer(s)}
                                                    className="w-full px-5 py-4 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                                                >
                                                    <p className="font-black text-sm text-slate-800 dark:text-white">{s.phone}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.name}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2"><label className={labelStyles}>Address</label><input type="text" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className={inputStyles} placeholder="City / Address..." /></div>
                            </div>
                        </div>
                        {isMobile && (
                            <button 
                                onClick={() => setActiveStep(2)}
                                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-indigo-600/20"
                            >
                                Next: Add Items
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Items Registry */}
            {(!isMobile || activeStep === 2) && (
                <div className="space-y-6 animate-fade-in">
                    {/* Quick Product Selection - Mobile Only */}
                    {isMobile && products.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Add Product</h3>
                                </div>
                                <button 
                                    onClick={() => setIsProductModalOpen(true)}
                                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="flex overflow-x-auto gap-3 pb-2 px-2 custom-scroll -mx-2 px-2">
                                {products.slice(0, 8).map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleProductSelect(p)}
                                        className="flex-shrink-0 w-32 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-center active:scale-95 transition-all shadow-sm"
                                    >
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                                            <Package className="w-6 h-6 text-indigo-600" strokeWidth={2.5} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase truncate">{p.name}</p>
                                        <p className="text-[8px] font-bold text-slate-400 mt-0.5">Rs. {p.price.toLocaleString()}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={`bg-white dark:bg-slate-950 ${isMobile ? 'p-6' : 'p-8'} rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl`}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-emerald-600 rounded-full" /> <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Items Registry</h3></div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsBarcodeScannerOpen(true)} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                                    <QrCode className="w-4 h-4" strokeWidth={3} />
                                    Scan
                                </button>
                                <button onClick={() => setIsProductModalOpen(true)} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Vault Access</button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {items.map((item, idx) => (
                                <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                                    <input type="text" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} placeholder="Item Description..." className="bg-transparent font-black text-xl outline-none placeholder:text-slate-200 dark:text-white" />
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                        <div><label className={labelStyles}>IMEI / S.N</label><input type="text" value={item.imei} onChange={e => handleItemChange(idx, 'imei', e.target.value)} className="w-full bg-white dark:bg-slate-800 px-4 py-4 rounded-xl text-[11px] font-mono border border-slate-200 dark:border-slate-700 dark:text-white" /></div>
                                        <div><label className={labelStyles}>Price (රු.)</label><input type="number" value={item.price || ''} onChange={e => handleItemChange(idx, 'price', Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 px-4 py-4 rounded-xl text-base font-black border border-slate-200 dark:border-slate-700 dark:text-indigo-400" /></div>
                                        <div><label className={labelStyles}>Qty</label><input type="number" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 px-4 py-4 rounded-xl text-base font-black text-center border border-slate-200 dark:border-slate-700 dark:text-white" /></div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setItems([...items, createEmptyItem()])} className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all">+ New Line Item</button>
                        </div>
                        {isMobile && (
                            <div className="flex gap-4 mt-6">
                                <button onClick={() => setActiveStep(1)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-[11px]">Back</button>
                                <button onClick={() => setActiveStep(3)} className="flex-1 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-indigo-600/20">Next: Plan</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3: Payment Plan */}
            {(!isMobile || activeStep === 3) && (
                <div className="space-y-6 animate-fade-in">
                    <div className={`bg-white dark:bg-slate-950 ${isMobile ? 'p-6' : 'p-8'} rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8`}>
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyles}>Direct Discount</label>
                                <input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value) || '')} className={inputStyles} placeholder="0" />
                            </div>
                            {paymentMode === 'installment' && (
                                <div>
                                    <label className={labelStyles}>Down Payment (මූලික ගෙවීම)</label>
                                    <input type="number" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value) || '')} className={`${inputStyles} text-emerald-500 text-3xl border-emerald-100`} placeholder="0.00" />
                                </div>
                            )}
                        </div>
                        
                        {paymentMode === 'installment' ? (
                            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col justify-between shadow-inner">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-6 block">Select Month Plan</span>
                                    <div className="flex flex-wrap gap-3 mb-8">
                                        {allowedMonthOptions.map(m => {
                                            const hasSpecificPlan = selectedProduct?.interestRates && selectedProduct.interestRates[m] !== undefined;
                                            return (
                                                <button 
                                                    key={m} 
                                                    onClick={() => setInstallmentsCount(m)} 
                                                    className={`px-6 py-3.5 rounded-2xl text-[12px] font-black border transition-all ${installmentsCount === m ? 'bg-indigo-600 border-indigo-600 shadow-lg' : hasSpecificPlan ? 'bg-white/10 border-white/20' : 'bg-white/5 border-transparent opacity-20'}`}
                                                >
                                                    {m}M
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {installmentsCount > 0 ? (
                                    <div className="animate-fade-in">
                                        <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Monthly Installment</p>
                                        <p className="text-4xl font-black text-indigo-400 tracking-tighter tabular-nums">Rs. {Math.round(installmentAmt).toLocaleString()}</p>
                                        {totalInterest > 0 && <p className="text-[9px] font-black text-amber-500 uppercase mt-3 tracking-widest">+ Incl. Rs. {Math.round(totalInterest).toLocaleString()} total interest</p>}
                                    </div>
                                ) : <p className="text-xs text-slate-500 font-bold uppercase tracking-widest italic">Choose a period above...</p>}
                            </div>
                        ) : (
                            <div className="p-10 bg-emerald-600 rounded-[2.5rem] text-white flex flex-col items-center justify-center text-center shadow-2xl">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-base font-black uppercase tracking-[0.3em]">Full Cash Transaction</p>
                            </div>
                        )}
                    </div>
                    {isMobile && (
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setActiveStep(2)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-[11px]">Back</button>
                            {paymentMode === 'installment' ? (
                                <button onClick={() => setActiveStep(4)} className="flex-1 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-indigo-600/20">Next: Legal</button>
                            ) : (
                                <button onClick={() => handleAddInvoice()} className="flex-1 py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-emerald-600/20">Authorize</button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Step 4: Legal Agreement (Mobile Only) */}
            {isMobile && activeStep === 4 && paymentMode === 'installment' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white dark:bg-slate-950 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Legal Agreement</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelStyles}>NIC Number</label>
                                <input 
                                    type="text" 
                                    value={nicNumber} 
                                    onChange={e => setNicNumber(e.target.value)} 
                                    className={inputStyles} 
                                    placeholder="Enter NIC..." 
                                />
                            </div>

                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl">
                                <p className="text-[9px] font-bold text-amber-600 uppercase leading-relaxed">
                                    හඳුනුම්පත් ඡායාරූප සහ අත්සන ඇතුළත් කිරීමට පහත බොත්තම භාවිතා කරන්න.
                                </p>
                            </div>

                            <button 
                                onClick={() => setIsLegalModalOpen(true)}
                                className="w-full py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {legalData ? 'Review Legal Data' : 'Capture ID & Signature'}
                            </button>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setActiveStep(3)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-[11px]">Back</button>
                            <button 
                                onClick={() => {
                                    if (!nicNumber && !legalData) return alert('කරුණාකර NIC අංකය ඇතුළත් කරන්න.');
                                    if (!legalData) return setIsLegalModalOpen(true);
                                    handleAddInvoice();
                                }} 
                                className="flex-1 py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-emerald-600/20"
                            >
                                {isEditMode ? 'Update' : 'Authorize'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Floating Side Summary */}
        {(!isMobile || (activeStep === 3 && paymentMode === 'full') || (activeStep === 4 && paymentMode === 'installment')) && (
            <div className={`${isMobile ? 'fixed bottom-20 left-0 right-0 z-[70] px-4 pb-4' : 'xl:col-span-4 h-full sticky top-32'}`}>
                <div className={`bg-slate-950 text-white shadow-2xl flex flex-col border border-white/5 relative overflow-hidden transition-all ${isMobile ? 'rounded-[2rem] p-6 space-y-4' : 'rounded-[3.5rem] p-10 space-y-8'}`}>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-[80px] -mr-20 -mt-20"></div>
                    <div className={`flex-grow relative z-10 ${isMobile ? 'flex items-center justify-between' : 'space-y-6'}`}>
                        {!isMobile ? (
                            <>
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Registry Summary</p>
                                    <span className="text-[10px] font-black text-slate-500 bg-white/5 px-2 py-1 rounded-lg">#{nextInvoiceId}</span>
                                </div>
                                <p className="text-3xl font-black truncate tracking-tighter uppercase">{customer.name || 'Anonymous client'}</p>
                                <div className="space-y-3 pt-6 border-t border-white/5">
                                    <div className="flex justify-between text-xs text-slate-500 font-bold"><span>Item Value</span><span className="font-mono">Rs. {Math.round(subtotal).toLocaleString()}</span></div>
                                    {totalInterest > 0 && <div className="flex justify-between text-xs text-amber-500 font-bold"><span>Total Interest</span><span className="font-mono">+ Rs. {Math.round(totalInterest).toLocaleString()}</span></div>}
                                    <div className="flex justify-between text-xs text-emerald-400 font-bold"><span>Deposit Paid</span><span className="font-mono">Rs. {Math.round(deposit).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-2xl font-black pt-6 border-t border-white/10 mt-6"><span>Balance</span><span className="text-rose-500 font-mono tracking-tighter">Rs. {Math.round(totalDueIncludingInterest).toLocaleString()}</span></div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Balance</p>
                                    <span className="text-[8px] font-black text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">#{nextInvoiceId}</span>
                                </div>
                                <p className="text-2xl font-black text-rose-500 font-mono tracking-tighter">Rs. {Math.round(totalDueIncludingInterest).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => {
                            if (isMobile && activeStep === 4 && paymentMode === 'installment') {
                                if (!nicNumber && !legalData) return alert('කරුණාකර NIC අංකය ඇතුළත් කරන්න.');
                                if (!legalData) return setIsLegalModalOpen(true);
                            }
                            handleAddInvoice();
                        }} 
                        className={`relative z-10 w-full rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl transition-all active:scale-95 ${isMobile ? 'py-5' : 'py-7'} ${blacklistedInfo ? 'bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}
                    >
                        {isEditMode ? 'Update Ledger Details' : (isMobile ? 'Authorize' : 'Authorize Bill')}
                    </button>
                    {isEditMode && onCancel && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onCancel(); }}
                            className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-colors"
                        >
                            Cancel Changes
                        </button>
                    )}
                </div>
            </div>
        )}
      
      <ProductSelectionModal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        products={products} 
        onAddProduct={handleProductSelect} 
      />

      <LegalStepModal 
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          onComplete={handleLegalComplete}
          customerName={customer.name}
          totalAmount={finalTotalWithInterest}
          installmentsCount={installmentsCount}
          installmentAmount={installmentAmt}
      />

      <BarcodeScannerModal 
          isOpen={isBarcodeScannerOpen}
          onClose={() => setIsBarcodeScannerOpen(false)}
          onScanSuccess={handleBarcodeScanSuccess}
      />

      <ConfirmationModal 
        isOpen={showPhoneWarning}
        onClose={() => {
            setShowPhoneWarning(false);
            setPendingInvoiceData(null);
        }}
        onConfirm={() => {
            setShowPhoneWarning(false);
            handleAddInvoice(pendingInvoiceData);
            setPendingInvoiceData(null);
        }}
        title="Phone Number Warning"
        message="දුරකථන අංකය වැරදි බව පෙනේ. එසේ වුවද මෙම බිල්පත ඇතුළත් කිරීමට ඔබට අවශ්‍යද? (Phone number seems invalid. Do you still want to proceed?)"
      />
    </div>
  );
};

export default NewInvoiceForm;