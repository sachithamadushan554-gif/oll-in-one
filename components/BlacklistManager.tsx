import React, { useState, useMemo } from 'react';
import type { BlacklistedCustomer } from '../types';
import Modal, { ConfirmationModal } from './Modal';
import { useLanguage } from '../contexts/LanguageContext';

interface BlacklistManagerProps {
    blacklist: BlacklistedCustomer[];
    onAdd: (customer: Omit<BlacklistedCustomer, 'id' | 'createdAt'>) => void;
    onRemove: (id: string) => void;
}

export const BlacklistManager: React.FC<BlacklistManagerProps> = ({ blacklist, onAdd, onRemove }) => {
    const { t } = useLanguage();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [customerToRemove, setCustomerToRemove] = useState<BlacklistedCustomer | null>(null);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [reason, setReason] = useState('');

    const filteredList = useMemo(() => {
        if (!searchQuery) return blacklist;
        const q = searchQuery.toLowerCase();
        return blacklist.filter(c => 
            c.name.toLowerCase().includes(q) || 
            c.phone.includes(q) || 
            c.reason.toLowerCase().includes(q)
        );
    }, [blacklist, searchQuery]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone || !reason) return;
        onAdd({ name, phone, reason });
        setName('');
        setPhone('');
        setReason('');
        setIsAddModalOpen(false);
    };

    const inputStyle = "w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-semibold";

    return (
        <div className="space-y-8 px-2 sm:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter flex items-center gap-4">
                        <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        {t('blacklist_title')}
                    </h2>
                    <p className="text-slate-500 font-semibold mt-2">{t('blacklist_subtitle')}</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-rose-600/30 transition-all active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    {t('blacklist_add_btn')}
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-slate-800/80 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="relative max-w-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input 
                            type="search"
                            placeholder={t('blacklist_search_placeholder')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-rose-500/10 outline-none font-bold text-sm"
                        />
                    </div>
                </div>

                {/* Adaptive List/Table */}
                <div className="overflow-hidden">
                    {/* Desktop View (Table) */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">
                                <tr>
                                    <th className="px-8 py-5 text-left">{t('blacklist_col_customer')}</th>
                                    <th className="px-8 py-5 text-left">{t('blacklist_col_reason')}</th>
                                    <th className="px-8 py-5 text-left">{t('blacklist_col_date')}</th>
                                    <th className="px-8 py-5 text-right">{t('blacklist_col_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredList.map(item => (
                                    <tr key={item.id} className="hover:bg-rose-50/20 dark:hover:bg-rose-900/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-800 dark:text-slate-100 text-base">{item.name}</p>
                                            <p className="text-xs text-slate-400 font-mono font-bold mt-1 uppercase tracking-widest">{item.phone}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30">
                                                {item.reason}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-slate-500">
                                            {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => setCustomerToRemove(item)}
                                                className="opacity-0 group-hover:opacity-100 p-3 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl transition-all"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredList.map(item => (
                            <div key={item.id} className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-black text-slate-800 dark:text-slate-100 text-lg">{item.name}</p>
                                        <p className="text-xs text-slate-400 font-mono font-bold mt-1 uppercase tracking-widest">{item.phone}</p>
                                    </div>
                                    <button 
                                        onClick={() => setCustomerToRemove(item)}
                                        className="p-3 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-2xl"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                                <div className="space-y-2 pt-2">
                                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Reason for blacklist</p>
                                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">{item.reason}</p>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase text-right">{new Date(item.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>

                    {filteredList.length === 0 && (
                        <div className="py-24 text-center px-10">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-slate-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <p className="text-lg font-black text-slate-400 uppercase tracking-widest">{blacklist.length === 0 ? t('blacklist_empty') : t('blacklist_no_results')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('blacklist_add_modal_title')}>
                <form onSubmit={handleAdd} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{t('blacklist_label_name')}</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputStyle} placeholder="Full name..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{t('blacklist_label_phone')}</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className={inputStyle} placeholder="Contact number..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{t('blacklist_label_reason')}</label>
                        <textarea 
                            value={reason} 
                            onChange={e => setReason(e.target.value)} 
                            required 
                            className={`${inputStyle} h-32 resize-none`} 
                            placeholder="Reason for flagging this customer..."
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-6">
                        <button 
                            type="button" 
                            onClick={() => setIsAddModalOpen(false)}
                            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {t('blacklist_btn_cancel')}
                        </button>
                        <button 
                            type="submit"
                            className="flex-[2] py-5 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-rose-600/30 transition-all transform active:scale-95"
                        >
                            {t('blacklist_btn_confirm')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal 
                isOpen={!!customerToRemove}
                onClose={() => setCustomerToRemove(null)}
                onConfirm={() => { if (customerToRemove) onRemove(customerToRemove.id); setCustomerToRemove(null); }}
                title={t('blacklist_remove_title')}
                message={t('blacklist_remove_message', customerToRemove?.name || '')}
            />
        </div>
    );
};