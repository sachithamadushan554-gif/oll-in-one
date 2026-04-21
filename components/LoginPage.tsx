import React from 'react';

interface LoginPageProps {
    signIn: () => void;
    isApiReady: boolean;
    signInError: string | null;
    initializationError: string | null;
    onSkip: () => void;
}

const Logo = () => (
    <div className="flex-shrink-0 bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/40">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
            <path d="M16 3.535C14.012 2.553 11.636 2 9 2C5.134 2 2 5.134 2 9C2 12.153 3.963 14.881 6.75 15.688M8 20.465C9.988 21.447 12.364 22 15 22C18.866 22 22 18.866 22 15C22 11.847 20.037 9.119 17.25 8.312" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </div>
);


export const LoginPage: React.FC<LoginPageProps> = ({ signIn, isApiReady, signInError, initializationError, onSkip }) => {
    const error = signInError || initializationError;

    return (
        <div className="flex items-center justify-center min-h-screen bg-stone-100 dark:bg-stone-950 p-4 subtle-bg">
            <div className="w-full max-w-sm p-8 space-y-8 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl rounded-2xl shadow-2xl text-center border dark:border-stone-200 dark:border-stone-800 animate-modal-pop-in">
                <div className="space-y-4">
                    <Logo />
                    <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">MW all in one billing system</h1>
                    <p className="text-stone-500 dark:text-stone-400">Billing Management System</p>
                </div>

                {error && (
                    <div className="p-3 my-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-sm text-rose-700 dark:text-rose-300 text-left" role="alert">
                        <p className="font-semibold">Authentication Error</p>
                        <p>{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={signIn}
                        disabled={!isApiReady || !!initializationError}
                        className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-stone-400 dark:disabled:bg-stone-500 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg>
                        <span>{isApiReady ? 'Sign in with Google' : 'Connecting...'}</span>
                    </button>
                    <button
                        onClick={onSkip}
                        disabled={!!initializationError}
                        className="w-full text-sm font-semibold text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Skip and use local data only
                    </button>
                </div>
                 <p className="text-xs text-stone-400 dark:text-stone-500 pt-2">
                    Sign in to securely backup and sync your data across devices using your Google Drive.
                </p>
            </div>
        </div>
    );
};