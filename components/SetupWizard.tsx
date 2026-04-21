import React, { useState, useRef } from 'react';
import type { ShopDetails } from '../types';
import { optimizeImage } from '../utils/imageOptimizer';

interface SetupWizardProps {
    onSetupComplete: (details: ShopDetails) => void;
    onSkip: () => void;
}

const Logo = () => (
    <div className="inline-block flex-shrink-0 bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/40">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
            <path d="M16 3.535C14.012 2.553 11.636 2 9 2C5.134 2 2 5.134 2 9C2 12.153 3.963 14.881 6.75 15.688M8 20.465C9.988 21.447 12.364 22 15 22C18.866 22 22 18.866 22 15C22 11.847 20.037 9.119 17.25 8.312" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </div>
);


const SetupWizard: React.FC<SetupWizardProps> = ({ onSetupComplete, onSkip }) => {
    const [step, setStep] = useState(1);
    const [isCompleting, setIsCompleting] = useState(false);
    const [details, setDetails] = useState<ShopDetails>({
        name: '',
        address: '',
        phone1: '',
        phone2: '',
        paymentMethod: 'Cash Only',
        logoUrl: '',
    });
    const logoInputRef = useRef<HTMLInputElement>(null);
    const TOTAL_STEPS = 4;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };
    
    const canProceed = () => {
        if (step === 1) return details.name.trim() !== '';
        if (step === 2) return details.address.trim() !== '';
        if (step === 3) return details.phone1.trim() !== '';
        if (step === 4) return true; // Optional step
        return false;
    };

    const handleNext = () => {
        if (canProceed()) {
            setStep(s => Math.min(s + 1, TOTAL_STEPS));
        }
    };
    
    const handleBack = () => {
        setStep(s => Math.max(s - 1, 1));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!details.name || !details.address || !details.phone1) {
            alert('Please fill in at least the Shop Name, Address, and Primary Phone before finishing.');
            if (!details.name) setStep(1);
            else if (!details.address) setStep(2);
            else setStep(3);
            return;
        }
        setIsCompleting(true);
        setTimeout(() => {
            onSetupComplete(details);
        }, 1500); // Wait for completion animation
    };
    
    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const optimizedDataUrl = await optimizeImage(file);
                setDetails(prev => ({ ...prev, logoUrl: optimizedDataUrl }));
            } catch (error) {
                console.error("Error optimizing logo:", error);
                alert("There was an error processing the logo. Please try another image.");
            }
        }
    };

    const handleRemoveLogo = () => {
        setDetails(prev => ({ ...prev, logoUrl: '' }));
    };

    const formInputStyle = "w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 text-base";
    
    const stepTitles = ["Shop Name", "Shop Address", "Contact Details", "Add Logo"];

    return (
        <div className="flex items-center justify-center min-h-screen bg-stone-100 dark:bg-stone-950 p-4 subtle-bg">
            <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border dark:border-stone-800 overflow-hidden animate-modal-pop-in relative">
                 {isCompleting && (
                    <div className="absolute inset-0 bg-white dark:bg-stone-900 flex flex-col items-center justify-center animate-fade-in z-20">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-teal-500 animate-checkmark-pop-in" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>Setup Complete!</h2>
                        <p className="text-stone-500 dark:text-stone-400 mt-2 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>Launching your shop...</p>
                    </div>
                )}
                <div className={`p-8 ${isCompleting ? 'animate-finish-setup-zoom-out' : ''}`}>
                    <div className="text-center mb-8">
                        <Logo />
                        <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight mt-4">Welcome! Let's get you set up.</h1>
                        <p className="text-stone-500 dark:text-stone-400 mt-1">This will only take a minute.</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{stepTitles[step - 1]}</span>
                            <span className="text-sm font-medium text-stone-500 dark:text-stone-400">Step {step} of {TOTAL_STEPS}</span>
                        </div>
                        <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}></div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="min-h-[220px] flex flex-col justify-center">
                        <div key={step}>
                            {step === 1 && <div className="space-y-2 animate-fade-in-up">
                                <label htmlFor="name" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">What's your shop's name? *</label>
                                <input type="text" id="name" name="name" value={details.name} onChange={handleChange} className={formInputStyle} required autoFocus placeholder="e.g., Saman Mobile" />
                            </div>}
                            {step === 2 && <div className="space-y-2 animate-fade-in-up">
                                <label htmlFor="address" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Where is your shop located? *</label>
                                <input type="text" id="address" name="address" value={details.address} onChange={handleChange} className={formInputStyle} required autoFocus placeholder="e.g., 123 Main Street, Colombo" />
                            </div>}
                            {step === 3 && <div className="space-y-4 animate-fade-in-up">
                                <div>
                                    <label htmlFor="phone1" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Primary Phone Number *</label>
                                    <input type="tel" id="phone1" name="phone1" value={details.phone1} onChange={handleChange} className={formInputStyle} required placeholder="0771234567" autoFocus />
                                </div>
                                <div>
                                    <label htmlFor="phone2" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Secondary Phone (Optional)</label>
                                    <input type="tel" id="phone2" name="phone2" value={details.phone2} onChange={handleChange} className={formInputStyle} />
                                </div>
                            </div>}
                            {step === 4 && <div className="space-y-4 animate-fade-in-up text-center">
                                <h3 className="text-xl font-bold text-stone-700 dark:text-stone-200">Add Your Logo (Optional)</h3>
                                <p className="text-sm text-stone-500 dark:text-stone-400 pb-2">A logo will make your invoices look more professional.</p>
                                <div className="flex items-center justify-center gap-4">
                                    <div className="w-24 h-24 rounded-lg bg-stone-100 dark:bg-stone-700 flex items-center justify-center overflow-hidden border border-stone-200 dark:border-stone-600">
                                        {details.logoUrl ? <img src={details.logoUrl} alt="Shop Logo" className="w-full h-full object-contain" /> : <span className="text-xs text-stone-400 dark:text-stone-500 p-2 text-center">No Logo</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                                        <button type="button" onClick={() => logoInputRef.current?.click()} className="w-full text-sm text-center px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-md hover:bg-stone-50 dark:hover:bg-stone-600">Upload Logo</button>
                                        {details.logoUrl && <button type="button" onClick={handleRemoveLogo} className="w-full text-sm text-center px-4 py-2 text-rose-600 dark:text-rose-400 hover:underline">Remove</button>}
                                    </div>
                                </div>
                            </div>}
                        </div>
                    </form>

                    <div className="flex items-center gap-4 pt-8">
                        {step > 1 && <button type="button" onClick={handleBack} className="px-5 py-3 text-base font-semibold rounded-xl text-stone-700 bg-stone-200 hover:bg-stone-300 dark:text-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 transition-colors">Back</button>}
                        {step < TOTAL_STEPS ? 
                            <button type="button" onClick={handleNext} disabled={!canProceed()} className="w-full flex-grow inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/30 transition-all disabled:bg-stone-400 disabled:shadow-none dark:disabled:bg-stone-500 disabled:cursor-not-allowed">
                                Next <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                            </button> :
                            <button type="button" onClick={handleSubmit} className="w-full flex-grow inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105">
                                Finish Setup
                            </button>
                        }
                    </div>
                </div>
                <div className="bg-stone-50 dark:bg-stone-800/50 p-4 text-center border-t dark:border-stone-800">
                    <button onClick={onSkip} className="text-sm font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200">
                        Skip for now, I'll set up later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;
