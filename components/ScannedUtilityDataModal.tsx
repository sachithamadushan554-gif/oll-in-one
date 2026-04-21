import React, { useState } from 'react';
import Modal from './Modal';

interface ScannedUtilityDataModalProps {
    data: { accountNumber: string; customerPhone: string };
    onClose: () => void;
}

const ScannedUtilityDataModal: React.FC<ScannedUtilityDataModalProps> = ({ data, onClose }) => {
    const [copiedField, setCopiedField] = useState<'account' | 'phone' | null>(null);

    const handleCopy = (text: string, field: 'account' | 'phone') => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy.');
        });
    };

    const formInputStyle = "w-full px-4 py-2 border border-stone-300 rounded-lg shadow-sm bg-stone-100 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200";

    return (
        <Modal isOpen={true} onClose={onClose} title="Scanned Bill Information">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Account Number</label>
                    <div className="flex items-center gap-2">
                        <input type="text" value={data.accountNumber} readOnly className={formInputStyle} />
                        <button
                            onClick={() => handleCopy(data.accountNumber, 'account')}
                            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 w-24 text-center transition-colors"
                        >
                            {copiedField === 'account' ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>
                {data.customerPhone && (
                    <div>
                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Phone Number</label>
                        <div className="flex items-center gap-2">
                            <input type="text" value={data.customerPhone} readOnly className={formInputStyle} />
                            <button
                                onClick={() => handleCopy(data.customerPhone, 'phone')}
                                className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 w-24 text-center transition-colors"
                            >
                                {copiedField === 'phone' ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                )}
                 <div className="flex justify-end pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-stone-700 bg-stone-100 hover:bg-stone-200 dark:text-stone-200 dark:bg-stone-600 dark:hover:bg-stone-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ScannedUtilityDataModal;
