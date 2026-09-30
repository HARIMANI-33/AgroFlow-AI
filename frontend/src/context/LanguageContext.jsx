import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('agroflow_lang') || 'en';
  });

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'ta') {
      setLanguageState(lang);
      localStorage.setItem('agroflow_lang', lang);
    }
  };

  const t = (key) => {
    if (!translations[language]) return key;
    const value = translations[language][key];
    if (value !== undefined) return value;
    // Fallback to English
    return translations.en[key] !== undefined ? translations.en[key] : key;
  };

  const getCropName = (crop) => {
    if (!crop) return '';
    const localized = translations[language]?.cropNames?.[crop];
    return localized || crop;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getCropName, isTamil: language === 'ta' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
