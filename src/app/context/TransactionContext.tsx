'use client';

import { invoke } from '@tauri-apps/api/core';
import { Transaction } from '@/types/Transaction';
import React, { createContext, useContext, useState, useEffect } from 'react';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  getDays: () => Promise<string[]>;
  getInstallDate: () => Promise<string>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    console.log('Environment check:', {
      isTauri,
      windowExists: typeof window !== 'undefined',
      tauriAvailable: typeof window !== 'undefined' && window.__TAURI__,
      tauriApis: window.__TAURI__ ? Object.keys(window.__TAURI__) : null,
      tauriVersion: window.__TAURI__?.version ?? 'undefined',
      location: window.location.href,
      userAgent: navigator.userAgent,
      isWebview: navigator.userAgent.includes('Webview') || navigator.userAgent.includes('Tauri'),
    });
    if (isTauri) {
      invoke<Transaction[]>('get_transactions')
        .then((txs) => {
          console.log('Fetched transactions:', txs);
          setTransactions(txs);
        })
        .catch((err) => console.error('Failed to fetch transactions:', err));
    } else {
      console.warn('Running in browser, using mock data');
      setTransactions([]);
    }
  }, []);

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    if (!isTauri) {
      console.warn('Tauri not available, skipping addTransaction');
      return;
    }
    try {
      console.log('Adding transaction:', tx);
      await invoke('add_transaction', { transaction: tx });
      const txs = await invoke<Transaction[]>('get_transactions');
      console.log('Updated transactions:', txs);
      setTransactions(txs);
    } catch (err) {
      console.error('Failed to add transaction:', err);
      throw err;
    }
  };

  const updateTransaction = async (tx: Transaction) => {
    if (!isTauri) {
      console.warn('Tauri not available, skipping updateTransaction');
      return;
    }
    try {
      await invoke('update_transaction', { transaction: tx });
      const txs = await invoke<Transaction[]>('get_transactions');
      setTransactions(txs);
    } catch (err) {
      console.error('Failed to update transaction:', err);
      throw err;
    }
  };

  const deleteTransaction = async (id: number) => {
    if (!isTauri) {
      console.warn('Tauri not available, skipping deleteTransaction');
      return;
    }
    try {
      await invoke('delete_transaction', { id });
      const txs = await invoke<Transaction[]>('get_transactions');
      setTransactions(txs);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      throw err;
    }
  };

  const getDays = async (): Promise<string[]> => {
    if (!isTauri) {
      console.warn('Tauri not available, returning empty days');
      return [];
    }
    try {
      const days = await invoke<{ date: string }[]>('get_days');
      return days.map((day) => day.date);
    } catch (err) {
      console.error('Failed to get days:', err);
      throw err;
    }
  };

  const getInstallDate = async (): Promise<string> => {
    if (!isTauri) {
      console.warn('Tauri not available, returning default install date');
      return '01.01.1900';
    }
    try {
      return await invoke<string>('get_install_date');
    } catch (err) {
      console.error('Failed to get install date:', err);
      throw err;
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getDays,
        getInstallDate,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};