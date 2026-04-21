
import React, { useState, useMemo, useEffect } from 'react';
import type { Invoice, Payment, ShopDetails, Product } from '../types';
import { InvoiceCard } from './InvoiceCard';
import { InvoiceStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, ChevronDown } from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  markInstallmentAsPaid: (invoiceId: string, installmentNumber: number, actualAmount: number, paymentDate: string, paymentNote: string, nextDueDate?: string) => void;
  onPrint: (invoice: Invoice) => void;
  onPrintAgreement?: (invoice: Invoice) => void;
  onPrintLegalNotice?: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  addPaymentToInvoice: (invoiceId: string, paymentData: { amount: number; date: string; note?: string }) => void;
  updatePayment?: (invoiceId: string, paymentId: string, updatedData: { date: string; note?: string }) => void;
  updateCustomerPhoto?: (invoiceId: string, photoUrl: string) => void;
  updateCustomerDetails: (invoiceId: string, updates: { name?: string; phone?: string }) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  snoozeInstallmentReminder: (invoiceId: string, installmentNumber: number) => void;
  onPrintReceipt: (invoice: Invoice, payment: Payment) => void;
  shopDetails: ShopDetails;
  newlyAddedInvoiceId: string | null;
  viewMode?: 'pc' | 'mobile';
  onViewCustomer?: (phone: string) => void;
  products: Product[];
}

type FilterStatus = 'all' | 'arrears' | 'settled';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'name-asc';

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, markInstallmentAsPaid, onPrint, onPrintAgreement, onPrintLegalNotice, onDeleteInvoice, addPaymentToInvoice, snoozeInstallmentReminder, onPrintReceipt, shopDetails, newlyAddedInvoiceId, updatePayment, updateCustomerPhoto, updateCustomerDetails, onUpdateInvoice, viewMode = 'pc', onViewCustomer, products }) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

  const isMobile = viewMode === 'mobile';

  useEffect(() => {
    if (newlyAddedInvoiceId) {
        // Clear all filters so the target invoice is definitely visible
        setSearchQuery('');
        setActiveFilter('all');
        setSortBy('date-desc');
        
        // Increase timeout to ensure the re-render of the list completes
        setTimeout(() => {
            const element = document.getElementById(`invoice-${newlyAddedInvoiceId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 350);
    }
  }, [newlyAddedInvoiceId]);

  const filteredInvoices = useMemo(() => {
    let result = [...invoices];
    if (activeFilter === 'arrears') {
        result = result.filter(inv => inv.status === InvoiceStatus.Partial || inv.status === InvoiceStatus.Overdue);
    } else if (activeFilter === 'settled') {
        result = result.filter(inv => inv.status === InvoiceStatus.Paid);
    }
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(invoice =>
          invoice.customer.name.toLowerCase().includes(query) ||
          invoice.customer.nickname?.toLowerCase().includes(query) ||
          invoice.id.toLowerCase().includes(query) ||
          invoice.customer.phone.includes(query)
        );
    }
    
    return result.sort((a, b) => {
        switch (sortBy) {
            case 'date-asc':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'amount-desc':
                return b.totalAmount - a.totalAmount;
            case 'amount-asc':
                return a.totalAmount - b.totalAmount;
            case 'name-asc':
                return a.customer.name.localeCompare(b.customer.name);
            case 'date-desc':
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });
  }, [invoices, searchQuery, activeFilter, sortBy]);
  
  const stats = useMemo(() => {
      const currentListTotal = filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0);
      return { currentListTotal };
  }, [filteredInvoices]);

  return (
    <div className={`space-y-6 animate-fade-in ${isMobile ? 'pb-32' : 'pb-40'}`}>
       {/* Analytic Ribbon */}
       <div className={`flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-900/60 rounded-[2.5rem] border border-slate-800/40 backdrop-blur-xl shadow-2xl ${isMobile ? 'p-6' : 'p-8'}`}>
          <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-indigo-600 rounded-full" />
              <div>
                <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-black text-white tracking-tighter uppercase leading-none`}>Billing History</h2>
                <p className="text-slate-500 font-bold uppercase text-[8px] tracking-[0.3em] mt-1.5">ලේඛනය කළමනාකරණය (Registry Control)</p>
              </div>
          </div>
          
          <div className={`flex items-center ${isMobile ? 'w-full justify-between gap-4' : 'gap-12'}`}>
              <div className={`text-right ${isMobile ? '' : 'hidden sm:block'}`}>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Records / ගණන</p>
                  <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-black text-slate-300 tabular-nums`}>{filteredInvoices.length}</p>
              </div>
              <div className="text-right">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Liability / හිඟ මුදල</p>
                  <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-indigo-400 tabular-nums tracking-tighter`}>
                    <span className="text-[10px] mr-1 opacity-40 uppercase font-mono">Rs.</span>
                    {Math.round(stats.currentListTotal).toLocaleString()}
                  </p>
              </div>
          </div>
       </div>

       {/* Control Deck */}
       <div className={`flex flex-col md:flex-row justify-between items-center gap-6`}>
            <div className={`flex p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full md:w-auto shadow-sm overflow-x-auto custom-scroll`}>
                {(['all', 'arrears', 'settled'] as FilterStatus[]).map((tab) => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveFilter(tab)} 
                        className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeFilter === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                    >
                        {tab === 'all' ? 'All / සියල්ල' : tab === 'arrears' ? 'Arrears / හිඟ' : 'Settled / ගෙවා නිම කළ'}
                    </button>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-48 group">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="w-full pl-4 pr-10 py-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 text-sm appearance-none cursor-pointer"
                    >
                        <option value="date-desc">Newest First / අලුත්ම මුලට</option>
                        <option value="date-asc">Oldest First / පැරණිම මුලට</option>
                        <option value="amount-desc">Highest Amount / වැඩිම මුදල</option>
                        <option value="amount-asc">Lowest Amount / අඩුම මුදල</option>
                        <option value="name-asc">Name A-Z / නම අනුව</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={3} />
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" strokeWidth={3} />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Registry / සොයන්න..."
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                    />
                </div>
            </div>
       </div>

       {/* Registry Grid */}
       <div className="grid grid-cols-1 gap-4">
        {filteredInvoices.map((invoice) => (
            <InvoiceCard 
                key={invoice.id}
                invoice={invoice} 
                markInstallmentAsPaid={markInstallmentAsPaid}
                onPrint={onPrint}
                onPrintAgreement={onPrintAgreement}
                onPrintLegalNotice={onPrintLegalNotice}
                onDelete={onDeleteInvoice}
                addPaymentToInvoice={addPaymentToInvoice}
                updatePayment={updatePayment}
                updateCustomerPhoto={updateCustomerPhoto}
                updateCustomerDetails={updateCustomerDetails}
                onUpdateInvoice={onUpdateInvoice}
                snoozeInstallmentReminder={snoozeInstallmentReminder}
                isSelected={selectedInvoices.has(invoice.id)}
                onSelectToggle={(id) => {
                    const next = new Set(selectedInvoices);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    setSelectedInvoices(next);
                }}
                onPrintReceipt={onPrintReceipt}
                shopDetails={shopDetails}
                newlyAddedInvoiceId={newlyAddedInvoiceId}
                onViewCustomer={onViewCustomer}
                viewMode={viewMode}
                products={products}
            />
        ))}
       </div>

       {filteredInvoices.length === 0 && (
          <div className="py-48 text-center opacity-40">
             <p className="font-black text-xs uppercase tracking-[0.6em] text-slate-500">No records found / දත්ත නොමැත</p>
          </div>
       )}
    </div>
  );
};
