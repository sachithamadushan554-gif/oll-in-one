import React, { useState, useCallback, useEffect } from 'react';
import type { BlankBillData, BlankBillItem, ShopDetails, BlankBillRecord, BlankBillSettings } from '../types';

interface BlankBillProps {
    shopDetails: ShopDetails;
    onPrint: (billData: BlankBillData) => void;
    onPrintEmptyBlankBill: () => void;
    log: BlankBillRecord[];
    addBillToLog: (record: BlankBillRecord) => void;
    deleteBillFromLog: (invoiceNumber: string) => void;
    settings?: BlankBillSettings;
}

const createEmptyItem = (): BlankBillItem => ({
    model: '',
    imei: '',
    rate: '',
    qty: '',
    amount: '',
});

const FIXED_ROWS = 8;

const BlankBill: React.FC<BlankBillProps> = ({ shopDetails, onPrint, onPrintEmptyBlankBill, log, addBillToLog, deleteBillFromLog, settings }) => {
    const [customer, setCustomer] = useState({ name: '', address: '', phone: '' });
    const [date, setDate] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [items, setItems] = useState<BlankBillItem[]>(Array.from({ length: FIXED_ROWS }, createEmptyItem));
    const [subtotal, setSubtotal] = useState('');
    const [total, setTotal] = useState('');
    const [notes, setNotes] = useState('');

    const viewMode = settings?.viewMode || 'pc';

    const getNextBillNumber = useCallback(() => {
        const year = new Date().getFullYear();
        const key = `blankBillCounter_v3_${year}`;
        let nextCount = 1;
        try {
            const savedCounter = localStorage.getItem(key);
            if (savedCounter) nextCount = parseInt(savedCounter, 10) + 1;
            else if (year === 2025) nextCount = 50; 
        } catch (e) { console.error(e); }
        return `BB ${year}-${String(nextCount).padStart(5, '0')}`;
    }, []);

    useEffect(() => {
        setInvoiceNumber(getNextBillNumber());
        setDate(new Date().toISOString().split('T')[0]);
    }, [getNextBillNumber]);

    const handleItemChange = (index: number, field: keyof BlankBillItem, value: string) => {
        const newItems = [...items];
        const item = { ...newItems[index] };
        (item[field] as any) = value;
        newItems[index] = item;
        setItems(newItems);
    };

    const handlePrintClick = () => {
        const billData: BlankBillData = {
            customer,
            invoiceNumber,
            date,
            items,
            subtotal,
            discountValue: '', 
            total,
            notes
        };
        
        addBillToLog(billData as any);
        onPrint(billData);

        const match = invoiceNumber.match(/^BB (\d{4})-(\d+)$/);
        if (match) {
            localStorage.setItem(`blankBillCounter_v3_${match[1]}`, parseInt(match[2], 10).toString());
        }
        resetForm();
    };

    const resetForm = () => {
        setCustomer({ name: '', address: '', phone: '' });
        setInvoiceNumber(getNextBillNumber());
        setDate(new Date().toISOString().split('T')[0]);
        setItems(Array.from({ length: FIXED_ROWS }, createEmptyItem));
        setSubtotal('');
        setTotal('');
        setNotes('');
    };

    const inputStyle = "w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all font-semibold text-sm";
    const labelStyles = "text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1";

    return (
        <div className={`max-w-5xl mx-auto space-y-6 md:space-y-10 stagger-child pb-40 ${viewMode === 'mobile' ? 'px-2' : ''}`}>
            {/* Context Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                        {shopDetails.name || 'Saman Mobile'}
                    </h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-1">Manual Billing Mode • <span className="text-indigo-500 uppercase">{viewMode} Optimized</span></p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={onPrintEmptyBlankBill} className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-200 dark:bg-indigo-900/50 transition-all shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v3a2 2 0 002 2h6a2 2 0 002-2v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                        <span className="hidden sm:inline">Templates (A4)</span>
                        <span className="sm:hidden">Templates</span>
                    </button>
                    <button onClick={resetForm} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all">Reset</button>
                </div>
            </div>

            {/* Customer Section */}
            <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white dark:bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-1.5 w-8 bg-indigo-600 rounded-full"></div>
                        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-slate-400">Customer Identity</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-4">
                            <div><label className={labelStyles}>Client Name</label><input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className={inputStyle} placeholder="John Doe" /></div>
                            <div><label className={labelStyles}>Contact Phone</label><input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className={inputStyle} placeholder="07XXXXXXXX" /></div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelStyles}>Ref No</label><input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className={inputStyle} /></div>
                                <div><label className={labelStyles}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputStyle} /></div>
                            </div>
                            <div><label className={labelStyles}>Address</label><input value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className={inputStyle} placeholder="Location details..." /></div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-white dark:bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-center">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-slate-400">Manual Subtotal</span>
                            <input value={subtotal} onChange={e => setSubtotal(e.target.value)} className="bg-transparent text-right font-black text-xl outline-none w-32 border-b border-dashed border-slate-300 dark:border-slate-700" placeholder="0.00" />
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-2">Net Payable</p>
                            <input value={total} onChange={e => setTotal(e.target.value)} className="bg-transparent text-center md:text-right font-black text-4xl tracking-tighter text-slate-900 dark:text-white outline-none w-full" placeholder="0.00" />
                        </div>
                        {viewMode === 'pc' && (
                            <button onClick={handlePrintClick} className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v3a2 2 0 002 2h6a2 2 0 002-2v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                                Authorize Receipt
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Items Interface */}
            <div className="bg-white dark:bg-slate-950 p-4 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <div className="h-1.5 w-8 bg-indigo-500 rounded-full"></div>
                    <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-slate-400">Inventory Registry</h3>
                </div>
                
                {viewMode === 'pc' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-indigo-50 dark:bg-indigo-900/20">
                                <tr>
                                    <th className="px-4 py-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest w-12">#</th>
                                    <th className="px-4 py-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest">Model / Description</th>
                                    <th className="px-4 py-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest">IMEI / S.N</th>
                                    <th className="px-4 py-3 text-center text-[9px] font-black text-indigo-400 uppercase tracking-widest w-20">Qty</th>
                                    <th className="px-4 py-3 text-right text-[9px] font-black text-indigo-400 uppercase tracking-widest w-32">Rate</th>
                                    <th className="px-4 py-3 text-right text-[9px] font-black text-indigo-400 uppercase tracking-widest w-32">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="group">
                                        <td className="px-4 py-3 text-xs font-black text-slate-300">{idx + 1}</td>
                                        <td className="px-4 py-3"><input value={item.model} onChange={e => handleItemChange(idx, 'model', e.target.value)} className="w-full bg-transparent font-bold outline-none placeholder:text-slate-200" placeholder="..." /></td>
                                        <td className="px-4 py-3"><input value={item.imei} onChange={e => handleItemChange(idx, 'imei', e.target.value)} className="w-full bg-transparent font-mono text-[10px] text-indigo-500 outline-none" placeholder="-" /></td>
                                        <td className="px-4 py-3 text-center"><input value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} className="w-full bg-transparent text-center font-bold outline-none" placeholder="0" /></td>
                                        <td className="px-4 py-3 text-right"><input value={item.rate} onChange={e => handleItemChange(idx, 'rate', e.target.value)} className="w-full bg-transparent text-right font-bold outline-none" placeholder="0" /></td>
                                        <td className="px-4 py-3 text-right"><input value={item.amount} onChange={e => handleItemChange(idx, 'amount', e.target.value)} className="w-full bg-transparent text-right font-black text-slate-900 dark:text-white outline-none" placeholder="0.00" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item, idx) => (
                            <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/60 space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em]">Registry Item #{idx + 1}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className={labelStyles}>Model Name</label>
                                        <input value={item.model} onChange={e => handleItemChange(idx, 'model', e.target.value)} className={inputStyle} placeholder="e.g. Galaxy S24 Ultra" />
                                    </div>
                                    <div>
                                        <label className={labelStyles}>Serial / IMEI</label>
                                        <input value={item.imei} onChange={e => handleItemChange(idx, 'imei', e.target.value)} className={`${inputStyle} font-mono text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10`} placeholder="Scan or enter UID" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelStyles}>Quantity</label>
                                            <input value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} className={`${inputStyle} text-center`} placeholder="1" />
                                        </div>
                                        <div>
                                            <label className={labelStyles}>Unit Rate</label>
                                            <input value={item.rate} onChange={e => handleItemChange(idx, 'rate', e.target.value)} className={`${inputStyle} text-right`} placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center px-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Line Total</span>
                                        <input value={item.amount} onChange={e => handleItemChange(idx, 'amount', e.target.value)} className="bg-transparent text-right font-black text-lg text-slate-900 dark:text-white outline-none w-32 border-b border-indigo-500/20" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile-Only Sticky Authorization Bar */}
            {viewMode === 'mobile' && (
                <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 animate-slide-up">
                    <div className="max-w-md mx-auto flex items-center gap-4">
                        <div className="flex-1">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Payable</p>
                             <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">Rs. {total || '0.00'}</p>
                        </div>
                        <button 
                            onClick={handlePrintClick}
                            disabled={!total || total === '0.00'}
                            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v3a2 2 0 002 2h6a2 2 0 002-2v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                            Authorize
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlankBill;