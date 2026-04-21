
import React from 'react';
import type { ShopDetails } from '../types';

interface MobileHeaderProps {
    shopDetails: ShopDetails;
    activeTab: string;
    viewMode: 'pc' | 'mobile';
    onViewModeChange: (mode: 'pc' | 'mobile') => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ shopDetails, activeTab, viewMode, onViewModeChange }) => {
    const getTitle = () => {
        switch (activeTab) {
            case 'dashboard': return 'Dashboard';
            case 'billing': return 'New Bill';
            case 'invoices': return 'History';
            case 'customers': return 'Clients';
            case 'products': return 'Stock Manager';
            case 'settings': return 'Settings';
            default: return shopDetails.name || 'MW Authority';
        }
    };

    return (
        <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="3">
                        <path d="M12 6L12 18"/><path d="M16 3.535C14.012 2.553 11.636 2 9 2C5.134 2 2 5.134 2 9C2 12.153 3.963 14.881 6.75 15.688M8 20.465C9.988 21.447 12.364 22 15 22C18.866 22 22 18.866 22 15C22 11.847 20.037 9.119 17.25 8.312"/>
                    </svg>
                </div>
                <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{getTitle()}</h1>
            </div>
            <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <button 
                    onClick={() => onViewModeChange(viewMode === 'pc' ? 'mobile' : 'pc')}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 shadow-sm transition-all active:scale-95"
                    title={viewMode === 'pc' ? "Switch to Mobile View" : "Switch to PC View"}
                >
                    {viewMode === 'pc' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{shopDetails.name?.split(' ')[0]}</p>
                </div>
            </div>
        </header>
    );
};
