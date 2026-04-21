import React, { useState } from 'react';
import type { AppState, AppSettings, ShopDetails, BlankBillSettings } from '../types';
import Modal from './Modal';

interface GoogleDriveSyncProps {
    fullAppData: AppState & { shopDetails: ShopDetails, blankBillSettings: BlankBillSettings };
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    userProfile: any;
    backupData: (data: string) => Promise<boolean>;
    restoreData: () => Promise<string | null>;
    signOut: () => void;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({ fullAppData, settings, updateSettings, userProfile, backupData, restoreData, signOut }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState<'backup' | 'restore' | null>(null);
    const [importSummary, setImportSummary] = useState<{
        invoices: number;
        products: number;
        shopName: string;
        date?: string;
        rawData: any;
    } | null>(null);

    const handleBackup = async () => {
        setIsLoading(true);
        setLoadingAction('backup');
        const success = await backupData(JSON.stringify(fullAppData, null, 2));
        if (success) {
            updateSettings({ lastBackupDate: new Date().toISOString() });
            alert('Backup successful!');
        } else {
            alert('Backup failed. Please check the console for errors.');
        }
        setIsLoading(false);
        setLoadingAction(null);
    };

    const handleRestore = async () => {
        setIsLoading(true);
        setLoadingAction('restore');
        const dataString = await restoreData();
        if (dataString) {
            try {
                const restoredState = JSON.parse(dataString);
                
                setImportSummary({
                    invoices: restoredState.invoices?.length || 0,
                    products: restoredState.products?.length || 0,
                    shopName: restoredState.shopDetails?.name || 'Unknown Shop',
                    date: restoredState.exportedAt || restoredState.settings?.lastBackupDate,
                    rawData: restoredState
                });
            } catch (e) {
                alert('Failed to parse restored data. The backup might be corrupted.');
                console.error(e);
            }
        }
        setIsLoading(false);
        setLoadingAction(null);
    };

    const confirmRestore = () => {
        if (!importSummary) return;
        const restoredState = importSummary.rawData;

        try {
            // Save to localStorage and reload
            localStorage.setItem('invoices', JSON.stringify(restoredState.invoices || []));
            localStorage.setItem('products', JSON.stringify(restoredState.products || []));
            localStorage.setItem('tasks', JSON.stringify(restoredState.tasks || []));
            localStorage.setItem('appSettings', JSON.stringify(restoredState.settings || {}));
            localStorage.setItem('shopDetails', JSON.stringify(restoredState.shopDetails || {}));
            localStorage.setItem('blankBillSettings', JSON.stringify(restoredState.blankBillSettings || {}));
            localStorage.setItem('blankBillTemplates', JSON.stringify(restoredState.blankBillTemplates || []));
            localStorage.setItem('utilityBillPayments', JSON.stringify(restoredState.utilityBillPayments || []));
            localStorage.setItem('utilityBillSubmissions', JSON.stringify(restoredState.utilityBillSubmissions || []));
            
            setImportSummary(null);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (e) {
            console.error(e);
            alert("Restore failed. Local storage error.");
        }
    };
    
    return (
        <div className="p-4 border dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-800/50 space-y-4">
            {/* User Profile Section */}
            <div className="flex justify-between items-center pb-4 border-b border-stone-200 dark:border-stone-700">
                <div className="flex items-center gap-3">
                    <img src={userProfile?.photos?.[0]?.url} alt="User" className="h-12 w-12 rounded-full border-2 border-white dark:border-stone-600 shadow-sm" />
                    <div>
                        <p className="font-semibold text-stone-800 dark:text-stone-100">{userProfile?.names?.[0]?.displayName}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{userProfile?.emailAddresses?.[0]?.value}</p>
                    </div>
                </div>
                <button onClick={signOut} className="text-xs font-medium text-stone-500 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400 transition-colors">Sign Out</button>
            </div>

            {/* Last Backup Info */}
            <div className="text-sm text-stone-600 dark:text-stone-300 flex items-center gap-3 p-3 bg-stone-100 dark:bg-stone-700/50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 10.586V6z" clipRule="evenodd" />
                </svg>
                {settings.lastBackupDate ? (
                    <span>Last backup: <span className="font-semibold">{new Date(settings.lastBackupDate).toLocaleString()}</span></span>
                ) : (
                    <span className="italic">No backup has been created yet.</span>
                )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-start gap-3 pt-2">
                <button 
                    onClick={handleBackup} 
                    disabled={isLoading} 
                    className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    {isLoading && loadingAction === 'backup' ? (
                        <Spinner />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 9.414V13h-2.5a.5.5 0 010-1H13v-1.5a.5.5 0 01.5-.5 3.5 3.5 0 00-6.83 1.025a.5.5 0 01-.83-.55A3.5 3.5 0 015.5 6.5a.5.5 0 010 1H5.5a2.5 2.5 0 000 5h.5a.5.5 0 010 1H5.5z" />
                           <path d="M9 13.414V17a1 1 0 102 0v-3.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 13.414z" />
                        </svg>
                    )}
                    <span>{isLoading && loadingAction === 'backup' ? 'Backing up...' : 'Backup Now'}</span>
                </button>
                <button 
                    onClick={handleRestore} 
                    disabled={isLoading} 
                    className="inline-flex items-center justify-center px-4 py-2 bg-stone-100 text-stone-800 rounded-lg text-sm font-semibold hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600 transition-colors shadow-sm border border-stone-300 dark:border-stone-600"
                >
                    {isLoading && loadingAction === 'restore' ? (
                        <Spinner />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    )}
                    <span>{isLoading && loadingAction === 'restore' ? 'Restoring...' : 'Restore'}</span>
                </button>
            </div>

            <Modal isOpen={!!importSummary} onClose={() => setImportSummary(null)} title="Cloud Vault Verification" variant="focus">
                {importSummary && (
                    <div className="space-y-8 animate-fade-in-content">
                        <div className="relative p-10 bg-slate-950 rounded-[3.5rem] border border-white/10 text-center shadow-2xl overflow-hidden group">
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-1000" />
                            
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-indigo-600/20 rounded-[2rem] flex items-center justify-center text-indigo-400 mx-auto mb-6 border border-indigo-500/30 shadow-xl animate-bounce-subtle">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h4 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Vault Data Ready</h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-8">Cloud Restore තහවුරු කරන්න</p>

                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Business</p>
                                        <p className="text-sm font-black text-slate-200 truncate">{importSummary.shopName}</p>
                                    </div>
                                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Vault Date</p>
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
                                        <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        <p className="text-[10px] font-bold text-rose-400/80 leading-relaxed uppercase">දැනට ඇති සියලුම දත්ත මැකී ගොස් මෙම නව දත්ත මගින් පද්ධතිය යාවත්කාලීන වනු ඇත.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={confirmRestore}
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
        </div>
    );
}