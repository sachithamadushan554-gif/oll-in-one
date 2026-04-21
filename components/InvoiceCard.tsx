
import React, { useState, useRef, useEffect, useMemo } from 'react';
import NewInvoiceForm from './NewInvoiceForm';
import type { Invoice, Installment, Payment, ShopDetails, Product } from '../types';
import { InvoiceStatus } from '../types';
import Modal, { ConfirmationModal } from './Modal';
import { useLanguage } from '../contexts/LanguageContext';
import { optimizeImage } from '../utils/imageOptimizer';
import { useBlacklist } from '../hooks/useBlacklist';
import { 
    User, 
    ExternalLink, 
    Edit, 
    Package, 
    ChevronDown, 
    Printer, 
    FileText, 
    AlertTriangle, 
    CheckCircle2,
    Calendar,
    DollarSign,
    MoreVertical
} from 'lucide-react';

interface InvoiceCardProps {
  invoice: Invoice;
  markInstallmentAsPaid: (invoiceId: string, installmentNumber: number, actualAmount: number, paymentDate: string, paymentNote: string, nextDueDate?: string) => void;
  onPrint: (invoice: Invoice) => void;
  onPrintAgreement?: (invoice: Invoice) => void;
  onPrintLegalNotice?: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  addPaymentToInvoice: (invoiceId: string, paymentData: { amount: number; date: string; note?: string }) => void;
  updatePayment?: (invoiceId: string, paymentId: string, updatedData: { date: string; note?: string }) => void;
  updateCustomerPhoto?: (invoiceId: string, photoUrl: string) => void;
  updateCustomerDetails?: (invoiceId: string, updates: { name?: string; phone?: string }) => void;
  snoozeInstallmentReminder: (invoiceId: string, installmentNumber: number) => void;
  isSelected: boolean;
  onSelectToggle: (invoiceId: string) => void;
  onPrintReceipt: (invoice: Invoice, payment: Payment) => void;
  shopDetails: ShopDetails;
  newlyAddedInvoiceId: string | null;
  viewMode?: 'pc' | 'mobile';
  onViewCustomer?: (phone: string) => void;
  products: Product[];
  onUpdateInvoice: (invoice: Invoice) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ 
    invoice, markInstallmentAsPaid, onPrint, onPrintAgreement, onPrintLegalNotice, onDelete, isSelected, 
    onSelectToggle, newlyAddedInvoiceId, shopDetails, updateCustomerPhoto, updateCustomerDetails,
    viewMode = 'pc', onViewCustomer, products, onUpdateInvoice
}) => {
    const { language } = useLanguage();
    const isMobile = viewMode === 'mobile';
    const { checkIsBlacklisted } = useBlacklist();
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
    const [isTargeted, setIsTargeted] = useState(false);
    
    const [editName, setEditName] = useState(invoice.customer.name);
    const [editNickname, setEditNickname] = useState(invoice.customer.nickname || '');
    const [editPhone, setEditPhone] = useState(invoice.customer.phone);

    const [confirmInstallment, setConfirmInstallment] = useState<number | null>(null);
    const [actualAmountReceived, setActualAmountReceived] = useState<string>('');
    const [paymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [staffName, setStaffName] = useState<string>('');
    const [shouldSendWhatsApp, setShouldSendWhatsApp] = useState(true);
    const [nextDueDate, setNextDueDate] = useState<string>('');

    const blacklistedInfo = useMemo(() => {
        return checkIsBlacklisted(invoice.customer.phone, invoice.customer.name);
    }, [invoice.customer.name, invoice.customer.phone, checkIsBlacklisted]);

    useEffect(() => {
        if (newlyAddedInvoiceId === invoice.id) {
            setIsOpen(true);
            setIsTargeted(true);
            const timer = setTimeout(() => setIsTargeted(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [newlyAddedInvoiceId, invoice.id]);

    const getFormattedPhone = (rawPhone: string) => {
        const clean = rawPhone.replace(/[^0-9]/g, '');
        if (clean.startsWith('0') && clean.length === 10) {
            return '94' + clean.substring(1);
        }
        return clean;
    };

    const handleToggleInstallment = (inst: Installment) => {
        if (!inst.paid) {
            setConfirmInstallment(inst.installmentNumber);
            setActualAmountReceived(String(Math.round(inst.amount)));
            setStaffName('');
            setShouldSendWhatsApp(true);
            setNextDueDate('');
        }
    };

    const handleUpdateDetails = () => {
        if (updateCustomerDetails && (editName.trim() || editPhone.trim())) {
            updateCustomerDetails(invoice.id, { name: editName, phone: editPhone, nickname: editNickname } as any);
            setIsEditDetailsOpen(false);
        }
    };

    const sendWhatsAppReceipt = (paidAmount: number, currentBalance: number, staff: string, instNum: number) => {
        const formattedPhone = getFormattedPhone(invoice.customer.phone);
        const newBal = Math.max(0, currentBalance - paidAmount);
        
        const totalInst = invoice.installments.length;
        const lateCount = invoice.installments.filter(i => i.paid === false && new Date(i.dueDate) < new Date()).length;
        const score = Math.max(0, 100 - (lateCount * (100 / totalInst)));
        
        const nextInst = invoice.installments.find(inst => !inst.paid && inst.installmentNumber > instNum);

        const itemsList = invoice.items.map(item => `• ${item.description} (Rs. ${Math.round(item.price).toLocaleString()})`).join('\n');

        let message = "";
        const accInfo = `🆔 *Account No:* ${invoice.accountNumber || 'N/A'}\n`;
        
        if (paidAmount === 0) {
            // Check if it's a new purchase share or a reminder
            if (invoice.installments.length === 0) {
                // FULL PAYMENT PURCHASE
                message = `📦 *නව මිලදී ගැනීම / NEW PURCHASE* 📦\n\n` +
                    `හිතවත් *${invoice.customer.name}*,\n\n` +
                    `ඔබගේ *${shopDetails.name.toUpperCase()}* මිලදී ගැනීම වෙනුවෙන් ස්තූතියි!\n\n` +
                    accInfo +
                    `📌 *භාණ්ඩ විස්තර (Asset Details):*\n${itemsList}\n\n` +
                    `💰 *මුළු වටිනාකම:* Rs. ${Math.round(invoice.totalAmount).toLocaleString()}\n` +
                    `✅ *ගෙවීම් ක්‍රමය:* සම්පූර්ණ ගෙවීම (Full Payment)\n` +
                    `📅 *දිනය:* ${invoice.createdAt}\n\n` +
                    `ස්තූතියි!\n*${shopDetails.name.toUpperCase()}*`;
            } else {
                const targetInst = invoice.installments.find(i => i.installmentNumber === instNum) || invoice.installments.find(i => !i.paid) || invoice.installments[0];
                const dueDate = new Date(targetInst.dueDate);
                dueDate.setHours(0,0,0,0);
                const today = new Date();
                today.setHours(0,0,0,0);
                
                const diffTime = today.getTime() - dueDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 0 && instNum === 1 && invoice.payments.length <= 1) {
                    // NEW INSTALLMENT PURCHASE
                    message = `📦 *නව මිලදී ගැනීම / NEW PURCHASE* 📦\n\n` +
                        `හිතවත් *${invoice.customer.name}*,\n\n` +
                        `ඔබගේ *${shopDetails.name.toUpperCase()}* මිලදී ගැනීම වෙනුවෙන් ස්තූතියි!\n\n` +
                        accInfo +
                        `📌 *භාණ්ඩ විස්තර (Asset Details):*\n${itemsList}\n\n` +
                        `📌 *ගෙවීම් සැලසුම (Payment Plan):*\n` +
                        `මුළු වටිනාකම: *Rs. ${Math.round(invoice.totalAmount).toLocaleString()}*\n` +
                        `වාරික ගණන: *${invoice.installments.length}*\n` +
                        `වාරිකයක මුදල: *Rs. ${Math.round(invoice.installments[0].amount).toLocaleString()}*\n` +
                        `මීළඟ වාරික දිනය: *${invoice.installments[0].dueDate}*\n\n` +
                        `📅 *දිනය:* ${invoice.createdAt}\n\n` +
                        `ස්තූතියි!\n*${shopDetails.name.toUpperCase()}*`;
                } else if (diffDays > 0) {
                    // Overdue
                    message = `⚠️ *ප්‍රමාද වූ ගෙවීම් මතක් කිරීම / OVERDUE REMINDER* ⚠️\n\n` +
                        `හිතවත් *${invoice.customer.name}*,\n\n` +
                        `ඔබගේ *${shopDetails.name.toUpperCase()}* ගිණුමේ වාරිකය ගෙවීමට නියමිතව තිබූ දිනය පසු වී ඇත. කරුණාකර හැකි ඉක්මනින් හිඟ මුදල පියවීමට කටයුතු කරන්න.\n\n` +
                        accInfo +
                        `📌 *භාණ්ඩ විස්තර (Asset Details):*\n${itemsList}\n\n` +
                        `📌 *ගෙවීම් විස්තර (Payment Details):*\n` +
                        `වාරික අංකය: #${targetInst.installmentNumber}\n` +
                        `ගෙවිය යුතු දිනය: *${targetInst.dueDate}*\n` +
                        `ප්‍රමාද වූ දින ගණන: *දින ${diffDays} ක්*\n` +
                        `ගෙවිය යුතු මුදල: *Rs. ${Math.round(targetInst.amount).toLocaleString()}*\n` +
                        `මුළු හිඟ මුදල: *Rs. ${Math.round(invoice.balance).toLocaleString()}*\n\n` +
                        `ස්තූතියි!\n*${shopDetails.name.toUpperCase()}*`;
                } else {
                    // Upcoming or Today
                    message = `🔔 *ගෙවීම් මතක් කිරීම / PAYMENT REMINDER* 🔔\n\n` +
                        `හිතවත් *${invoice.customer.name}*,\n\n` +
                        `ඔබගේ *${shopDetails.name.toUpperCase()}* ගිණුමේ වාරික ගෙවීම සඳහා නියමිත දිනය පැමිණ ඇත. කරුණාකර නියමිත වේලාවට ගෙවීම් සිදු කර අපගේ සේවාව අඛණ්ඩව ලබා ගැනීමට සහය වන්න.\n\n` +
                        accInfo +
                        `📌 *භාණ්ඩ විස්තර (Asset Details):*\n${itemsList}\n\n` +
                        `📌 *ගෙවීම් විස්තර (Payment Details):*\n` +
                        `වාරික අංකය: #${targetInst.installmentNumber}\n` +
                        `ගෙවිය යුතු දිනය: *${targetInst.dueDate}*\n` +
                        `ගෙවිය යුතු මුදල: *Rs. ${Math.round(targetInst.amount).toLocaleString()}*\n` +
                        `මුළු හිඟ මුදල: *Rs. ${Math.round(invoice.balance).toLocaleString()}*\n\n` +
                        `ස්තූතියි!\n*${shopDetails.name.toUpperCase()}*`;
                }
            }
        } else if (newBal <= 1) {
            // SETTLED MESSAGE
            message = `✅ *ගෙවා නිම කළා / ACCOUNT SETTLED* ✅\n\n` +
                `හිතවත් *${invoice.customer.name}*,\n\n` +
                `ඔබගේ *${shopDetails.name.toUpperCase()}* ගිණුමේ සියලුම ගෙවීම් සාර්ථකව අවසන් කර ඇත. අප කෙරෙහි තැබූ විශ්වාසයට ස්තූතියි!\n\n` +
                accInfo +
                `📌 *භාණ්ඩ විස්තර (Asset Details):*\n${itemsList}\n\n` +
                `💰 *අවසන් ගෙවීම:* Rs. ${Math.round(paidAmount).toLocaleString()}\n` +
                `📉 *ඉතිරි ශේෂය:* Rs. 0.00\n` +
                `⭐ *විශ්වාසනීයත්වය (Trust Rating):* ${Math.round(score)}/100\n\n` +
                `ලැබුණේ: ${staff || 'Authorized Admin'}\n` +
                `*---------------------------------*\n` +
                `Thank you for your business!`;
        } else {
            // REGULAR RECEIPT
            message = `✅ *ගෙවීම් ලැබුණි / PAYMENT RECEIVED* ✅\n\n` +
                `හිතවත් *${invoice.customer.name}*,\n\n` +
                `ඔබගේ ගෙවීම සාර්ථකව ලැබී ඇති බව දන්වා සිටිමු.\n\n` +
                accInfo +
                `📌 *භාණ්ඩ විස්තර (Asset Details):*\n${itemsList}\n\n` +
                `💵 *ගෙවූ මුදල:* Rs. ${Math.round(paidAmount).toLocaleString()}\n` +
                `📉 *නව ශේෂය:* Rs. ${Math.round(newBal).toLocaleString()}\n\n`;
            
            if (nextInst) {
                message += `🔔 *මීළඟ වාරිකය (Next Payment):*\n` +
                `දිනය: ${nextInst.dueDate}\n` +
                `මුදල: Rs. ${Math.round(nextInst.amount).toLocaleString()}\n\n`;
            }

            message += `ලැබුණේ: ${staff || 'Authorized Admin'}\n` +
                `*---------------------------------*\n` +
                `Thank you!\n*${shopDetails.name.toUpperCase()}*`;
        }
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const estimatedNewBalance = Math.max(0, invoice.balance - (Number(actualAmountReceived) || 0));
    
    // Summary data for collapsed view
    const mainItem = invoice.items[0]?.description || 'Multiple Items';
    const itemCount = invoice.items.length;

    return (
        <div id={`invoice-${invoice.id}`} className={`group relative bg-white dark:bg-[#0b0e14]/60 backdrop-blur-xl rounded-3xl border transition-all duration-700 overflow-hidden ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/10' : blacklistedInfo ? 'border-rose-500 shadow-rose-500/10' : isTargeted ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'} shadow-lg shadow-black/5`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all ${blacklistedInfo ? 'bg-rose-600' : invoice.status === InvoiceStatus.Paid ? 'bg-emerald-500' : invoice.status === InvoiceStatus.Overdue ? 'bg-rose-500' : 'bg-amber-500'}`} />
            <div onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-4 cursor-pointer select-none ml-1.5 ${isMobile ? 'p-4' : 'p-6'}`}>
                <div onClick={(e) => { e.stopPropagation(); setIsZoomOpen(true); }} className={`${isMobile ? 'w-12 h-12 rounded-xl' : 'w-14 h-14 rounded-2xl'} bg-slate-100 dark:bg-slate-900 border overflow-hidden flex-shrink-0 transition-transform active:scale-90 ${blacklistedInfo ? 'border-rose-500/50 shadow-lg shadow-rose-500/20' : 'border-slate-200 dark:border-slate-800'}`}>
                    {invoice.customer.photoUrl ? <img src={invoice.customer.photoUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700"><User className={`${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`} strokeWidth={3} /></div>}
                </div>
                <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-2 group/name">
                        <p className={`font-black uppercase truncate leading-none ${isMobile ? 'text-sm' : 'text-base md:text-lg'} ${blacklistedInfo ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {invoice.customer.name} {invoice.customer.nickname ? <span className="text-[10px] opacity-40 ml-1">({invoice.customer.nickname})</span> : ''}
                        </p>
                        <div className="flex items-center gap-1">
                            {onViewCustomer && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onViewCustomer(invoice.customer.phone); }}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 group-hover/name:opacity-100 transition-opacity"
                                    title="View Customer Profile"
                                >
                                    <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
                                </button>
                            )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsEditInvoiceOpen(true); }} 
                                className="p-1.5 text-slate-400 hover:text-indigo-600 transition-opacity"
                                title="Edit Full Ledger"
                            >
                                <Edit className="h-4 w-4" strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${isMobile ? 'mt-1' : 'mt-2'}`}>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{invoice.customer.phone}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="flex items-center gap-1">
                            <Package className="h-2.5 w-2.5 text-indigo-500" strokeWidth={3} />
                            <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase truncate max-w-[100px]">{mainItem}{itemCount > 1 ? ` (+${itemCount - 1})` : ''}</p>
                        </div>
                    </div>
                </div>
                <div className={`text-right px-2 ${isMobile ? 'min-w-[80px]' : 'min-w-[120px]'}`}>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 opacity-60">Balance</p>
                    <p className={`font-black tabular-nums tracking-tighter ${isMobile ? 'text-base' : 'text-lg md:text-xl'} ${invoice.balance > 0.5 ? 'text-rose-500' : 'text-emerald-500'}`}><span className="text-[9px] mr-1 opacity-40 uppercase">Rs</span>{Math.round(invoice.balance).toLocaleString()}</p>
                </div>
                <div className={`p-1.5 rounded-lg transition-all ${isOpen ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
                </div>
            </div>
            <div className={`animate-height ${isOpen ? 'open' : ''}`}>
                <div className={`${isMobile ? 'px-4 pb-6 pt-4' : 'px-6 pb-10 pt-6'} space-y-8 border-t border-slate-100 dark:border-slate-800/30 bg-slate-50/30 dark:bg-slate-950/20`}>
                    
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                         <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onPrint(invoice); }}
                                className={`flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 ${isMobile ? 'flex-1 py-3 px-4' : 'px-6 py-3'}`}
                            >
                                <Printer className="h-4 w-4" strokeWidth={2.5} />
                                {isMobile ? 'Print' : 'Print Master Bill'}
                            </button>
                            {onPrintAgreement && invoice.installments.length > 0 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onPrintAgreement(invoice); }}
                                    className={`flex items-center justify-center gap-2 bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-black/20 transition-all hover:bg-slate-900 active:scale-95 ${isMobile ? 'flex-1 py-3 px-4' : 'px-6 py-3'}`}
                                >
                                    <FileText className="h-4 w-4" strokeWidth={2.5} />
                                    {isMobile ? 'Agreement' : 'Print Agreement'}
                                </button>
                            )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); sendWhatsAppReceipt(0, invoice.balance, 'Admin', 1); }}
                                className={`flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95 ${isMobile ? 'flex-1 py-3 px-4' : 'px-6 py-3'}`}
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                {isMobile ? 'WhatsApp' : 'WhatsApp Share'}
                            </button>
                            {onPrintLegalNotice && invoice.status === 'Overdue' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onPrintLegalNotice(invoice); }}
                                    className={`flex items-center justify-center gap-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-95 ${isMobile ? 'w-full py-3' : 'px-6 py-3'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Legal Notice
                                </button>
                            )}
                         </div>
                    </div>

                    {/* Asset Registry (Items purchased) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Asset Registry / ලබාගත් භාණ්ඩ</h4>
                            {isMobile && <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">Swipe →</span>}
                        </div>
                        
                        <div className={`${isMobile ? 'flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory custom-scroll -mx-2 px-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
                            {invoice.items.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className={`${isMobile ? 'flex-shrink-0 w-[280px] snap-start' : ''} p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col justify-between group/item transition-all hover:shadow-2xl hover:border-indigo-500/30`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="font-black text-slate-800 dark:text-slate-100 uppercase text-sm leading-tight line-clamp-2 flex-1">{item.description}</p>
                                            <div className="px-2 py-1 bg-indigo-600/10 rounded-lg">
                                                <span className="text-[9px] font-black text-indigo-600 uppercase">Qty: {item.quantity}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-mono text-slate-400 font-bold tracking-widest bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl inline-block">
                                            {item.imei || 'NO IMEI RECORDED'}
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-slate-50 dark:border-slate-800/50 space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span>Unit Price</span>
                                            <span className="font-mono text-slate-600 dark:text-slate-300">Rs. {Math.round(item.price).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Total Amount</span>
                                            <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums font-mono tracking-tighter">Rs. {Math.round(item.amount || (item.price * item.quantity)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">Payment History</h4>
                                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-3 custom-scroll">
                                    {invoice.payments?.length > 0 ? [...invoice.payments].reverse().map((pay) => {
                                        const staffMatch = pay.note?.match(/\(By:\s*(.*?)\)/);
                                        const staffMember = staffMatch ? staffMatch[1] : 'System';
                                        return (
                                            <div key={pay.id} className="relative pl-5 border-l-2 border-indigo-500/20 py-2 group/pay">
                                                <div className="absolute -left-[6px] top-4 w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm transition-transform group-hover/pay:scale-125" />
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">Rs. {Math.round(pay.amount).toLocaleString()}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{pay.date}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black text-indigo-500 uppercase leading-none mb-0.5">Received By</p>
                                                        <p className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase truncate max-w-[80px]">{staffMember}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : <p className="text-[10px] font-bold text-slate-400 italic text-center py-6">No payments recorded yet.</p>}
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-8 space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">Installment Schedule</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-3 custom-scroll">
                                {invoice.installments.map((inst, i) => {
                                    const isOverdue = !inst.paid && new Date(inst.dueDate) < new Date();
                                    return (
                                        <div key={i} onClick={() => handleToggleInstallment(inst)} className={`group/point p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-40 ${inst.paid ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 opacity-60' : isOverdue ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/40 shadow-rose-500/5' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 hover:shadow-xl'}`}>
                                            <div className="flex justify-between items-start">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${inst.paid ? 'text-emerald-500' : isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>Point {inst.installmentNumber}</span>
                                                {inst.paid ? (
                                                    <svg className="w-4 h-4 text-emerald-500 animate-checkmark-pop" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                ) : (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); sendWhatsAppReceipt(0, invoice.balance, 'Admin', inst.installmentNumber); }}
                                                        className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all opacity-0 group-hover/point:opacity-100"
                                                        title="Send Reminder"
                                                    >
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                                    </button>
                                                )}
                                            </div>
                                            <div>{inst.paid ? <div className="space-y-1"><p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">Rs. {Math.round(inst.paidAmount || inst.amount).toLocaleString()}</p><p className="text-[7px] font-bold text-slate-400 uppercase leading-tight">{inst.paidAt || 'Cleared'}</p></div> : <><p className={`text-base font-black tabular-nums font-mono ${isOverdue ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>Rs. {Math.round(inst.amount).toLocaleString()}</p><p className={`text-[9px] font-black mt-2 uppercase tracking-widest ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>{inst.dueDate}</p></>}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setIsEditInvoiceOpen(true);
                                    }} 
                                    className="px-6 py-3 text-indigo-600 hover:text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                                >
                                    Edit Ledger
                                </button>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setIsDeleteModalOpen(true);
                                    }} 
                                    className="px-6 py-3 text-rose-500 hover:text-rose-600 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                                >
                                    Delete Ledger
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collection Hub Modal */}
            <Modal isOpen={confirmInstallment !== null} onClose={() => setConfirmInstallment(null)} title="Authority Collection Hub" variant="focus">
                <div className="space-y-8 animate-fade-in-content">
                    <div className="relative p-10 bg-slate-950 rounded-[3.5rem] border border-white/10 text-center shadow-2xl overflow-hidden group">
                        {/* Decorative Elements */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-1000" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full group-hover:bg-emerald-600/10 transition-all duration-1000" />
                        
                        <div className="relative z-10">
                            <div className="flex flex-col items-center mb-10">
                                <div className="w-16 h-16 bg-indigo-600/20 rounded-3xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/30 shadow-xl shadow-indigo-500/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <label className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.5em] mb-1">Asset Authorization</label>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ගෙවීම් තහවුරු කිරීම</p>
                            </div>

                            <div className="relative mb-10">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-700 font-mono">Rs.</span>
                                <input 
                                    type="number" 
                                    value={actualAmountReceived} 
                                    onChange={(e) => setActualAmountReceived(e.target.value)} 
                                    className="w-full bg-transparent text-center text-6xl md:text-7xl font-black text-white outline-none tabular-nums placeholder:text-slate-900 transition-all focus:scale-110" 
                                    autoFocus 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-10">
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                                    <p className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-widest">Expected</p>
                                    <p className="text-lg font-black text-slate-300 font-mono tracking-tighter">Rs. {Math.round(invoice.installments.find(i => i.installmentNumber === confirmInstallment)?.amount || 0).toLocaleString()}</p>
                                </div>
                                <div className="p-5 bg-rose-500/5 rounded-3xl border border-rose-500/10 backdrop-blur-sm">
                                    <p className="text-[9px] font-black uppercase text-rose-500 mb-2 tracking-widest">Total Due</p>
                                    <p className="text-lg font-black text-rose-500 font-mono tracking-tighter">Rs. {Math.round(estimatedNewBalance).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-6 text-left border-t border-white/5 pt-10">
                                <div className="group/input">
                                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-3 block ml-2 group-focus-within/input:text-indigo-400 transition-colors">Authorized Personnel</label>
                                    <div className="relative">
                                        <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <input 
                                            type="text" 
                                            value={staffName} 
                                            onChange={(e) => setStaffName(e.target.value)} 
                                            placeholder="Enter authorized name..." 
                                            className="w-full bg-slate-900/50 border border-slate-800/50 pl-14 pr-6 py-5 rounded-[1.5rem] text-sm font-black text-indigo-400 focus:border-indigo-600 focus:bg-slate-900 outline-none transition-all shadow-inner" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-6 bg-indigo-600/5 rounded-[2rem] border border-indigo-600/10 group/toggle cursor-pointer" onClick={() => setShouldSendWhatsApp(!shouldSendWhatsApp)}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">WhatsApp Sync</span>
                                        </div>
                                        <span className="text-[8px] text-slate-500 uppercase mt-1.5 font-bold tracking-tighter">ස්වයංක්‍රීයව පණිවිඩයක් යවන්න</span>
                                    </div>
                                    <div className={`w-14 h-7 rounded-full transition-all relative ${shouldSendWhatsApp ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                                        <div className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-500 ${shouldSendWhatsApp ? 'left-8 bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'left-1 bg-slate-400'}`} />
                                    </div>
                                </div>

                                {/* Partial Payment Next Due Date - Only if it's the last installment or no next unpaid */}
                                {confirmInstallment !== null && Number(actualAmountReceived) > 0 && Number(actualAmountReceived) < (invoice.installments.find(i => i.installmentNumber === confirmInstallment)?.amount || 0) && 
                                 !invoice.installments.some(inst => !inst.paid && inst.installmentNumber > confirmInstallment) && (
                                    <div className="p-8 bg-rose-500/5 rounded-[2.5rem] border border-rose-500/10 space-y-4 animate-fade-in-up">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-500">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">Next Due Date (Partial)</span>
                                                <p className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">ඉතිරි මුදල ගෙවීමට ලබා දෙන දිනය</p>
                                            </div>
                                        </div>
                                        <input 
                                            type="date" 
                                            value={nextDueDate}
                                            onChange={(e) => setNextDueDate(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl text-xs font-black text-white outline-none focus:border-rose-500 transition-all shadow-inner"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => { 
                                if(confirmInstallment && Number(actualAmountReceived) > 0) { 
                                    markInstallmentAsPaid(invoice.id, confirmInstallment, Number(actualAmountReceived), paymentDate, `Point #${confirmInstallment} (By: ${staffName || 'Admin'})`, nextDueDate); 
                                    if (shouldSendWhatsApp) sendWhatsAppReceipt(Number(actualAmountReceived), invoice.balance, staffName, confirmInstallment); 
                                    setConfirmInstallment(null); 
                                } 
                            }} 
                            className="group relative w-full py-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            <span className="relative z-10">Authorize Transaction / තහවුරු කරන්න</span>
                        </button>
                        <button 
                            onClick={() => setConfirmInstallment(null)}
                            className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            Cancel and Return
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Customer Details Modal */}
            <Modal isOpen={isEditDetailsOpen} onClose={() => setIsEditDetailsOpen(false)} title="Registry Editor / දත්ත සංස්කරණය" variant="focus">
                <div className="space-y-8">
                    <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-inner space-y-6">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] ml-2">Customer Name / නම</label>
                             <input 
                                type="text" 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)} 
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-base font-black text-slate-800 dark:text-white outline-none focus:border-indigo-600 transition-all shadow-sm"
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] ml-2">Nickname / සොයාගැනීමේ නම</label>
                             <input 
                                type="text" 
                                value={editNickname} 
                                onChange={(e) => setEditNickname(e.target.value)} 
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-base font-black text-slate-800 dark:text-white outline-none focus:border-indigo-600 transition-all shadow-sm"
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] ml-2">Phone Number / දුරකථනය</label>
                             <input 
                                type="tel" 
                                value={editPhone} 
                                onChange={(e) => setEditPhone(e.target.value)} 
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-base font-black text-slate-800 dark:text-white outline-none focus:border-indigo-600 transition-all shadow-sm"
                             />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleUpdateDetails} 
                            className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-indigo-600/20 transition-all transform active:scale-95"
                        >
                            Save Changes / සුරකින්න
                        </button>
                        <button 
                            onClick={() => setIsEditDetailsOpen(false)} 
                            className="w-full py-4 text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    onDelete(invoice.id);
                    setIsDeleteModalOpen(false);
                }}
                title="Delete Ledger"
                message="මෙම ලෙජරය ස්ථිරවම මකා දැමීමට ඔබට අවශ්‍යද? (Are you sure you want to delete this ledger permanently? This action cannot be undone.)"
            />

            <Modal isOpen={isEditInvoiceOpen} onClose={() => setIsEditInvoiceOpen(false)} title="Edit Ledger Details" variant="focus" fullScreen>
                <div className="max-w-6xl mx-auto">
                    <NewInvoiceForm 
                        initialInvoice={invoice}
                        onUpdateInvoice={(updated) => {
                            onUpdateInvoice(updated);
                            setIsEditInvoiceOpen(false);
                            setIsOpen(false);
                        }}
                        products={products}
                        invoices={[]} 
                        onDeductStock={() => {}} 
                        viewMode={viewMode}
                        onCancel={() => setIsEditInvoiceOpen(false)}
                    />
                </div>
            </Modal>
        </div>
    );
};
