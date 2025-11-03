'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  TooltipProps,
} from 'recharts';
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction } from '@/types/Transaction';
import { useSettings } from '@/app/context/SettingsContext';
import { useTranslation } from 'react-i18next';



type CustomTickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
  dataMap: Record<string, { income: number; expenses: number; incomeDescriptions: string[]; expenseDescriptions: string[] }>;
};

const TimeDisplay: React.FC = () => {
  const { t } = useTranslation();
  const { dateFormat } = useSettings();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentTime) {
    return <p className="text-sm text-gray-400">{t('chart.loading_time')}</p>;
  }

  const formatCurrentTime = (date: Date): string => {
    if (dateFormat === 'yyyy-mm-dd') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${date.toLocaleTimeString()}`;
    }
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${date.toLocaleTimeString()}`;
  };

  return (
    <p className="text-sm">
      {t('chart.current_date_time')}:{' '}
      <span className="text-green-500 text-shadow-lg">{formatCurrentTime(currentTime).split(' ')[0]}</span>,{' '}
      <span className="text-amber-600 text-shadow-lg">{formatCurrentTime(currentTime).split(' ')[1]}</span>
    </p>
  );
};

const formatDate = (date: string, dateFormat: 'dd/mm/yyyy' | 'yyyy-mm-dd'): string => {
  const [day, month, year] = date.split('.');
  if (dateFormat === 'yyyy-mm-dd') {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return `${day}/${month}/${year}`;
};

const Chart = ({ transactions }: { transactions: Transaction[] }) => {
  const { t } = useTranslation();
  const { currency, dateFormat } = useSettings();

  const dataMap = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (!acc[tx.date]) {
        acc[tx.date] = { income: 0, expenses: 0, incomeDescriptions: [], expenseDescriptions: [] };
      }
      if (tx.transaction_type === 'income') {
        acc[tx.date].income += tx.amount;
        acc[tx.date].incomeDescriptions.push(tx.description);
      } else {
        acc[tx.date].expenses += Math.abs(tx.amount);
        acc[tx.date].expenseDescriptions.push(tx.description);
      }
      return acc;
    }, {} as Record<string, { income: number; expenses: number; incomeDescriptions: string[]; expenseDescriptions: string[] }>);
  }, [transactions]);

  const data = useMemo(() => {
    return Object.keys(dataMap)
      .map((date) => ({
        date,
        income: dataMap[date].income,
        expenses: dataMap[date].expenses,
        incomeDescriptions: dataMap[date].incomeDescriptions,
        expenseDescriptions: dataMap[date].expenseDescriptions,
      }))
      .sort((a, b) => {
        const [aDay, aMonth, aYear] = a.date.split('.').map(Number);
        const [bDay, bMonth, bYear] = b.date.split('.').map(Number);
        return new Date(aYear, aMonth - 1, aDay).getTime() - new Date(bYear, bMonth - 1, bDay).getTime();
      });
  }, [dataMap]);

  if (data.length === 0) {
    return (
      <div className="h-[18.75rem] mt-[-0.5rem]" aria-label={t('chart.title')}>
        <h2 className="text-white">{t('chart.title')}</h2>
        <TimeDisplay />
        <p className="text-gray-400">{t('chart.no_transactions')}</p>
      </div>
    );
  }

  const CustomTick: React.FC<CustomTickProps> = ({ x, y, payload, dataMap }) => {
    if (!payload || !payload.value || x === undefined || y === undefined) return null;
  
    const date = payload.value;
    const entry = dataMap[date];
  
    let fillColor = '#ffffff';
    if (entry.income > 0 && entry.expenses === 0) {
      fillColor = '#00cc00';
    } else if (entry.expenses > 0 && entry.income === 0) {
      fillColor = '#ff0000';
    }
  
    // Detect last for offset (using the sorted data from scope)
    const isLast = date === data[data.length - 1]?.date;
    const anchor = 'middle';
    const dx = isLast ? -5 : 0;
  
    return (
      <text x={x} y={y} dx={dx} dy={11} fill={fillColor} textAnchor={anchor} fontSize="0.80rem">
        {formatDate(date, dateFormat)}
      </text>
    );
  };

  const formatYAxis = (value: number) => {
    if (value >= 1_000_000_000_000_000_000_000) {
      return `${(value / 1_000_000_000_000_000_000_000).toFixed(1)}E21`;
    } else if (value >= 1_000_000_000_000_000_000) {
      return `${(value / 1_000_000_000_000_000_000).toFixed(1)}Qi`;
    } else if (value >= 1_000_000_000_000_000) {
      return `${(value / 1_000_000_000_000_000).toFixed(1)}Q`;
    } else if (value >= 1_000_000_000_000) {
      return `${(value / 1_000_000_000_000).toFixed(1)}T`;
    } else if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length || !label) return null;

    const entry = dataMap[label];

    return (
      <div className="bg-[#333] text-white border border-[#574217] p-[24px] rounded-[12px]">
        <p>{formatDate(label, dateFormat)}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className={entry.dataKey === 'income' ? 'text-[#00cc00]' : 'text-[#ff0000]'}
          >
            {t(`chart.${entry.dataKey}`)}: {currency}{entry.value?.toFixed(2)}
          </p>
        ))}
        {(entry.incomeDescriptions.length > 0 || entry.expenseDescriptions.length > 0) && (
          <div>
            <p>{t('chart.descriptions')}:</p>
            {entry.incomeDescriptions.length > 0 && (
              <ul className="list-disc ml-[1.25rem]">
                {entry.incomeDescriptions.map((desc, index) => (
                  <li key={`income-${index}`} className="text-[#00cc00]">
                    {desc}
                  </li>
                ))}
              </ul>
            )}
            {entry.expenseDescriptions.length > 0 && (
              <ul className="list-disc ml-[1.25rem]">
                {entry.expenseDescriptions.map((desc, index) => (
                  <li key={`expense-${index}`} className="text-[#ff0000]">
                    {desc}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[18.75rem] mt-[-0.5rem]" aria-label={t('chart.title')}>
      <h2 className="text-white">{t('chart.title')}</h2>
      <TimeDisplay />
      <ResponsiveContainer width="100%" height="93%">
        <LineChart data={data}>
          <CartesianGrid stroke="#777777" />
          <XAxis
            dataKey="date"
            stroke="#ffffff"
            tick={<CustomTick dataMap={dataMap} />}
          />
          <YAxis
            stroke="#ffffff"
            tick={{ fill: '#ffffff', fontSize: '0.75rem' }}
            tickFormatter={formatYAxis}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#00cc00"
            name={t('chart.income')}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#ff0000"
            name={t('chart.expenses')}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;