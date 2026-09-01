"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CurrencyContextType {
  hideBalances: boolean;
  toggleHideBalances: () => void;
  formatRupiah: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [hideBalances, setHideBalances] = useState(false);

  // Persist preference in localStorage
  useEffect(() => {
    const savedPref = localStorage.getItem("hideBalances");
    if (savedPref) {
      setHideBalances(savedPref === "true");
    }
  }, []);

  const toggleHideBalances = () => {
    setHideBalances((prev) => {
      const newValue = !prev;
      localStorage.setItem("hideBalances", String(newValue));
      return newValue;
    });
  };

  const formatRupiah = (value: number) => {
    if (hideBalances) {
      return "Rp •••••••";
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <CurrencyContext.Provider
      value={{ hideBalances, toggleHideBalances, formatRupiah }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
