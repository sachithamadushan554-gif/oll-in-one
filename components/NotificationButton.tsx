
import React from 'react';

interface NotificationButtonProps {
    permission: NotificationPermission;
    requestPermission: () => void;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({ permission, requestPermission }) => {
    if (permission === 'granted') {
        return (
             <div className="flex items-center gap-2 text-sm text-teal-700 bg-teal-100 dark:text-teal-300 dark:bg-teal-500/20 p-3 rounded-xl">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Payment reminders are enabled.</span>
            </div>
        )
    }
    
    if (permission === 'denied') {
        return (
             <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-500/20 p-3 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>Notification permissions denied. You won't receive payment reminders.</span>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between gap-2 text-sm text-amber-800 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/20 p-3 rounded-xl">
            <span>Enable notifications to get payment reminders.</span>
            <button onClick={requestPermission} className="bg-amber-500 text-white font-semibold px-3 py-1 rounded-md hover:bg-amber-600 text-xs">
                Enable Notifications
            </button>
        </div>
    );
};