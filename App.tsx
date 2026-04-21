import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    LayoutDashboard, 
    PlusCircle, 
    History, 
    Users, 
    Calendar, 
    Repeat, 
    HelpCircle, 
    FileBarChart, 
    Settings as SettingsIcon,
    X,
    MoreHorizontal,
    RefreshCcw,
    Database,
    Package
} from 'lucide-react';
import { useInvoices } from './hooks/useInvoices';
import { useProducts } from './hooks/useProducts';
import { useTasks } from './hooks/useTasks';
import { useSettings } from './hooks/useSettings';
import { useShopDetails } from './hooks/useShopDetails';
import { useNotifications } from './hooks/useNotifications';
import { useTheme } from './hooks/useTheme';
import { useQuickActions } from './hooks/useQuickActions';
import { useGoogleDrive } from './hooks/useGoogleDrive';
import { useAppNotifications } from './hooks/useAppNotifications';
import { useBlacklist } from './hooks/useBlacklist';
import { useRecurringInvoices } from './hooks/useRecurringInvoices';
import { useLanguage } from './contexts/LanguageContext';
import { useBlankBillSettings } from './hooks/useBlankBillSettings';
import { useBlankBillLog } from './hooks/useBlankBillLog';
import { useBlankBillTemplates } from './hooks/useBlankBillTemplates';
import { useSyncEngine } from './hooks/useSyncEngine';

import { Header } from './components/Header';
import { InvoiceList } from './components/InvoiceList';
import NewInvoiceForm from './components/NewInvoiceForm';
import { Dashboard } from './components/Dashboard';
import ManageProducts from './components/ManageProducts';
import { Settings } from './components/Settings';
import SplashScreen from './components/SplashScreen';
import PrintPreview from './components/PrintPreview';
import PrintableInvoice from './components/PrintableInvoice';
import PrintableReceipt from './components/PrintableReceipt';
import { Reports } from './components/Reports';
import { CustomerManager } from './components/CustomerManager';
import { AIAssistant } from './components/AIAssistant';
import { PrintableLegalNotice } from './components/PrintableLegalNotice';
import { PrintableLegalAgreement } from './components/PrintableLegalAgreement';
import PrintableInventoryReport from './components/PrintableInventoryReport';
import CalendarView from './components/CalendarView';
import RecurringBillingView from './components/RecurringBillingView';
import FAQView from './components/FAQView';

import type { Invoice, Payment, ActiveTab, ShopDetails, AppNotification, QuickActionId, Product } from './types';

import { useFirebase } from './contexts/FirebaseContext';

import { MobileHeader } from './components/MobileHeader';

const SystemTicker: React.FC<{ 
    invoices: Invoice[], 
    products: Product[], 
    isBackupDue: boolean, 
    lastSync?: string, 
    isSyncing?: boolean,
    syncError?: string | null,
    user: any,
    isBackingUp?: boolean
}> = ({ invoices, products, isBackupDue, lastSync, isSyncing, syncError, user, isBackingUp }) => {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const stats = useMemo(() => {
        const lowStock = products.filter(p => p.stock < 5).length;
        const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length;
        return { lowStock, overdueCount };
    }, [invoices, products]);

    return (
        <div className="bg-slate-950 text-white border-b border-white/5 px-6 py-2 flex items-center gap-8 z-40 relative">
             <div className="flex-shrink-0 flex items-center gap-2 px-2 py-1 bg-indigo-600 rounded text-[8px] font-black uppercase tracking-widest">
                SYSTEM ACTIVE
            </div>
            <div className="flex-grow flex items-center gap-6 overflow-hidden whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-slate-400">
                <span className="text-white font-mono">{now.toLocaleTimeString()}</span>
                
                {user ? (
                    <span className="text-emerald-400 font-black flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        CLOUD SYNC ACTIVE: {user.displayName?.split(' ')[0]}
                    </span>
                ) : (
                    <span className="text-slate-500 font-black flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        LOCAL MODE (LOGIN TO SYNC)
                    </span>
                )}
                
                {isBackingUp && (
                    <span className="text-indigo-400 font-black animate-pulse flex items-center gap-1">
                        <RefreshCcw className="w-3 h-3 animate-spin" strokeWidth={3} />
                        BACKING UP...
                    </span>
                )}

                {isBackupDue && !isBackingUp && <span className="text-rose-400 font-black animate-pulse px-2 py-1 bg-rose-400/10 rounded">SNAPSHOT DUE</span>}
                <span className="flex items-center gap-1">Stock Alerts: <b className="text-rose-500">{stats.lowStock}</b></span>
                <span className="flex items-center gap-1">Arrears: <b className="text-rose-500">{stats.overdueCount}</b></span>
            </div>
        </div>
    );
};

const BottomNav: React.FC<{ activeTab: ActiveTab, setActiveTab: (tab: ActiveTab) => void }> = ({ activeTab, setActiveTab }) => {
    const { t } = useLanguage();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    const mainItems = [
        { id: 'dashboard', label: t('nav_dashboard'), icon: <LayoutDashboard className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'billing', label: t('nav_new_invoice'), icon: <PlusCircle className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'invoices', label: t('nav_all_invoices'), icon: <History className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'customers', label: t('nav_customers'), icon: <Users className="w-5 h-5" strokeWidth={2.5} /> },
    ];

    const moreItems = [
        { id: 'calendar', label: t('nav_calendar'), icon: <Calendar className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'recurring', label: t('nav_recurring'), icon: <Repeat className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'faq', label: t('nav_faq'), icon: <HelpCircle className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'reports', label: t('nav_reports'), icon: <FileBarChart className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'settings', label: t('nav_settings'), icon: <SettingsIcon className="w-5 h-5" strokeWidth={2.5} /> },
    ];

    const isTabInMore = moreItems.some(item => item.id === activeTab);

    return (
        <>
            {isMoreMenuOpen && (
                <div className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm flex items-end justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsMoreMenuOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">More Options</h3>
                            <button onClick={() => setIsMoreMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                <X className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {moreItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id as ActiveTab); setIsMoreMenuOpen(false); }}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all ${activeTab === item.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500'}`}
                                >
                                    <div className={`p-2 rounded-xl ${activeTab === item.id ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 z-[60] flex items-center justify-around px-4 pb-safe">
                {mainItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as ActiveTab)}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-50 dark:bg-indigo-900/30 scale-110 shadow-sm' : ''}`}>
                            {item.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </button>
                ))}
                
                <button
                    onClick={() => setIsMoreMenuOpen(true)}
                    className={`flex flex-col items-center gap-1 transition-all ${isTabInMore ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                    <div className={`p-2 rounded-xl transition-all ${isTabInMore ? 'bg-indigo-50 dark:bg-indigo-900/30 scale-110 shadow-sm' : ''}`}>
                        <MoreHorizontal className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">More</span>
                </button>
            </nav>
        </>
    );
};

const Navigation: React.FC<{
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    onLinkClick: () => void;
    isSidebarOpen: boolean;
    overdueCount: number;
}> = ({ activeTab, setActiveTab, onLinkClick, isSidebarOpen, overdueCount }) => {
    const { t } = useLanguage();
    const items = [
        { id: 'dashboard', label: t('nav_dashboard'), icon: <LayoutDashboard className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'billing', label: t('nav_new_invoice'), icon: <PlusCircle className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'invoices', label: t('nav_all_invoices'), icon: <History className="w-5 h-5" strokeWidth={2.5} />, badge: overdueCount },
        { id: 'calendar', label: t('nav_calendar'), icon: <Calendar className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'recurring', label: t('nav_recurring'), icon: <Repeat className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'customers', label: t('nav_customers'), icon: <Users className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'products', label: t('nav_stock_manager'), icon: <Package className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'reports', label: t('nav_reports'), icon: <FileBarChart className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'faq', label: t('nav_faq'), icon: <HelpCircle className="w-5 h-5" strokeWidth={2.5} /> },
        { id: 'settings', label: t('nav_settings'), icon: <SettingsIcon className="w-5 h-5" strokeWidth={2.5} /> },
    ];
    return (
        <>
            {isSidebarOpen && <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[70] lg:hidden" onClick={onLinkClick} />}
            <aside className={`fixed lg:relative z-[80] w-72 bg-slate-50/80 dark:bg-slate-950/90 backdrop-blur-3xl border-r border-slate-200/50 dark:border-slate-800/50 h-screen flex-shrink-0 transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
                <div className="p-8 pb-4 flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                         <Database className="w-6 h-6 text-white" strokeWidth={3} />
                     </div>
                     <h2 className="font-black text-slate-800 dark:text-white tracking-tighter uppercase text-sm">MW Authority</h2>
                </div>
                <div className="p-5 space-y-2 flex-grow overflow-y-auto custom-scroll">
                    {items.map(item => (
                        <button key={item.id} onClick={() => { setActiveTab(item.id as ActiveTab); onLinkClick(); }} className={`relative flex items-center w-full px-4 py-4 rounded-[1.25rem] text-xs font-black transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-white'}`}>
                            <div className="mr-3 flex-shrink-0">{React.cloneElement(item.icon as React.ReactElement<any>, { className: "w-5 h-5" })}</div>
                            <span className="truncate uppercase tracking-wider">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && <span className="ml-auto px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">{item.badge}</span>}
                        </button>
                    ))}
                </div>
            </aside>
        </>
    );
};

export const App: React.FC = () => {
  useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [printData, setPrintData] = useState<{ type: string, data: any } | null>(null);
  const [newlyAddedInvoiceId, setNewlyAddedInvoiceId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { user } = useFirebase();

  // System Hooks
  const { products, addProduct, updateProduct, deleteProduct, deductStock } = useProducts();
  const { invoices, addInvoice, updateInvoice, markInstallmentAsPaid, deleteInvoice, addPaymentToInvoice, snoozeInstallmentReminder, updatePayment, updateCustomerPhoto, updateCustomerDetails } = useInvoices();
  const { tasks, addTask, toggleTaskStatus, deleteTask } = useTasks();
  const { shopDetails, updateShopDetails } = useShopDetails();
  const { settings, updateSettings } = useSettings();
  const { recurringInvoices, processDueCycles } = useRecurringInvoices();
  const { blacklist, addToBlacklist, removeFromBlacklist } = useBlacklist();
  const { blankBillSettings, updateBlankBillSettings } = useBlankBillSettings();
  const { log: blankBillLog } = useBlankBillLog();
  const { templates: blankBillTemplates } = useBlankBillTemplates();
  
  const { permission, requestPermission } = useNotifications(invoices);
  const { selectedActionIds, updateSelectedActionIds } = useQuickActions();
  const { isSignedIn, userProfile, signIn, signOut, backupData, restoreData, isBackingUp } = useGoogleDrive();
  const { notifications, unreadCount, markAllAsRead, clearAll, markAsRead } = useAppNotifications(invoices, []);
  const { createCloudBin, uploadToCloud, fetchFromCloud, isSyncing, error: syncError } = useSyncEngine();

  // Comprehensive data object for snapshots
  const fullAppData = useMemo(() => ({
      invoices,
      products,
      tasks,
      settings,
      shopDetails,
      blacklist,
      blankBillLog,
      blankBillTemplates,
      blankBillSettings,
      exportedAt: new Date().toISOString(),
      version: "1.4.2"
  }), [invoices, products, tasks, settings, shopDetails, blacklist, blankBillLog, blankBillTemplates, blankBillSettings]);

  const isBackupDue = useMemo(() => {
    if (!settings.autoBackupEnabled || !settings.nextBackupDate) return false;
    return new Date() >= new Date(settings.nextBackupDate);
  }, [settings.autoBackupEnabled, settings.nextBackupDate]);

  useEffect(() => {
    if (isBackupDue && isSignedIn && !isBackingUp) {
      const performAutoBackup = async () => {
        const success = await backupData(JSON.stringify(fullAppData));
        if (success) {
          const nextDate = new Date();
          if (settings.autoBackupFrequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
          else if (settings.autoBackupFrequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
          else if (settings.autoBackupFrequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
          
          updateSettings({
            lastBackupDate: new Date().toISOString(),
            nextBackupDate: nextDate.toISOString()
          });
        }
      };
      // Small delay to ensure everything is loaded
      const timer = setTimeout(performAutoBackup, 10000);
      return () => clearTimeout(timer);
    }
  }, [isBackupDue, isSignedIn, isBackingUp, backupData, fullAppData, settings.autoBackupFrequency, updateSettings]);

  useEffect(() => {
    if (settings.viewMode === 'mobile' && !['dashboard', 'billing', 'invoices', 'customers', 'settings'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [settings.viewMode]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Process recurring invoices on mount
    const timeout = setTimeout(() => {
        processDueCycles(addInvoice);
    }, 5000); // Wait 5s for data to sync
    return () => clearTimeout(timeout);
  }, [processDueCycles, addInvoice]);

  const handleNotificationClick = useCallback((n: AppNotification) => {
    markAsRead(n.id);
    if (n.type === 'invoice-overdue' || n.type === 'invoice-reminder') {
        if (n.relatedId) {
            setActiveTab('invoices');
            setNewlyAddedInvoiceId(null);
            setTimeout(() => {
                setNewlyAddedInvoiceId(n.relatedId);
            }, 100);
        }
    }
  }, [markAsRead]);

  if (showSplash) return <SplashScreen />;
  const isMobileView = settings.viewMode === 'mobile';

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-200 font-sans transition-colors duration-300 overflow-hidden subtle-bg ${isMobileView ? 'flex-col' : ''}`}>
      {!isMobileView && <Navigation activeTab={activeTab} setActiveTab={setActiveTab} onLinkClick={() => setIsSidebarOpen(false)} isSidebarOpen={isSidebarOpen} overdueCount={invoices.filter(i => i.status === 'Overdue').length} />}
      
      <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden ${isMobileView ? 'pb-20' : ''}`}>
        {isMobileView ? (
            <MobileHeader 
                shopDetails={shopDetails} 
                activeTab={activeTab} 
                viewMode={settings.viewMode}
                onViewModeChange={(mode) => updateSettings({ viewMode: mode })}
            />
        ) : (
            <Header 
                onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                shopDetails={shopDetails} 
                notifications={notifications} 
                unreadCount={unreadCount} 
                onNotificationClick={handleNotificationClick} 
                onMarkAllAsRead={markAllAsRead} 
                onClearAll={clearAll} 
                onLogoClick={() => setActiveTab('dashboard')} 
                viewMode={settings.viewMode}
                onViewModeChange={(mode) => updateSettings({ viewMode: mode })}
            />
        )}
        
        {!isMobileView && <SystemTicker invoices={invoices} products={products} isBackupDue={isBackupDue} lastSync={settings.lastSyncedAt} isSyncing={isSyncing} syncError={syncError} user={user} isBackingUp={isBackingUp} />}
        
        <main className="flex-1 overflow-y-auto custom-scroll">
          <div className={`max-w-7xl mx-auto py-8 ${isMobileView ? 'px-4 pb-32' : 'px-10 pb-32'}`}>
            {activeTab === 'dashboard' && (
                <Dashboard 
                    invoices={invoices} 
                    products={products} 
                    selectedActionIds={selectedActionIds} 
                    onQuickAction={() => {}} 
                    onNavigate={setActiveTab} 
                    onPriorityHubClick={id => { setNewlyAddedInvoiceId(id); setActiveTab('invoices'); }} 
                    onRecordPayment={markInstallmentAsPaid}
                    viewMode={settings.viewMode}
                    settings={settings}
                />
            )}
            {activeTab === 'billing' && (
                <NewInvoiceForm 
                    onAddInvoice={(inv, print) => { 
                        addInvoice(inv); 
                        setNewlyAddedInvoiceId(inv.id);
                        setActiveTab('invoices');
                        // Optional: if print is true, we could still open printData, 
                        // but the user wants to go to History and see the card.
                        // if(print) setPrintData({type: 'invoice', data: inv}); 
                    }} 
                    products={products} 
                    invoices={invoices}
                    onDeductStock={deductStock} 
                    viewMode={settings.viewMode} 
                />
            )}
            {activeTab === 'invoices' && <InvoiceList invoices={invoices} markInstallmentAsPaid={markInstallmentAsPaid} onPrint={d => setPrintData({type:'invoice', data:d})} onPrintAgreement={d => setPrintData({type:'agreement', data:d})} onPrintLegalNotice={inv => setPrintData({type:'legalNotice', data:inv})} onDeleteInvoice={deleteInvoice} addPaymentToInvoice={addPaymentToInvoice} updatePayment={updatePayment} updateCustomerPhoto={updateCustomerPhoto} updateCustomerDetails={updateCustomerDetails} onUpdateInvoice={updateInvoice} snoozeInstallmentReminder={id => snoozeInstallmentReminder(id, 1)} onPrintReceipt={(inv, pay) => setPrintData({type: 'receipt', data: { invoice: inv, payment: pay }})} shopDetails={shopDetails} newlyAddedInvoiceId={newlyAddedInvoiceId} viewMode={settings.viewMode} products={products} onViewCustomer={(phone) => {
                setSelectedCustomerId(phone);
                setActiveTab('customers');
            }} />}
            {activeTab === 'calendar' && (
                <CalendarView 
                    invoices={invoices} 
                    onViewInvoice={(id) => {
                        setNewlyAddedInvoiceId(id);
                        setActiveTab('invoices');
                    }}
                    viewMode={settings.viewMode}
                />
            )}
            {activeTab === 'recurring' && (
                <RecurringBillingView 
                    invoices={invoices} 
                    addInvoice={addInvoice}
                    viewMode={settings.viewMode}
                />
            )}
            {activeTab === 'faq' && <FAQView />}
            {activeTab === 'customers' && (
                <CustomerManager 
                    invoices={invoices} 
                    onNavigateToInvoice={(id) => {
                        setNewlyAddedInvoiceId(id);
                        setActiveTab('invoices');
                    }}
                    viewMode={settings.viewMode}
                    selectedCustomerId={selectedCustomerId}
                    onSelectCustomer={setSelectedCustomerId}
                    blacklist={blacklist}
                    onAddToBlacklist={addToBlacklist}
                    onRemoveFromBlacklist={removeFromBlacklist}
                />
            )}
            {activeTab === 'products' && (
                <ManageProducts 
                    products={products} 
                    addProduct={addProduct} 
                    updateProduct={updateProduct} 
                    deleteProduct={deleteProduct} 
                    onPrintReport={(plist) => setPrintData({ type: 'inventoryReport', data: plist })}
                    viewMode={settings.viewMode}
                />
            )}
            {activeTab === 'reports' && <Reports invoices={invoices} products={products} viewMode={settings.viewMode} />}
            {activeTab === 'settings' && (
              <Settings 
                settings={settings} 
                updateSettings={updateSettings} 
                shopDetails={shopDetails} 
                updateShopDetails={updateShopDetails} 
                appData={{ invoices, products, tasks, settings }} 
                selectedActionIds={selectedActionIds} 
                updateSelectedActions={updateSelectedActionIds} 
                fullAppData={fullAppData} 
                signIn={signIn} 
                isSignedIn={isSignedIn} 
                permission={permission} 
                requestPermission={requestPermission} 
              />
            )}
          </div>
        </main>
      </div>
      {isMobileView && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      <AIAssistant invoices={invoices} products={products} blacklist={blacklist} onRecordPayment={markInstallmentAsPaid} onNavigate={setActiveTab} />
      
      {printData && (
        <PrintPreview onClose={() => setPrintData(null)} defaultPaperSize={settings.invoicePaperSize}>
            {printData.type === 'invoice' ? <PrintableInvoice invoice={printData.data} shopDetails={shopDetails} paperSize={settings.invoicePaperSize} /> 
            : printData.type === 'receipt' ? <PrintableReceipt invoice={printData.data.invoice} payment={printData.data.payment} shopDetails={shopDetails} paperSize={settings.invoicePaperSize} /> 
            : printData.type === 'legalNotice' ? <PrintableLegalNotice invoice={printData.data} shopDetails={shopDetails} /> 
            : printData.type === 'agreement' ? <PrintableLegalAgreement invoice={printData.data} shopDetails={shopDetails} />
            : printData.type === 'inventoryReport' ? <PrintableInventoryReport products={printData.data} shopDetails={shopDetails} />
            : null}
        </PrintPreview>
      )}
    </div>
  );
};