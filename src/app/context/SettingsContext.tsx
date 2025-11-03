'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

interface SettingsContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  dateFormat: 'dd/mm/yyyy' | 'yyyy-mm-dd';
  setDateFormat: (dateFormat: 'dd/mm/yyyy' | 'yyyy-mm-dd') => void;
  dateRange: { start: string; end: string };
  setDateRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
  language: string;
  setLanguage: (language: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>('€');
  const [dateFormat, setDateFormat] = useState<'dd/mm/yyyy' | 'yyyy-mm-dd'>('dd/mm/yyyy');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const today = new Date();
    const start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const end = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    ).padStart(2, '0')}`;
    return { start, end };
  });
  const [language, setLanguageState] = useState<string>('en');

  // Fetch currency and language from backend on mount
  useEffect(() => {
    if (isTauri) {
      invoke<string>('get_currency')
        .then((savedCurrency) => {
          console.log('Fetched currency:', savedCurrency);
          setCurrencyState(savedCurrency);
        })
        .catch((err) => {
          console.error('Failed to fetch currency:', err);
          setCurrencyState('€');
        });
      invoke<string>('get_language')
        .then((savedLanguage) => {
          console.log('Fetched language:', savedLanguage);
          setLanguageState(savedLanguage);
        })
        .catch((err) => {
          console.error('Failed to fetch language:', err);
          setLanguageState('en');
        });
    }
  }, []);

  // Update currency in backend when it changes
  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    if (isTauri) {
      invoke('set_currency', { currency: newCurrency })
        .then(() => console.log('Currency saved:', newCurrency))
        .catch((err) => console.error('Failed to save currency:', err));
    }
  };

  // Update language in backend when it changes
  const setLanguage = (newLanguage: string) => {
    setLanguageState(newLanguage);
    if (isTauri) {
      invoke('set_language', { language: newLanguage })
        .then(() => console.log('Language saved:', newLanguage))
        .catch((err) => console.error('Failed to save language:', err));
    }
  };

  return (
    <SettingsContext.Provider
      value={{ currency, setCurrency, dateFormat, setDateFormat, dateRange, setDateRange, language, setLanguage }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};