
import React from 'react';
import type { AppNotification } from '../types';

interface NotificationPanelProps {
    notifications: AppNotification[];
    onNotificationClick: (notification: AppNotification) => void;
    onMarkAllAsRead: () => void;
    onClearAll: () => void;
    onClose: () => void;
}

const NotificationIcon: React.FC<{ type: AppNotification['type'] }> = ({ type }) => {
    const baseClasses = "h-10 w-10 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-current/10";
    switch (type) {
        case 'invoice-overdue':
            return <div className={`${baseClasses} bg-rose-600`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v5.586l1.707 1.707a1 1 0 001.414-1.414L11 10.586V5z" clipRule="evenodd" /></svg></div>;
        case 'invoice-reminder':
            return <div className={`${baseClasses} bg-amber-500`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" clipRule="evenodd" /></svg></div>;
        case 'system-backup':
            return <div className={`${baseClasses} bg-indigo-600`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011-1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg></div>;
        default:
            return null;
    }
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onNotificationClick, onMarkAllAsRead, onClearAll, onClose }) => {
    const timeSince = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };
    
    const sortedNotifications = [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return (
        <div className="absolute top-full right-0 mt-4 w-screen max-w-[380px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in origin-top-right z-[100] overflow-hidden">
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-slate-100">Alert Center</h3>
                </div>
                <button onClick={onMarkAllAsRead} className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline">Mark all read</button>
            </div>
            
            <div className="max-h-[480px] overflow-y-auto custom-scroll divide-y divide-slate-50 dark:divide-slate-800/50">
                {sortedNotifications.length > 0 ? (
                    sortedNotifications.map(n => (
                        <div 
                            key={n.id} 
                            onClick={() => { onNotificationClick(n); onClose(); }} 
                            className={`p-6 flex items-start gap-4 cursor-pointer transition-all hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 group active:scale-[0.98] ${!n.isRead ? 'bg-white dark:bg-slate-900 shadow-sm z-10' : 'opacity-60 grayscale-[0.5]'}`}
                        >
                            <NotificationIcon type={n.type} />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <p className={`font-black text-sm uppercase tracking-tight group-hover:text-indigo-600 transition-colors ${!n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{n.title}</p>
                                    {!n.isRead && <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse flex-shrink-0 ml-2"></div>}
                                </div>
                                <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{n.message}</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">{timeSince(n.createdAt)}</p>
                                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800"></span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors cursor-pointer select-none">Open Details →</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 opacity-30">
                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        <p className="font-black uppercase text-xs tracking-[0.4em] text-slate-400">Ledger clear</p>
                    </div>
                )}
            </div>
            
            {sortedNotifications.length > 0 && (
                 <div className="p-4 text-center border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                    <button onClick={onClearAll} className="text-[10px] font-black uppercase text-rose-600 tracking-[0.3em] hover:text-rose-700 transition-colors">Clear All Records</button>
                </div>
            )}
        </div>
    );
};
