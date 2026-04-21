
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import type { Invoice, QuickAction, ActiveTab, Product, Installment, AppSettings } from '../types';
import { QuickActionId, ALL_QUICK_ACTIONS } from '../hooks/useQuickActions';
import { useLanguage } from '../contexts/LanguageContext';
import { useShopDetails } from '../hooks/useShopDetails';
import Modal from './Modal';
import { 
    Search, 
    QrCode, 
    Plus, 
    Package, 
    CreditCard, 
    TrendingUp, 
    AlertTriangle, 
    FileText, 
    ChevronDown, 
    ExternalLink, 
    MessageSquare, 
    Phone, 
    DollarSign,
    Zap
} from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  products: Product[];
  selectedActionIds: QuickActionId[];
  onQuickAction: (actionId: QuickActionId) => void;
  onNavigate: (tab: ActiveTab) => void;
  onPriorityHubClick: (invoiceId: string) => void;
  onRecordPayment: (invoiceId: string, installmentNumber: number, actualAmount: number, paymentDate: string, paymentNote: string, nextDueDate?: string) => void;
  viewMode?: 'pc' | 'mobile';
  settings: AppSettings;
}

const StatCard: React.FC<{ 
    title: string; 
    subTitle: string;
    value: string | number; 
    icon: React.ReactNode; 
    colorClass: string;
    delay: string;
    onClick?: () => void;
    pulseColor?: string;
}> = ({ title, subTitle, value, icon, colorClass, delay, onClick, pulseColor = "bg-indigo-500" }) => {
    return (
        <div 
            onClick={onClick}
            className={`group relative bg-white dark:bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer animate-fade-in-up overflow-hidden backdrop-blur-md z-10`}
            style={{ animationDelay: delay }}
        >
            <div className={`absolute -top-10 -right-10 w-32 h-32 ${pulseColor} opacity-[0.08] rounded-full group-hover:scale-150 transition-transform duration-1000`}></div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center text-white shadow-lg shadow-current/20 transform group-hover:rotate-6 transition-transform`}>
                    {icon}
                </div>
                <div>
                    <div className="flex flex-col mb-1">
                        <p className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{title}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">{subTitle}</p>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                            {value}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ 
    invoices, 
    products, 
    selectedActionIds, 
    onQuickAction, 
    onNavigate, 
    onPriorityHubClick, 
    onRecordPayment, 
    viewMode = 'pc',
    settings
}) => {
    const { t } = useLanguage();
    const isMobile = viewMode === 'mobile';
    const { shopDetails } = useShopDetails();
    const [activeFeed, setActiveFeed] = useState<'overdue' | 'today' | 'upcoming'>('today');
    const [searchQuery, setSearchQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [expandedFeedId, setExpandedFeedId] = useState<string | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    
    const [paymentModalData, setPaymentModalData] = useState<{ invoice: Invoice, installment: Installment } | null>(null);
    const [manualAmount, setManualAmount] = useState<string>('');
    const [staffName, setStaffName] = useState<string>('');
    const [shouldSendWhatsApp, setShouldSendWhatsApp] = useState<boolean>(true);
    const [nextDueDate, setNextDueDate] = useState<string>('');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isScanning) {
            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(
                (decodedText) => {
                    setSearchQuery(decodedText);
                    setIsScanning(false);
                    scanner.clear();
                },
                (error) => {
                    // console.warn(error);
                }
            );

            return () => {
                scanner.clear().catch(err => console.error("Failed to clear scanner", err));
            };
        }
    }, [isScanning]);

    const totalOutstanding = useMemo(() => Math.round(invoices.reduce((sum, inv) => sum + inv.balance, 0)), [invoices]);
    const revenueToday = useMemo(() => {
        return Math.round(invoices.flatMap(inv => inv.payments || [])
            .filter(p => p.date === todayStr)
            .reduce((sum, p) => sum + p.amount, 0));
    }, [invoices, todayStr]);

    const searchSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return invoices.filter(inv => 
            inv.customer.name.toLowerCase().includes(q) || 
            inv.customer.phone.includes(q) ||
            inv.accountNumber?.toLowerCase().includes(q)
        ).slice(0, 5);
    }, [invoices, searchQuery]);

    const feedData = useMemo(() => {
        const allInst = invoices.flatMap(inv => inv.installments.map(inst => ({ ...inst, customer: inv.customer, invId: inv.id, fullInvoice: inv })));
        const overdue = allInst.filter(inst => !inst.paid && new Date(inst.dueDate) < today).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const dueToday = allInst.filter(inst => !inst.paid && inst.dueDate === todayStr);
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(today.getDate() + 3);
        const upcoming = allInst.filter(inst => !inst.paid && new Date(inst.dueDate) > today && new Date(inst.dueDate) <= threeDaysLater).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        
        return { overdue, today: dueToday, upcoming, counts: { overdue: overdue.length, today: dueToday.length, upcoming: upcoming.length } };
    }, [invoices, today, todayStr]);

    const triggerWhatsAppReceipt = (invoice: Invoice, paidAmt: number, currentBalance: number, staff: string, instPaidNum: number) => {
        const phone = invoice.customer.phone.replace(/[^0-9]/g, '');
        const formattedPhone = (phone.startsWith('0') && phone.length === 10) ? '94' + phone.substring(1) : phone;
        const newBal = Math.max(0, currentBalance - paidAmt);
        
        const totalInst = invoice.installments.length;
        const lateCount = invoice.installments.filter(i => i.paid === false && new Date(i.dueDate) < today).length;
        const score = Math.max(0, 100 - (lateCount * (100 / totalInst)));
        
        const nextInst = invoice.installments.find(inst => !inst.paid && inst.installmentNumber > instPaidNum);

            const itemsList = invoice.items.map(item => `• ${item.description} (Rs. ${Math.round(item.price).toLocaleString()}) [IMEI: ${item.imei || 'N/A'}]`).join('\n');

        let message = "";
        const accInfo = `🆔 *Account No:* ${invoice.accountNumber}\n`;
        
        if (paidAmt === 0) {
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
                const targetInst = invoice.installments.find(i => i.installmentNumber === instPaidNum) || invoice.installments.find(i => !i.paid) || invoice.installments[0];
                const dueDate = new Date(targetInst.dueDate);
                dueDate.setHours(0,0,0,0);
                
                const diffTime = today.getTime() - dueDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 0 && instPaidNum === 1 && invoice.payments.length <= 1) {
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
                    if (settings.whatsappOverdueTemplate) {
                        message = settings.whatsappOverdueTemplate
                            .replace(/{customer}/g, invoice.customer.name)
                            .replace(/{shop}/g, shopDetails.name)
                            .replace(/{amount}/g, Math.round(targetInst.amount).toLocaleString())
                            .replace(/{dueDate}/g, targetInst.dueDate)
                            .replace(/{balance}/g, Math.round(invoice.balance).toLocaleString())
                            .replace(/{items}/g, itemsList)
                            .replace(/{days}/g, diffDays.toString());
                        message = accInfo + "\n" + message;
                    } else {
                        message = `⚠️ *ප්‍රමාද වූ ගෙවීම් මතක් කිරීම / OVERDUE REMINDER* ⚠️\n\n` +
                            `හිතවත් *${invoice.customer.name}*,\n\n` +
                            `ඔබගේ *${shopDetails.name.toUpperCase()}* ගිණුමේ වාරිකය ගෙවීමට නියමිතව තිබූ දිනය පසු වී ඇත.\n\n` +
                            accInfo +
                            `📌 *භාණ්ඩ විස්තර (Asset Details):*\n${itemsList}\n\n` +
                            `📌 *ගෙවීම් විස්තර (Payment Details):*\n` +
                            `වාරික අංකය: #${targetInst.installmentNumber}\n` +
                            `ගෙවිය යුතු දිනය: *${targetInst.dueDate}*\n` +
                            `ප්‍රමාද වූ දින ගණන: *දින ${diffDays} ක්*\n` +
                            `ගෙවිය යුතු මුදල: *Rs. ${Math.round(targetInst.amount).toLocaleString()}*\n` +
                            `මුළු හිඟ මුදල: *Rs. ${Math.round(invoice.balance).toLocaleString()}*\n\n` +
                            `ස්තූතියි!\n*${shopDetails.name.toUpperCase()}*`;
                    }
                } else {
                    // Upcoming or Today
                    if (settings.whatsappUpcomingTemplate) {
                        message = settings.whatsappUpcomingTemplate
                            .replace(/{customer}/g, invoice.customer.name)
                            .replace(/{shop}/g, shopDetails.name)
                            .replace(/{amount}/g, Math.round(targetInst.amount).toLocaleString())
                            .replace(/{dueDate}/g, targetInst.dueDate)
                            .replace(/{balance}/g, Math.round(invoice.balance).toLocaleString())
                            .replace(/{items}/g, itemsList);
                        message = accInfo + "\n" + message;
                    } else {
                        message = `🔔 *ගෙවීම් මතක් කිරීම / PAYMENT REMINDER* 🔔\n\n` +
                            `හිතවත් *${invoice.customer.name}*,\n\n` +
                            `ඔබගේ *${shopDetails.name.toUpperCase()}* ගිණුමේ වාරික ගෙවීම සඳහා නියමිත දිනය පැමිණ ඇත.\n\n` +
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
            }
        } else if (newBal <= 1) {
            // SETTLED MESSAGE
            message = `✅ *ගෙවා නිම කළා / ACCOUNT SETTLED* ✅\n\n` +
                `හිතවත් *${invoice.customer.name}*,\n\n` +
                `ඔබගේ *${shopDetails.name.toUpperCase()}* ගිණුමේ සියලුම ගෙවීම් සාර්ථකව අවසන් කර ඇත.\n\n` +
                accInfo +
                `📌 *භාණ්ඩ විස්තර (Asset Details):*\n${itemsList}\n\n` +
                `💰 *අවසන් ගෙවීම:* Rs. ${Math.round(paidAmt).toLocaleString()}\n` +
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
                `💵 *ගෙවූ මුදල:* Rs. ${Math.round(paidAmt).toLocaleString()}\n` +
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

    const handleOpenPaymentHub = (inst: any) => {
        setPaymentModalData({ invoice: inst.fullInvoice, installment: inst });
        setManualAmount(String(Math.round(inst.amount)));
        setStaffName('');
        setShouldSendWhatsApp(true);
    };

    const handleFinalAuthorize = () => {
        if (!paymentModalData || !manualAmount) return;
        const amount = Number(manualAmount);
        if (amount <= 0) return;
        const { invoice, installment } = paymentModalData;
        onRecordPayment(invoice.id, installment.installmentNumber, amount, todayStr, `Point #${installment.installmentNumber} (By: ${staffName || 'Admin'})`, nextDueDate);
        if (shouldSendWhatsApp) {
            triggerWhatsAppReceipt(invoice, amount, invoice.balance, staffName, installment.installmentNumber);
        }
        setPaymentModalData(null);
        setNextDueDate('');
    };

    if (isMobile) {
        return (
            <div className="space-y-8 pb-32 animate-fade-in">
                {/* Mobile Header */}
                <div className="px-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Authority Dashboard</p>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Hello, <span className="text-indigo-600 dark:text-indigo-400">{shopDetails.name.split(' ')[0] || 'Admin'}</span>
                    </h1>
                </div>

                {/* Quick Stats - Simplified for Mobile */}
                <div className="px-2">
                    <StatCard 
                        delay="0ms" title="Outstanding Balance" subTitle="හිඟ මුදල් ශේෂය"
                        value={`Rs. ${totalOutstanding.toLocaleString()}`}
                        colorClass="bg-rose-500" pulseColor="bg-rose-500"
                        onClick={() => onNavigate('invoices')} icon={<CreditCard className="w-6 h-6" strokeWidth={2.5} />}
                    />
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-4 px-2">
                    <button 
                        onClick={() => onNavigate('billing')}
                        className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Plus className="w-6 h-6" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">New Bill</span>
                    </button>
                    <button 
                        onClick={() => onNavigate('products')}
                        className="p-6 bg-slate-900 dark:bg-white rounded-[2rem] text-white dark:text-slate-900 shadow-xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
                            <Package className="w-6 h-6" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Stock</span>
                    </button>
                </div>

                {/* Search Bar - Mobile Style */}
                <div className="px-2">
                    <div className="relative group flex gap-2" ref={searchRef}>
                        <div className="relative flex-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={3} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search Client / සොයන්න..."
                                className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-lg outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 dark:text-white"
                            />
                        </div>
                        <button 
                            onClick={() => setIsScanning(true)}
                            className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-lg active:scale-95 transition-all flex items-center justify-center"
                            title="Scan QR"
                        >
                            <QrCode className="w-6 h-6" strokeWidth={2.5} />
                        </button>
                        {searchSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden z-[100] animate-fade-in-up">
                                {searchSuggestions.map(inv => (
                                    <button 
                                        key={inv.id} 
                                        onClick={() => { onPriorityHubClick(inv.id); setSearchQuery(''); }}
                                        className="w-full flex items-center justify-between px-8 py-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b last:border-0 dark:border-slate-800"
                                    >
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{inv.customer.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.customer.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-rose-500">Rs. {Math.round(inv.balance).toLocaleString()}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Feed - Mobile Style */}
                <div className="px-2">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Activity Feed</h2>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                            {(['today', 'overdue', 'upcoming'] as const).map(tab => (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveFeed(tab)}
                                    className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeFeed === tab ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {feedData[activeFeed].slice(0, 10).map((inst) => (
                            <div 
                                key={`${inst.invId}-${inst.installmentNumber}`}
                                onClick={() => handleOpenPaymentHub(inst)}
                                className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${activeFeed === 'overdue' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500' : activeFeed === 'upcoming' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>
                                        <span className="text-[6px] uppercase opacity-40">Pt</span>
                                        <span className="text-lg leading-none font-mono">#{inst.installmentNumber}</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 dark:text-white text-sm uppercase truncate max-w-[140px]">{inst.customer.name}</p>
                                        <p className="text-[10px] font-bold text-indigo-500 font-mono tracking-widest">{inst.customer.phone}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">Rs. {Math.round(inst.amount).toLocaleString()}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{inst.dueDate}</p>
                                </div>
                            </div>
                        ))}
                        {feedData[activeFeed].length === 0 && (
                            <div className="py-12 text-center opacity-30">
                                <p className="text-[10px] font-black uppercase tracking-widest">No records found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Modal for Mobile */}
                <Modal isOpen={!!paymentModalData} onClose={() => setPaymentModalData(null)} title="Payment Hub" variant="focus">
                    {paymentModalData && (
                        <div className="space-y-6">
                            <div className="bg-slate-950 p-8 rounded-[2.5rem] text-center text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Authorize Collection</p>
                                    <div className="flex items-center justify-center gap-2 mb-6">
                                        <span className="text-2xl font-black text-slate-700 font-mono">Rs.</span>
                                        <input 
                                            type="number"
                                            value={manualAmount}
                                            onChange={(e) => setManualAmount(e.target.value)}
                                            className="bg-transparent text-center font-black text-5xl outline-none w-full max-w-[200px]"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Expected</p>
                                            <p className="font-mono font-black text-sm">Rs. {Math.round(paymentModalData.installment.amount).toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Arrears</p>
                                            <p className="font-mono font-black text-sm text-rose-500">Rs. {Math.round(paymentModalData.invoice.balance).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={staffName} 
                                        onChange={(e) => setStaffName(e.target.value)}
                                        placeholder="Staff Name / ඔබේ නම..."
                                        className="flex-grow px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => {
                                            const phone = paymentModalData.invoice.customer.phone.replace(/[^0-9]/g, '');
                                            const formattedPhone = (phone.startsWith('0') && phone.length === 10) ? '94' + phone.substring(1) : phone;
                                            const message = `🔔 *PAYMENT REMINDER*\n\nDear ${paymentModalData.invoice.customer.name},\nYour installment #${paymentModalData.installment.installmentNumber} of Rs. ${Math.round(paymentModalData.installment.amount).toLocaleString()} is due on ${paymentModalData.installment.dueDate}.\n\nShop: ${shopDetails.name}`;
                                            window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                                        }}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 active:scale-95 transition-all"
                                    >
                                        {/* Keep WhatsApp SVG as it's a brand */}
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                        <span className="text-[8px] font-black uppercase">WhatsApp</span>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const message = `Reminder: Your installment #${paymentModalData.installment.installmentNumber} (Rs. ${Math.round(paymentModalData.installment.amount).toLocaleString()}) is due on ${paymentModalData.installment.dueDate}. - ${shopDetails.name}`;
                                            window.open(`sms:${paymentModalData.invoice.customer.phone}?body=${encodeURIComponent(message)}`, '_self');
                                        }}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 active:scale-95 transition-all"
                                    >
                                        <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
                                        <span className="text-[8px] font-black uppercase">Message</span>
                                    </button>
                                    <button 
                                        onClick={() => window.open(`tel:${paymentModalData.invoice.customer.phone}`, '_self')}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-600 active:scale-95 transition-all"
                                    >
                                        <Phone className="w-5 h-5" strokeWidth={2.5} />
                                        <span className="text-[8px] font-black uppercase">Call Now</span>
                                    </button>
                                </div>

                                <button 
                                    onClick={handleFinalAuthorize}
                                    className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all"
                                >
                                    Confirm Payment
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        );
    }

    return (
        <div className={`space-y-12 animate-fade-in ${isMobile ? 'pb-24' : 'pb-32'}`}>
            <div className={`relative group bg-white/40 dark:bg-slate-900/40 rounded-[4rem] border border-white/60 dark:border-slate-800/60 shadow-2xl backdrop-blur-3xl overflow-visible z-50 ${isMobile ? 'p-6' : 'p-8 md:p-12'}`}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 mb-6">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Authority Registry Engine</span>
                    </div>
                    <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-6xl'} font-black text-slate-900 dark:text-white tracking-tighter leading-tight`}>
                        Dashboard, <span className="text-indigo-600 dark:text-indigo-400">{shopDetails.name || 'Admin'}!</span>
                    </h1>
                    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 mt-8 pt-8 border-t border-slate-200/40 dark:border-slate-800/40`}>
                        <p className={`text-slate-500 dark:text-slate-400 font-bold tracking-tight ${isMobile ? 'text-sm' : 'text-lg'}`}>පද්ධතියේ වත්මන් තත්ත්වය (System Overview)</p>
                        
                        <div className={`relative w-full group flex gap-2 ${isMobile ? '' : 'md:w-96'}`} ref={searchRef}>
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" strokeWidth={3} />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search Client / පාරිභෝගිකයා..."
                                    className="w-full pl-11 pr-4 py-3 bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-sm text-slate-800 dark:text-white"
                                />
                            </div>
                            <button 
                                onClick={() => setIsScanning(true)}
                                className="px-4 py-3 bg-indigo-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center"
                                title="Scan QR"
                            >
                                <QrCode className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                            
                            {searchSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden z-[100] animate-fade-in-up ring-1 ring-black/5">
                                    <div className="p-3 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2">Suggestions</span>
                                        <button onClick={() => setSearchQuery('')} className="text-[9px] font-bold text-rose-500 uppercase px-2 hover:underline">Close</button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto custom-scroll">
                                        {searchSuggestions.map(inv => (
                                            <button 
                                                key={inv.id} 
                                                onClick={() => { onPriorityHubClick(inv.id); setSearchQuery(''); }}
                                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors text-left border-b last:border-0 dark:border-slate-800"
                                            >
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase truncate max-w-[150px]">{inv.customer.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.customer.phone}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-rose-500">Rs. {Math.round(inv.balance).toLocaleString()}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Outstanding</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`grid grid-cols-1 gap-8 ${isMobile ? 'sm:grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
                <StatCard 
                    delay="50ms" title="Outstanding" subTitle="හිඟ මුදල්"
                    value={`Rs. ${totalOutstanding.toLocaleString()}`}
                    colorClass="bg-gradient-to-br from-rose-500 to-rose-700" pulseColor="bg-rose-500"
                    onClick={() => onNavigate('invoices')} icon={<CreditCard className="w-7 h-7" strokeWidth={2.5} />}
                />
                <StatCard 
                    delay="150ms" title="Revenue Today" subTitle="අද ආදායම"
                    value={`Rs. ${revenueToday.toLocaleString()}`}
                    colorClass="bg-gradient-to-br from-emerald-500 to-teal-700" pulseColor="bg-emerald-500"
                    icon={<TrendingUp className="w-7 h-7" strokeWidth={2.5} />}
                />
                <StatCard 
                    delay="250ms" title="Due Alerts" subTitle="ප්‍රමාද වාරික"
                    value={feedData.counts.overdue}
                    colorClass="bg-gradient-to-br from-amber-500 to-orange-700" pulseColor="bg-amber-500"
                    onClick={() => setActiveFeed('overdue')}
                    icon={<AlertTriangle className="w-7 h-7" strokeWidth={2.5} />}
                />
                <StatCard 
                    delay="350ms" title="Products" subTitle="මුළු තොගය"
                    value={products.length}
                    colorClass="bg-gradient-to-br from-indigo-600 to-blue-800" pulseColor="bg-indigo-600"
                    onClick={() => onNavigate('products')} icon={<Package className="w-7 h-7" strokeWidth={2.5} />}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                <div className={`xl:col-span-8 bg-white dark:bg-slate-950/80 rounded-[3.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl flex flex-col overflow-hidden backdrop-blur-xl`}>
                    <div className={`border-b border-slate-50 dark:border-slate-900/30 flex flex-col lg:flex-row justify-between lg:items-end gap-6 ${isMobile ? 'p-6 pb-4' : 'p-10 pb-6'}`}>
                        <div className="flex items-center gap-5">
                            <div className="w-1.5 h-12 bg-indigo-600 rounded-full" />
                            <div>
                                <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-black text-slate-800 dark:text-white tracking-tight uppercase leading-none`}>Activity Feed</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">ලේඛනයේ වත්මන් තත්ත්වය</p>
                            </div>
                        </div>
                        <div className={`flex p-1.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-x-auto custom-scroll`}>
                            {(['today', 'overdue', 'upcoming'] as const).map((tab) => (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveFeed(tab)} 
                                    className={`relative px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${activeFeed === tab ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab === 'today' ? 'Today' : tab === 'overdue' ? 'Overdue' : 'Upcoming'}
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[8px] ${activeFeed === tab ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                        {feedData.counts[tab]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={`flex-1 overflow-y-auto custom-scroll max-h-[700px] space-y-4 ${isMobile ? 'p-4' : 'p-8'}`}>
                        {feedData[activeFeed].length > 0 ? feedData[activeFeed].map((inst, i) => {
                            const uniqueId = `${inst.invId}-${inst.installmentNumber}`;
                            const isExpanded = expandedFeedId === uniqueId;
                            return (
                                <div 
                                    key={uniqueId} 
                                    onClick={() => setExpandedFeedId(isExpanded ? null : uniqueId)}
                                    className={`group bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/50 transition-all duration-500 p-6 rounded-[2.5rem] flex flex-col gap-6 cursor-pointer hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl ${isExpanded ? 'ring-2 ring-indigo-500/20 shadow-2xl scale-[1.01]' : ''}`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-8 min-w-0 flex-grow">
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); onPriorityHubClick(inst.invId); }}
                                                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 font-black transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm cursor-pointer ${activeFeed === 'overdue' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}
                                                title="View Ledger"
                                            >
                                                <span className="text-[7px] uppercase opacity-40">Point</span>
                                                <span className="text-xl leading-none font-mono">#{inst.installmentNumber}</span>
                                            </div>
                                            <div className="min-w-0 flex-grow">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div 
                                                        onClick={(e) => { e.stopPropagation(); onPriorityHubClick(inst.invId); }}
                                                        className="group/name flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight truncate uppercase leading-none group-hover/name:text-indigo-600 transition-colors">{inst.customer.name}</p>
                                                        <ExternalLink className="w-4 h-4 text-slate-300 opacity-0 group-hover/name:opacity-100 transition-all" strokeWidth={3} />
                                                    </div>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter font-mono leading-none">
                                                        Rs. {Math.round(inst.amount).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                                                        <FileText className="w-3 h-3 text-slate-400" />
                                                        <p className="text-[9px] font-black text-slate-500 uppercase font-mono">{inst.dueDate}</p>
                                                    </div>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                                                    <p className="text-[10px] font-black text-indigo-500 font-mono tracking-widest">{inst.customer.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-xl transition-all flex-shrink-0 ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} strokeWidth={3} />
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 animate-fade-in-up flex flex-col lg:flex-row justify-between items-center gap-6">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 rounded-lg w-fit">
                                                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Current Arrears:</p>
                                                    <p className="text-[11px] font-black text-rose-600 font-mono tracking-tight">Rs. {Math.round(inst.fullInvoice.balance).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full lg:w-auto">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onPriorityHubClick(inst.invId); }} 
                                                    className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm group/ledger"
                                                    title="View Full Ledger"
                                                >
                                                    <FileText className="w-6 h-6 group-hover/ledger:scale-110 transition-transform" strokeWidth={2.5} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); triggerWhatsAppReceipt(inst.fullInvoice, 0, inst.fullInvoice.balance, 'Admin', inst.installmentNumber); }} 
                                                    className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleOpenPaymentHub(inst); }} 
                                                    className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                                                >
                                                    Mark Paid / ගෙවීම්
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="py-40 text-center opacity-30">
                                <p className="font-black uppercase tracking-[0.5em] text-xs text-slate-400">Registry Clear / දැනට ගෙවීම් නොමැත</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${isMobile ? 'xl:col-span-12' : 'xl:col-span-4'} space-y-10`}>
                    <div className={`bg-indigo-600 text-white rounded-[3.5rem] shadow-2xl relative overflow-hidden ring-1 ring-white/10 ${isMobile ? 'p-6' : 'p-10'}`}>
                        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 -mr-10 -mt-10">
                            <TrendingUp className="w-48 h-48" strokeWidth={1.5} />
                        </div>
                        <div className="relative z-10">
                             <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em] mb-1">System Reports</p>
                             <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-black tracking-tight mb-8`}>වාර්තා මධ්‍යස්ථානය</h3>
                             <p className="text-xs opacity-70 mb-6 font-bold">සියලුම පද්ධති වාර්තා මෙතැනින් ලබාගන්න.</p>
                             <button 
                                onClick={() => onNavigate('reports')}
                                className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all"
                             >
                                Open Reports
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Components */}
            <Modal isOpen={isScanning} onClose={() => setIsScanning(false)} title="Scan Customer QR" variant="focus">
                <div className="p-4">
                    <div id="qr-reader" className="w-full overflow-hidden rounded-3xl border-4 border-indigo-600/20"></div>
                    <p className="text-center text-[10px] font-black uppercase text-slate-400 mt-6 tracking-widest">
                        Point camera at the invoice QR code
                    </p>
                </div>
            </Modal>

            <Modal isOpen={!!paymentModalData} onClose={() => setPaymentModalData(null)} title="Authority Collection Hub" variant="focus">
                {paymentModalData && (
                    <div className={`space-y-8 animate-fade-in-content ${isMobile ? 'max-h-[80vh] overflow-y-auto px-1' : ''}`}>
                        <div className={`relative bg-slate-950 rounded-[3.5rem] border border-white/10 text-center shadow-2xl overflow-hidden group ${isMobile ? 'p-6' : 'p-10'}`}>
                            {/* Decorative Elements */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-1000" />
                            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full group-hover:bg-emerald-600/10 transition-all duration-1000" />
                            
                            <div className="relative z-10">
                                <div className={`flex flex-col items-center ${isMobile ? 'mb-6' : 'mb-10'}`}>
                                    <div className="w-16 h-16 bg-indigo-600/20 rounded-3xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/30 shadow-xl shadow-indigo-500/10">
                                        <Zap className="h-8 w-8" strokeWidth={2.5} />
                                    </div>
                                    <label className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.5em] mb-1">Asset Authorization</label>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ගෙවීම් තහවුරු කිරීම</p>
                                </div>

                                <div className={`relative ${isMobile ? 'mb-6' : 'mb-10'}`}>
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-700 font-mono">Rs.</span>
                                    <input 
                                        type="number"
                                        value={manualAmount}
                                        onChange={(e) => setManualAmount(e.target.value)}
                                        placeholder="0"
                                        autoFocus
                                        className={`w-full bg-transparent text-center font-black text-white outline-none tabular-nums placeholder:text-slate-900 transition-all focus:scale-110 ${isMobile ? 'text-5xl' : 'text-6xl md:text-7xl'}`}
                                    />
                                </div>

                                <div className={`grid grid-cols-2 gap-4 ${isMobile ? 'mb-6' : 'mb-10'}`}>
                                    <div className="p-4 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                                        <p className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-widest">Expected</p>
                                        <p className={`${isMobile ? 'text-base' : 'text-lg'} font-black text-slate-300 font-mono tracking-tighter`}>Rs. {Math.round(paymentModalData.installment.amount).toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-rose-500/5 rounded-3xl border border-rose-500/10 backdrop-blur-sm">
                                        <p className="text-[9px] font-black uppercase text-rose-500 mb-2 tracking-widest">Total Due</p>
                                        <p className={`${isMobile ? 'text-base' : 'text-lg'} font-black text-rose-500 font-mono tracking-tighter`}>Rs. {Math.round(paymentModalData.invoice.balance).toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                <div className={`space-y-6 text-left border-t border-white/5 ${isMobile ? 'pt-6' : 'pt-10'}`}>
                                    <div className="group/input">
                                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-3 block ml-2 group-focus-within/input:text-indigo-400 transition-colors">Authorized Personnel</label>
                                        <div className="relative">
                                            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            <input 
                                                type="text" 
                                                value={staffName}
                                                onChange={(e) => setStaffName(e.target.value)}
                                                placeholder="Enter Staff Name..."
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
                                    {Number(manualAmount) > 0 && Number(manualAmount) < paymentModalData.installment.amount && 
                                     !paymentModalData.invoice.installments.some(inst => !inst.paid && inst.installmentNumber > paymentModalData.installment.installmentNumber) && (
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

                        <button 
                            onClick={handleFinalAuthorize} 
                            disabled={!manualAmount || Number(manualAmount) <= 0}
                            className="group relative w-full py-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-20 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            <span className="relative z-10">Authorize Transaction / තහවුරු කරන්න</span>
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};
