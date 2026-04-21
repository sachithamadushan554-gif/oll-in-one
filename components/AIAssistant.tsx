import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import type { Invoice, Product, BlacklistedCustomer } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Headset, MessageCircle, X, Zap, Send } from 'lucide-react';

interface AIAssistantProps {
    invoices: Invoice[];
    products: Product[];
    blacklist: BlacklistedCustomer[];
    onRecordPayment: (invoiceId: string, installmentNumber: number, actualAmount: number, paymentDate: string, paymentNote: string, nextDueDate?: string) => void;
    onNavigate: (tab: any) => void;
}

interface Message {
    role: 'user' | 'model' | 'system';
    text: string;
    timestamp: Date;
    action?: {
        type: 'payment';
        data: any;
    };
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ invoices, products, blacklist, onRecordPayment, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: "System Support Hub active. How can I help you today?", timestamp: new Date() }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // System Instructions to help the AI understand its context
    const systemInstruction = `You are the MW Billing Assistant. You manage a mobile shop's ledger in Sri Lanka.
    Current System State Summary:
    - Total Invoices: ${invoices.length}
    - Total Products in Catalog: ${products.length}
    - Blacklisted Entities: ${blacklist.length}
    
    You have tools to search data and record payments. If a user wants to pay, find their invoice first.
    Always be extremely concise. If asked about arrears, list the top 3 critical ones.
    Be polite and professional.`;

    // Define tools for Gemini to interact with the system
    const tools: { functionDeclarations: FunctionDeclaration[] }[] = [{
        functionDeclarations: [
            {
                name: 'search_customer_status',
                description: 'Searches for a customer by name or phone and returns their current debt status and invoice IDs.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        searchTerm: { type: Type.STRING, description: 'Name or partial phone number' }
                    },
                    required: ['searchTerm']
                }
            },
            {
                name: 'record_installment_payment',
                description: 'Prepares a payment record for a specific invoice installment.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        invoiceId: { type: Type.STRING },
                        installmentNumber: { type: Type.NUMBER },
                        amount: { type: Type.NUMBER },
                        customerName: { type: Type.STRING }
                    },
                    required: ['invoiceId', 'installmentNumber', 'amount', 'customerName']
                }
            },
            {
                name: 'get_inventory_alert',
                description: 'Identifies low stock items and popular products.',
                parameters: { type: Type.OBJECT, properties: {} }
            }
        ]
    }];

    const handleSend = async () => {
        if (!query.trim()) return;
        
        const userMsg: Message = { role: 'user', text: query, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setIsTyping(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Prepare context by sending a summary of relevant invoices to the model
            // For a small shop, we can send simplified data objects
            const simplifiedInvoices = invoices.map(inv => ({
                id: inv.id,
                name: inv.customer.name,
                phone: inv.customer.phone,
                balance: inv.balance,
                status: inv.status,
                nextDue: inv.installments.find(i => !i.paid)?.dueDate
            })).slice(0, 50); // Limit to latest 50 for efficiency

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    { role: 'user', parts: [{ text: `System Context: ${JSON.stringify({ invoices: simplifiedInvoices, products: products.slice(0,20) })}` }] },
                    ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
                    { role: 'user', parts: [{ text: query }] }
                ],
                config: {
                    systemInstruction,
                    tools,
                }
            });

            const functionCalls = response.functionCalls;
            
            if (functionCalls && functionCalls.length > 0) {
                for (const fc of functionCalls) {
                    if (fc.name === 'search_customer_status') {
                        const term = (fc.args as any).searchTerm.toLowerCase();
                        const found = invoices.filter(inv => 
                            inv.customer.name.toLowerCase().includes(term) || 
                            inv.customer.phone.includes(term)
                        );
                        
                        let reply = "";
                        if (found.length === 0) reply = "I couldn't find any active records matching that name.";
                        else {
                            reply = `I found ${found.length} record(s):\n` + found.map(f => `• ${f.customer.name}: Rs. ${Math.round(f.balance).toLocaleString()} outstanding (ID: ${f.id.substring(0,8)})`).join('\n');
                        }
                        setMessages(prev => [...prev, { role: 'model', text: reply, timestamp: new Date() }]);
                    }
                    
                    if (fc.name === 'record_installment_payment') {
                        const args = fc.args as any;
                        const actionMsg: Message = { 
                            role: 'model', 
                            text: `I've prepared a payment record for ${args.customerName}. Ready to authenticate?`, 
                            timestamp: new Date(),
                            action: {
                                type: 'payment',
                                data: args
                            }
                        };
                        setMessages(prev => [...prev, actionMsg]);
                    }

                    if (fc.name === 'get_inventory_alert') {
                        const low = products.filter(p => p.stock < 5);
                        let reply = low.length > 0 
                            ? `Attention: ${low.length} items are running low, including ${low[0].name}.` 
                            : "Inventory levels are healthy across the catalog.";
                        setMessages(prev => [...prev, { role: 'model', text: reply, timestamp: new Date() }]);
                    }
                }
            } else {
                setMessages(prev => [...prev, { role: 'model', text: response.text || "I'm processing that request...", timestamp: new Date() }]);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'model', text: "Connection to Intelligence Hub lost. Please check your network.", timestamp: new Date() }]);
        } finally {
            setIsTyping(false);
        }
    };

    const confirmPaymentAction = (data: any) => {
        onRecordPayment(data.invoiceId, data.installmentNumber, data.amount, new Date().toISOString().split('T')[0], `AI Verified Payment`);
        setMessages(prev => [...prev, { role: 'model', text: `✅ Payment of Rs. ${data.amount} recorded successfully for ${data.customerName}.`, timestamp: new Date() }]);
    };

    return (
        <>
            {/* Floating FAB */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed right-6 bottom-24 lg:bottom-10 z-[100] w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${isOpen ? 'bg-rose-500 rotate-90' : 'bg-indigo-600'}`}
            >
                {isOpen ? (
                    <X className="w-8 h-8 text-white" />
                ) : (
                    <div className="relative">
                        <Headset className="w-8 h-8 text-white" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-300"></span></span>
                    </div>
                )}
            </button>

            {/* AI Panel */}
            <div className={`fixed right-0 top-0 bottom-0 z-[90] w-full md:w-[450px] bg-slate-50/80 dark:bg-slate-950/90 backdrop-blur-3xl border-l border-slate-200 dark:border-slate-800 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-8 pb-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Support Engine</p>
                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-full animate-pulse">24/7 SUPPORT</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">SYSTEM SUPPORT</h2>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
                    </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                            <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-sm ${
                                m.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-sm'
                            }`}>
                                <p className="whitespace-pre-wrap font-medium">{m.text}</p>
                                {m.action?.type === 'payment' && (
                                    <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Authorized Amt</span>
                                            <span className="font-black text-slate-800 dark:text-white">Rs. {m.action.data.amount.toLocaleString()}</span>
                                        </div>
                                        <button 
                                            onClick={() => confirmPaymentAction(m.action?.data)}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95"
                                        >
                                            Confirm Receipt
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] rounded-tl-sm border border-slate-200 dark:border-slate-800">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay:'0ms'}} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay:'150ms'}} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay:'300ms'}} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 pb-10 space-y-4">
                    <a 
                        href="https://wa.me/94783614915" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 group"
                    >
                        <MessageCircle className="w-5 h-5 group-hover:animate-bounce" />
                        WhatsApp Support
                    </a>

                    <div className="relative group">
                        <input 
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything about your business..."
                            className="w-full pl-6 pr-14 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 dark:text-white font-medium transition-all"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!query.trim() || isTyping}
                            className="absolute right-2 top-2 bottom-2 w-12 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center transition-all hover:bg-indigo-700 active:scale-90 disabled:opacity-30"
                        >
                            <Send className="w-5 h-5" strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
