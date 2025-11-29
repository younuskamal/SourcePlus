
import { useState, useEffect, useCallback } from 'react';
import { translations, Language } from '../locales';

// Event bus for language changes to sync across components instantly
const languageChangeTarget = new EventTarget();

export const useTranslation = () => {
    // Initialize from localStorage or default to 'en'
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('sp_language');
        return (saved === 'ar' || saved === 'en') ? saved : 'en';
    });

    // Function to change language
    const changeLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('sp_language', lang);

        // Update document direction
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;

        // Dispatch event for other hooks
        languageChangeTarget.dispatchEvent(new CustomEvent('language-change', { detail: lang }));
    }, []);

    // Listen for external language changes (e.g. from another component)
    useEffect(() => {
        const handler = (e: Event) => {
            const customEvent = e as CustomEvent<Language>;
            setLanguageState(customEvent.detail);
        };
        languageChangeTarget.addEventListener('language-change', handler);
        return () => languageChangeTarget.removeEventListener('language-change', handler);
    }, []);

    // Ensure direction is correct on mount
    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    // Translation function with nested key support (e.g., 'login.title')
    const t = useCallback((key: string, params?: Record<string, string>) => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k as keyof typeof value];
            } else {
                return key; // Return key if not found
            }
        }

        if (typeof value !== 'string') return key;

        // Replace parameters like {{name}}
        if (params) {
            return Object.entries(params).reduce((acc, [key, val]) => {
                return acc.replace(new RegExp(`{{${key}}}`, 'g'), val);
            }, value);
        }

        return value;
    }, [language]);

    return { t, i18n: { language, changeLanguage } };
};
