import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { AppSettings, ShopDetails, AppState, QuickAction, QuickActionId } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useTheme } from '../hooks/useTheme';
import Modal from './Modal';
import { ALL_QUICK_ACTIONS } from '../hooks/useQuickActions';
import { optimizeImage } from '../utils/imageOptimizer';
import { MigrationHub } from './MigrationHub';
import { 
    Image as ImageIcon, 
    ShieldCheck, 
    Pencil, 
    Download, 
    Upload, 
    AlertTriangle,
    Database,
    Cloud,
    Bell,
    Monitor,
    Smartphone,
    Layout,
    Globe
} from 'lucide-react';

const formInputStyle = "w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all text-slate-800 dark:text-white";
const labelStyle = "text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-2";

interface SettingsProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  shopDetails: ShopDetails;
  updateShopDetails: (newDetails: Partial<ShopDetails>) => void;
  appData: AppState;
  selectedActionIds: QuickActionId[];
  updateSelectedActions: (actionIds: QuickActionId[]) => void;
  fullAppData: any;
  signIn: () => void;
  isSignedIn: boolean;
  permission: NotificationPermission;
  requestPermission: () => void;
}

type SettingsTab = 'profile' | 'display' | 'registry' | 'engine';

export const Settings: React.FC<SettingsProps> = ({ 
    settings, updateSettings, shopDetails, updateShopDetails, selectedActionIds, updateSelectedActions, fullAppData, signIn, isSignedIn, permission, requestPermission 
}) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<'idle' | 'exporting' | 'importing'>('idle');
  const [importSummary, setImportSummary] = useState<{
    invoices: number;
    products: number;
    shopName: string;
    date?: string;
    version?: string;
    rawData: any;
  } | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const sealInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleAssetUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: keyof ShopDetails) => {
    const file = event.target.files?.[0];
    if (file) {
        try {
            const optimized = await optimizeImage(file);
            updateShopDetails({ [field]: optimized });
        } catch (error) { console.error(error); }
    }
  };

  const handleExport = () => {
      setIsProcessing('exporting');
      // Biological delay for "Securing" feel
      setTimeout(() => {
          try {
              const dataStr = JSON.stringify(fullAppData, null, 2);
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `MW_Authority_Registry_${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setIsProcessing('idle');
          } catch (e) {
              console.error(e);
              setIsProcessing('idle');
              alert("Export අසාර්ථකයි. පද්ධති දෝෂයකි.");
          }
      }, 1000);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File could not be read.");
        
        let restoredData = JSON.parse(text);

        if (Array.isArray(restoredData)) {
            restoredData = { invoices: restoredData };
        }

        const invoices = restoredData.invoices || restoredData.invoiceList || restoredData.allInvoices || restoredData.invoice_records || [];
        const products = restoredData.products || restoredData.productList || restoredData.allProducts || restoredData.inventory || [];
        const shopInfo = restoredData.shopDetails || restoredData.shopInfo || restoredData.businessDetails || restoredData.identity || {};
        
        setImportSummary({
            invoices: invoices.length,
            products: products.length,
            shopName: shopInfo.name || 'Unknown Shop',
            date: restoredData.exportedAt,
            version: restoredData.version,
            rawData: restoredData
        });
      } catch (error) {
        console.error("Import failure:", error);
        alert("වැරදි දත්ත ගොනුවකි (Invalid JSON). කරුණාකර නිවැරදි Snapshot ගොනුවක් තෝරන්න.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const confirmImport = () => {
    if (!importSummary) return;
    setIsProcessing('importing');
    const restoredData = importSummary.rawData;

    try {
        const invoices = restoredData.invoices || restoredData.invoiceList || restoredData.allInvoices || restoredData.invoice_records || [];
        const products = restoredData.products || restoredData.productList || restoredData.allProducts || restoredData.inventory || [];
        const tasks = restoredData.tasks || restoredData.taskList || restoredData.to_do_list || [];
        const appConfig = restoredData.settings || restoredData.appSettings || restoredData.config || restoredData.preferences || {};
        const shopInfo = restoredData.shopDetails || restoredData.shopInfo || restoredData.businessDetails || restoredData.identity || {};
        const blacklistData = restoredData.blacklist || restoredData.customerBlacklist || restoredData.blacklisted_customers || [];
        
        const bbLog = restoredData.blankBillLog || restoredData.bb_log || [];
        const bbTemplates = restoredData.blankBillTemplates || restoredData.bb_templates || [];
        const bbSettings = restoredData.blankBillSettings || restoredData.bb_config || {};
        const utilityPayments = restoredData.utilityBillPayments || restoredData.utility_payments || [];

        localStorage.setItem('invoices', JSON.stringify(invoices));
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('appSettings', JSON.stringify({ ...settings, ...appConfig }));
        localStorage.setItem('shopDetails', JSON.stringify({ ...shopDetails, ...shopInfo }));
        localStorage.setItem('customerBlacklist', JSON.stringify(blacklistData));
        localStorage.setItem('blankBillLog', JSON.stringify(bbLog));
        localStorage.setItem('blankBillTemplates', JSON.stringify(bbTemplates));
        localStorage.setItem('blankBillSettings', JSON.stringify(bbSettings));
        localStorage.setItem('utilityBillPayments', JSON.stringify(utilityPayments));

        setImportSummary(null);
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (error) {
        console.error("Restore failure:", error);
        setIsProcessing('idle');
        setImportSummary(null);
        alert("පද්ධති දෝෂයකි. නැවත උත්සාහ කරන්න.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-40 animate-fade-in">
        {/* Animated Navigation Ribbon */}
        <div className="flex p-2 bg-slate-900 rounded-[2.5rem] shadow-2xl mb-10 gap-2 border border-white/5 stagger-child">
            {(['profile', 'display', 'registry', 'engine'] as SettingsTab[]).map(tab => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 transform active:scale-95 tap-squish ${activeTab === tab ? 'bg-white text-indigo-600 shadow-xl scale-100' : 'text-slate-500 hover:text-white scale-95 opacity-60'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        <div className="space-y-10 animate-fade-in-up" key={activeTab}>
            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 bg-white dark:bg-slate-950 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Authority Identity</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className={labelStyle}>Business Name (මුද්‍රිත නම)</label>
                                <input type="text" value={shopDetails.name} onChange={e => updateShopDetails({ name: e.target.value })} className={formInputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>Hotline 01</label>
                                <input type="tel" value={shopDetails.phone1} onChange={e => updateShopDetails({ phone1: e.target.value })} className={formInputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>Hotline 02</label>
                                <input type="tel" value={shopDetails.phone2} onChange={e => updateShopDetails({ phone2: e.target.value })} className={formInputStyle} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelStyle}>Official Address (ලිපිනය)</label>
                                <input type="text" value={shopDetails.address} onChange={e => updateShopDetails({ address: e.target.value })} className={formInputStyle} />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl flex flex-col items-center text-center group hover-lift">
                            <div className="w-24 h-24 rounded-3xl bg-white/10 p-2 mb-6 border-2 border-dashed border-white/20 overflow-hidden flex items-center justify-center relative cursor-pointer hover:border-indigo-400 transition-colors tap-squish" onClick={() => logoInputRef.current?.click()}>
                                {shopDetails.logoUrl ? <img src={shopDetails.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <ImageIcon className="w-10 h-10 text-slate-500" strokeWidth={1.5} />}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-black uppercase transition-opacity">Change Logo</div>
                            </div>
                            <h4 className="font-black uppercase text-[11px] tracking-widest mb-1">Official Brand Logo</h4>
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleAssetUpload(e, 'logoUrl')} />
                            {shopDetails.logoUrl && <button onClick={() => updateShopDetails({ logoUrl: '' })} className="text-rose-500 text-[8px] font-black uppercase hover:underline mt-2">Remove Asset</button>}
                        </div>

                        <div className="bg-white dark:bg-slate-950 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                            <div className="flex justify-around items-center">
                                <div className="text-center group tap-squish" onClick={() => sealInputRef.current?.click()}>
                                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 mb-2 overflow-hidden flex items-center justify-center relative cursor-pointer hover:scale-110 transition-transform">
                                        {shopDetails.digitalSeal ? <img src={shopDetails.digitalSeal} className="w-full h-full object-contain p-2" alt="Seal" /> : <ShieldCheck className="w-6 h-6 text-slate-300" strokeWidth={1.5} />}
                                    </div>
                                    <p className="text-[8px] font-black uppercase text-slate-400">Seal</p>
                                    <input type="file" ref={sealInputRef} className="hidden" onChange={(e) => handleAssetUpload(e, 'digitalSeal')} />
                                </div>
                                <div className="text-center group tap-squish" onClick={() => signInputRef.current?.click()}>
                                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 mb-2 overflow-hidden flex items-center justify-center relative cursor-pointer hover:scale-110 transition-transform">
                                        {shopDetails.digitalSignature ? <img src={shopDetails.digitalSignature} className="w-full h-full object-contain p-2" alt="Signature" /> : <Pencil className="w-6 h-6 text-slate-300" strokeWidth={1.5} />}
                                    </div>
                                    <p className="text-[8px] font-black uppercase text-slate-400">Signature</p>
                                    <input type="file" ref={signInputRef} className="hidden" onChange={(e) => handleAssetUpload(e, 'digitalSignature')} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'display' && (
                <div className="grid md:grid-cols-2 gap-10">
                    <div className="bg-white dark:bg-slate-950 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 animate-fade-in-up">
                         <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Interface Theme</h3>
                        </div>
                        <ThemeSwitcher theme={theme} setTheme={setTheme} />
                    </div>
                    <div className="bg-white dark:bg-slate-950 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                         <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">View Mode (දර්ශන මාදිලිය)</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {(['pc', 'mobile'] as const).map(mode => (
                                <button 
                                    key={mode}
                                    onClick={() => updateSettings({ viewMode: mode })}
                                    className={`py-4 rounded-2xl text-xs font-black transition-all border-2 tap-squish ${settings.viewMode === mode ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-indigo-300'}`}
                                >
                                    {mode === 'pc' ? 'Desktop View' : 'Mobile View'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-950 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                         <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Paper Size (පෙරනිමි)</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {(['A4', 'A5', 'A6'] as const).map(size => (
                                <button 
                                    key={size}
                                    onClick={() => updateSettings({ invoicePaperSize: size })}
                                    className={`py-4 rounded-2xl text-xs font-black transition-all border-2 tap-squish ${settings.invoicePaperSize === size ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-emerald-300'}`}
                                >
                                    {size} Format
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'registry' && (
                <div className="bg-white dark:bg-slate-950 p-10 rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-10 animate-fade-in-up">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
                        <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">System Reminders</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyle}>Notification Lead Time (කල් තැබීම)</label>
                            <select value={settings.reminderLeadTime} onChange={(e) => updateSettings({ reminderLeadTime: parseInt(e.target.value) })} className={formInputStyle}>
                                <option value="0">Exactly on Due Date</option>
                                <option value="1">1 Day Before</option>
                                <option value="3">3 Days Before</option>
                                <option value="7">1 Week Before</option>
                            </select>
                        </div>
                        <div className="pt-6 border-t dark:border-slate-800 space-y-6">
                             <label className={labelStyle}>System Notifications</label>
                             <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                                <p className="text-sm font-bold text-slate-500 uppercase">Allow the application to send pop-up alerts for upcoming payments.</p>
                                <button onClick={requestPermission} className={`w-full md:w-auto px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all tap-squish ${permission === 'granted' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'}`}>
                                    {permission === 'granted' ? 'Registry Permissions Granted ✓' : 'Enable Ledger Alerts'}
                                </button>
                             </div>
                        </div>

                        <div className="pt-6 border-t dark:border-slate-800 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">WhatsApp Message Templates</h4>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-8">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upcoming Payment Template (ගෙවීම් මතක් කිරීම)</label>
                                        <span className="text-[8px] font-bold text-indigo-500 uppercase">Variables: {`{customer}`}, {`{shop}`}, {`{amount}`}, {`{dueDate}`}, {`{balance}`}, {`{items}`}</span>
                                    </div>
                                    <textarea 
                                        value={settings.whatsappUpcomingTemplate || ''} 
                                        onChange={(e) => updateSettings({ whatsappUpcomingTemplate: e.target.value })}
                                        placeholder="🔔 *PAYMENT REMINDER* 🔔\n\nDear {customer},\nYour payment of Rs. {amount} is due on {dueDate}.\n\nShop: {shop}"
                                        className={`${formInputStyle} min-h-[150px] font-mono text-xs leading-relaxed`}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overdue Payment Template (ප්‍රමාද වූ ගෙවීම්)</label>
                                        <span className="text-[8px] font-bold text-rose-500 uppercase">Variables: {`{customer}`}, {`{shop}`}, {`{amount}`}, {`{dueDate}`}, {`{balance}`}, {`{items}`}, {`{days}`}</span>
                                    </div>
                                    <textarea 
                                        value={settings.whatsappOverdueTemplate || ''} 
                                        onChange={(e) => updateSettings({ whatsappOverdueTemplate: e.target.value })}
                                        placeholder="⚠️ *OVERDUE REMINDER* ⚠️\n\nDear {customer},\nYour payment of Rs. {amount} was due on {dueDate}. It is now {days} days overdue.\n\nShop: {shop}"
                                        className={`${formInputStyle} min-h-[150px] font-mono text-xs leading-relaxed`}
                                    />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                                <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase leading-relaxed">
                                    * Note: Leave blank to use the system default message. Use the variables in curly braces to automatically insert data.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'engine' && (
                <div className="grid md:grid-cols-2 gap-10">
                     <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl flex flex-col justify-between overflow-hidden relative group border border-white/5 animate-fade-in-up">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-all duration-1000">
                             <Database className="w-64 h-64" strokeWidth={1} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-4">Local Registry Backup</p>
                            <h4 className="text-3xl font-black uppercase tracking-tighter mb-4 leading-none">Portable Snapshot</h4>
                            <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed mb-12">දත්ත සියල්ල එක් ගොනුවකට ලබාගෙන ආරක්ෂිතව තබා ගැනීමට හෝ වෙනත් ඕනෑම උපාංගයකට ඇතුළත් කිරීමට මෙය භාවිතා කරන්න.</p>
                            
                            {isProcessing === 'idle' ? (
                                <div className="flex flex-col gap-3">
                                    <button onClick={handleExport} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-indigo-50 transition-all transform active:scale-95 tap-squish flex items-center justify-center gap-3">
                                        <Download className="w-5 h-5" strokeWidth={2.5} />
                                        Download Snapshot
                                    </button>
                                    <button onClick={() => importFileRef.current?.click()} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all tap-squish">Restore from File</button>
                                    <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleFileImport} />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 animate-bio-breathe">
                                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400">
                                        {isProcessing === 'exporting' ? 'Securing Ledger...' : 'Restoring Registry...'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-indigo-600 text-white p-12 rounded-[4rem] shadow-2xl flex flex-col justify-center gap-8 text-center relative overflow-hidden border border-white/10 group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity"></div>
                        <div className="relative z-10 space-y-6">
                            <h4 className="text-4xl font-black uppercase tracking-tighter leading-none">Cloud Vault</h4>
                            <p className="text-[11px] font-bold text-indigo-100 uppercase leading-relaxed max-w-[200px] mx-auto">Google Drive හරහා ඔබගේ දත්ත ස්වයංක්‍රීයව ආරක්ෂා කරන්න.</p>
                            {isSignedIn ? (
                                 <div className="space-y-4">
                                     <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/20 shadow-2xl">
                                        <div className="flex items-center justify-center gap-2 mb-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Vault Synchronized</span>
                                        </div>
                                        
                                        <div className="space-y-4 text-left mb-6">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Auto Backup</span>
                                                <button 
                                                    onClick={() => updateSettings({ autoBackupEnabled: !settings.autoBackupEnabled })}
                                                    className={`w-10 h-5 rounded-full transition-all relative ${settings.autoBackupEnabled ? 'bg-emerald-500' : 'bg-white/20'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.autoBackupEnabled ? 'left-6' : 'left-1'}`} />
                                                </button>
                                            </div>
                                            
                                            {settings.autoBackupEnabled && (
                                                <div>
                                                    <label className="text-[8px] font-black uppercase tracking-widest text-indigo-200 mb-2 block">Frequency</label>
                                                    <select 
                                                        value={settings.autoBackupFrequency} 
                                                        onChange={(e) => updateSettings({ autoBackupFrequency: e.target.value as any })}
                                                        className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-white/20"
                                                    >
                                                        <option value="daily" className="bg-slate-900">Daily</option>
                                                        <option value="weekly" className="bg-slate-900">Weekly</option>
                                                        <option value="monthly" className="bg-slate-900">Monthly</option>
                                                    </select>
                                                </div>
                                            )}
                                            
                                            <div className="pt-4 border-t border-white/10">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200 mb-1">Last Backup</p>
                                                <p className="text-[10px] font-mono font-bold">{settings.lastBackupDate ? new Date(settings.lastBackupDate).toLocaleString() : 'Never'}</p>
                                            </div>
                                        </div>

                                        <button onClick={() => setIsMigrationOpen(true)} className="w-full py-5 bg-white text-indigo-600 rounded-[1.5rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-xl active:scale-95 transition-all tap-squish">Launch Portal</button>
                                     </div>
                                 </div>
                            ) : (
                                <button onClick={signIn} className="w-full py-6 bg-white text-indigo-600 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-4 tap-squish">
                                    <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path></g></svg>
                                    Connect Engine
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        <MigrationHub isOpen={isMigrationOpen} onClose={() => setIsMigrationOpen(false)} fullAppData={fullAppData} />
        
        <Modal isOpen={!!importSummary} onClose={() => setImportSummary(null)} title="Snapshot Verification" variant="focus">
            {importSummary && (
                <div className="space-y-8 animate-fade-in-content">
                    <div className="relative p-10 bg-slate-950 rounded-[3.5rem] border border-white/10 text-center shadow-2xl overflow-hidden group">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-1000" />
                        
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-indigo-600/20 rounded-[2rem] flex items-center justify-center text-indigo-400 mx-auto mb-6 border border-indigo-500/30 shadow-xl animate-bounce-subtle">
                                <Upload className="w-10 h-10" strokeWidth={2.5} />
                            </div>
                            <h4 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Restore Registry?</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-8">දත්ත පද්ධතිය යාවත්කාලීන කිරීම</p>

                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Business</p>
                                    <p className="text-sm font-black text-slate-200 truncate">{importSummary.shopName}</p>
                                </div>
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Snapshot Date</p>
                                    <p className="text-sm font-black text-slate-200">{importSummary.date ? new Date(importSummary.date).toLocaleDateString() : 'Unknown'}</p>
                                </div>
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Invoices</p>
                                    <p className="text-xl font-black text-indigo-400 font-mono">{importSummary.invoices}</p>
                                </div>
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Products</p>
                                    <p className="text-xl font-black text-emerald-400 font-mono">{importSummary.products}</p>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-rose-500/5 border border-rose-500/10 rounded-[2rem] text-left animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" strokeWidth={2.5} />
                                    <p className="text-[10px] font-bold text-rose-400/80 leading-relaxed uppercase">දැනට ඇති සියලුම දත්ත මැකී ගොස් මෙම නව දත්ත මගින් පද්ධතිය යාවත්කාලීන වනු ඇත.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={confirmImport}
                            className="group relative w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            <span className="relative z-10">Confirm and Overwrite</span>
                        </button>
                        <button 
                            onClick={() => setImportSummary(null)}
                            className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            Cancel and Return
                        </button>
                    </div>
                </div>
            )}
        </Modal>

        <style>{`
            .stagger-child > * {
                animation: fadeInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            @keyframes fadeInDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
    </div>
  );
};