"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "@/lib/i18n/translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [locale, setLocale] = useState("en");

    // Load language preference from local storage on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem("appLanguage");
        if (savedLanguage && translations[savedLanguage]) {
            setLocale(savedLanguage);
        }
    }, []);

    const changeLanguage = (newLocale) => {
        if (translations[newLocale]) {
            setLocale(newLocale);
            localStorage.setItem("appLanguage", newLocale);
        }
    };

    const t = (key) => {
        return translations[locale][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
