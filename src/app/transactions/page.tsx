'use client';

import React, { useState } from 'react';
import TransactionForm from '@/app/components/TransactionForm';
import Summary from '@/app/components/Summary';
import Chart from '@/app/components/Chart';
import TransactionList from '@/app/components/TransactionList';
import { useTransactions } from '@/app/context/TransactionContext';
import { useSettings } from '@/app/context/SettingsContext';
import { Transaction } from '@/types/Transaction';

const Page = () => {
  const { transactions } = useTransactions();
  const { dateRange, setDateRange } = useSettings();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Convert dd.mm.yyyy to yyyy-mm-dd for comparison
  const convertToYYYYMMDD = (date: string): string => {
    if (date.includes('.')) {
      const [day, month, year] = date.split('.');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return date;
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!dateRange.start || !dateRange.end) return true;
    const txDate = convertToYYYYMMDD(tx.date);
    return txDate >= dateRange.start && txDate <= dateRange.end;
  });

  const setThisMonth = () => {
    const today = new Date();
    const start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const end = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    ).padStart(2, '0')}`;
    setDateRange({ start, end });
  };

  const setToday = () => {
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
    setDateRange({ start: date, end: date });
  };

  return (
    <div className="container mx-auto p-[1.4rem]">
      <header>
        <h1 className="text-2xl font-bold mt-[-1.7rem] mb-[0.6rem]">Personal Finance Dashboard</h1>
      </header>
      <div className="card-bg shadow-custom-card p-[1rem] rounded-[0.5rem] mb-[1rem]">
        <TransactionForm
          editingTransaction={editingTransaction}
          setEditingTransaction={setEditingTransaction}
        />
      </div>
      <div className="card-bg shadow-custom-card p-[1rem] rounded-[0.5rem] mb-[1rem]">
        <Summary transactions={filteredTransactions} />
      </div>
      <div className="card-bg shadow-custom-card p-[1rem] rounded-[0.5rem] mb-[1rem]">
        <Chart transactions={filteredTransactions} />
      </div>
      <div className="card-bg shadow-custom-card p-[1rem] rounded-[0.5rem]">
        <TransactionList
          setEditingTransaction={setEditingTransaction}
          transactions={filteredTransactions}
          dateRange={dateRange}
          setDateRange={setDateRange}
          setThisMonth={setThisMonth}
          setToday={setToday}
        />
      </div>
    </div>
  );
};

export default Page;