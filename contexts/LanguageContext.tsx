"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Language, getDefaultLanguage, setLanguage as saveLanguage, getTranslation } from "@/lib/i18n";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const lang = getDefaultLanguage();
    setLanguageState(lang);
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    saveLanguage(lang);
  }, []);

  const t = useCallback(
    (key: string) => {
      return getTranslation(language, key);
    },
    [language]
  );

  // Don't render children until we've loaded the language from localStorage
  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
