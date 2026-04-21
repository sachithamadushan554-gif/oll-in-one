
import React from 'react';
import QRCode from "react-qr-code";
import type { Invoice, ShopDetails, PaperSize } from '../types';

interface PrintableInvoiceProps {
  invoice: Invoice;
  shopDetails: ShopDetails;
  paperSize: PaperSize;
}

const getPaperStyles = (paperSize: PaperSize) => {
    switch (paperSize) {
        case 'A6':
            return {
                container: 'p-3 text-[7px]',
                h1: 'text-base',
                h2: 'text-xs',
                headerBottomMargin: 'mb-2',
                sectionMargin: 'mb-2',
                customerLabel: 'text-[5px]',
                customerName: 'text-[9px]',
                itemCardPadding: 'p-2',
                itemTitle: 'text-[8px]',
                itemMeta: 'text-[6px]',
                itemPrice: 'text-[7px]',
                summaryWidth: 'w-full',
                summaryText: 'text-[7px]',
                totalText: 'text-xs p-1.5',
                gridGap: 'gap-1.5',
                accentBorder: 'border',
                logoMax: 'max-h-8',
                footerMargin: 'mt-4',
                itemGrid: 'grid-cols-1',
                watermarkSize: 'text-3xl',
                signaturePadding: 'px-2',
            };
        case 'A5':
            return {
                container: 'p-8 text-[10px]',
                h1: 'text-2xl',
                h2: 'text-xl',
                headerBottomMargin: 'mb-6',
                sectionMargin: 'mb-8',
                customerLabel: 'text-[9px]',
                customerName: 'text-base',
                itemCardPadding: 'p-4',
                itemTitle: 'text-sm',
                itemMeta: 'text-[9px]',
                itemPrice: 'text-[11px]',
                summaryWidth: 'w-3/4',
                summaryText: 'text-[11px]',
                totalText: 'text-lg p-3',
                gridGap: 'gap-3',
                accentBorder: 'border-2',
                logoMax: 'max-h-12',
                footerMargin: 'mt-10',
                itemGrid: 'grid-cols-1',
                watermarkSize: 'text-7xl',
                signaturePadding: 'px-12',
            };
        case 'A4':
        default:
            return {
                container: 'p-12 text-base',
                h1: 'text-4xl',
                h2: 'text-3xl',
                headerBottomMargin: 'mb-12',
                sectionMargin: 'mb-16',
                customerLabel: 'text-xs',
                customerName: 'text-2xl',
                itemCardPadding: 'p-6',
                itemTitle: 'text-xl',
                itemMeta: 'text-sm',
                itemPrice: 'text-lg',
                summaryWidth: 'w-1/2',
                summaryText: 'text-base',
                totalText: 'text-3xl p-5',
                gridGap: 'gap-6',
                accentBorder: 'border-2',
                logoMax: 'max-h-20',
                footerMargin: 'mt-16',
                itemGrid: 'grid-cols-1',
                watermarkSize: 'text-9xl',
                signaturePadding: 'px-20',
            };
    }
};

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice, shopDetails, paperSize }) => {
  const styles = getPaperStyles(paperSize);
  const isFullyPaid = invoice.balance < 1;

  return (
    <>
      <div className={`print-page ${paperSize.toLowerCase()} bg-white text-slate-800 font-sans mx-auto shadow-none border-none ${styles.container} relative flex flex-col print:m-0 print:block`}>
        
        {isFullyPaid && (
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none select-none z-0">
                <span className={`${styles.watermarkSize} font-black uppercase -rotate-45 whitespace-nowrap text-emerald-600 border-[0.15em] border-emerald-600 px-6 py-2 rounded-[0.3em] tracking-tighter`}>
                    PAID IN FULL
                </span>
            </div>
        )}

        <header className={`flex justify-between items-start border-b-4 ${isFullyPaid ? 'border-emerald-600' : 'border-indigo-600'} pb-6 ${styles.headerBottomMargin} relative z-10`}>
          <div className="flex items-start gap-4">
            {shopDetails.logoUrl && (
              <img src={shopDetails.logoUrl} alt="" className={`${styles.logoMax} w-auto object-contain`} />
            )}
            <div>
              <h1 className={`${styles.h1} font-black text-slate-900 tracking-tighter uppercase leading-none`}>
                {shopDetails.name || 'MW AUTHORITY'}
              </h1>
              <p className="text-slate-500 font-bold leading-tight mt-1 max-w-xs">{shopDetails.address}</p>
              <p className={`${isFullyPaid ? 'text-emerald-600' : 'text-indigo-600'} font-black tracking-widest mt-1 text-[10px]`}>
                {shopDetails.phone1} {shopDetails.phone2 && `| ${shopDetails.phone2}`}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 flex items-start gap-4">
            <div className="bg-white p-1 border border-slate-100 rounded-lg shadow-sm">
              <QRCode 
                value={invoice.accountNumber || invoice.id || ""} 
                size={paperSize === 'A6' ? 40 : paperSize === 'A5' ? 60 : 80}
                level="H"
              />
            </div>
            <div>
              <h2 className={`${styles.h2} font-black ${isFullyPaid ? 'text-emerald-600' : 'text-indigo-600'} uppercase tracking-[0.1em]`}>
                {isFullyPaid ? 'Payment Receipt' : 'Invoice'}
              </h2>
              <p className="font-mono font-black text-indigo-600 mt-1 uppercase tracking-widest text-[10px]">ACC NO: {invoice.accountNumber || 'N/A'}</p>
              <p className="font-mono font-bold text-slate-400 mt-0.5 uppercase tracking-widest text-[8px]">Ref: #{invoice.id.substring(4, 12).toUpperCase()}</p>
            </div>
          </div>
        </header>

        <div className={`grid grid-cols-2 gap-8 ${styles.sectionMargin} relative z-10`}>
          <div className="flex gap-4 items-start">
             {invoice.customer.photoUrl && paperSize !== 'A6' && (
                 <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 ${isFullyPaid ? 'border-emerald-100' : 'border-indigo-100'} flex-shrink-0 bg-slate-50 shadow-sm`}>
                     <img src={invoice.customer.photoUrl} className="w-full h-full object-cover" alt="Customer" />
                 </div>
             )}
             <div className="space-y-1">
                <span className={`${styles.customerLabel} font-black text-slate-400 uppercase tracking-widest block`}>Bill To:</span>
                <p className={`${styles.customerName} font-black text-slate-900 uppercase tracking-tight`}>{invoice.customer.name}</p>
                <p className="font-mono font-bold text-slate-600 text-[10px]">{invoice.customer.phone}</p>
                {invoice.customer.address && <p className="text-slate-500 italic text-[10px] leading-tight line-clamp-2 max-w-[200px]">{invoice.customer.address}</p>}
             </div>
          </div>
          <div className="text-right space-y-1">
              <div className="flex justify-end gap-3 items-center">
                  <span className="font-black text-slate-300 uppercase text-[8px]">Registry Date</span>
                  <span className="font-mono text-slate-800 font-black text-[10px]">{invoice.createdAt}</span>
              </div>
              <div className="flex justify-end gap-3 items-center">
                  <span className="font-black text-slate-300 uppercase text-[8px]">Terms</span>
                  <span className={`font-black uppercase text-[10px] ${isFullyPaid ? 'text-emerald-600' : 'text-indigo-600'}`}>
                      {isFullyPaid ? 'Cash/Full Settlement' : 'Deferred Installments'}
                  </span>
              </div>
          </div>
        </div>

        <div className="space-y-4 relative z-10 flex-grow">
          <h3 className={`font-black ${isFullyPaid ? 'text-emerald-600' : 'text-indigo-600'} uppercase tracking-[0.4em] mb-4 text-[8px]`}>Asset Description</h3>
          <div className={`grid ${styles.itemGrid} ${styles.gridGap}`}>
            {invoice.items.map((item, index) => (
              <div key={index} className={`${styles.accentBorder} ${isFullyPaid ? 'border-emerald-600' : 'border-indigo-600'} rounded-3xl ${styles.itemCardPadding} flex flex-col gap-2 bg-slate-50/20`}>
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div className="flex-1 min-w-0">
                          <p className={`${styles.itemTitle} font-black text-slate-900 uppercase tracking-tight truncate`}>{item.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                              <span className="font-black text-indigo-400 text-[8px] uppercase">Unique ID:</span>
                              <span className="font-mono font-black text-slate-800 tracking-widest text-[9px]">{item.imei || 'NOT SPECIFIED'}</span>
                          </div>
                      </div>
                      <div className="ml-4">
                          <span className={`px-4 py-1.5 ${isFullyPaid ? 'bg-emerald-600' : 'bg-indigo-600'} text-white text-[9px] font-black rounded-xl uppercase shadow-lg`}>QTY {item.quantity}</span>
                      </div>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                      <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rate (LKR)</p>
                          <p className={`${styles.itemPrice} font-black text-slate-700 tabular-nums font-mono`}>{Math.round(item.price).toLocaleString()}.00</p>
                      </div>
                      <div className="text-right">
                          <p className={`text-[9px] font-black ${isFullyPaid ? 'text-emerald-500' : 'text-indigo-500'} uppercase tracking-widest`}>Subtotal</p>
                          <p className={`${styles.h2} font-black text-slate-900 tabular-nums tracking-tighter font-mono`}>{Math.round(item.amount).toLocaleString()}.00</p>
                      </div>
                  </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`flex justify-end ${styles.footerMargin} relative z-10 pt-10 border-t border-slate-100 mb-8`}>
          <div className={`${styles.summaryWidth} space-y-3`}>
            <div className="flex justify-between text-slate-400 font-bold px-4">
              <span className="uppercase text-[8px] tracking-[0.2em]">Gross Sale Value</span>
              <span className="font-mono font-black">Rs. {Math.round(invoice.subtotal).toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between text-emerald-500 font-bold px-4">
              <span className="uppercase text-[8px] tracking-[0.2em]">Amount Received</span>
              <span className="font-mono font-black">Rs. {Math.round(invoice.amountPaid).toLocaleString()}.00</span>
            </div>
            <div className={`flex justify-between font-black ${isFullyPaid ? 'bg-emerald-600' : 'bg-slate-900'} text-white rounded-[2rem] shadow-2xl ${styles.totalText} items-center`}>
              <span className="uppercase tracking-[0.3em]">Arrears</span>
              <span className="tabular-nums font-mono tracking-tighter">Rs. {Math.round(invoice.balance).toLocaleString()}.00</span>
            </div>
          </div>
        </div>

        <footer className="mt-auto pt-8 border-t-2 border-slate-100 flex flex-col relative z-10">
           <div className="text-center px-10">
              <h4 className="font-black text-[9px] text-slate-800 uppercase tracking-widest mb-2 underline decoration-indigo-200 underline-offset-4">Policy & Certification</h4>
              <div className="space-y-1.5">
                   <p className="text-[10px] font-black text-slate-900 leading-relaxed uppercase tracking-tight">
                      පාරිභෝගික වගකීම: භාණ්ඩය සඳහා ලබාදී ඇති වගකීම් සහතිකය සමාගම් කොන්දේසි මත ක්‍රියාත්මක වේ.
                   </p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase italic tracking-widest">
                      Authorized dealer certified. Warranty is valid from registry date as per manufacturer policy.
                   </p>
              </div>
           </div>
        </footer>
      </div>

      {/* Back Side - Page 2 */}
      {!isFullyPaid && invoice.installments.length > 0 && (
          <div className={`print-page ${paperSize.toLowerCase()} bg-white text-slate-800 font-sans mx-auto shadow-none border-none ${styles.container} relative flex flex-col print:m-0 print:block`}>
            <header className={`border-b-2 border-slate-200 pb-4 ${styles.headerBottomMargin}`}>
                <h2 className={`${styles.h2} font-black text-slate-900 uppercase tracking-tighter`}>Installment Tracking & Terms</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice Ref: #{invoice.id.substring(4, 12).toUpperCase()}</p>
            </header>

            <div className={`flex-grow ${paperSize === 'A6' ? 'space-y-4' : paperSize === 'A5' ? 'space-y-6' : 'space-y-8'}`}>
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Primary Account</p>
                        <p className="text-sm font-black text-indigo-600 font-mono">{invoice.accountNumber || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">System Reference</p>
                        <p className="text-sm font-black text-slate-800 font-mono">#{invoice.id.substring(4, 12).toUpperCase()}</p>
                    </div>
                </div>
                {/* Installment Tracking Table */}
                <section className="break-inside-avoid">
                    <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Payment Tracking Card (වාරික සටහන් පත)</h3>
                    <table className="w-full border-collapse border-2 border-slate-200">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className={`border-2 border-slate-200 ${paperSize === 'A6' ? 'p-1' : 'p-2'} text-[9px] font-black uppercase text-slate-600`}>No</th>
                                <th className={`border-2 border-slate-200 ${paperSize === 'A6' ? 'p-1' : 'p-2'} text-[9px] font-black uppercase text-slate-600`}>Due Date</th>
                                <th className={`border-2 border-slate-200 ${paperSize === 'A6' ? 'p-1' : 'p-2'} text-[9px] font-black uppercase text-slate-600`}>Amount</th>
                                <th className={`border-2 border-slate-200 ${paperSize === 'A6' ? 'p-1' : 'p-2'} text-[9px] font-black uppercase text-slate-600`}>Paid Date</th>
                                <th className={`border-2 border-slate-200 ${paperSize === 'A6' ? 'p-1' : 'p-2'} text-[9px] font-black uppercase text-slate-600`}>Stamp/Sign</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.installments.map((inst, i) => (
                                <tr key={i} className={paperSize === 'A6' ? 'h-7' : 'h-10'}>
                                    <td className={`border-2 border-slate-200 ${paperSize === 'A6' ? 'p-1' : 'p-2'} text-center font-black text-[10px]`}>{inst.installmentNumber}</td>
                                    <td className={`border-2 border-slate-200 ${paperSize === 'A6' ? 'p-1' : 'p-2'} text-center font-mono text-[9px]`}>{inst.dueDate}</td>
                                    <td className={`border-2 border-slate-200 ${paperSize === 'A6' ? 'p-1' : 'p-2'} text-right font-mono font-black text-[10px]`}>Rs. {Math.round(inst.amount).toLocaleString()}</td>
                                    <td className={`border-2 border-slate-200 ${paperSize === 'A6' ? 'p-1' : 'p-2'}`}></td>
                                    <td className={`border-2 border-slate-200 ${paperSize === 'A6' ? 'p-1' : 'p-2'}`}></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Terms and Conditions */}
                <section className={`${paperSize === 'A6' ? 'p-3' : 'p-6'} bg-slate-50 rounded-[2rem] border border-slate-200 break-inside-avoid`}>
                    <h3 className="text-[9px] font-black text-rose-600 uppercase tracking-[0.3em] mb-4 border-b border-rose-100 pb-2">Terms & Conditions (ආයතනික කොන්දේසි)</h3>
                    <ul className={`${paperSize === 'A6' ? 'space-y-1.5' : 'space-y-3'}`}>
                        <li className="flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[9px] font-black flex-shrink-0">01</span>
                            <p className={`${paperSize === 'A6' ? 'text-[8px]' : 'text-[10px]'} font-bold text-slate-700 leading-relaxed`}>භාණ්ඩය සඳහා සම්පූර්ණ මුදල ගෙවා අවසන් වන තෙක් එහි අයිතිය ආයතනය සතු වේ. (Ownership remains with the shop until full payment).</p>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[9px] font-black flex-shrink-0">02</span>
                            <p className={`${paperSize === 'A6' ? 'text-[8px]' : 'text-[10px]'} font-bold text-slate-700 leading-relaxed`}>වාරික නියමිත දිනට ගෙවිය යුතුය. ප්‍රමාද වන වාරික සඳහා අමතර ගාස්තු අය කළ හැක. (Installments must be paid on time. Late fees may apply).</p>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[9px] font-black flex-shrink-0">03</span>
                            <p className={`${paperSize === 'A6' ? 'text-[8px]' : 'text-[10px]'} font-bold text-slate-700 leading-relaxed`}>වාරික 3ක් හෝ ඊට වැඩි ප්‍රමාණයක් ප්‍රමාද වුවහොත් භාණ්ඩය නැවත ලබා ගැනීමට ආයතනයට අයිතිය ඇත. (Shop can repossess if 3+ installments are missed).</p>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[9px] font-black flex-shrink-0">04</span>
                            <p className={`${paperSize === 'A6' ? 'text-[8px]' : 'text-[10px]'} font-bold text-slate-700 leading-relaxed`}>භාණ්ඩයට සිදුවන හානි හෝ අස්ථානගතවීම් සඳහා වගකීම පාරිභෝගිකයා සතු වේ. (Customer is responsible for damage/loss).</p>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[9px] font-black flex-shrink-0">05</span>
                            <p className={`${paperSize === 'A6' ? 'text-[8px]' : 'text-[10px]'} font-bold text-slate-700 leading-relaxed`}>වගකීම් සහතිකය වලංගු වන්නේ වාරික නිසි පරිදි ගෙවා නිම කළ පසු පමණි. (Warranty is valid only after full payment).</p>
                        </li>
                    </ul>
                </section>
            </div>

            <footer className={`${paperSize === 'A6' ? 'mt-3 pt-3' : 'mt-8 pt-6'} border-t border-slate-200 flex justify-between items-center`}>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Document Integrity Verified • {new Date().toLocaleDateString()}</p>
                <div className={`${paperSize === 'A6' ? 'gap-4' : 'gap-10'} flex`}>
                    <div className="text-center">
                        <div className={`${paperSize === 'A6' ? 'h-8' : 'h-12'} flex items-center justify-center mb-1`}>
                            {shopDetails.digitalSignature ? (
                                <img src={shopDetails.digitalSignature} className="max-h-full max-w-full object-contain grayscale brightness-50" alt="" />
                            ) : (
                                <div className={`${paperSize === 'A6' ? 'w-16' : 'w-28'} border-b border-slate-900`}></div>
                            )}
                        </div>
                        <p className="text-[7px] font-black uppercase text-slate-500">Manager Sign</p>
                    </div>
                    <div className="text-center">
                        <div className={`${paperSize === 'A6' ? 'h-8' : 'h-12'} flex items-center justify-center mb-1`}>
                            {invoice.signature ? (
                                <img src={invoice.signature} className="max-h-full max-w-full object-contain grayscale brightness-50 contrast-150" alt="" />
                            ) : (
                                <div className={`${paperSize === 'A6' ? 'w-16' : 'w-28'} border-b border-slate-900`}></div>
                            )}
                        </div>
                        <p className="text-[7px] font-black uppercase text-slate-500">Customer Sign</p>
                    </div>
                </div>
            </footer>
          </div>
      )}
    </>
  );
};

export default PrintableInvoice;
