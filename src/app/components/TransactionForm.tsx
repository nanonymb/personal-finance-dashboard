'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types/Transaction';
import { useTransactions } from '@/app/context/TransactionContext';
import { useSettings } from '@/app/context/SettingsContext';
import { useTranslation } from 'react-i18next';

const TransactionForm = ({
  editingTransaction,
  setEditingTransaction,
}: {
  editingTransaction: Transaction | null;
  setEditingTransaction: React.Dispatch<React.SetStateAction<Transaction | null>>;
}) => {
  const { t } = useTranslation();
  const { addTransaction, updateTransaction, getInstallDate } = useTransactions();
  const { dateFormat } = useSettings();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [transaction_type, setTransactionType] = useState<'income' | 'expense'>('income');
  const [date, setDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [installDate, setInstallDate] = useState<string | null>(null);
  const [isLoadingInstallDate, setIsLoadingInstallDate] = useState(true);

  // Convert dd.mm.yyyy to the selected display format (dd/mm/yyyy or yyyy-mm-dd)
  const convertToDisplayFormat = useCallback((date: string): string => {
    if (!date.includes('.')) return date;
    const [day, month, year] = date.split('.');
    if (dateFormat === 'yyyy-mm-dd') {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return `${day}/${month}/${year}`;
  }, [dateFormat]);

  // Convert display format (dd/mm/yyyy or yyyy-mm-dd) to dd.mm.yyyy for storage
  const convertToStorageFormat = useCallback((date: string): string => {
    if (dateFormat === 'yyyy-mm-dd' && date.includes('-')) {
      const [year, month, day] = date.split('-');
      return `${day}.${month}.${year}`;
    } else if (dateFormat === 'dd/mm/yyyy' && date.includes('/')) {
      const [day, month, year] = date.split('/');
      return `${day}.${month}.${year}`;
    }
    return date;
  }, [dateFormat]);

  // Validate date format based on dateFormat
  const validateDate = (date: string): boolean => {
    if (dateFormat === 'yyyy-mm-dd') {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(date)) return false;
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return (
        dateObj.getFullYear() === year &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getDate() === day &&
        year >= 1800 &&
        year <= 2100
      );
    } else {
      const regex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!regex.test(date)) return false;
      const [day, month, year] = date.split('/').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return (
        dateObj.getFullYear() === year &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getDate() === day &&
        year >= 1800 &&
        year <= 2100
      );
    }
  };

  // Format date input as user types
  const formatDateInput = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 8) return date;

    if (dateFormat === 'yyyy-mm-dd') {
      let formatted = '';
      for (let i = 0; i < digits.length; i++) {
        if (i === 4 || i === 6) formatted += '-';
        formatted += digits[i];
      }
      // Ensure valid ranges as typing
      if (digits.length >= 4) {
        const year = parseInt(digits.slice(0, 4), 10);
        if (year < 1800 || year > 2100) return date;
      }
      if (digits.length >= 6) {
        const month = parseInt(digits.slice(4, 6), 10);
        if (month < 1 || month > 12) return date;
      }
      if (digits.length === 8) {
        const day = parseInt(digits.slice(6, 8), 10);
        if (day < 1 || day > 31) return date;
      }
      return formatted;
    } else {
      let formatted = '';
      for (let i = 0; i < digits.length; i++) {
        if (i === 2 || i === 4) formatted += '/';
        formatted += digits[i];
      }
      // Ensure valid ranges as typing
      if (digits.length >= 2) {
        const day = parseInt(digits.slice(0, 2), 10);
        if (day < 1 || day > 31) return date;
      }
      if (digits.length >= 4) {
        const month = parseInt(digits.slice(2, 4), 10);
        if (month < 1 || month > 12) return date;
      }
      if (digits.length >= 8) {
        const year = parseInt(digits.slice(4, 8), 10);
        if (year < 1800 || year > 2100) return date;
      }
      return formatted;
    }
  };

  // Handle date input changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setDate(formatted);
  };

  // Fetch install date on mount
  useEffect(() => {
    setIsLoadingInstallDate(true);
    getInstallDate()
      .then((date) => setInstallDate(date))
      .catch(() => { 
        setError(t('transaction_form.error_install_date'));
      })
      .finally(() => setIsLoadingInstallDate(false));
  }, [getInstallDate, t]);

  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description);
      setAmount(Math.abs(editingTransaction.amount).toString());
      setTransactionType(editingTransaction.transaction_type);
      setDate(convertToDisplayFormat(editingTransaction.date));
      setError(null);
    } else {
      setDescription('');
      setAmount('');
      setTransactionType('income');
      setDate('');
      setError(null);
    }
  }, [editingTransaction, convertToDisplayFormat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) {
      setError(t('transaction_form.error_required'));
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t('transaction_form.error_amount'));
      return;
    }
    if (!validateDate(date)) {
      setError(t('transaction_form.error_date', { format: t(`transaction_list.start_date_placeholder_${dateFormat.replace(/[-/]/g, '_')}`) }));
      return;
    }

    const year = parseInt(
      dateFormat === 'yyyy-mm-dd' ? date.split('-')[0] : date.split('/')[2],
      10
    );
    const minYear = installDate
      ? new Date(installDate.split('.').reverse().join('-')).getFullYear() - 100
      : 1800;
    if (year < minYear || year > 2100) {
      setError(t('transaction_form.error_year', { minYear, maxYear: 2100 }));
      return;
    }

    const transaction = {
      description,
      amount: transaction_type === 'income' ? parsedAmount : -parsedAmount,
      transaction_type,
      date: convertToStorageFormat(date),
    };

    try {
      if (editingTransaction) {
        await updateTransaction({ ...transaction, id: editingTransaction.id! });
        setEditingTransaction(null);
      } else {
        await addTransaction(transaction);
      }
      setDescription('');
      setAmount('');
      setTransactionType('income');
      setDate('');
      setError(null);
    } catch {
      setError(t('transaction_form.error_save'));
    }
  };

  const handleCancel = () => {
    setEditingTransaction(null);
    setDescription('');
    setAmount('');
    setTransactionType('income');
    setDate('');
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-[0rem]">
      <h2 className="text-xl font-semibold mb-[0.5rem] mt-[-0.4rem]">
        {editingTransaction ? t('transaction_form.edit_transaction') : t('transaction_form.add_transaction')}
      </h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('transaction_form.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 w-full h-10"
            required
          />
        </div>
        <div className="flex-1">
          <input
            type="number"
            placeholder={t('transaction_form.amount')}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border p-2 w-full h-10"
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>
      <div className="flex space-x-4">
        <div className="flex-1">
          {isLoadingInstallDate ? (
            <div className="border p-2 w-full h-10 flex items-center justify-center">
              <span className="text-gray-400">{t('transaction_form.loading_date')}</span>
            </div>
          ) : (
            <input
              type="text"
              placeholder={t(`transaction_list.start_date_placeholder_${dateFormat.replace(/[-/]/g, '_')}`)}
              value={date}
              onChange={handleDateChange}
              className="border p-2 w-full h-10"
              pattern={
                dateFormat === 'yyyy-mm-dd'
                  ? '\\d{4}-\\d{2}-\\d{2}'
                  : '\\d{2}/\\d{2}/\\d{4}'
              }
              title={t('transaction_form.date_title', { format: t(`transaction_list.start_date_placeholder_${dateFormat.replace(/[-/]/g, '_')}`) })}
              maxLength={10}
              required
            />
          )}
        </div>
        <div className="flex-1">
          <select
            value={transaction_type}
            onChange={(e) => setTransactionType(e.target.value as 'income' | 'expense')}
            className="border p-2 w-full h-10"
          >
            <option value="income">{t('transaction_form.income')}</option>
            <option value="expense">{t('transaction_form.expense')}</option>
          </select>
        </div>
      </div>
      <div className="flex space-x-4">
        <button
          type="submit"
          className="bg-[rgba(82,120,155,0.7)] text-white p-2 rounded flex-1 hover:bg-[rgba(59,106,151,0.7)]"
        >
          {editingTransaction ? t('transaction_form.update') : t('transaction_form.submit')}
        </button>
        {editingTransaction && (
          <button
            type="button"
            onClick={handleCancel}
            className="bg-[rgba(152,157,161,0.7)] text-white hover:bg-[rgba(83,94,100,0.7)] p-2 rounded flex-1"
          >
            {t('transaction_form.cancel')}
          </button>
        )}
      </div>
    </form>
  );
};

export default TransactionForm;