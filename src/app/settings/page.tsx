'use client';

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/app/context/SettingsContext';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { currency, setCurrency, dateFormat, setDateFormat, language, setLanguage } = useSettings();
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update currentTime every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format current time based on dateFormat
  const formatCurrentTime = (date: Date): string => {
    if (dateFormat === 'yyyy-mm-dd') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${date.toLocaleTimeString()}`;
    }
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-[var(--foreground)]">{t('settings.title')}</h1>
      <p className="text-[var(--foreground)] mb-4">
        {t('settings.current_date_time')}: {formatCurrentTime(currentTime)}
      </p>
      <h2 className="text-2xl text-shadow-glow font-semibold mb-2 text-[var(--foreground)]">{t('settings.currency_label')}</h2>
      <select
        id="currency"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="mt-1 pl-1 block w-[7.7rem] rounded-md border-gray-300 bg-[rgb(131,190,195)] text-neutral-700 focus:border-orange-400 focus:ring-orange-400 sm:text-sm mb-6"
      >
        <optgroup label={t('settings.currency_label')} className="text-neutral-700">
          <option value="$">USD ($)</option>
          <option value="€">EUR (€)</option>
          <option value="₽">RUB (₽)</option>
          <option value="£">GBP (£)</option>
          <option value="zł">PLN (zł)</option>
        </optgroup>
      </select>
      <h2 className="text-2xl text-shadow-glow font-semibold mb-2 text-[var(--foreground)]">{t('settings.date_format_label')}</h2>
      <select
        id="dateFormat"
        value={dateFormat}
        onChange={(e) => setDateFormat(e.target.value as 'dd/mm/yyyy' | 'yyyy-mm-dd')}
        className="mt-1 pl-1 block w-[7.7rem] rounded-md border-gray-300 bg-[rgb(131,190,195)] text-neutral-700 focus:border-orange-400 focus:ring-orange-400 sm:text-sm mb-6"
      >
        <option value="dd/mm/yyyy">{t('settings.date_format_options.dd_mm_yyyy')}</option>
        <option value="yyyy-mm-dd">{t('settings.date_format_options.yyyy_mm_dd')}</option>
      </select>
      <h2 className="text-2xl text-shadow-glow font-semibold mb-2 text-[var(--foreground)]">{t('settings.language_label')}</h2>
      <select
        id="language"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="mt-1 pl-1 block w-[7.7rem] rounded-md border-gray-300 bg-[rgb(131,190,195)] text-neutral-700 focus:border-orange-400 focus:ring-orange-400 sm:text-sm"
      >
        <optgroup label={t('settings.language_label')} className="text-neutral-700">
          <option value="en">{t('settings.language_options.en')}</option>
          <option value="de">{t('settings.language_options.de')}</option>
          <option value="ru">{t('settings.language_options.ru')}</option>
          <option value="es">{t('settings.language_options.es')}</option>
          <option value="pl">{t('settings.language_options.pl')}</option>
        </optgroup>
      </select>
    </div>
  );
};

export default Settings;