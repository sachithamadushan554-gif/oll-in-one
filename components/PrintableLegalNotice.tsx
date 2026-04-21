
import React from 'react';
import type { Invoice, ShopDetails } from '../types';

interface PrintableLegalNoticeProps {
  invoice: Invoice;
  shopDetails: ShopDetails;
}

export const PrintableLegalNotice: React.FC<PrintableLegalNoticeProps> = ({ invoice, shopDetails }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const year = today.getFullYear();
  
  // Calculate missed installments count specifically
  const missedInstallments = invoice.installments.filter(
    inst => !inst.paid && new Date(inst.dueDate) < today
  );

  const lrn = `LRN-${year}-${invoice.id.substring(4, 10).toUpperCase()}`;

  return (
    <div className="print-page a4 bg-white text-slate-900 p-[25mm] font-serif mx-auto shadow-none border-[12px] border-double border-slate-200 leading-relaxed overflow-hidden flex flex-col h-full relative">
      
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
          <p className="text-9xl font-black -rotate-45 uppercase whitespace-nowrap">Legal Recovery Dept</p>
      </div>

      {/* Formal Letter Header */}
      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-8 mb-10 relative z-10">
        <div className="flex items-center gap-5">
            {shopDetails.logoUrl && <img src={shopDetails.logoUrl} className="w-16 h-16 object-contain grayscale" alt="" />}
            <div>
                <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900 font-sans">
                  {shopDetails.name}
                </h1>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 font-sans">Corporate Legal & Debt Recovery Intelligence</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400 font-sans">Official Case Reference</p>
            <p className="text-sm font-bold font-mono text-slate-900">{lrn}</p>
        </div>
      </div>

      {/* Title / Reference */}
      <div className="text-center mb-10">
          <h2 className="text-2xl font-black underline uppercase tracking-tight">අවසාන දැනුම්දීමේ ලිපිය / Final Notice</h2>
      </div>

      {/* Recipient and Date Details */}
      <div className="flex justify-between items-start mb-12 relative z-10">
        <div className="space-y-2">
            <p className="font-bold text-xs uppercase text-slate-400 font-sans">පාරිභෝගිකයා (Recipient):</p>
            <div className="pl-2 border-l-2 border-slate-900">
                <p className="text-xl font-black uppercase text-slate-900">{invoice.customer.name}</p>
                <p className="text-sm font-bold text-slate-600 font-mono tracking-tighter">{invoice.customer.phone}</p>
                {invoice.customer.address && <p className="text-sm max-w-xs mt-1 text-slate-600">{invoice.customer.address}</p>}
            </div>
        </div>
        <div className="text-right space-y-1">
            <p className="text-sm font-bold">දිනය: <span className="font-mono">{todayStr}</span></p>
            <p className="text-[10px] font-black uppercase text-slate-400 font-sans">Bill Tracking ID</p>
            <p className="text-sm font-bold font-mono">#{invoice.id.substring(0, 12)}</p>
        </div>
      </div>

      {/* Formal Body Content */}
      <div className="space-y-8 text-[15px] text-justify relative z-10 flex-grow">
        <p className="font-black text-lg border-b border-slate-200 pb-2">විෂය: වාරික ගෙවීම් පැහැර හැරීම පිළිබඳ අවසාන නිවේදනය සහ භාණ්ඩය අත්පත් කර ගැනීමේ අනතුරු ඇඟවීම.</p>
        
        <p>
          ඔබ අප ආයතනයෙන් ලබාගත් පහත සඳහන් භාණ්ඩය සඳහා ගෙවිය යුතු වාරික ගෙවීම් පිළිබඳව ඔබව දැනුවත් කිරීමට මෙම ලිපිය එවන්නෙමු. අපගේ වාර්තාවලට අනුව ඔබ මේ වන විට වාරික <strong>{missedInstallments.length} ක්</strong> ගෙවීම පැහැර හැර ඇති අතර එමගින් ඔබ දෙපාර්ශවය අතර ඇති කරගත් ගිවිසුම උල්ලංඝනය කර ඇත.
        </p>

        {/* Audit Box */}
        <div className="bg-slate-50 border-2 border-slate-900 p-6 rounded-lg">
            <div className="grid grid-cols-2 gap-y-4">
                <div className="text-slate-500 font-sans text-xs uppercase font-black">භාණ්ඩය (Asset)</div>
                <div className="text-right font-black uppercase">{invoice.items.map(i => i.description).join(', ')}</div>
                
                <div className="text-slate-500 font-sans text-xs uppercase font-black">වටිනාකම (Value)</div>
                <div className="text-right font-mono font-bold">Rs. {Math.round(invoice.totalAmount).toLocaleString()}</div>
                
                <div className="text-rose-600 font-sans text-xs uppercase font-black">හිඟ මුළු ශේෂය (Outstanding)</div>
                <div className="text-right font-mono font-black text-xl text-rose-600 underline">Rs. {Math.round(invoice.balance).toLocaleString()}</div>
            </div>
        </div>

        {/* The Ultimatum */}
        <div className="space-y-4 p-8 bg-slate-900 text-white rounded-xl shadow-xl">
            <p className="font-black text-lg underline uppercase tracking-widest text-rose-400">Ultimatum / අවසාන අවස්ථාව:</p>
            <p className="font-bold leading-relaxed text-base italic">
                නැවත දැනුම් දෙන තුරු රැඳී නොසිට, මෙම ලිපිය ලැබී ඉදිරි <span className="text-2xl font-black text-white underline decoration-rose-500">දින 03 (තුනක්) ඇතුළත</span> ඔබ විසින් ගෙවිය යුතු සම්පූර්ණ හිඟ වාරික මුදල් ගෙවා අවසන් කරන ලෙස කාරුණිකව දන්වා සිටිමු.
            </p>
            <p className="text-slate-300 leading-relaxed text-sm">
                යම් හෙයකින් මෙම සහන කාලය ඇතුළත ගෙවීම් සිදු කිරීමට ඔබ අපොහොසත් වුවහොත්, <strong>භාණ්ඩය වහාම ක්‍රියාත්මක වන පරිදි නැවත අප ආයතනය භාරයට ගැනීමට (Repossession)</strong> සහ පොලිස් මූලස්ථානය හරහා නීතිමය ක්‍රියාමාර්ග ගැනීමට කටයුතු කරන බව මෙයින් දැඩිව අවධාරණය කරමු.
            </p>
        </div>

        <p className="text-xs font-bold text-slate-400 mt-6 font-sans italic text-center">
          * This is an electronically verified legal demand document. All recorded data is admissible in court proceedings.
        </p>
      </div>

      {/* Authentication Section */}
      <div className="mt-auto pt-10 flex justify-between items-end px-4 relative z-10">
        <div className="text-center w-60 relative">
            {shopDetails.digitalSeal ? (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 pointer-events-none opacity-80 mix-blend-multiply">
                    <img src={shopDetails.digitalSeal} className="w-full h-full object-contain filter grayscale brightness-50 sepia-[1] hue-rotate-[200deg] saturate-[3]" alt="Seal" />
                </div>
            ) : (
                <div className="h-24 flex items-center justify-center opacity-5 grayscale mb-2">
                     <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>
                </div>
            )}
            <div className="border-t-2 border-slate-900 pt-3">
                <p className="text-xs font-black uppercase tracking-widest font-sans">අධිකාරී මුද්‍රාව</p>
                <p className="text-[10px] text-slate-400 font-sans mt-1 uppercase">Official Registry Seal</p>
            </div>
        </div>
        <div className="text-center w-60 relative">
            <p className="mb-8 italic font-bold">මෙයට විශ්වාසී,</p>
            {shopDetails.digitalSignature && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-20 pointer-events-none mix-blend-multiply">
                    <img src={shopDetails.digitalSignature} className="w-full h-full object-contain filter grayscale brightness-50 sepia-[1] hue-rotate-[200deg] saturate-[3]" alt="Signature" />
                </div>
            )}
            <div className="border-t-2 border-slate-900 pt-3">
                <p className="text-sm font-black uppercase tracking-widest font-sans">කළමනාකාරීත්වය</p>
                <p className="text-[10px] text-slate-400 font-sans mt-1 uppercase">Chief Recovery Officer</p>
            </div>
        </div>
      </div>

      {/* Sinhalese Disclaimer and Contact */}
      <div className="mt-10 px-4 text-center">
          <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
            මෙය ස්වයංක්‍රීයව ජනනය වූ පණිවිඩයකි. ඔබ දැනටමත් ගෙවීම් සිදුකර ඇත්නම් කරුණාකර අප ආයතනය හා සම්බන්ධ වී එය තහවුරු කරන්න.
          </p>
          <p className="text-[11px] font-black text-slate-900 mt-1 uppercase tracking-widest">
            ස්තූතියි, {shopDetails.phone1}
          </p>
      </div>
      
      {/* Footer Info */}
      <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
          <p className="text-[8px] font-sans font-black text-slate-300 uppercase tracking-[0.4em]">MW LEDGER AUTHORITY RECOVERY UNIT • {shopDetails.address}</p>
          <div className="flex gap-2">
               <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
               <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
          </div>
      </div>
    </div>
  );
};
