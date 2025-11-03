'use client';

import React from 'react';
import { useTransactions } from '@/app/context/TransactionContext';
import { useSettings } from '@/app/context/SettingsContext';

export default function Reports() {
  const { transactions } = useTransactions();
  const { currency } = useSettings();

  const weeklyData = transactions.reduce((acc, tx) => {
    const date = new Date(tx.date);
    const week = `${date.getFullYear()}-W${String(Math.floor((date.getDate() + date.getDay()) / 7) + 1).padStart(2, '0')}`;
    if (!acc[week]) acc[week] = { income: 0, expenses: 0 };
    if (tx.transaction_type === 'income') {
      acc[week].income += tx.amount;
    } else {
      acc[week].expenses += Math.abs(tx.amount);
    }
    return acc;
  }, {} as Record<string, { income: number; expenses: number }>);

  const monthlyData = transactions.reduce((acc, tx) => {
    const month = tx.date.slice(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = { income: 0, expenses: 0 };
    if (tx.transaction_type === 'income') {
      acc[month].income += tx.amount;
    } else {
      acc[month].expenses += Math.abs(tx.amount);
    }
    return acc;
  }, {} as Record<string, { income: number; expenses: number }>);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-[var(--foreground)]">Reports</h1>
      <p className="text-[var(--foreground)] mb-4">
        Total Transactions: {transactions.length}
      </p>
      <h2 className="text-2xl font-semibold mb-4 text-[var(--foreground)]">Monthly Reports</h2>
      {Object.keys(monthlyData).length === 0 ? (
        <p className="text-[var(--foreground)]">No transactions available</p>
      ) : (
        <ul className="space-y-2">
          {Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => (
              <li key={month} className="text-[var(--foreground)]">
                {month}: Income {currency}
                {data.income.toFixed(2)}, Expenses {currency}
                {data.expenses.toFixed(2)}
              </li>
            ))}
        </ul>
      )}
      <h2 className="text-2xl font-semibold mb-4 mt-6 text-[var(--foreground)]">Weekly Reports</h2>
      {Object.keys(weeklyData).length === 0 ? (
        <p className="text-[var(--foreground)]">No transactions available</p>
      ) : (
        <ul className="space-y-2">
          {Object.entries(weeklyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([week, data]) => (
              <li key={week} className="text-[var(--foreground)]">
                {week}: Income {currency}
                {data.income.toFixed(2)}, Expenses {currency}
                {data.expenses.toFixed(2)}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}