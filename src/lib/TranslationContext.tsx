"use client";

import React, { createContext, useContext } from "react";

type TranslationDictionary = any; // We'll keep it flexible

interface TranslationContextProps {
  t: TranslationDictionary;
  language: string;
}

const TranslationContext = createContext<TranslationContextProps | undefined>(
  undefined,
);

export function TranslationProvider({
  children,
  dictionary,
  language,
}: {
  children: React.ReactNode;
  dictionary: TranslationDictionary;
  language: string;
}) {
  return (
    <TranslationContext.Provider value={{ t: dictionary, language }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
