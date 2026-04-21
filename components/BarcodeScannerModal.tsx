import React, { useEffect, useRef } from 'react';
import Modal from './Modal';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (data: string) => void;
}

declare var Html5Qrcode: any;

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
    const scannerRef = useRef<any>(null);
    const regionId = 'reader';

    useEffect(() => {
        let html5QrCode: any;

        if (isOpen) {
            // Wait for DOM to update
            setTimeout(() => {
                if (typeof Html5Qrcode === 'undefined') {
                    console.error("Html5Qrcode library not loaded.");
                    alert("Scanner library failed to load. Please check your internet connection.");
                    return;
                }

                html5QrCode = new Html5Qrcode(regionId);
                scannerRef.current = html5QrCode;

                const config = { 
                    fps: 10, 
                    qrbox: { width: 250, height: 150 }, // Wider box for barcodes
                    aspectRatio: 1.0
                };

                html5QrCode.start(
                    { facingMode: "environment" }, 
                    config, 
                    (decodedText: string) => {
                        // Success callback
                        if (html5QrCode.isScanning) {
                            html5QrCode.stop().then(() => {
                                onScanSuccess(decodedText);
                                onClose();
                            }).catch((err: any) => console.error(err));
                        }
                    },
                    (errorMessage: any) => {
                        // Ignore scan errors as they happen every frame
                    }
                ).catch((err: any) => {
                    console.error("Error starting scanner", err);
                    alert("Could not access camera. Please allow camera permissions.");
                    onClose();
                });
            }, 100);
        }

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch((err: any) => console.error("Failed to stop scanner", err));
            }
        };
    }, [isOpen, onClose, onScanSuccess]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Scan Barcode">
            <div className="w-full bg-black rounded-lg overflow-hidden relative">
                <div id={regionId} className="w-full"></div>
                <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-lg"></div>
            </div>
            <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-4">
                Point camera at a barcode. Ensure good lighting.
            </p>
        </Modal>
    );
};

export default BarcodeScannerModal;