
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronDown, ChevronUp, HelpCircle, Book, Shield, Database, Smartphone, Clock } from 'lucide-react';

interface FAQItemProps {
    question: string;
    answer: React.ReactNode;
    icon: React.ReactNode;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, icon }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-5 flex items-center justify-between text-left gap-4"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        {icon}
                    </div>
                    <span className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm md:text-base">
                        {question}
                    </span>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            {isOpen && (
                <div className="px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="pl-14 text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                        {answer}
                    </div>
                </div>
            )}
        </div>
    );
};

const FAQView: React.FC = () => {
    const { t, language } = useLanguage();

    const faqData = [
        {
            icon: <Book className="w-5 h-5" />,
            question: language === 'si' ? "අලුත් බිල් එකක් (New Bill) හදන්නේ කොහොමද?" : "How to create a new bill?",
            answer: language === 'si' ? (
                <div className="space-y-2">
                    <p>1. <b>"New Bill"</b> ටැබ් එකට යන්න.</p>
                    <p>2. පාරිභෝගිකයාගේ නම සහ දුරකථන අංකය ඇතුළත් කරන්න.</p>
                    <p>3. භාණ්ඩ (Products) තෝරා ප්‍රමාණය (Quantity) ඇතුළත් කරන්න.</p>
                    <p>4. <b>"Full Payment"</b> හෝ <b>"Installment"</b> (වාරික) ක්‍රමය තෝරන්න.</p>
                    <p>5. අවසානයේ <b>"Save & Print"</b> බොත්තම ඔබන්න.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p>1. Go to the <b>"New Bill"</b> tab.</p>
                    <p>2. Enter the customer's name and phone number.</p>
                    <p>3. Select products and enter the quantity.</p>
                    <p>4. Choose <b>"Full Payment"</b> or <b>"Installment"</b> mode.</p>
                    <p>5. Finally, click the <b>"Save & Print"</b> button.</p>
                </div>
            )
        },
        {
            icon: <Clock className="w-5 h-5" />,
            question: language === 'si' ? "වාරික ගෙවීම් (Installments) කළමනාකරණය කරන්නේ කොහොමද?" : "How to manage installments?",
            answer: language === 'si' ? (
                <div className="space-y-2">
                    <p>1. <b>"History"</b> (Invoices) ටැබ් එකට යන්න.</p>
                    <p>2. අදාළ බිල්පත සොයාගෙන එය මත ක්ලික් කරන්න.</p>
                    <p>3. එහි ඇති <b>"Installments"</b> කොටසේ ගෙවිය යුතු වාරික පෙන්වනු ඇත.</p>
                    <p>4. ගෙවීමක් කළ පසු <b>"Record Payment"</b> බොත්තම ඔබා තොරතුරු ඇතුළත් කරන්න.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p>1. Go to the <b>"History"</b> (Invoices) tab.</p>
                    <p>2. Find the relevant invoice and click on it.</p>
                    <p>3. The <b>"Installments"</b> section will show due payments.</p>
                    <p>4. After a payment is made, click <b>"Record Payment"</b> and enter details.</p>
                </div>
            )
        },
        {
            icon: <Smartphone className="w-5 h-5" />,
            question: language === 'si' ? "භාණ්ඩ (Products) ඇතුළත් කරන්නේ කොහොමද?" : "How to add products?",
            answer: language === 'si' ? (
                <div className="space-y-2">
                    <p>1. <b>"Stock Manager"</b> ටැබ් එකට යන්න.</p>
                    <p>2. <b>"Add New Product"</b> බොත්තම ඔබන්න.</p>
                    <p>3. භාණ්ඩයේ නම, මිල සහ දැනට ඇති ප්‍රමාණය (Stock) ඇතුළත් කර Save කරන්න.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p>1. Go to the <b>"Stock Manager"</b> tab.</p>
                    <p>2. Click the <b>"Add New Product"</b> button.</p>
                    <p>3. Enter the product name, price, and current stock, then click Save.</p>
                </div>
            )
        },
        {
            icon: <Shield className="w-5 h-5" />,
            question: language === 'si' ? "Blacklist එක පාවිච්චි කරන්නේ ඇයි?" : "Why use the Blacklist?",
            answer: language === 'si' ? (
                <p>ගෙවීම් පැහැර හරින හෝ ගැටලුකාරී පාරිභෝගිකයන් Blacklist එකට ඇතුළත් කළ හැක. එවිට ඔවුන්ට අලුතින් බිල්පත් සෑදීමේදී පද්ධතිය විසින් ඔබට අනතුරු ඇඟවීමක් (Warning) ලබා දෙනු ඇත.</p>
            ) : (
                <p>You can add customers who default on payments or are problematic to the Blacklist. The system will then give you a warning when trying to create a new bill for them.</p>
            )
        },
        {
            icon: <Database className="w-5 h-5" />,
            question: language === 'si' ? "මගේ Data ආරක්ෂිතද? Backup කරන්නේ කොහොමද?" : "Is my data safe? How to backup?",
            answer: language === 'si' ? (
                <div className="space-y-2">
                    <p>ඔබේ සියලුම දත්ත Cloud එකේ ආරක්ෂිතව ගබඩා වේ. අතින් Backup එකක් ලබා ගැනීමට අවශ්‍ය නම්:</p>
                    <p>1. <b>"Settings"</b> වෙත යන්න.</p>
                    <p>2. <b>"Google Drive Backup"</b> හෝ <b>"Export Data"</b> භාවිතා කරන්න.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p>All your data is securely stored in the Cloud. If you want to take a manual backup:</p>
                    <p>1. Go to <b>"Settings"</b>.</p>
                    <p>2. Use <b>"Google Drive Backup"</b> or <b>"Export Data"</b>.</p>
                </div>
            )
        },
        {
            icon: <HelpCircle className="w-5 h-5" />,
            question: language === 'si' ? "Recurring Billing කියන්නේ මොකක්ද?" : "What is Recurring Billing?",
            answer: language === 'si' ? (
                <p>සෑම මසකම හෝ සතියකම එකම මුදලක් අය කරන සේවාවන් (උදා: නඩත්තු ගාස්තු) සඳහා මෙය භාවිතා වේ. මෙහිදී පද්ධතිය විසින් ස්වයංක්‍රීයව නියමිත දිනයේදී බිල්පත සකස් කරනු ලබයි.</p>
            ) : (
                <p>This is used for services that charge the same amount every month or week (e.g., maintenance fees). The system automatically generates the bill on the scheduled date.</p>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white uppercase">
                    {t('faq_title')}
                </h1>
                <p className="text-slate-500 text-sm font-medium">
                    {t('faq_subtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {faqData.map((item, index) => (
                    <FAQItem 
                        key={index}
                        icon={item.icon}
                        question={item.question}
                        answer={item.answer}
                    />
                ))}
            </div>

            <div className="mt-12 p-8 bg-indigo-600 rounded-[2.5rem] text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="relative z-10">
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-2">
                        {language === 'si' ? "තවත් උදව් අවශ්‍යද?" : "Need More Help?"}
                    </h3>
                    <p className="text-indigo-100 text-sm font-medium max-w-md">
                        {language === 'si' 
                            ? "ඔබට කිසියම් ගැටලුවක් ඇත්නම් අපගේ සහාය කණ්ඩායම හා සම්බන්ධ වන්න. අපි ඔබට උදව් කිරීමට සැමවිටම සූදානම්." 
                            : "If you have any issues, please contact our support team. We are always ready to help you."}
                    </p>
                    <button className="mt-6 px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                        {language === 'si' ? "සහාය ලබාගන්න" : "Contact Support"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FAQView;
