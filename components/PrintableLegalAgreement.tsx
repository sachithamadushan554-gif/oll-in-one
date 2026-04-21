import React from 'react';
import type { Invoice, ShopDetails } from '../types';

interface PrintableLegalAgreementProps {
  invoice: Invoice;
  shopDetails: ShopDetails;
}

export const PrintableLegalAgreement: React.FC<PrintableLegalAgreementProps> = ({ invoice, shopDetails }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  return (
    <div className="space-y-8 print:space-y-0">
      {/* PAGE 1: Identification & Asset Details */}
      <div className="print-page a4 bg-white text-slate-900 p-[15mm] font-serif mx-auto shadow-none border-[1px] border-slate-300 print:border-0 leading-relaxed overflow-hidden flex flex-col min-h-[297mm] h-[297mm] relative">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-4">
              {shopDetails.logoUrl && <img src={shopDetails.logoUrl} className="w-12 h-12 object-contain grayscale" alt="" />}
              <div>
                  <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 font-sans">
                    {shopDetails.name}
                  </h1>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 font-sans">Hire Purchase & Installment Agreement</p>
              </div>
          </div>
          <div className="text-right">
              <p className="text-[9px] font-black uppercase text-slate-400 font-sans">Agreement No</p>
              <p className="text-sm font-bold font-mono text-slate-900">AGR-{invoice.id.substring(4, 10).toUpperCase()}</p>
              <p className="text-[9px] font-bold text-slate-500 mt-1">{todayStr}</p>
          </div>
        </div>

        <div className="text-center mb-6">
            <h2 className="text-lg font-black underline uppercase tracking-tight">වාරික ගෙවීමේ ගිවිසුම - 01 වන කොටස / Installment Agreement - Part 01</h2>
        </div>

        {/* Customer & ID Details */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="space-y-4">
              <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 font-sans mb-1">පාරිභෝගිකයා (Customer)</p>
                  <p className="text-base font-black uppercase">{invoice.customer.name}</p>
                  <p className="text-xs font-bold text-slate-600 font-mono tracking-tighter">{invoice.customer.phone}</p>
                  <p className="text-[11px] text-slate-600 mt-1">{invoice.customer.address}</p>
              </div>
              <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 font-sans mb-1">හැඳුනුම්පත් අංකය (NIC Number)</p>
                  <p className="text-base font-black font-mono">{invoice.idNumber || 'N/A'}</p>
              </div>
          </div>
          <div className="flex justify-end gap-2">
              {invoice.customer.photoUrl && (
                  <div className="w-28 h-28 border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <img src={invoice.customer.photoUrl} className="w-full h-full object-cover grayscale" alt="Customer" />
                      <p className="text-[7px] text-center font-bold uppercase py-1 bg-slate-100 text-slate-500">Profile</p>
                  </div>
              )}
          </div>
        </div>

        {/* Asset & Financial Details */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl mb-8">
            <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-4">Asset & Payment Details</h3>
            <div className="grid grid-cols-2 gap-y-4 text-[12px]">
                <div className="font-bold text-slate-600">භාණ්ඩය (Item Description)</div>
                <div className="text-right font-black uppercase">{invoice.items.map(i => i.description).join(', ')}</div>
                
                <div className="font-bold text-slate-600">අනන්‍යතා අංකය (IMEI/Serial)</div>
                <div className="text-right font-mono font-bold">{invoice.items.map(i => i.imei).join(', ')}</div>
                
                <div className="font-bold text-slate-600">මුළු වටිනාකම (Total Value)</div>
                <div className="text-right font-mono font-black">Rs. {Math.round(invoice.totalAmount).toLocaleString()}</div>
                
                <div className="font-bold text-slate-600">මූලික ගෙවීම (Down Payment)</div>
                <div className="text-right font-mono font-bold">Rs. {Math.round(invoice.amountPaid).toLocaleString()}</div>
                
                <div className="font-bold text-slate-600">වාරික ගණන (Plan)</div>
                <div className="text-right font-black uppercase">{invoice.installments.length} Months</div>
                
                <div className="font-bold text-rose-600">මාසික වාරිකය (Monthly Installment)</div>
                <div className="text-right font-mono font-black text-rose-600">Rs. {Math.round(invoice.installments[0]?.amount || 0).toLocaleString()}</div>
            </div>
        </div>

        {/* ID Photos Section */}
        <div className="mb-4 flex-grow">
            <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-4">Identification Documents (NIC Copies)</h3>
            <div className="grid grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 aspect-[1.58/1] flex flex-col">
                    {invoice.idPhotoFront ? (
                        <img src={invoice.idPhotoFront} className="w-full h-full object-cover grayscale" alt="NIC Front" />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-300 italic text-[8px]">Front Photo Not Available</div>
                    )}
                    <div className="py-2 bg-slate-100 text-center text-[7px] font-black uppercase text-slate-500 border-t border-slate-200">NIC Front View</div>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 aspect-[1.58/1] flex flex-col">
                    {invoice.idPhotoBack ? (
                        <img src={invoice.idPhotoBack} className="w-full h-full object-cover grayscale" alt="NIC Back" />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-300 italic text-[8px]">Back Photo Not Available</div>
                    )}
                    <div className="py-2 bg-slate-100 text-center text-[7px] font-black uppercase text-slate-500 border-t border-slate-200">NIC Back View</div>
                </div>
            </div>
        </div>

        <div className="mt-auto text-center pb-4">
            <p className="text-[7px] font-bold text-slate-300 uppercase italic">Page 01 of 02 - Identification & Assets</p>
        </div>
      </div>

      {/* PAGE 2: Terms, Conditions & Signatures */}
      <div className="print-page a4 bg-white text-slate-900 p-[15mm] font-serif mx-auto shadow-none border-[1px] border-slate-300 print:border-0 leading-relaxed overflow-hidden flex flex-col min-h-[297mm] h-[297mm] relative">
        <div className="text-center mb-8 border-b-2 border-slate-900 pb-4">
            <h2 className="text-lg font-black underline uppercase tracking-tight">ගිවිසුම් කොන්දේසි සහ අත්සන් - 02 වන කොටස / Terms & Signatures - Part 02</h2>
        </div>

        {/* Terms & Conditions - Expanded */}
        <div className="mb-8 flex-grow">
            <h3 className="text-[11px] font-black uppercase text-slate-900 tracking-widest mb-6 border-l-4 border-indigo-600 pl-3">Terms & Conditions (ගිවිසුම් කොන්දේසි)</h3>
            <div className="text-[10px] text-slate-700 space-y-4 leading-loose text-justify">
                <p>1. <b>හිමිකාරිත්වය (Ownership):</b> මෙම භාණ්ඩය සඳහා සම්පූර්ණ මුදල සහ අදාළ පොලී මුදල් ගෙවා අවසන් වන තෙක් එහි පූර්ණ අයිතිය {shopDetails.name} ආයතනය සතු වේ. පාරිභෝගිකයා භාණ්ඩය පරිහරණය කරන්නෙකු පමණක් වන අතර එය විකිණීමට, උකස් කිරීමට හෝ වෙනත් පාර්ශවයකට පැවරීමට අයිතියක් නැත.</p>
                
                <p>2. <b>වාරික ගෙවීම (Installment Payments):</b> පාරිභෝගිකයා විසින් එකඟ වූ පරිදි නියමිත දිනට වාරික ගෙවිය යුතුය. කිසියම් වාරිකයක් ප්‍රමාද වුවහොත්, ප්‍රමාද වන සෑම දිනක් සඳහාම ආයතනය විසින් නියම කරනු ලබන ප්‍රමාද ගාස්තුවක් (Late Fee) ගෙවීමට පාරිභෝගිකයා බැඳී සිටී.</p>
                
                <p>3. <b>භාණ්ඩය නැවත පවරා ගැනීම (Repossession):</b> අඛණ්ඩව වාරික 03ක් හෝ ඊට වැඩි ප්‍රමාණයක් පැහැර හරිනු ලැබුවහොත්, කිසිදු පූර්ව දැනුම්දීමකින් තොරව භාණ්ඩය නැවත ආයතනය සතු කර ගැනීමට ආයතනයට පූර්ණ අයිතිය ඇත. එහිදී ගෙවන ලද මුදල් ආපසු ගෙවනු නොලැබේ.</p>
                
                <p>4. <b>භාණ්ඩයේ ආරක්ෂාව (Asset Safety):</b> භාණ්ඩය අස්ථානගත වීමකදී, සොරකම් කිරීමකදී හෝ හානි වීමකදී ඉතිරි වාරික මුදල් ගෙවීමේ වගකීමෙන් පාරිභෝගිකයා නිදහස් නොවේ. එවැනි අවස්ථාවකදී වුවද සම්පූර්ණ හිඟ මුදල ගෙවා නිම කළ යුතුය.</p>
                
                <p>5. <b>තොරතුරු තහවුරු කිරීම (Verification):</b> පාරිභෝගිකයා විසින් ලබා දී ඇති ලිපිනය හෝ දුරකථන අංක වෙනස් වුවහොත් වහාම ආයතනය දැනුවත් කළ යුතුය. වැරදි තොරතුරු ලබා දීම ගිවිසුම උල්ලංඝනය කිරීමක් ලෙස සලකනු ලැබේ.</p>
                
                <p>6. <b>නීතිමය ක්‍රියාමාර්ග (Legal Action):</b> මෙම ගිවිසුම උල්ලංඝනය කිරීමකදී හෝ වංචා සහගත ලෙස භාණ්ඩය අතුරුදහන් කිරීමකදී, ලංකා දණ්ඩ නීති සංග්‍රහය යටතේ නීතිමය ක්‍රියාමාර්ග ගැනීමට සහ පොලිස් මූලස්ථානය වෙත පැමිණිලි කිරීමට ආයතනයට පූර්ණ බලය ඇත.</p>
                
                <p>7. <b>වගකීම් සහතිකය (Warranty):</b> භාණ්ඩය සඳහා ලබා දී ඇති වගකීම් සහතිකය වලංගු වන්නේ වාරික නිසි පරිදි ගෙවා නිම කළ පසු පමණි. වාරික පැහැර හරින ලද භාණ්ඩ සඳහා වගකීම් සේවා සැපයීම ආයතනය විසින් ප්‍රතික්ෂේප කළ හැක.</p>
                
                <p>8. <b>ගෙවීම් ක්‍රමවේදය (Payment Method):</b> වාරික මුදල් ආයතනය වෙත පැමිණ හෝ බැංකු තැන්පතු මගින් ගෙවිය හැක. බැංකු තැන්පතු සිදු කරන්නේ නම් එහි රිසිට්පත ආයතනය වෙත ඉදිරිපත් කිරීම අනිවාර්ය වේ. ගෙවීම් ප්‍රමාද වීම් වළක්වා ගැනීමට නියමිත දිනට පෙර ගෙවීම් සිදු කරන ලෙස උපදෙස් දෙනු ලැබේ.</p>
                
                <p>9. <b>භාණ්ඩය පරීක්ෂා කිරීම (Inspection):</b> ගිවිසුම් කාලය තුළ ඕනෑම අවස්ථාවක භාණ්ඩය පරීක්ෂා කිරීමට ආයතන නියෝජිතයින්ට අවසර දිය යුතුය. භාණ්ඩය පවතින ස්ථානය පිළිබඳව නිවැරදි තොරතුරු සැපයීමට පාරිභෝගිකයා බැඳී සිටී.</p>
                
                <p>10. <b>ගිවිසුම අවලංගු කිරීම (Termination):</b> පාරිභෝගිකයාට අවශ්‍ය නම් ඉතිරි සියලුම වාරික එකවර ගෙවා ගිවිසුම අවසන් කළ හැක. එහිදී යම් පොලී සහනයක් ලබා දීම ආයතනයේ කළමනාකාරීත්වයේ තීරණය මත පමණක් සිදු වේ.</p>
                
                <p>11. <b>අත්සන් කිරීම (Certification):</b> මම ඉහත සඳහන් සියලුම කොන්දේසි (01 සිට 10 දක්වා) කියවා හොඳින් තේරුම් ගත් බවත්, ඒවාට කොන්දේසි විරහිතව එකඟ වන බවත් මෙයින් සහතික කරමි.</p>
            </div>
        </div>

        {/* Signatures - Large Space */}
        <div className="mt-auto pt-10 border-t-2 border-slate-900 grid grid-cols-2 gap-16 pb-6">
            <div className="text-center">
                <div className="h-40 flex items-end justify-center mb-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 relative">
                    <div className="absolute top-2 left-2 text-[7px] font-black text-slate-300 uppercase">Customer Signature Area</div>
                    {invoice.signature ? (
                        <img src={invoice.signature} className="max-h-full max-w-full object-contain grayscale brightness-50 contrast-150" alt="Customer Signature" />
                    ) : (
                        <div className="mb-4 w-4/5 border-b border-slate-300"></div>
                    )}
                </div>
                <div className="pt-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">..................................................</p>
                    <p className="text-[11px] font-black uppercase tracking-widest mt-1">පාරිභෝගිකයාගේ අත්සන</p>
                    <p className="text-[9px] text-slate-500 uppercase font-sans">Customer Signature</p>
                    <p className="text-[8px] text-slate-400 mt-2 font-mono">Date: {todayStr}</p>
                </div>
            </div>
            <div className="text-center">
                <div className="h-40 flex items-end justify-center mb-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 relative">
                    <div className="absolute top-2 left-2 text-[7px] font-black text-slate-300 uppercase">Official Stamp & Signature</div>
                    {shopDetails.digitalSignature ? (
                        <img src={shopDetails.digitalSignature} className="max-h-full max-w-full object-contain grayscale brightness-50" alt="Manager Signature" />
                    ) : (
                        <div className="mb-4 w-4/5 border-b border-slate-300"></div>
                    )}
                </div>
                <div className="pt-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">..................................................</p>
                    <p className="text-[11px] font-black uppercase tracking-widest mt-1">ආයතනික අත්සන</p>
                    <p className="text-[9px] text-slate-500 uppercase font-sans">Authorized Manager</p>
                    <p className="text-[8px] text-slate-400 mt-2 font-mono">Date: {todayStr}</p>
                </div>
            </div>
        </div>

        <div className="text-center pb-4">
            <p className="text-[8px] font-bold text-slate-400 italic">
                * This is a legally binding document. Page 02 of 02 - Terms & Certification.
            </p>
        </div>
      </div>
    </div>
  );
};
