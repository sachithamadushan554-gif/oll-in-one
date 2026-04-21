
import React, { useMemo } from 'react';
import type { Product, ShopDetails } from '../types';

interface PrintableInventoryReportProps {
  products: Product[];
  shopDetails: ShopDetails;
}

const PrintableInventoryReport: React.FC<PrintableInventoryReportProps> = ({ products, shopDetails }) => {
  const today = new Date().toISOString().split('T')[0];

  // Determine which installment months are actually used across all products
  const usedMonths = useMemo(() => {
    const months = new Set<number>();
    products.forEach(p => {
      if (p.allowedInstallmentMonths) {
        p.allowedInstallmentMonths.forEach(m => months.add(m));
      }
    });
    return Array.from(months).sort((a, b) => a - b);
  }, [products]);

  return (
    <div className="print-page a4 bg-white text-slate-900 p-10 font-sans mx-auto shadow-none border-none relative overflow-hidden flex flex-col h-full">
      <header className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">{shopDetails.name || 'MW STORE'}</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2">Official Price List & Installment Guide</p>
          <p className="text-slate-400 text-xs mt-1">{shopDetails.address}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400">Effective Date</p>
          <p className="text-lg font-black font-mono">{today}</p>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
              <th className="p-3 border-r border-white/10">Product Model</th>
              <th className="p-3 text-right border-r border-white/10">Cash Price</th>
              <th className="p-3 text-right border-r border-white/10">Down Pay</th>
              {usedMonths.map(m => (
                <th key={m} className="p-3 text-center border-r border-white/10">{m} Months</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, idx) => (
              <tr key={p.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-slate-50/50' : ''}`}>
                <td className="p-3">
                  <p className="font-black text-xs uppercase text-slate-900">{p.name}</p>
                  <p className="text-[8px] font-mono text-slate-400 mt-0.5">{p.barcode || 'NO BARCODE'}</p>
                </td>
                <td className="p-3 text-right font-bold text-xs font-mono">Rs. {Math.round(p.price).toLocaleString()}</td>
                <td className="p-3 text-right text-indigo-600 font-bold text-xs font-mono bg-indigo-50/30">Rs. {Math.round(p.defaultDownPayment || 0).toLocaleString()}</td>
                {usedMonths.map(m => {
                  const isAllowed = p.allowedInstallmentMonths?.includes(m);
                  if (!isAllowed) return <td key={m} className="p-2 text-center border-r border-slate-50 text-slate-200 font-black text-[8px] uppercase">N/A</td>;

                  const interest = p.interestRates?.[m] || 0;
                  const principal = p.price - (p.defaultDownPayment || 0);
                  const monthly = (principal + interest) / m;
                  const totalAtEnd = p.price + interest;
                  
                  return (
                    <td key={m} className="p-2 text-center border-r border-slate-50">
                        <p className="text-[10px] font-black text-slate-800">Rs. {Math.round(monthly).toLocaleString()}</p>
                        <p className="text-[7px] font-bold text-slate-400 mt-0.5 uppercase">Tot: {Math.round(totalAtEnd).toLocaleString()}</p>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="mt-auto pt-10 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-10">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="font-black text-[10px] uppercase tracking-widest mb-2 text-slate-900">General Conditions:</h4>
            <ul className="text-[9px] font-bold text-slate-500 space-y-1">
              <li>• පාරිභෝගිකයාගේ ණය සුදුසුකම් මත වාරික අනුමත කරනු ලැබේ.</li>
              <li>• මෙම මිල ගණන් පවතින තොග මත පමණක් වලංගු වේ.</li>
              <li>• Warranty conditions apply as per company policy.</li>
            </ul>
          </div>
          <div className="flex items-end justify-end">
            <div className="text-center w-48">
              <div className="border-t border-slate-900 pt-2">
                <p className="text-[9px] font-black uppercase text-slate-900 tracking-widest">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center font-black text-[8px] uppercase tracking-[0.6em] text-slate-300 mt-10">Registry Secured • Product Price Authority v1.0</p>
      </footer>
    </div>
  );
};

export default PrintableInventoryReport;
