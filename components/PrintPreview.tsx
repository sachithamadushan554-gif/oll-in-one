
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { PaperSize } from '../types';

interface PrintPreviewProps {
  children: React.ReactNode;
  onClose: () => void;
  defaultPaperSize?: PaperSize;
  isSizable?: boolean;
}

const SegmentedControl: React.FC<{
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
}> = ({ options, value, onChange }) => (
    <div className="flex items-center gap-1 bg-stone-900/20 p-1 rounded-lg">
        {options.map(opt => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`flex-1 px-3 py-1.5 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white font-semibold text-sm ${value === opt.value ? 'bg-white shadow-sm text-stone-800' : 'text-white/80 hover:bg-black/20'}`}
            >
                {opt.label}
            </button>
        ))}
    </div>
);


const PrintPreview: React.FC<PrintPreviewProps> = ({ children, onClose, defaultPaperSize = 'A4', isSizable = true }) => {
  const [paperSize, setPaperSize] = useState<PaperSize>(defaultPaperSize);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    setPaperSize(defaultPaperSize);
  }, [defaultPaperSize]);

  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const handleWhatsAppShare = () => {
    // Try to extract invoice data if available to build the message
    const props = (children as any)?.props;
    const invoice = props?.invoice;
    const shop = props?.shopDetails;

    if (!invoice) {
        window.open(`https://wa.me/?text=${encodeURIComponent("Please find your official Legal Recovery Notice attached as a PDF.")}`, '_blank');
        return;
    }

    const phone = invoice.customer.phone.replace(/[^0-9]/g, '');
    const formattedPhone = (phone.startsWith('0') && phone.length === 10) ? '94' + phone.substring(1) : phone;
    
    const message = `🚨 *LEGAL RECOVERY NOTICE / අවසාන නීතිමය නිවේදනය* 🚨\n\n` +
      `Dear ${invoice.customer.name},\n\n` +
      `Please find your official *LEGAL RECOVERY NOTICE* attached below in PDF format. / පහතින් දක්වා ඇති නිල නීතිමය නිවේදනය වහාම කියවා ඒ අනුව කටයුතු කරන්න.\n\n` +
      `🆔 *Account No:* ${invoice.accountNumber || 'N/A'}\n` +
      `*Total Outstanding:* Rs. ${Math.round(invoice.balance).toLocaleString()}\n` +
      `*Case Ref:* LRN-${new Date().getFullYear()}-${invoice.id.substring(4, 10).toUpperCase()}\n\n` +
      `Settlement is required within *03 DAYS (දින 03)* to avoid police escalation at the local station via ${shop?.name || 'our office'}. / පොලිස් මූලස්ථානය හරහා නීතිමය ක්‍රියාමාර්ග ගැනීමට පෙර මෙම හිඟ මුදල ඉදිරි දින 03 ඇතුළත පියවීමට කටයුතු කරන්න.\n\n` +
      `_Please save the following document as PDF and attach it manually if not sent already._`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const paperSizeOptions = [
    { label: 'A4', value: 'A4' },
    { label: 'A5', value: 'A5' },
    { label: 'A6', value: 'A6' },
  ];

  const contentWithProps = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, isSizable ? { paperSize: paperSize } : {})
    : children;

  // Improved detection of legal notice to show specific toolbar actions
  const isLegalNotice = (children as any)?.type?.name === 'PrintableLegalNotice' || (children as any)?.props?.invoice?.balance !== undefined;

  const printPreviewRoot = document.getElementById('print-preview-root');
  if (!printPreviewRoot) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-slate-900/95 z-[100] flex flex-col items-center justify-start p-4 pt-16 animate-fade-in-up custom-scroll overflow-y-auto print:bg-white print:p-0 print:pt-0">
      <div id="print-preview-toolbar" className="w-full max-w-4xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/90 p-4 rounded-[2rem] backdrop-blur-xl shadow-2xl border border-white/10 no-print">
        {isSizable ? (
            <div className="w-full md:w-52">
                 <SegmentedControl options={paperSizeOptions} value={paperSize} onChange={(val) => setPaperSize(val as PaperSize)} />
            </div>
        ) : <div />}
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            {isLegalNotice && (
                <button
                    onClick={handleWhatsAppShare}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    WhatsApp Notice
                </button>
            )}
            
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 text-xs font-black uppercase tracking-widest rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:bg-indigo-400 disabled:cursor-wait transition-all shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v3a2 2 0 002 2h6a2 2 0 002-2v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
              {isPrinting ? 'Preparing...' : isLegalNotice ? 'Print to PDF' : 'Confirm Print'}
            </button>

            <button
              onClick={onClose}
              className="p-3 text-white hover:bg-white/10 rounded-xl transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </div>
      </div>

      <div id="print-preview-content" className="relative print:m-0 print:p-0 mb-20">
        <div className={`print-content-wrapper transition-all duration-500 ${isPrinting ? 'opacity-80 scale-[0.98]' : 'opacity-100 scale-100'}`}>
            {contentWithProps}
        </div>
      </div>
    </div>,
    printPreviewRoot
  );
};

export default PrintPreview;
