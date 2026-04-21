import React from 'react';
import Modal from './Modal';
import { CHANGELOG, APP_VERSION } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface UpdateSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UpdateSummaryModal: React.FC<UpdateSummaryModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const currentLog = CHANGELOG.find(log => log.version === APP_VERSION);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('update_modal_title')} v${APP_VERSION}`} variant="focus">
            <div className="space-y-8 animate-fade-in-content">
                <div className="p-6 bg-indigo-600/5 border border-indigo-600/10 rounded-3xl">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                        {t('update_modal_desc')}
                    </p>
                </div>
                
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 pl-1">New Capabilities</h4>
                    {currentLog ? (
                        <div className="space-y-3">
                            {currentLog.features.map((feature, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{feature}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm italic text-slate-500">Performance improvements and bug fixes.</p>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    {t('update_modal_btn')}
                </button>
            </div>
        </Modal>
    );
};