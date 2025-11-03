'use client';

import React, { useState, useEffect } from 'react';
import { Transaction } from '@/types/Transaction';
import { useTransactions } from '@/app/context/TransactionContext';
import { useSettings } from '@/app/context/SettingsContext';
import { useTranslation } from 'react-i18next';

const formatDate = (date: string, dateFormat: 'dd/mm/yyyy' | 'yyyy-mm-dd'): string => {
  const [day, month, year] = date.split('.');
  if (dateFormat === 'yyyy-mm-dd') {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return `${day}/${month}/${year}`;
};

// Convert dd.mm.yyyy to yyyy-mm-dd for sorting
const parseDateForSorting = (date: string): string => {
  const [day, month, year] = date.split('.');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Convert display format (dd/mm/yyyy or yyyy-mm-dd) to yyyy-mm-dd for dateRange
const convertToYYYYMMDD = (date: string, dateFormat: 'dd/mm/yyyy' | 'yyyy-mm-dd'): string => {
  if (!date) return '';
  if (dateFormat === 'yyyy-mm-dd' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return date;
  } else if (dateFormat === 'dd/mm/yyyy' && date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [day, month, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return '';
};

type Props = {
  transactions: Transaction[];
  setEditingTransaction: React.Dispatch<React.SetStateAction<Transaction | null>>;
  dateRange: { start: string; end: string };
  setDateRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
  setThisMonth: () => void;
  setToday: () => void;
};

const TransactionList = ({
  transactions,
  setEditingTransaction,
  dateRange,
  setDateRange,
  setThisMonth: setThisMonthProp,
  setToday: setTodayProp,
}: Props) => {
  const { t } = useTranslation();
  const { deleteTransaction } = useTransactions();
  const { dateFormat, currency } = useSettings();
  const [startInput, setStartInput] = useState<string>(
    dateFormat === 'dd/mm/yyyy' && dateRange.start
      ? formatDate(dateRange.start.split('-').reverse().join('.'), dateFormat)
      : dateRange.start
  );
  const [endInput, setEndInput] = useState<string>(
    dateFormat === 'dd/mm/yyyy' && dateRange.end
      ? formatDate(dateRange.end.split('-').reverse().join('.'), dateFormat)
      : dateRange.end
  );
  const [monthOffset, setMonthOffset] = useState<number>(0);

  // Calculate initial monthOffset based on current dateRange
  useEffect(() => {
    if (dateRange.start) {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      const [year, month] = dateRange.start.split('-').map(Number);
      const offset = (currentYear - year) * 12 + (currentMonth - month);
      setMonthOffset(offset);
    }
  }, [dateRange.start]);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      const formattedStart = formatDate(
        dateRange.start.split('-').reverse().join('.'),
        dateFormat
      );
      const formattedEnd = formatDate(
        dateRange.end.split('-').reverse().join('.'),
        dateFormat
      );
      setStartInput(formattedStart);
      setEndInput(formattedEnd);
    }
  }, [dateRange.start, dateRange.end, dateFormat]);

  // Wrap setThisMonth to reset monthOffset
  const setThisMonth = () => {
    setMonthOffset(0);
    setThisMonthProp();
  };

  // Wrap setToday to reset monthOffset
  const setToday = () => {
    setMonthOffset(0);
    setTodayProp();
  };

  // Format date input as user types
  const formatDateInput = (value: string, dateFormat: 'dd/mm/yyyy' | 'yyyy-mm-dd'): string => {
    const separator = dateFormat === 'yyyy-mm-dd' ? '-' : '/';
    const regex = dateFormat === 'yyyy-mm-dd'
      ? /^(\d{0,4})(?:-(\d{0,2}))?(?:-(\d{0,2}))?$/
      : /^(\d{0,2})(?:\/(\d{0,2}))?(?:\/(\d{0,4}))?$/;
    const match = value.replace(/[^0-9/-]/g, '').match(regex);
    if (!match) return '';

    const [, rawField1, rawField2, rawField3] = match ?? [];

    // Change 'let' to 'const' (no re-assignment)
    const f1 = rawField1?.slice(0, dateFormat === 'yyyy-mm-dd' ? 4 : 2) ?? '';
    const f2 = rawField2?.slice(0, 2) ?? '';
    const f3 = rawField3?.slice(0, dateFormat === 'yyyy-mm-dd' ? 2 : 4) ?? '';

    // Build formatted string
    let formatted = f1 || '';
    if (f1.length === (dateFormat === 'yyyy-mm-dd' ? 4 : 2) && f2 !== undefined) {
      formatted += separator + (f2 || '');
    }
    if (f2.length === 2 && f3 !== undefined) {
      formatted += separator + (f3 || '');
    }

    return formatted;
  };

  // Handle date input changes
  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'start' | 'end'
  ) => {
    const formatted = formatDateInput(e.target.value, dateFormat);
    if (field === 'start') {
      setStartInput(formatted);
      const converted = convertToYYYYMMDD(formatted, dateFormat);
      if (converted) {
        setDateRange((prev) => ({ ...prev, start: converted }));
        setMonthOffset(0);
      }
    } else {
      setEndInput(formatted);
      const converted = convertToYYYYMMDD(formatted, dateFormat);
      if (converted) {
        setDateRange((prev) => ({ ...prev, end: converted }));
        setMonthOffset(0);
      }
    }
  };

  // Set date range to previous month based on offset
  const setPreviousMonth = () => {
    const maxOffset = 1200;
    if (monthOffset >= maxOffset) return;

    const today = new Date();
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - (monthOffset + 1), 1);

    const start = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const end = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-${String(
      new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate()
    ).padStart(2, '0')}`;
    setDateRange({ start, end });
    // Update input fields to reflect the new date range in the correct format
    setStartInput(formatDate(`01.${String(prevMonth.getMonth() + 1).padStart(2, '0')}.${prevMonth.getFullYear()}`, dateFormat));
    setEndInput(formatDate(`${String(new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate()).padStart(2, '0')}.${String(prevMonth.getMonth() + 1).padStart(2, '0')}.${prevMonth.getFullYear()}`, dateFormat));
    setMonthOffset((prev) => prev + 1);
  };

  // Set date range to next month based on offset
  const setNextMonth = () => {
    const minOffset = -1200;
    if (monthOffset <= minOffset) return;

    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() - (monthOffset - 1), 1);

    const start = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const end = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(
      new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()
    ).padStart(2, '0')}`;

    setDateRange({ start, end });
    // Update input fields
    setStartInput(formatDate(`01.${String(nextMonth.getMonth() + 1).padStart(2, '0')}.${nextMonth.getFullYear()}`, dateFormat));
    setEndInput(formatDate(`${String(new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()).padStart(2, '0')}.${String(nextMonth.getMonth() + 1).padStart(2, '0')}.${nextMonth.getFullYear()}`, dateFormat));
  
    setMonthOffset((prev) => prev - 1);
  };

  // Sort transactions by date in descending order
  const sortedTransactions = transactions.slice().sort((a, b) => {
    const dateA = parseDateForSorting(a.date);
    const dateB = parseDateForSorting(b.date);
    return dateB.localeCompare(dateA);
  });

  const incomeTransactions = sortedTransactions.filter((tx) => tx.transaction_type === 'income');
  const expenseTransactions = sortedTransactions.filter((tx) => tx.transaction_type === 'expense');

  const handleDelete = async (id: number) => {
    if (confirm(t('transaction_list.delete_confirm'))) {
      try {
        await deleteTransaction(id);
      } catch (err) {
        console.error('Failed to delete transaction:', err);
      }
    }
  };

  return (
    <div className="mt-[-0.5rem]">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-[1rem] gap-2">
        <h2 className="text-xl font-semibold">{t('transaction_list.title')}</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder={t(`transaction_list.start_date_placeholder_${dateFormat.replace(/\//g, '_')}`)}
            value={startInput}
            onChange={(e) => handleDateChange(e, 'start')}
            className="border rounded px-2 py-1 text-white"
            aria-label={t('transaction_list.start_date_label')}
            maxLength={10}
          />
          <input
            type="text"
            placeholder={t(`transaction_list.end_date_placeholder_${dateFormat.replace(/\//g, '_')}`)}
            value={endInput}
            onChange={(e) => handleDateChange(e, 'end')}
            className="border rounded px-2 py-1 text-white"
            aria-label={t('transaction_list.end_date_label')}
            maxLength={10}
          />
          <button
            onClick={setPreviousMonth}
            className="bg-slate-700 text-white px-3 py-1 rounded hover:bg-yellow-600"
            disabled={monthOffset >= 1200}
          >
            {t('transaction_list.previous_month')}
          </button>
          <button
            onClick={setNextMonth}
            className="bg-slate-700 text-white px-3 py-1 rounded hover:bg-yellow-600"
            disabled={monthOffset <= -1200}
          >
            {t('transaction_list.next_month') || 'Nächster Monat'}
          </button>
          <button
            onClick={setThisMonth}
            className="bg-slate-700 text-white px-3 py-1 rounded hover:bg-yellow-600"
          >
            {t('transaction_list.this_month')}
          </button>
          <button
            onClick={setToday}
            className="bg-slate-700 text-white px-3 py-1 rounded hover:bg-yellow-600"
          >
            {t('transaction_list.today')}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h3 className="text-lg font-medium income-text mb-2">{t('transaction_list.income')}</h3>
          {incomeTransactions.length > 0 ? (
            <ul className="space-y-2">
              {incomeTransactions.map((tx) => (
                <li
                  key={tx.id ?? `${tx.date}-${tx.description}`}
                  className="flex justify-between items-center"
                >
                  <span>
                    {tx.description} - <span className="text-orange-400">{formatDate(tx.date, dateFormat)}</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="income-text">{currency}{Math.abs(tx.amount).toFixed(2)}</span>
                    <button
                      onClick={() => setEditingTransaction(tx)}
                      className="bg-slate-700 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                      aria-label={t('transaction_list.edit_aria_label', { description: tx.description })}
                    >
                      {t('transaction_list.edit')}
                    </button>
                    <button
                      onClick={() => tx.id && handleDelete(tx.id)}
                      className="bg-red-800 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                      aria-label={t('transaction_list.delete_aria_label', { description: tx.description })}
                    >
                      {t('transaction_list.delete')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">{t('transaction_list.no_income_transactions')}</p>
          )}
        </div>
        <div className="border rounded p-4">
          <h3 className="text-lg font-medium expense-text mb-2">{t('transaction_list.expenses')}</h3>
          {expenseTransactions.length > 0 ? (
            <ul className="space-y-2">
              {expenseTransactions.map((tx) => (
                <li
                  key={tx.id ?? `${tx.date}-${tx.description}`}
                  className="flex justify-between items-center"
                >
                  <span>
                    {tx.description} - <span className="text-orange-400">{formatDate(tx.date, dateFormat)}</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="expense-text">-{currency}{Math.abs(tx.amount).toFixed(2)}</span>
                    <button
                      onClick={() => setEditingTransaction(tx)}
                      className="bg-slate-700 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                      aria-label={t('transaction_list.edit_aria_label', { description: tx.description })}
                    >
                      {t('transaction_list.edit')}
                    </button>
                    <button
                      onClick={() => tx.id && handleDelete(tx.id)}
                      className="bg-red-800 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                      aria-label={t('transaction_list.delete_aria_label', { description: tx.description })}
                    >
                      {t('transaction_list.delete')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">{t('transaction_list.no_expense_transactions')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionList;