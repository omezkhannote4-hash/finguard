"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { translate, type TranslationKey } from "@/lib/i18n";
import type { LanguageCode } from "@/lib/languages";

type LanguageState = { language: LanguageCode; setLanguage: (code: LanguageCode) => void };

// Defaults to English, so a component outside the provider still works.
const LanguageContext = createContext<LanguageState>({ language: "en", setLanguage: () => {} });

// Holds the header's language choice for the whole interface. React state only:
// nothing is stored.
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>("en");

  // Lets screen readers and browsers know which language the page is in.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

// Returns t(key, vars): the interface text in the chosen language.
export function useT() {
  const { language } = useLanguage();
  return useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language],
  );
}
