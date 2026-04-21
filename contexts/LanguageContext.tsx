
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import type { Language } from '../types';

const en = {
  "nav_dashboard": "Dashboard",
  "nav_new_invoice": "New Bill",
  "nav_all_invoices": "History",
  "nav_products": "Stock",
  "nav_tasks": "Tasks",
  "nav_blacklist": "Blacklist",
  "nav_photo_print": "Photo Studio",
  "nav_settings": "Settings",
  "nav_customers": "Customers",
  "nav_reports": "Reports",
  "nav_stock_manager": "Stock Manager",

  "dashboard_title": "Command Center",
  "msg_reminder_template": "Hello {0}, reminder from {1}. Your installment of Rs. {2} is due on {3}. Thanks!",
  "msg_warning_template": "URGENT: {0}, your payment of Rs. {1} for Bill #{2} is OVERDUE since {3}. Contact {4} immediately.",
  "msg_debt_warning": "DEBT ALERT: Outstanding balance is Rs. {0}. Proceed with caution.",
  
  "blacklist_title": "Customer Blacklist",
  "blacklist_subtitle": "Registry of delinquent accounts and security risks.",
  "blacklist_add_btn": "Flag Customer",
  "blacklist_search_placeholder": "Search registry...",
  "blacklist_btn_confirm": "Confirm Entry",
  "blacklist_remove_title": "Remove Flag",

  "settings_title": "System Engine",
  "settings_subtitle": "Core application configuration.",
  "nav_calendar": "Calendar",
  "nav_recurring": "Recurring Bills",
  "nav_faq": "Help & FAQ",
  "faq_title": "Help Center",
  "faq_subtitle": "Find answers to common questions.",
  "recurring_title": "Recurring Billing Center",
  "recurring_subtitle": "Manage automated billing cycles.",
  "recurring_add_btn": "Create Cycle",
  "recurring_frequency": "Frequency",
  "recurring_next_date": "Next Generation",
  "recurring_status": "Status",
  "recurring_generate_now": "Process Due Cycles",
  "recurring_no_cycles": "No recurring cycles defined.",
  "recurring_daily": "Daily",
  "recurring_weekly": "Weekly",
  "recurring_monthly": "Monthly",
  "recurring_yearly": "Yearly",
  "calendar_title": "Installment Calendar",
  "calendar_subtitle": "Payment Schedule",
  "calendar_due_count": "{0} Installments Due",
  "calendar_no_payments": "No payments due on this day"
};

const si = {
  "nav_dashboard": "Dashboard",
  "nav_new_invoice": "New Bill",
  "nav_all_invoices": "History",
  "nav_products": "Stock",
  "nav_tasks": "Tasks",
  "nav_blacklist": "Blacklist",
  "nav_photo_print": "Photo Studio",
  "nav_settings": "Settings",
  "nav_customers": "ගනුදෙනුකරුවන්",
  "nav_reports": "වාර්තා",
  "nav_stock_manager": "තොග පාලනය",

  "dashboard_title": "Operations Console",
  "msg_reminder_template": "ආයුබෝවන් {0}, {1} වෙතින් කරන සිහිපත් කිරීමකි. ඔබගේ රු. {2} ක වාරිකය {3} දිනට ගෙවිය යුතුව ඇත. ස්තූතියි!",
  "msg_warning_template": "හදිසි දැනුම්දීමයි: {0}, අංක {2} බිල්පත සඳහා රු. {1} ක ගෙවීම {3} දින සිට ප්‍රමාද වී ඇත. වහාම {4} අමතන්න.",
  "msg_debt_warning": "ණය අවවාදයයි: මෙම පාරිභෝගිකයා රු. {0} ක හිඟ මුදලක් ගෙවීමට ඇත.",
  "msg_final_warning_whatsapp": "🚨 *LEGAL RECOVERY NOTICE* 🚨\n\nDear {0},\n\nOur records indicate a delinquent balance of *Rs. {2}* for Bill #{1}. / අංක #{1} බිල්පත සඳහා ඔබ ගෙවිය යුතු රු. {2} ක හිඟ මුදල පියවීමට වහාම කටයුතු කරන්න.\n\nමෙම පණිවිඩය ලැබී පැය 24ක් ඇතූලත මුදල පියවීමට කටයුතු නොකරන්නේ නම්, පොලිස් මූලස්ථානය සහ {3} ආයතනය මගින් නීතිමය ක්‍රියාමාර්ග ගනු ලැබේ.",

  "blacklist_title": "Blacklist Registry",
  "blacklist_subtitle": "ගෙවීම් පැහැර හරින සහ අනාරක්ෂිත ගනුදෙනුකරුවන්ගේ ලේඛනය.",
  "blacklist_add_btn": "Add to Blacklist",
  "blacklist_search_placeholder": "සොයන්න...",
  "blacklist_btn_confirm": "Confirm Entry",
  "blacklist_remove_title": "Remove Flag",
  "blacklist_remove_message": "{0} ගනුදෙනුකරුවාව ඉවත් කිරීමට අවශ්‍ය බව සහතිකද?",

  "settings_title": "System Settings",
  "settings_subtitle": "පද්ධතියේ මූලික සැකසුම් මෙතැනින් සකසන්න.",
  "nav_calendar": "දින දර්ශනය",
  "nav_recurring": "වාරික බිල්පත්",
  "nav_faq": "උදව් (FAQ)",
  "faq_title": "උදව් මධ්‍යස්ථානය",
  "faq_subtitle": "පද්ධතිය භාවිතා කරන ආකාරය මෙතැනින් දැනගන්න.",
  "recurring_title": "වාරික බිල්පත් මධ්‍යස්ථානය",
  "recurring_subtitle": "ස්වයංක්‍රීය බිල්පත් චක්‍ර කළමනාකරණය කරන්න.",
  "recurring_add_btn": "නව චක්‍රයක් සාදන්න",
  "recurring_frequency": "වාර ගණන",
  "recurring_next_date": "ඊළඟ බිල්පත",
  "recurring_status": "තත්ත්වය",
  "recurring_generate_now": "හිඟ බිල්පත් සකසන්න",
  "recurring_no_cycles": "වාරික බිල්පත් කිසිවක් නොමැත.",
  "recurring_daily": "දිනපතා",
  "recurring_weekly": "සතිපතා",
  "recurring_monthly": "මාසිකව",
  "recurring_yearly": "වාර්ෂිකව",
  "calendar_title": "වාරික දින දර්ශනය",
  "calendar_subtitle": "ගෙවීම් කාලසටහන",
  "calendar_due_count": "වාරික {0} ක් ඇත",
  "calendar_no_payments": "මෙම දිනයේ ගෙවිය යුතු වාරික නොමැත"
};

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, ...args: any[]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = { en, si };

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = (localStorage.getItem('language') as Language);
        return (saved && translations[saved]) ? saved : 'en';
    });

    useEffect(() => {
        if (language === 'si') document.body.classList.add('lang-si');
        else document.body.classList.remove('lang-si');
        localStorage.setItem('language', language);
    }, [language]);

    const t = useCallback((key: string, ...args: any[]): string => {
        const currentTranslations = translations[language];
        let translation = currentTranslations[key] || translations['en'][key] || key;
        if (args.length > 0) {
            args.forEach((arg, index) => {
                translation = translation.replace(`{${index}}`, arg);
            });
        }
        return translation;
    }, [language]);

    const contextValue = useMemo(() => ({
        language,
        setLanguage,
        t
    }), [language, setLanguage, t]);

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) throw new Error('useLanguage must be used within a LanguageProvider');
    return context;
};
