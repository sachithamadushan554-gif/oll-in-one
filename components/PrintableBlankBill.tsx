import React from 'react';
import type { BlankBillData, BlankBillSettings, PaperSize, ShopDetails } from '../types';

interface PrintableBlankBillProps {
    billData: BlankBillData;
    shopDetails: ShopDetails;
    settings: BlankBillSettings;
    paperSize?: PaperSize;
    isNested?: boolean;
}

const PrintableBlankBill: React.FC<PrintableBlankBillProps> = ({ billData, shopDetails, settings, paperSize = 'A4', isNested = false }) => {
    const containerClasses = isNested 
        ? "w-[105mm] h-[148.5mm] p-6 text-[10px]" 
        : `print-page ${paperSize.toLowerCase()} p-10 text-sm`;

    const accentColor = "indigo-600";
    const accentBg = "indigo-50";

    return (
        <div className={`${containerClasses} bg-white font-sans text-slate-800 mx-auto border-0 shadow-none relative overflow-hidden flex flex-col`}>
            {/* Header Section */}
            <div className="text-center mb-6">
                <h1 className="text-4xl font-black text-indigo-700 tracking-tighter uppercase leading-none mb-2">
                    {shopDetails.name || 'SAMAN MOBILE'}
                </h1>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed max-w-[80%] mx-auto">
                    {shopDetails.address || 'Your Business Address Goes Here'}<br/>
                    <span className="text-slate-400">Hotline: {shopDetails.phone1} {shopDetails.phone2 && `| ${shopDetails.phone2}`}</span>
                </p>
                <div className="h-0.5 bg-gradient-to-r from-transparent via-indigo-200 to-transparent mt-4 w-full"></div>
            </div>

            {/* Bill Info Grid */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col gap-1.5">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Bill To:</p>
                    <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <p className="font-black text-slate-800 uppercase text-xs">{billData.customer.name || '..............................................'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <p className="text-[10px] font-bold text-slate-600">{billData.customer.phone || '..............................................'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <p className="text-[10px] font-bold text-slate-500">{billData.customer.address || '..............................................'}</p>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center gap-2 text-right">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bill No</p>
                        <p className="font-black text-indigo-700 text-sm">#{billData.invoiceNumber}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                        <p className="font-bold text-slate-800 text-xs">{billData.date}</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6 flex-grow">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-indigo-600 text-white">
                        <tr>
                            <th className="p-3 text-[9px] font-black uppercase tracking-[0.2em] w-10 text-center">#</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-[0.2em]">Model / Description</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-[0.2em] w-32">IMEI</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-[0.2em] text-center w-12">Qty</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-[0.2em] text-right w-24">Rate</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-[0.2em] text-right w-28">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {Array.from({ length: 8 }).map((_, i) => {
                            const item = billData.items[i];
                            return (
                                <tr key={i} className="h-10">
                                    <td className="px-3 text-center text-[10px] font-bold text-slate-400">{i + 1}</td>
                                    <td className="px-3 text-[11px] font-bold text-slate-800 uppercase">{item?.model || ''}</td>
                                    <td className="px-3 text-[10px] font-mono text-indigo-600/80">{item?.imei || ''}</td>
                                    <td className="px-3 text-center text-[11px] font-bold text-slate-800">{item?.qty || ''}</td>
                                    <td className="px-3 text-right text-[11px] font-bold text-slate-800">{item?.rate || ''}</td>
                                    <td className="px-3 text-right text-[11px] font-black text-slate-900">{item?.amount || ''}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-12 gap-8 items-end">
                <div className="col-span-4">
                    <div className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50 relative overflow-hidden group">
                        <div className="absolute inset-2 border border-slate-100 opacity-50"></div>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center px-1">QR Code Placeholder</span>
                    </div>
                </div>
                <div className="col-span-8 space-y-2">
                    <div className="flex justify-between px-2 text-[11px] font-bold text-slate-500">
                        <span className="uppercase tracking-widest">Sub Total</span>
                        <span className="font-black text-slate-800">{billData.subtotal || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-indigo-700 text-white p-4 rounded-2xl shadow-xl shadow-indigo-200">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Total Amount</span>
                        <span className="text-2xl font-black tracking-tighter">Rs. {billData.total || '0.00'}</span>
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <div className="mt-12 grid grid-cols-2 gap-20">
                <div className="text-center">
                    <div className="border-t border-slate-200 pt-2 px-4">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Customer Signature</p>
                    </div>
                </div>
                <div className="text-center">
                    <div className="border-t-2 border-indigo-600 pt-2 px-4">
                        <p className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">For {shopDetails.name || 'SAMAN MOBILE'}</p>
                    </div>
                </div>
            </div>

            <p className="text-[11px] font-black text-center mt-10 text-indigo-400 tracking-[0.4em] uppercase italic opacity-60">
                {settings.footerMessage || 'Thank You! Come Again!'}
            </p>
        </div>
    );
};

export default PrintableBlankBill;