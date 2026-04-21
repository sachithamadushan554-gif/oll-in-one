
import React, { useState, useMemo } from 'react';
import { useRecurringInvoices } from '../hooks/useRecurringInvoices';
import { useLanguage } from '../contexts/LanguageContext';
import type { RecurringInvoice, Customer, InvoiceItem, RecurringFrequency, Invoice } from '../types';
import { Plus, Play, Pause, Trash2, RefreshCw, Calendar, User, DollarSign, Clock } from 'lucide-react';

interface RecurringBillingViewProps {
    invoices: Invoice[];
    addInvoice: (inv: Invoice) => void;
    viewMode?: 'pc' | 'mobile';
}

const RecurringBillingView: React.FC<RecurringBillingViewProps> = ({ invoices, addInvoice, viewMode = 'pc' }) => {
    const { t, language } = useLanguage();
    const { recurringInvoices, addRecurringInvoice, updateRecurringInvoice, deleteRecurringInvoice, processDueCycles } = useRecurringInvoices();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCycle, setEditingCycle] = useState<RecurringInvoice | null>(null);

    // Form State
    const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', address: '', nickname: '' });
    const [amount, setAmount] = useState<number>(0);
    const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalCycles, setTotalCycles] = useState<number | ''>('');
    const [notes, setNotes] = useState('');

    const uniqueCustomers = useMemo(() => {
        const map = new Map<string, Customer>();
        invoices.forEach(inv => {
            if (inv.customer?.phone) {
                map.set(inv.customer.phone, inv.customer);
            }
        });
        return Array.from(map.values());
    }, [invoices]);

    const [suggestions, setSuggestions] = useState<Customer[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleCustomerSearch = (val: string) => {
        setCustomer(prev => ({ ...prev, name: val }));
        if (val.length > 1) {
            const filtered = uniqueCustomers.filter(c => 
                c.name.toLowerCase().includes(val.toLowerCase()) || 
                c.phone.includes(val) || 
                (c.nickname && c.nickname.toLowerCase().includes(val.toLowerCase()))
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSelectCustomer = (c: Customer) => {
        setCustomer(c);
        setShowSuggestions(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer.name || !customer.phone || amount <= 0) return;

        const cycle: RecurringInvoice = {
            id: editingCycle?.id || `REC-${Date.now()}`,
            customer,
            items: [{ description: editingCycle?.notes || 'Recurring Service', quantity: 1, price: amount, amount: amount, imei: '' }],
            frequency,
            amount,
            startDate,
            nextGenerationDate: startDate,
            status: 'active',
            totalCycles: totalCycles === '' ? undefined : totalCycles,
            completedCycles: editingCycle?.completedCycles || 0,
            notes
        };

        if (editingCycle) {
            updateRecurringInvoice(cycle);
        } else {
            addRecurringInvoice(cycle);
        }

        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setEditingCycle(null);
        setCustomer({ name: '', phone: '', address: '', nickname: '' });
        setAmount(0);
        setFrequency('monthly');
        setStartDate(new Date().toISOString().split('T')[0]);
        setTotalCycles('');
        setNotes('');
    };

    const openEdit = (cycle: RecurringInvoice) => {
        setEditingCycle(cycle);
        setCustomer(cycle.customer);
        setAmount(cycle.amount);
        setFrequency(cycle.frequency);
        setStartDate(cycle.startDate);
        setTotalCycles(cycle.totalCycles || '');
        setNotes(cycle.notes || '');
        setIsModalOpen(true);
    };

    const isMobile = viewMode === 'mobile';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white uppercase">
                        {t('recurring_title')}
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        {t('recurring_subtitle')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => processDueCycles(addInvoice)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-indigo-200 transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {t('recurring_generate_now')}
                    </button>
                    <button 
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-105 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        {t('recurring_add_btn')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recurringInvoices.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                            {t('recurring_no_cycles')}
                        </p>
                    </div>
                ) : (
                    recurringInvoices.map(cycle => (
                        <div key={cycle.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">
                                            {cycle.customer.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-bold">{cycle.customer.phone}</p>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                    cycle.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 
                                    cycle.status === 'paused' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {cycle.status}
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3" /> {t('recurring_frequency')}
                                    </span>
                                    <span className="text-slate-700 dark:text-slate-300 font-black uppercase">
                                        {t(`recurring_${cycle.frequency}`)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" /> {t('amount')}
                                    </span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-black">
                                        Rs. {cycle.amount.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {t('recurring_next_date')}
                                    </span>
                                    <span className="text-slate-700 dark:text-slate-300 font-black">
                                        {cycle.nextGenerationDate}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => updateRecurringInvoice({ ...cycle, status: cycle.status === 'active' ? 'paused' : 'active' })}
                                    className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all"
                                >
                                    {cycle.status === 'active' ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
                                </button>
                                <button 
                                    onClick={() => openEdit(cycle)}
                                    className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all"
                                >
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                </button>
                                <button 
                                    onClick={() => deleteRecurringInvoice(cycle.id)}
                                    className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl flex items-center justify-center transition-all group/del"
                                >
                                    <Trash2 className="w-4 h-4 text-slate-400 group-hover/del:text-rose-500" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-8">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-6">
                                {editingCycle ? 'Edit Cycle' : t('recurring_add_btn')}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="relative">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Customer Name</label>
                                    <input 
                                        type="text"
                                        value={customer.name}
                                        onChange={(e) => handleCustomerSearch(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="Search or enter name..."
                                        required
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-48 overflow-y-auto custom-scroll">
                                            {suggestions.map(c => (
                                                <button 
                                                    key={c.phone}
                                                    type="button"
                                                    onClick={() => handleSelectCustomer(c)}
                                                    className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex flex-col"
                                                >
                                                    <span className="text-sm font-black text-slate-800 dark:text-white">{c.name}</span>
                                                    <span className="text-[10px] text-slate-500">{c.phone}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                                    <input 
                                        type="text"
                                        value={customer.phone}
                                        onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="07XXXXXXXX"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Amount (Rs.)</label>
                                        <input 
                                            type="number"
                                            value={amount || ''}
                                            onChange={(e) => setAmount(Number(e.target.value))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('recurring_frequency')}</label>
                                        <select 
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                        >
                                            <option value="daily">{t('recurring_daily')}</option>
                                            <option value="weekly">{t('recurring_weekly')}</option>
                                            <option value="monthly">{t('recurring_monthly')}</option>
                                            <option value="yearly">{t('recurring_yearly')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
                                        <input 
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Total Cycles (Optional)</label>
                                        <input 
                                            type="number"
                                            value={totalCycles}
                                            onChange={(e) => setTotalCycles(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                            placeholder="Infinite"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Service Description / Notes</label>
                                    <textarea 
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all h-20 resize-none"
                                        placeholder="e.g. Monthly Maintenance Fee"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-[1.02] transition-all"
                                    >
                                        {editingCycle ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecurringBillingView;
