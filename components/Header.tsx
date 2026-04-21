
import React, { useState, useRef, useEffect } from 'react';
import type { ShopDetails, AppNotification } from '../types';
import { NotificationPanel } from './NotificationPanel';
import { useLanguage } from '../contexts/LanguageContext';
import { useFirebase } from '../contexts/FirebaseContext';
import { Menu, Monitor, Smartphone, LogIn, LogOut, Check, Bell } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
  shopDetails: ShopDetails;
  notifications: AppNotification[];
  unreadCount: number;
  onNotificationClick: (notification: AppNotification) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onLogoClick?: () => void;
  viewMode: 'pc' | 'mobile';
  onViewModeChange: (mode: 'pc' | 'mobile') => void;
}

const Logo = () => (
  <div className="flex-shrink-0 bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-transform hover:rotate-3 duration-300">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
      <path d="M16 3.535C14.012 2.553 11.636 2 9 2C5.134 2 2 5.134 2 9C2 12.153 3.963 14.881 6.75 15.688M8 20.465C9.988 21.447 12.364 22 15 22C18.866 22 22 18.866 22 15C22 11.847 20.037 9.119 17.25 8.312" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 6L12 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const Clock = () => {
  const [date, setDate] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:flex flex-col items-end pr-6 border-r border-slate-200/60 dark:border-slate-800/60 h-10 justify-center">
      <p className="text-xl font-black text-slate-800 dark:text-slate-100 tabular-nums leading-none tracking-tighter">
        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black mt-1.5 uppercase tracking-[0.15em]">
        {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ onMenuClick, shopDetails, notifications, unreadCount, onNotificationClick, onMarkAllAsRead, onClearAll, onLogoClick, viewMode, onViewModeChange }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { user, signIn, signOut } = useFirebase();

  const togglePanel = () => {
    const willOpen = !isPanelOpen;
    setIsPanelOpen(willOpen);
    if (willOpen && unreadCount > 0) {
        setTimeout(() => onMarkAllAsRead(), 500);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
            setIsPanelOpen(false);
        }
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setIsUserMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="relative z-[80] bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
      <div className="mx-auto max-w-7xl px-4 lg:px-10">
        <div className="h-24 flex justify-between items-center">
            <div className="flex items-center gap-6">
                <button 
                  onClick={onMenuClick} 
                  className="lg:hidden p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" strokeWidth={2.5} />
                </button>

                <button onClick={onLogoClick} className="flex items-center gap-5 group" aria-label="Go to dashboard">
                  <Logo />
                  <div className="text-left">
                    <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{shopDetails.name || 'Saman Mobile'}</h1>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-2 opacity-80">{shopDetails.address || 'Colombo, SL'}</p>
                  </div>
                </button>
            </div>
            
            <div className="flex items-center gap-6">
                <Clock />

                {/* View Mode Toggle */}
                <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button 
                        onClick={() => onViewModeChange('pc')}
                        className={`p-2 rounded-xl transition-all ${viewMode === 'pc' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="PC View"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => onViewModeChange('mobile')}
                        className={`p-2 rounded-xl transition-all ${viewMode === 'mobile' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Mobile View"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
                
                {/* User Profile / Login */}
                <div className="relative" ref={userMenuRef}>
                    {user ? (
                        <button 
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-3 p-1 pr-4 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-600 transition-all"
                        >
                            <img 
                                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
                                alt={user.displayName || 'User'} 
                                className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800"
                                referrerPolicy="no-referrer"
                            />
                            <div className="hidden sm:block text-left">
                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none truncate max-w-[80px]">
                                    {user.displayName?.split(' ')[0]}
                                </p>
                                <p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest mt-1">Synced</p>
                            </div>
                        </button>
                    ) : (
                        <button 
                            onClick={signIn}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                        >
                            <LogIn className="w-4 h-4" strokeWidth={3} />
                            Login to Sync
                        </button>
                    )}

                    {isUserMenuOpen && user && (
                        <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="text-center mb-6">
                                <img 
                                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
                                    alt={user.displayName || 'User'} 
                                    className="w-16 h-16 rounded-3xl mx-auto mb-4 border-4 border-indigo-50 dark:border-indigo-900/30 shadow-lg"
                                    referrerPolicy="no-referrer"
                                />
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{user.displayName}</h3>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold lowercase mt-1">{user.email}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                                            <Check className="w-4 h-4" strokeWidth={3} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Cloud Sync Active</p>
                                            <p className="text-[8px] text-emerald-600/60 dark:text-emerald-400/60 font-bold uppercase tracking-widest mt-0.5">Real-time backup</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { signOut(); setIsUserMenuOpen(false); }}
                                    className="w-full flex items-center justify-center gap-2 p-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px]"
                                >
                                    <LogOut className="w-4 h-4" strokeWidth={3} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Notification Bell Container */}
                <div className="relative z-[90]" ref={panelRef}>
                    <button
                        onClick={togglePanel}
                        className={`relative p-3.5 rounded-2xl transition-all duration-300 ${
                            isPanelOpen 
                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' 
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-600 hover:text-indigo-600 shadow-sm'
                        }`}
                        aria-label="Notifications"
                    >
                        <Bell className="h-5 w-5" strokeWidth={2.5} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-rose-600 text-white text-[10px] font-black shadow-lg">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </span>
                        )}
                    </button>
                    {isPanelOpen && (
                        <NotificationPanel
                            notifications={notifications}
                            onNotificationClick={(n) => { onNotificationClick(n); setIsPanelOpen(false); }}
                            onMarkAllAsRead={onMarkAllAsRead}
                            onClearAll={onClearAll}
                            onClose={() => setIsPanelOpen(false)}
                        />
                    )}
                </div>
            </div>
        </div>
      </div>
    </header>
  );
};
