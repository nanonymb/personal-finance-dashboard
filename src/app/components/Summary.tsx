'use client';

import React from 'react';
import { Transaction } from '@/types/Transaction';
import { useSettings } from '@/app/context/SettingsContext';
import { useTranslation } from 'react-i18next';

interface Props {
  transactions: Transaction[];
}

const Summary = ({ transactions }: Props) => {
  const { t } = useTranslation();
  const { currency } = useSettings();

  const income = React.useMemo(
    () =>
      transactions
        .filter((t) => t.transaction_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const expenses = React.useMemo(
    () =>
      transactions
        .filter((t) => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [transactions]
  );
  const balance = income - expenses;

  return (
    <div className="mt-[-0.5rem] mb-[-0.2rem]">
      <h2 className="text-xl font-semibold mb-[0.3rem]">{t('summary.title')}</h2>
      <p>
        <strong>{t('summary.income')}:</strong>{' '}
        <span className="income-text">
          {currency}
          {income.toFixed(2)}
        </span>
      </p>
      <p>
        <strong>{t('summary.expenses')}:</strong>{' '}
        <span className="expense-text">
          {currency}
          {expenses.toFixed(2)}
        </span>
      </p>
      <p>
        <strong>{t('summary.balance')}:</strong>{' '}
        <span className="balance-text">
          {currency}
          {balance.toFixed(2)}
        </span>
      </p>
    </div>
  );
};

export default Summary;