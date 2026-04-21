import React, { useState, useEffect } from 'react';

interface SimpleLockScreenProps {
    onUnlock: () => void;
    correctCode: string;
}

const Logo = () => (
    <div className="flex-shrink-0 bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/40">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
            <path d="M16 3.535C14.012 2.553 11.636 2 9 2C5.134 2 2 5.134 2 9C2 12.153 3.963 14.881 6.75 15.688M8 20.465C9.988 21.447 12.364 22 15 22C18.866 22 22 18.866 22 15C22 11.847 20.037 9.119 17.25 8.312" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </div>
);

export const SimpleLockScreen: React.FC<SimpleLockScreenProps> = ({ onUnlock, correctCode }) => {
    const [inputCode, setInputCode] = useState('');
    const [error, setError] = useState(false);
    const [lockoutTime, setLockoutTime] = useState<number>(0);

    useEffect(() => {
        const checkLockout = () => {
            const lockoutEnd = parseInt(localStorage.getItem('lock_lockout_end') || '0', 10);
            const now = Date.now();
            if (lockoutEnd > now) {
                setLockoutTime(Math.ceil((lockoutEnd - now) / 1000));
            } else {
                setLockoutTime(0);
            }
        };
        
        checkLockout(); // Check immediately
        const interval = setInterval(checkLockout, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (lockoutTime > 0) return;

        if (inputCode === correctCode) {
            onUnlock();
            // Reset attempts on successful unlock
            localStorage.removeItem('lock_failed_attempts');
            localStorage.removeItem('lock_lockout_end');
        } else {
            setError(true);
            setInputCode('');
            
            // Increment failed attempts
            const attempts = parseInt(localStorage.getItem('lock_failed_attempts') || '0', 10) + 1;
            localStorage.setItem('lock_failed_attempts', attempts.toString());

            // Lockout logic: Lock for 30s after 5 failed attempts
            if (attempts >= 5) {
                const lockoutDuration = 30 * 1000; // 30 seconds
                localStorage.setItem('lock_lockout_end', (Date.now() + lockoutDuration).toString());
                setLockoutTime(30);
                // Reset attempts after lockout triggers so they have another 5 tries after waiting
                localStorage.setItem('lock_failed_attempts', '0');
            }

            // Clear error shake after animation
            setTimeout(() => setError(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-100 dark:bg-stone-950 p-4 subtle-bg backdrop-blur-sm">
            <div className="w-full max-w-sm p-8 space-y-8 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-2xl shadow-2xl text-center border dark:border-stone-800 animate-modal-pop-in">
                <div className="flex flex-col items-center space-y-4">
                    <Logo />
                    <div>
                        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">App Locked</h2>
                        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
                            {lockoutTime > 0 
                                ? `Too many attempts. Try again in ${lockoutTime}s.` 
                                : "Please enter your code to continue."}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <input 
                            type="password" 
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            placeholder={lockoutTime > 0 ? "Locked" : "Enter Code"}
                            disabled={lockoutTime > 0}
                            autoFocus
                            className={`w-full px-4 py-3 text-center text-2xl tracking-widest font-bold border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-stone-800 dark:text-stone-100 transition-all 
                                ${error ? 'border-rose-500 ring-2 ring-rose-500 animate-shake' : 'border-stone-300 dark:border-stone-700'}
                                ${lockoutTime > 0 ? 'bg-stone-200 dark:bg-stone-800 cursor-not-allowed opacity-50' : ''}
                            `}
                        />
                        {error && !lockoutTime && (
                            <p className="absolute -bottom-6 left-0 right-0 text-xs text-rose-500 font-semibold animate-pulse">
                                Incorrect code. Please try again.
                            </p>
                        )}
                        <style>{`
                            @keyframes shake {
                                0%, 100% { transform: translateX(0); }
                                20%, 60% { transform: translateX(-5px); }
                                40%, 80% { transform: translateX(5px); }
                            }
                            .animate-shake { animation: shake 0.4s ease-in-out; }
                        `}</style>
                    </div>

                    <button 
                        type="submit" 
                        disabled={lockoutTime > 0 || inputCode.length === 0}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {lockoutTime > 0 ? `Wait ${lockoutTime}s` : 'Unlock'}
                    </button>
                </form>
            </div>
        </div>
    );
};