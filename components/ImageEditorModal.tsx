import React, { useState, useRef, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    onSave: (newImageSrc: string) => void;
}

const ControlButton = ({ onClick, children, title }: { onClick: () => void, children?: React.ReactNode, title?: string }) => (
    <button 
        type="button" 
        onClick={onClick} 
        className="p-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 rounded-lg text-stone-700 dark:text-stone-200 transition-colors"
        title={title}
    >
        {children}
    </button>
);

const RangeControl = ({ label, value, onChange, min = 0, max = 200 }: { label: string, value: number, onChange: (val: number) => void, min?: number, max?: number }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>{label}</span>
            <span>{value}%</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer dark:bg-stone-700"
        />
    </div>
);

type ActiveTab = 'adjust' | 'id';

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, imageSrc, onSave }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<ActiveTab>('adjust');
    
    // Adjustments State
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [grayscale, setGrayscale] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // ID Photo State
    const [currentImageForId, setCurrentImageForId] = useState<string>(imageSrc);
    const [idScale, setIdScale] = useState(1);
    const [idPosition, setIdPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showFaceGuide, setShowFaceGuide] = useState(true);
    const [aspectRatio, setAspectRatio] = useState(1); // 1 = square (2x2), 0.77 = 35/45
    const idContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state when opening
            setRotation(0);
            setFlipH(false);
            setFlipV(false);
            setBrightness(100);
            setContrast(100);
            setSaturation(100);
            setGrayscale(0);
            setActiveTab('adjust');
            setCurrentImageForId(imageSrc);
            setIdScale(1);
            setIdPosition({ x: 0, y: 0 });
        }
    }, [isOpen, imageSrc]);

    // When switching tabs to ID, generate a temporary image with adjustments applied
    useEffect(() => {
        if (activeTab === 'id') {
            applyAdjustmentsToTempImage().then(url => {
                if (url) setCurrentImageForId(url);
                setIdScale(1);
                setIdPosition({ x: 0, y: 0 });
            });
        }
    }, [activeTab]);

    const applyAdjustmentsToTempImage = async (): Promise<string | null> => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const img = new Image();
        img.src = imageSrc;
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        // Calculate dimensions allowing for rotation
        const angleInRadians = (rotation * Math.PI) / 180;
        const absSin = Math.abs(Math.sin(angleInRadians));
        const absCos = Math.abs(Math.cos(angleInRadians));
        canvas.width = img.width * absCos + img.height * absSin;
        canvas.height = img.width * absSin + img.height * absCos;

        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%)`;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angleInRadians);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        return canvas.toDataURL('image/jpeg', 0.95);
    };

    const handleRotate = (direction: 'left' | 'right') => {
        setRotation(prev => (direction === 'left' ? prev - 90 : prev + 90));
    };

    const handleSave = async () => {
        setIsSaving(true);
        // If in ID mode, we are saving the crop
        // If in Adjust mode, we apply adjustments
        // Actually, we usually want to save adjustments.
        // If user is in ID tab, we assume they want to save the crop.
        
        const finalUrl = activeTab === 'id' ? await generateCroppedImage() : await applyAdjustmentsToTempImage();
        
        if (finalUrl) {
            onSave(finalUrl);
        }
        setIsSaving(false);
        onClose();
    };

    const generateCroppedImage = async (): Promise<string | null> => {
        // Draw the zoomed/panned image onto a canvas of the desired ratio
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx || !idContainerRef.current) return null;

        // Determine output resolution (high quality)
        const outputWidth = 600; 
        const outputHeight = outputWidth / aspectRatio;
        
        canvas.width = outputWidth;
        canvas.height = outputHeight;

        const img = new Image();
        img.src = currentImageForId;
        await new Promise((resolve) => img.onload = resolve);

        // Map visual position to canvas draw
        // Logic: 
        // Visual Container width/height relative to image aspect ratio
        // idScale 1 means image covers container (object-fit: cover logic)
        
        // Simpler logic for robust cropping without complex mapping:
        // We will calculate the source rectangle from the original image based on idScale and idPosition (offset percentages)
        
        // 1. Calculate image render size in the visual container to determine 'cover' fit
        // The container in UI is responsive, but let's map logic abstractly.
        // Let's assume the 'container' is the crop box.
        
        const imgRatio = img.width / img.height;
        const cropRatio = aspectRatio;
        
        let drawWidth, drawHeight;
        
        // "Cover" logic
        if (imgRatio > cropRatio) {
            drawHeight = outputHeight;
            drawWidth = drawHeight * imgRatio;
        } else {
            drawWidth = outputWidth;
            drawHeight = drawWidth / imgRatio;
        }
        
        // Apply zoom
        drawWidth *= idScale;
        drawHeight *= idScale;
        
        // Center alignment
        let dx = (outputWidth - drawWidth) / 2;
        let dy = (outputHeight - drawHeight) / 2;
        
        // Apply Pan
        dx += idPosition.x;
        dy += idPosition.y;
        
        // Background color (white)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, outputWidth, outputHeight);
        
        ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
        
        return canvas.toDataURL('image/jpeg', 0.95);
    };

    const handleReset = () => {
        if (activeTab === 'adjust') {
            setRotation(0);
            setFlipH(false);
            setFlipV(false);
            setBrightness(100);
            setContrast(100);
            setSaturation(100);
            setGrayscale(0);
        } else {
            setIdScale(1);
            setIdPosition({ x: 0, y: 0 });
        }
    };

    // --- ID Photo Interaction Handlers ---
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setDragStart({ x: clientX - idPosition.x, y: clientY - idPosition.y });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setIdPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    // --- Render Logic ---
    const transformStyle = {
        transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%)`,
        transition: 'transform 0.3s ease, filter 0.3s ease'
    };

    const idImageStyle = {
        transform: `translate(${idPosition.x}px, ${idPosition.y}px) scale(${idScale})`,
        cursor: isDragging ? 'grabbing' : 'grab',
        // Important: object-fit cover behavior simulated by transforms on an image that fits container naturally
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
        touchAction: 'none'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('editor_title')}>
            <div className="flex flex-col h-[85vh] md:h-[80vh]">
                {/* Tabs */}
                <div className="flex border-b border-stone-200 dark:border-stone-700 mb-4">
                    <button 
                        onClick={() => setActiveTab('adjust')} 
                        className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'adjust' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
                    >
                        {t('editor_tab_adjust')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('id')} 
                        className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'id' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
                    >
                        {t('editor_tab_id')}
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
                    {/* Preview Area */}
                    <div className="flex-1 bg-stone-900/5 dark:bg-black/40 rounded-xl overflow-hidden flex items-center justify-center border border-stone-200 dark:border-stone-700 relative min-h-[300px]">
                        {activeTab === 'adjust' ? (
                            <img 
                                src={imageSrc} 
                                alt="Preview" 
                                className="max-w-full max-h-full object-contain p-4"
                                style={transformStyle}
                            />
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-stone-100 dark:bg-stone-800"
                                 onMouseMove={handleMouseMove} onTouchMove={handleMouseMove}
                                 onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}
                                 onMouseLeave={handleMouseUp}
                            >
                                {/* Crop Frame Container */}
                                <div 
                                    ref={idContainerRef}
                                    style={{ 
                                        aspectRatio: `${aspectRatio}`,
                                        height: aspectRatio > 1 ? '70%' : 'auto',
                                        width: aspectRatio > 1 ? 'auto' : '70%',
                                        maxHeight: '90%',
                                        maxWidth: '90%',
                                    }}
                                    className="relative overflow-hidden bg-white shadow-2xl border-4 border-indigo-500/30"
                                >
                                    <div className="w-full h-full relative overflow-hidden" 
                                         onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}>
                                        <img 
                                            src={currentImageForId} 
                                            alt="ID Crop" 
                                            style={idImageStyle}
                                            draggable={false}
                                        />
                                    </div>
                                    
                                    {/* Face Guide Overlay */}
                                    {showFaceGuide && (
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                                            <svg viewBox="0 0 100 120" className="h-[80%] w-auto stroke-indigo-500 stroke-2 fill-none">
                                                <ellipse cx="50" cy="50" rx="30" ry="40" />
                                                <path d="M20 120 Q50 80 80 120" />
                                            </svg>
                                            <div className="absolute h-full w-[1px] bg-indigo-500/30"></div>
                                            <div className="absolute w-full h-[1px] bg-indigo-500/30 top-[40%]"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-4 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
                                    {t('editor_id_help')}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls Area */}
                    <div className="w-full md:w-64 space-y-6 overflow-y-auto pr-2 pb-2">
                        {activeTab === 'adjust' ? (
                            <>
                                {/* Transform Controls */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase text-stone-500 dark:text-stone-400 tracking-wider">Transform</p>
                                    <div className="flex gap-2">
                                        <ControlButton onClick={() => handleRotate('left')} title={t('editor_rotate_left')}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" transform="rotate(-45 10 10)"/></svg>
                                        </ControlButton>
                                        <ControlButton onClick={() => handleRotate('right')} title={t('editor_rotate_right')}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" transform="rotate(45 10 10)"/></svg>
                                        </ControlButton>
                                        <ControlButton onClick={() => setFlipH(!flipH)} title={t('editor_flip_h')}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" transform="rotate(90 10 10)"/></svg>
                                        </ControlButton>
                                        <ControlButton onClick={() => setFlipV(!flipV)} title={t('editor_flip_v')}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"/></svg>
                                        </ControlButton>
                                    </div>
                                </div>

                                {/* Adjustments */}
                                <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                                    <p className="text-xs font-semibold uppercase text-stone-500 dark:text-stone-400 tracking-wider">Adjustments</p>
                                    <RangeControl label={t('editor_brightness')} value={brightness} onChange={setBrightness} />
                                    <RangeControl label={t('editor_contrast')} value={contrast} onChange={setContrast} />
                                    <RangeControl label={t('editor_saturation')} value={saturation} onChange={setSaturation} />
                                    <RangeControl label={t('editor_grayscale')} value={grayscale} onChange={setGrayscale} max={100} />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                {/* ID Presets */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase text-stone-500 dark:text-stone-400 tracking-wider">Size Presets</p>
                                    
                                    {/* Sri Lanka Specific */}
                                    <div className="pb-2 mb-2 border-b border-stone-100 dark:border-stone-700/50">
                                        <p className="text-[10px] font-bold text-indigo-500 mb-1">Sri Lanka</p>
                                        <button onClick={() => setAspectRatio(35/45)} className={`w-full text-left px-3 py-2 rounded-lg text-sm border mb-1 ${Math.abs(aspectRatio - 35/45) < 0.01 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                                            {t('editor_id_preset_sl_nic')}
                                        </button>
                                        <button onClick={() => setAspectRatio(25/30)} className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${Math.abs(aspectRatio - 25/30) < 0.01 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                                            {t('editor_id_preset_sl_small')}
                                        </button>
                                    </div>

                                    {/* International */}
                                    <p className="text-[10px] font-bold text-stone-400 mb-1">International</p>
                                    <button onClick={() => setAspectRatio(1)} className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${aspectRatio === 1 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                                        {t('editor_id_preset_2x2')}
                                    </button>
                                    <button onClick={() => setAspectRatio(35/45)} className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${Math.abs(aspectRatio - 35/45) < 0.01 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                                        {t('editor_id_preset_35x45')}
                                    </button>
                                    <button onClick={() => setAspectRatio(40/60)} className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${Math.abs(aspectRatio - 40/60) < 0.01 ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                                        {t('editor_id_preset_40x60')}
                                    </button>
                                </div>

                                {/* Zoom Control */}
                                <div className="space-y-2 pt-4 border-t border-stone-200 dark:border-stone-700">
                                    <p className="text-xs font-semibold uppercase text-stone-500 dark:text-stone-400 tracking-wider">{t('editor_id_zoom')}</p>
                                    <input 
                                        type="range" 
                                        min={100} 
                                        max={300} 
                                        value={idScale * 100} 
                                        onChange={(e) => setIdScale(parseInt(e.target.value) / 100)}
                                        className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer dark:bg-stone-700"
                                    />
                                </div>

                                {/* Options */}
                                <div className="space-y-2 pt-4 border-t border-stone-200 dark:border-stone-700">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={showFaceGuide} 
                                            onChange={(e) => setShowFaceGuide(e.target.checked)} 
                                            className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-stone-700 dark:text-stone-300">{t('editor_id_guide')}</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-6 border-t border-stone-200 dark:border-stone-700 flex flex-col gap-3">
                            <button 
                                onClick={handleReset} 
                                className="w-full py-2 text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                            >
                                {t('editor_reset')}
                            </button>
                            <div className="flex gap-3">
                                <button 
                                    onClick={onClose} 
                                    className="flex-1 py-2 px-4 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 text-sm font-medium"
                                >
                                    {t('editor_cancel')}
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isSaving ? 'Saving...' : activeTab === 'id' ? t('editor_id_apply') : t('editor_save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ImageEditorModal;