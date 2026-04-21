import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Modal from './Modal';

interface AnalyzeItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyAnalysis: (analysis: { model: string; price: number; imei: string }) => void;
}

const Spinner: React.FC = () => (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
        <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);


export const AnalyzeItemModal: React.FC<AnalyzeItemModalProps> = ({ isOpen, onClose, onApplyAnalysis }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{ productName: string; price: number; imei: string; fullText: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const cleanupCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const setupCamera = useCallback(async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera: ", err);
            setError("Could not access camera. Please ensure you have granted permission in your browser settings.");
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setupCamera();
        } else {
            cleanupCamera();
            setCapturedImage(null);
            setAnalysisResult(null);
            setIsLoading(false);
            setError(null);
        }
        return () => cleanupCamera();
    }, [isOpen, setupCamera, cleanupCamera]);

    const handleTakePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedImage(dataUrl);
            cleanupCamera();
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setAnalysisResult(null);
        setupCamera();
    };

    const handleAnalyze = async () => {
        if (!capturedImage) return;

        setIsLoading(true);
        setAnalysisResult(null);
        setError(null);
        
        try {
            // FIX: Initializing Gemini API using the recommended GoogleGenAI class with apiKey from environment variables.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const base64Data = capturedImage.split(',')[1];
            const imagePart = {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data,
                },
            };
            const textPart = {
                text: 'Analyze this image of a product, like a mobile phone or its box. Extract only the product name, its price, and its IMEI number if they are visible in the image. If a piece of information is not available, return an empty string or 0 for the price.'
            };
            
            const responseSchema = {
              type: Type.OBJECT,
              properties: {
                productName: {
                  type: Type.STRING,
                  description: "The name of the product (e.g., iPhone 15 Pro). If not found, return an empty string."
                },
                price: {
                  type: Type.NUMBER,
                  description: "The price of the product in Rupees, if visible. If not found, return 0."
                },
                imei: {
                  type: Type.STRING,
                  description: "The IMEI number of the product. If not found, return an empty string."
                }
              },
              required: ["productName", "price", "imei"]
            };

            // FIX: Using 'gemini-3-flash-preview' for basic analysis/OCR tasks as per model selection guidelines.
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                },
            });

            // FIX: Accessing response content directly via .text property as per guidelines (not a function call).
            const jsonStr = response.text?.trim() || '{}';
            const parsedResult = JSON.parse(jsonStr);

            let fullTextParts = [];
            if (parsedResult.productName) fullTextParts.push(`Product Name: ${parsedResult.productName}`);
            if (parsedResult.price > 0) fullTextParts.push(`Price: Rs. ${parsedResult.price.toFixed(2)}`);
            if (parsedResult.imei) fullTextParts.push(`IMEI: ${parsedResult.imei}`);

            setAnalysisResult({ 
                productName: parsedResult.productName || '',
                price: parsedResult.price || 0,
                imei: parsedResult.imei || '',
                fullText: fullTextParts.length > 0 ? fullTextParts.join('\n') : "No details could be extracted."
            });

        } catch (err) {
            console.error("Error analyzing image:", err);
            setError("Sorry, I couldn't analyze the image. Please check your API key or try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = () => {
        if (analysisResult) {
            onApplyAnalysis({ model: analysisResult.productName, price: analysisResult.price, imei: analysisResult.imei });
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Analyze Item with AI">
            <div className="space-y-4">
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    {error && <p className="text-center text-rose-400 p-4">{error}</p>}
                    {!capturedImage && !error && (
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    )}
                    {capturedImage && (
                        <img src={capturedImage} alt="Captured item" className="w-full h-full object-contain" />
                    )}
                    {isLoading && <Spinner />}
                </div>
                
                <div className="flex justify-center items-center gap-4">
                    {!capturedImage ? (
                        <button onClick={handleTakePhoto} disabled={!!error} className="w-full px-5 py-2 text-base font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all disabled:bg-stone-400 disabled:shadow-none">
                            Take Photo
                        </button>
                    ) : (
                        <>
                            <button onClick={handleRetake} disabled={isLoading} className="w-full px-5 py-2 text-base font-semibold rounded-xl text-stone-700 bg-stone-200 hover:bg-stone-300 dark:text-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 transition-colors disabled:opacity-50">
                                Retake
                            </button>
                             <button onClick={handleAnalyze} disabled={isLoading} className="w-full px-5 py-2 text-base font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md transition-all disabled:opacity-50">
                                Analyze
                            </button>
                        </>
                    )}
                </div>

                {analysisResult && (
                    <div className="mt-4 p-4 bg-stone-100 dark:bg-stone-800 rounded-lg border dark:border-stone-700 animate-fade-in">
                        <h4 className="font-bold text-stone-800 dark:text-stone-100 mb-2">Analysis Result:</h4>
                        <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap">{analysisResult.fullText}</p>
                        <div className="mt-4 pt-3 border-t border-stone-300 dark:border-stone-700 flex justify-end">
                            <button onClick={handleApply} className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700">
                                Use this Data
                            </button>
                        </div>
                    </div>
                )}
                 {error && !isLoading && (
                    <div className="mt-4 p-4 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-rose-700 dark:text-rose-300 text-sm">
                        {error}
                    </div>
                 )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </Modal>
    );
};