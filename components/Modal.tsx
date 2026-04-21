import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'focus';
  fullScreen?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, variant = 'default', fullScreen = false }) => {
  if (!isOpen) return null;

  const isFocus = variant === 'focus';

  return (
    <div 
      className={`fixed inset-0 z-[200] flex justify-center items-center p-2 sm:p-4 md:p-8 transition-all duration-700 ${isFocus ? 'bg-black/95 backdrop-blur-2xl' : 'bg-black/80 backdrop-blur-md'}`}
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-[#0b0f1a] shadow-2xl flex flex-col overflow-hidden border transition-all duration-700 ${fullScreen ? 'w-full h-full max-h-screen rounded-none' : 'rounded-3xl sm:rounded-[3.5rem] w-full max-w-lg max-h-[96dvh] sm:max-h-[92dvh]'} ${isFocus ? 'border-indigo-500/30 shadow-[0_0_100px_-20px_rgba(99,102,241,0.4)] scale-100' : 'border-slate-200 dark:border-slate-800/50 scale-100'} animate-hub-entrance relative`}
        onClick={e => e.stopPropagation()}
      >
        {/* Premium Glow Effects */}
        {isFocus && (
          <>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-600/10 blur-[80px] rounded-full pointer-events-none" />
          </>
        )}

        <div className={`flex justify-between items-center p-5 sm:p-8 md:p-10 border-b flex-shrink-0 relative z-10 ${isFocus ? 'border-indigo-500/10 bg-indigo-500/5' : 'border-slate-100 dark:border-slate-800/50'}`}>
          <div className="flex items-center gap-3 sm:gap-4">
             {isFocus && (
               <div className="relative">
                 <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-indigo-500 animate-ping absolute inset-0" />
                 <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-indigo-500 relative z-10" />
               </div>
             )}
             <h3 className={`text-base sm:text-lg md:text-xl font-black uppercase tracking-[0.25em] ${isFocus ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-100'}`}>{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-rose-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50 active:scale-90 group"
            aria-label="Close modal"
          >
            <X className="h-6 w-6 sm:h-7 sm:w-7 transition-transform group-hover:rotate-90" strokeWidth={2.5} />
          </button>
        </div>
        <div className="p-5 sm:p-8 md:p-12 overflow-y-auto custom-scroll flex-1 scroll-smooth relative z-10">
          <div className="animate-fade-in-content">
            {children}
          </div>
        </div>
      </div>
       <style>{`
        @keyframes hubEntrance {
          0% { transform: scale(0.8) translateY(50px); opacity: 0; filter: blur(15px); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0px); }
        }
        @keyframes fadeInContent {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-hub-entrance { 
          animation: hubEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in-content {
          animation: fadeInContent 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
        
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-base font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-5 text-xs font-black uppercase tracking-widest rounded-2xl text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-5 text-xs font-black uppercase tracking-widest rounded-2xl text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;
