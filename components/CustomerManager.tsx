
import React, { useState, useMemo } from 'react';
import type { Invoice, Customer, ActiveTab, BlacklistedCustomer } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import Modal from './Modal';
import { ArrowUpDown, User, TrendingUp } from 'lucide-react';

interface CustomerRecord extends Customer {
    id: string;
    accountNumber: string;
    totalPurchases: number;
    totalPaid: number;
    totalBalance: number;
    purchaseHistory: Invoice[];
    lastPurchaseDate: string;
}

interface CustomerManagerProps {
    invoices: Invoice[];
    onNavigateToInvoice: (invoiceId: string) => void;
    viewMode?: 'pc' | 'mobile';
    selectedCustomerId: string | null;
    onSelectCustomer: (id: string | null) => void;
    blacklist: BlacklistedCustomer[];
    onAddToBlacklist: (customer: Omit<BlacklistedCustomer, 'id' | 'createdAt'>) => void;
    onRemoveFromBlacklist: (id: string) => void;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({ 
    invoices, 
    onNavigateToInvoice, 
    viewMode = 'pc',
    selectedCustomerId,
    onSelectCustomer,
    blacklist,
    onAddToBlacklist,
    onRemoveFromBlacklist
}) => {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'purchases'>('purchases');
    const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
    const [blacklistReason, setBlacklistReason] = useState('');
    const isMobile = viewMode === 'mobile';

    const customers = useMemo(() => {
        const customerMap = new Map<string, CustomerRecord>();

        invoices.forEach(inv => {
            const phone = inv.customer.phone;
            if (!customerMap.has(phone)) {
                customerMap.set(phone, {
                    ...inv.customer,
                    id: phone,
                    accountNumber: inv.accountNumber || 'N/A',
                    totalPurchases: 0,
                    totalPaid: 0,
                    totalBalance: 0,
                    purchaseHistory: [],
                    lastPurchaseDate: inv.createdAt
                });
            }

            const record = customerMap.get(phone)!;
            record.totalPurchases += inv.totalAmount;
            record.totalPaid += inv.amountPaid;
            record.totalBalance += inv.balance;
            record.purchaseHistory.push(inv);
            
            if (new Date(inv.createdAt) > new Date(record.lastPurchaseDate)) {
                record.lastPurchaseDate = inv.createdAt;
                record.accountNumber = inv.accountNumber || record.accountNumber;
            }
        });

        return Array.from(customerMap.values()).sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            }
            return b.totalPurchases - a.totalPurchases;
        });
    }, [invoices, sortBy]);

    const filteredCustomers = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return customers.filter(c => 
            c.name.toLowerCase().includes(q) || 
            (c.nickname && c.nickname.toLowerCase().includes(q)) ||
            c.phone.includes(q)
        );
    }, [customers, searchQuery]);

    const selectedCustomer = useMemo(() => 
        customers.find(c => c.id === selectedCustomerId), 
    [customers, selectedCustomerId]);

    const blacklistedInfo = useMemo(() => {
        if (!selectedCustomer) return null;
        const cleanPhone = selectedCustomer.phone.replace(/[^0-9]/g, '');
        return blacklist.find(c => {
            const matchPhone = cleanPhone && c.phone.replace(/[^0-9]/g, '') === cleanPhone;
            const matchName = selectedCustomer.name.toLowerCase().trim() === c.name.toLowerCase().trim();
            return matchPhone || matchName;
        });
    }, [blacklist, selectedCustomer]);

    const handleBlacklist = () => {
        if (!selectedCustomer) return;
        if (blacklistedInfo) {
            onRemoveFromBlacklist(blacklistedInfo.id);
        } else {
            setIsBlacklistModalOpen(true);
        }
    };

    const confirmBlacklist = () => {
        if (!selectedCustomer || !blacklistReason) return;
        onAddToBlacklist({
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
            reason: blacklistReason
        });
        setBlacklistReason('');
        setIsBlacklistModalOpen(false);
    };

    return (
        <div className={`space-y-8 animate-fade-in ${isMobile ? 'pb-24' : 'pb-32'}`}>
            {/* Header Section */}
            <div className={`flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-900/60 rounded-[2.5rem] border border-slate-800/40 backdrop-blur-xl shadow-2xl ${isMobile ? 'p-6' : 'p-8'}`}>
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-10 bg-indigo-600 rounded-full" />
                    <div>
                        <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-black text-white tracking-tighter uppercase leading-none`}>Customer Registry</h2>
                        <p className="text-slate-500 font-bold uppercase text-[8px] tracking-[0.3em] mt-1.5">පාරිභෝගික කළමනාකරණය (Customer Management)</p>
                    </div>
                </div>
                
                <div className={`relative w-full group ${isMobile ? '' : 'lg:w-96'}`}>
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Customers / සොයන්න..."
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Customer List */}
                <div className={`xl:col-span-5 bg-white dark:bg-slate-950/80 rounded-[3rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl overflow-hidden backdrop-blur-xl flex flex-col h-[700px]`}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-900/50 flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Registry Records</p>
                            <div className="flex bg-slate-50 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-100 dark:border-slate-800 mt-1">
                                <button 
                                    onClick={() => setSortBy('name')}
                                    className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all flex items-center gap-1.5 ${sortBy === 'name' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    <User className="w-2.5 h-2.5" />
                                    Name
                                </button>
                                <button 
                                    onClick={() => setSortBy('purchases')}
                                    className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all flex items-center gap-1.5 ${sortBy === 'purchases' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    <TrendingUp className="w-2.5 h-2.5" />
                                    Value
                                </button>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-indigo-600/10 text-indigo-500 rounded-full text-[10px] font-black">{filteredCustomers.length} Total</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-2">
                        {filteredCustomers.map(customer => (
                            <button
                                key={customer.id}
                                onClick={() => onSelectCustomer(customer.id)}
                                className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center gap-4 group ${selectedCustomerId === customer.id ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]' : 'hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-sm transition-transform group-hover:scale-110 ${selectedCustomerId === customer.id ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-black uppercase tracking-tight truncate ${selectedCustomerId === customer.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        {customer.name} {customer.nickname ? <span className="text-[10px] opacity-60 ml-1">({customer.nickname})</span> : ''}
                                    </p>
                                    <p className={`text-[10px] font-bold tracking-widest ${selectedCustomerId === customer.id ? 'text-white/60' : 'text-slate-400'}`}>{customer.phone}</p>
                                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 ${selectedCustomerId === customer.id ? 'text-indigo-200' : 'text-indigo-500'}`}>ACC: {customer.accountNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xs font-black tabular-nums ${selectedCustomerId === customer.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Rs. {Math.round(customer.totalPurchases).toLocaleString()}</p>
                                    <p className={`text-[8px] font-bold uppercase ${selectedCustomerId === customer.id ? 'text-white/40' : 'text-slate-400'}`}>Total Volume</p>
                                </div>
                            </button>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                <p className="font-black uppercase tracking-[0.4em] text-[10px]">No Customers Found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Customer Detail View */}
                <div className={`xl:col-span-7 bg-white dark:bg-slate-950/80 rounded-[3rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl overflow-hidden backdrop-blur-xl min-h-[700px] flex flex-col`}>
                    <AnimatePresence mode="wait">
                        {selectedCustomer ? (
                            <motion.div
                                key={selectedCustomer.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col h-full"
                            >
                                {/* Detail Header */}
                                <div className="p-10 bg-slate-900 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[80px] -mr-20 -mt-20 rounded-full" />
                                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                                        <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-white/10">
                                            {selectedCustomer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-center md:text-left flex-1">
                                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                                                <h3 className="text-4xl font-black tracking-tighter uppercase leading-none">
                                                    {selectedCustomer.name}
                                                </h3>
                                                {blacklistedInfo && (
                                                    <span className="inline-flex items-center px-4 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-rose-600/20 animate-pulse">
                                                        Blacklisted
                                                    </span>
                                                )}
                                            </div>
                                            {selectedCustomer.nickname && (
                                                <span className="block text-xl text-indigo-400 mb-2 opacity-80">({selectedCustomer.nickname})</span>
                                            )}
                                            <p className="text-indigo-400 font-black tracking-[0.3em] uppercase text-xs">{selectedCustomer.phone}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Account:</span>
                                                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-mono font-black border border-indigo-500/30">
                                                    {selectedCustomer.accountNumber}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-sm mt-4 font-bold max-w-md">{selectedCustomer.address || 'No address provided'}</p>
                                            
                                            <div className="mt-8 flex flex-wrap gap-4">
                                                <button
                                                    onClick={handleBlacklist}
                                                    className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 flex items-center gap-2 ${
                                                        blacklistedInfo 
                                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                                                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/20'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        {blacklistedInfo ? (
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        ) : (
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                                                        )}
                                                    </svg>
                                                    {blacklistedInfo ? 'Remove from Blacklist' : 'Add to Blacklist'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Ribbon */}
                                <div className="grid grid-cols-3 border-b border-slate-100 dark:border-slate-900/50">
                                    <div className="p-8 text-center border-r border-slate-100 dark:border-slate-900/50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Volume</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">Rs. {Math.round(selectedCustomer.totalPurchases).toLocaleString()}</p>
                                    </div>
                                    <div className="p-8 text-center border-r border-slate-100 dark:border-slate-900/50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                                        <p className="text-2xl font-black text-emerald-500 tracking-tighter tabular-nums">Rs. {Math.round(selectedCustomer.totalPaid).toLocaleString()}</p>
                                    </div>
                                    <div className="p-8 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
                                        <p className="text-2xl font-black text-rose-500 tracking-tighter tabular-nums">Rs. {Math.round(selectedCustomer.totalBalance).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Purchase History */}
                                <div className="flex-1 p-10 overflow-y-auto custom-scroll">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                                        <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Purchase History</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {selectedCustomer.purchaseHistory.map(inv => (
                                            <div 
                                                key={inv.id}
                                                onClick={() => onNavigateToInvoice(inv.id)}
                                                className="group bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 p-6 rounded-[2rem] flex flex-col gap-4 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">Invoice #{inv.id}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(inv.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums tracking-tighter leading-none mb-1">Rs. {Math.round(inv.totalAmount).toLocaleString()}</p>
                                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                                            inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 
                                                            inv.status === 'Overdue' ? 'bg-rose-500/10 text-rose-500' : 
                                                            'bg-amber-500/10 text-amber-500'
                                                        }`}>
                                                            {inv.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Items Purchased List */}
                                                <div className="pl-16 pr-6 pb-2">
                                                    <div className="flex flex-wrap gap-2">
                                                        {inv.items.map((item, idx) => (
                                                            <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                                {item.description} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-20 p-20 text-center">
                                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-900 rounded-[3rem] flex items-center justify-center mb-8">
                                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-[0.3em] mb-2">Select a Customer</h3>
                                <p className="text-xs font-bold uppercase tracking-widest">පාරිභෝගිකයෙකු තෝරන්න</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <Modal 
                isOpen={isBlacklistModalOpen} 
                onClose={() => setIsBlacklistModalOpen(false)} 
                title="Add to Blacklist"
            >
                <div className="space-y-6 p-2">
                    <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-3xl border border-rose-100 dark:border-rose-900/30">
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400 leading-relaxed">
                            You are about to blacklist <span className="font-black underline">{selectedCustomer?.name}</span>. This will flag them across the system for all future invoices.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Reason for Blacklisting</label>
                        <textarea
                            value={blacklistReason}
                            onChange={(e) => setBlacklistReason(e.target.value)}
                            placeholder="e.g. Non-payment, Fraudulent behavior..."
                            className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 min-h-[120px]"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={() => setIsBlacklistModalOpen(false)}
                            className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmBlacklist}
                            disabled={!blacklistReason}
                            className="flex-1 py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all disabled:opacity-50"
                        >
                            Confirm Blacklist
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
