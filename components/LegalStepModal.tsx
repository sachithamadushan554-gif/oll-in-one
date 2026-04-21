import React, { useRef, useState, useEffect, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { optimizeImage } from '../utils/imageOptimizer';
import { RotateCcw, RotateCw, Check, X, Camera } from 'lucide-react';

interface LegalStepModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: { idNumber: string; signature: string; idPhotoFront: string; idPhotoBack: string }) => void;
    customerName: string;
    totalAmount: number;
    installmentsCount: number;
    installmentAmount: number;
}

const LegalStepModal: React.FC<LegalStepModalProps> = ({ 
    isOpen, 
    onClose, 
    onComplete, 
    customerName,
    totalAmount,
    installmentsCount,
    installmentAmount
}) => {
    const [idNumber, setIdNumber] = useState('');
    const [signature, setSignature] = useState('');
    const [idPhotoFront, setIdPhotoFront] = useState('');
    const [idPhotoBack, setIdPhotoBack] = useState('');
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: ID Info, 2: Photos, 3: Signature
    const [isCropping, setIsCropping] = useState<'front' | 'back' | null>(null);
    const [tempImage, setTempImage] = useState('');
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const frontInputRef = useRef<HTMLInputElement>(null);
    const backInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (step === 3 && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        }
    }, [step]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            setSignature(canvasRef.current.toDataURL());
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const clearSignature = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setSignature('');
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const optimized = await optimizeImage(file);
                setTempImage(optimized);
                setIsCropping(side);
                setRotation(0);
            } catch (err) { console.error(err); }
        }
    };

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    if (!isOpen) return null;

    const processAndConfirmPhoto = async () => {
        if (!croppedAreaPixels || !tempImage) return;

        try {
            const img = new Image();
            img.src = tempImage;
            await new Promise((resolve) => { img.onload = resolve; });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Set canvas size to the cropped area size
            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;

            // Draw the cropped and rotated image
            // We need to account for rotation when drawing
            const radians = (rotation * Math.PI) / 180;
            
            // Create a temporary canvas to handle rotation
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            const isVertical = rotation % 180 !== 0;
            tempCanvas.width = isVertical ? img.height : img.width;
            tempCanvas.height = isVertical ? img.width : img.height;

            tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
            tempCtx.rotate(radians);
            tempCtx.drawImage(img, -img.width / 2, -img.height / 2);

            // Now draw the cropped area from the temp canvas to the final canvas
            ctx.drawImage(
                tempCanvas,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const processedImage = canvas.toDataURL('image/jpeg', 0.8);
            if (isCropping === 'front') setIdPhotoFront(processedImage);
            else if (isCropping === 'back') setIdPhotoBack(processedImage);
            
            setIsCropping(null);
            setTempImage('');
            setRotation(0);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        } catch (err) {
            console.error('Error processing image:', err);
            alert('ඡායාරූපය සැකසීමේදී දෝෂයක් ඇති විය. (Error processing image)');
        }
    };

    const handleFinish = () => {
        if (!idNumber || !signature || !idPhotoFront || !idPhotoBack) {
            alert('කරුණාකර සියලුම තොරතුරු සම්පූර්ණ කරන්න. (Please complete all information)');
            return;
        }
        onComplete({ idNumber, signature, idPhotoFront, idPhotoBack });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Legal Agreement</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Step {step} of 3</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => {
                                onComplete({ idNumber: '', signature: '', idPhotoFront: '', idPhotoBack: '' });
                            }}
                            className="px-4 py-2 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                        >
                            Skip Step
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scroll flex-1 space-y-6">
                    {isCropping ? (
                        <div className="space-y-6 animate-fade-in h-full flex flex-col">
                            <div className="text-center">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Adjust ID Photo</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Crop and rotate the image for clarity</p>
                            </div>
                            
                            <div className="relative flex-1 min-h-[300px] bg-slate-100 dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-indigo-600/20">
                                <Cropper
                                    image={tempImage}
                                    crop={crop}
                                    zoom={zoom}
                                    rotation={rotation}
                                    aspect={1.58 / 1}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    onRotationChange={setRotation}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Zoom</span>
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button 
                                        onClick={() => setRotation(prev => prev - 90)}
                                        className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                                        title="Rotate Left"
                                    >
                                        <RotateCcw size={20} />
                                        <span className="text-[10px] font-black uppercase">Left</span>
                                    </button>
                                    <button 
                                        onClick={() => setRotation(prev => prev + 90)}
                                        className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                                        title="Rotate Right"
                                    >
                                        <RotateCw size={20} />
                                        <span className="text-[10px] font-black uppercase">Right</span>
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => { setIsCropping(null); setTempImage(''); }}
                                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <X size={16} />
                                        Retake
                                    </button>
                                    <button 
                                        onClick={processAndConfirmPhoto}
                                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} />
                                        Confirm & Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Summary Card */}
                            <div className="p-5 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Customer</p>
                                            <p className="text-xl font-black">{customerName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Value</p>
                                            <p className="text-xl font-black">Rs. {totalAmount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                        <p className="text-[11px] font-bold uppercase tracking-widest">Plan: {installmentsCount} Months</p>
                                        <p className="text-[11px] font-bold uppercase tracking-widest">Monthly: Rs. {Math.round(installmentAmount).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {step === 1 && (
                                <div className="space-y-4 animate-fade-in-up">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">National ID Number (NIC)</label>
                                        <input 
                                            type="text" 
                                            value={idNumber}
                                            onChange={e => setIdNumber(e.target.value)}
                                            placeholder="Enter NIC Number..."
                                            className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-600/10 text-lg"
                                        />
                                    </div>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl">
                                        <p className="text-[10px] font-bold text-amber-600 uppercase leading-relaxed">
                                            මෙම වාරික ගෙවීමේ ගිවිසුම සඳහා පාරිභෝගිකයාගේ අනන්‍යතාවය තහවුරු කිරීම අනිවාර්ය වේ. කරුණාකර නිවැරදි හැඳුනුම්පත් අංකය ඇතුළත් කරන්න.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="grid grid-cols-1 gap-6 animate-fade-in-up">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ID Front Photo</label>
                                        <div 
                                            onClick={() => frontInputRef.current?.click()}
                                            className="aspect-[1.58/1] rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer hover:border-indigo-600 transition-all"
                                        >
                                            {idPhotoFront ? (
                                                <img src={idPhotoFront} className="w-full h-full object-cover" alt="ID Front" />
                                            ) : (
                                                <>
                                                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                                        <Camera className="w-8 h-8 text-indigo-600" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Capture Front Side</p>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" ref={frontInputRef} className="hidden" accept="image/*" capture="environment" onChange={e => handlePhotoUpload(e, 'front')} />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ID Back Photo</label>
                                        <div 
                                            onClick={() => backInputRef.current?.click()}
                                            className="aspect-[1.58/1] rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer hover:border-indigo-600 transition-all"
                                        >
                                            {idPhotoBack ? (
                                                <img src={idPhotoBack} className="w-full h-full object-cover" alt="ID Back" />
                                            ) : (
                                                <>
                                                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                                        <Camera className="w-8 h-8 text-indigo-600" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Capture Back Side</p>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" ref={backInputRef} className="hidden" accept="image/*" capture="environment" onChange={e => handlePhotoUpload(e, 'back')} />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4 animate-fade-in-up">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Signature</label>
                                        <button onClick={clearSignature} className="text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors">Clear</button>
                                    </div>
                                    <div className="bg-white rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 overflow-hidden touch-none shadow-inner">
                                        <canvas 
                                            ref={canvasRef}
                                            width={800}
                                            height={400}
                                            className="w-full h-64 cursor-crosshair"
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                            onTouchStart={startDrawing}
                                            onTouchMove={draw}
                                            onTouchEnd={stopDrawing}
                                        />
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-slate-400">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        <p className="text-[9px] font-bold uppercase tracking-widest italic">Sign inside the box above</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                {!isCropping && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                        {step > 1 && (
                            <button 
                                onClick={() => setStep((step - 1) as any)}
                                className="flex-1 py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                            >
                                Back
                            </button>
                        )}
                        {step < 3 ? (
                            <button 
                                onClick={() => {
                                    if (step === 1 && !idNumber) return alert('NIC අංකය ඇතුළත් කරන්න.');
                                    if (step === 2 && (!idPhotoFront || !idPhotoBack)) return alert('හැඳුනුම්පතේ ඡායාරූප ලබා ගන්න.');
                                    setStep((step + 1) as any);
                                }}
                                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20"
                            >
                                Next Step
                            </button>
                        ) : (
                            <button 
                                onClick={handleFinish}
                                className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-600/20"
                            >
                                Finish & Authorize
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LegalStepModal;
