"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { LanguageCode } from "@/lib/languages";

type LanguageState = { language: LanguageCode; setLanguage: (code: LanguageCode) => void };

// Defaults to English, so a component outside the provider still works.
const LanguageContext = createContext<LanguageState>({ language: "en", setLanguage: () => {} });

// Holds the header's language choice so the analyser and follow-up can send it
// with each request. React state only: nothing is stored.
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>("en");
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
