'use client';

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Transaction } from '@/types/Transaction';
import { useSettings } from '@/app/context/SettingsContext';
import { useTranslation } from 'react-i18next';
import { exportArchiveToPDF } from '@/lib/pdf-export';
import { useArchiveFilter } from '@/app/context/ArchiveFilterContext';

interface Day {
  date: string;
}

const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;


// Convert dd.mm.yyyy to yyyy-mm-dd for sorting
const parseDateForSorting = (date: string): string => {
  const [day, month, year] = date.split('.');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const Archive = () => {
  const { t, i18n } = useTranslation();
  const { dateFormat, currency } = useSettings();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [days, setDays] = useState<Day[]>([]);

  const {
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
  } = useArchiveFilter();

  const isFilterApplied = selectedYear !== '' && selectedMonth !== '';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // ----- PDF EXPORT STATE -----
  const [showModal, setShowModal] = useState(false);
  const [exportData, setExportData] = useState<{
    year: string;
    month?: string;
    months: Array<{ month: string; transactions: Transaction[] }>;
  } | null>(null);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    address: string;
    plz: string;
    city: string;
    logoBase64: string | null;
  }>({
    name: '',
    address: '',
    plz: '',
    city: '',
    logoBase64: null,
  });

  const [logoFileName, setLogoFileName] = useState(t('archive.no_logo_chosen'));

  // Helper for logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserInfo((p) => ({ ...p, logoBase64: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const formatDate = (date: string, dateFormat: 'dd/mm/yyyy' | 'yyyy-mm-dd'): string => {
    const [day, month, year] = date.split('.');
    if (dateFormat === 'yyyy-mm-dd') {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (!isTauri) {
      setError(t('archive.error_tauri'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([
      invoke('get_transactions')
        .then((txs) => setTransactions(txs as Transaction[]))
        .catch((err: unknown) => {
          console.error('Failed to fetch transactions:', err);
          setError(t('archive.error_fetch_transactions'));
        }),
      invoke('get_days')
        .then((ds) => setDays(ds as Day[]))
        .catch((err: unknown) => {
          console.error('Failed to fetch days:', err);
          setError(t('archive.error_fetch_days'));
        }),
    ])
      .catch((err: unknown) => {
        console.error('Failed to fetch data:', err);
        setError(t('archive.error_fetch_data'));
      })
      .finally(() => setIsLoading(false));
  }, [t]);

  // Define month keys per language
  const monthKeysByLanguage: Record<string, string[]> = {
    en: [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ],
    de: [
      'januar', 'februar', 'marz', 'april', 'mai', 'juni',
      'juli', 'august', 'september', 'oktober', 'november', 'dezember'
    ],
    ru: [
      'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
      'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
    ],
  };

  // Get current language from i18n
  const currentLanguage = i18n.language || 'en';
  const monthKeys = monthKeysByLanguage[currentLanguage] || monthKeysByLanguage.en;

  // Create months array with month numbers as values and translated names for display
  const months = Array.from(
    new Set(days.map((day) => day.date.split('.')[1]))
  )
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((month) => ({
      value: month,
      label: t(`archive.months.${monthKeys[parseInt(month, 10) - 1]}`),
    }));

  const years = Array.from(new Set(days.map((day) => day.date.split('.')[2]))).sort();

  const groupedData = days.reduce((acc, day) => {
    const [ , month, year] = day.date.split('.');
    const key = `${year}/${month}`;
    if (!acc[key]) {
      acc[key] = { days: [], transactions: [], year, month };
    }
    acc[key].days.push(day.date);
    const dayTxs = transactions.filter((tx) => tx.date === day.date);
    acc[key].transactions.push(...dayTxs);
    return acc;
  }, {} as Record<string, { days: string[]; transactions: Transaction[]; year: string; month: string }>);

  const filteredData = isFilterApplied && selectedYear !== '' && selectedMonth !== ''
    ? Object.entries(groupedData).filter(([ , data]) => {
        const yearMatch = selectedYear === 'All' || data.year === selectedYear;
        const monthMatch = selectedMonth === 'All' || data.month === selectedMonth;
        return yearMatch && monthMatch;
      })
    : [];

  // Group filtered data by year
  const groupedByYear = filteredData.reduce((acc, [ , data]) => {
    if (!acc[data.year]) {
      acc[data.year] = [];
    }
    acc[data.year].push(data);
    return acc;
  }, {} as Record<string, typeof groupedData[string][]>);

  // Sort years descending
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

  return (
    <div className="p-6">
      <style jsx>{`
        #year, #month {
          color: #404040;
        }
        #year option, #month option {
          color: #404040;
        }
      `}</style>
      <h1 className="text-3xl font-bold mb-6 text-[var(--foreground)]">{t('archive.title')}</h1>
      <div aria-live="polite">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {isLoading && <p className="text-[var(--foreground)]">{t('archive.loading')}</p>}
        {!isLoading && !error && (
          <>
            <div className="mb-6 flex space-x-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-[var(--foreground)]">
                  {t('archive.year_label')}
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    }}
                  className="mt-1 pl-1 block w-full rounded-md border-gray-300 bg-[rgb(131,190,195)] text-neutral-700 focus:border-orange-400 focus:ring-orange-400 sm:text-sm"
                >
                  <option value="" disabled>
                    {t('archive.select_year')}
                  </option>
                  <option value="All">{t('archive.all_years')}</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-[var(--foreground)]">
                  {t('archive.month_label')}
                </label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                  }}
                  className="mt-1 pl-1 block w-full rounded-md border-gray-300 bg-[rgb(131,190,195)] text-neutral-700 focus:border-orange-400 focus:ring-orange-400 sm:text-sm"
                >
                  <option value="" disabled>
                    {t('archive.select_month')}
                  </option>
                  <option value="All">{t('archive.all_months')}</option>
                  {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {t(`archive.months.${monthKeys[parseInt(month.value, 10) - 1]}`)}
                  </option>
                  ))}
                </select>
              </div>
            </div>
            {filteredData.length === 0 ? (
              <p className="text-2xl text-white text-shadow-lg">{t('archive.no_selection')}</p>
            ) : (
              sortedYears.map((year) => (
                <div key={year} role="region" aria-labelledby={`year-${year}`} className="mb-10">
                  <h2 id={`year-${year}`} className="text-2xl text-shadow-lg font-semibold text-neutral-100 mb-4 mt-4">
                    {year}

                    {/* ---- YEAR PDF BUTTON ---- */}
                    <button
                      onClick={() => {
                        setExportData({
                        year,
                          months: groupedByYear[year],
                        });
                        setShowModal(true);
                      }}
                      className="ml-4 bg-[rgb(79,173,181)] text-neutral-600 px-3 py-1 rounded text-sm hover:bg-[rgb(99,190,198)]"
                    >
                      PDF
                    </button>
                  </h2>


                  <div className="card-bg shadow-custom-card p-[1rem] rounded-[0.5rem] mb-[1rem] space-y-6">
                    {groupedByYear[year]
                      .sort((a, b) => parseInt(b.month) - parseInt(a.month))
                      .map((monthData) => {
                        const sortedTransactions = monthData.transactions.slice().sort((a, b) => {
                          const dateA = parseDateForSorting(a.date);
                          const dateB = parseDateForSorting(b.date);
                          return dateB.localeCompare(dateA);
                        });

                        const incomeTransactions = sortedTransactions.filter((tx) => tx.transaction_type === 'income');
                        const expenseTransactions = sortedTransactions.filter((tx) => tx.transaction_type === 'expense');

                        return (
                          <div key={monthData.month} className="border-t-2 border-orange-900 pt-2">
                            <h3 className="text-lg font-medium text-amber-400 pb-2">
                              {t(`archive.months.${monthKeys[parseInt(monthData.month, 10) - 1]}`)} ({monthData.month})

                              {/* ---- MONTH PDF BUTTON ---- */}
                              <button
                                onClick={() => {
                                  setExportData({
                                    year,
                                    month: monthData.month,
                                    months: [monthData],
                                  });
                                  setShowModal(true);
                                }}
                                className="ml-2 bg-[rgb(71,144,85)] text-white px-2 py-1 rounded text-xs hover:bg-[rgb(85,174,103)]"
                              >
                                PDF
                              </button>
                            </h3>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="border rounded p-4">
                                <h4 className="text-lg font-medium income-text mb-2">{t('transaction_list.income')}</h4>
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
                                        <span className="income-text">{currency}{Math.abs(tx.amount).toFixed(2)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-400">{t('transaction_list.no_income_transactions')}</p>
                                )}
                              </div>
                              <div className="border rounded p-4">
                                <h4 className="text-lg font-medium expense-text mb-2">{t('transaction_list.expenses')}</h4>
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
                                        <span className="expense-text">-{currency}{Math.abs(tx.amount).toFixed(2)}</span>
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
                      })}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* ==================== PDF EXPORT MODAL ==================== */}
    {showModal && exportData && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[rgba(39,51,62,0.8)] p-6 rounded-lg max-w-md w-full">
          <h3 className="text-lg text-gray-300 font-bold mb-4">{t('archive.export_options')}</h3>

          <input
            placeholder={t('archive.full_name')}
            className="w-full mb-2 p-2 border rounded"
            onChange={(e) => setUserInfo((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            placeholder={t('archive.address')}
            className="w-full mb-2 p-2 border rounded"
            onChange={(e) => setUserInfo((p) => ({ ...p, address: e.target.value }))}
          />
          <div className="flex gap-2 mb-2">
            <input
              placeholder={t('archive.plz')}
              className="w-24 p-2 border rounded"
              onChange={(e) => setUserInfo((p) => ({ ...p, plz: e.target.value }))}
            />
            <input
              placeholder={t('archive.city')}
              className="flex-1 p-2 border rounded"
              onChange={(e) => setUserInfo((p) => ({ ...p, city: e.target.value }))}
            />
          </div>

          <div className="mb-4 flex items-center">
            <label
              htmlFor="logo-upload"
              className="mr-4 py-2 px-4 border-0 text-sm font-semibold bg-[rgba(52,90,125,0.7)] text-blue-100 hover:bg-[rgba(35,110,142,0.7)] cursor-pointer rounded"
            >
              {t('archive.choose_logo')}
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <span className="text-sm text-gray-400">{logoFileName}</span>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border rounded hover:bg-[rgba(88,52,52,0.7)]"
            >
              {t('archive.cancel')}
            </button>
            <button
              onClick={() => {
                exportArchiveToPDF(exportData, userInfo, t, currency, dateFormat);
                setShowModal(false);
                setUserInfo({ name: '', address: '', plz: '', city: '', logoBase64: null });
              }}
              className="px-4 py-2 bg-[rgb(67,124,119)] text-white rounded hover:bg-[rgb(75,140,134)]"
            >
              {t('archive.generate_pdf')}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default Archive;