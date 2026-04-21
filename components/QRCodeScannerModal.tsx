import React, { useRef, useEffect } from 'react';
import Modal from './Modal';

// Let TypeScript know that jsQR is available globally from the script tag in index.html
declare var jsQR: any;

interface QRCodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (data: string) => void;
}

const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        let animationFrameId: number;

        const tick = () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code) {
                        onScanSuccess(code.data);
                        // No need to call onClose(), the parent component will handle it after success
                        return; // Stop the loop
                    }
                }
            }
            animationFrameId = requestAnimationFrame(tick);
        };

        if (isOpen) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                .then(stream => {
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.setAttribute("playsinline", "true"); // required for iOS Safari
                        videoRef.current.play();
                        animationFrameId = requestAnimationFrame(tick);
                    }
                })
                .catch(err => {
                    console.error("Error accessing camera: ", err);
                    alert("Could not access camera. Please ensure you have granted permission in your browser settings.");
                    onClose();
                });
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen, onClose, onScanSuccess]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Scan Utility Bill QR Code">
            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-8 border-white/30 rounded-lg m-8 ring-4 ring-black/20" />
            </div>
            <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-4">Point your camera at the QR code on a previous bill.</p>
        </Modal>
    );
};

export default QRCodeScannerModal;
