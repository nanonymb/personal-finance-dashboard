'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  const [showWebviewWarning, setShowWebviewWarning] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.__TAURI__ || !window.__TAURI__.isWebview) {
        setShowWebviewWarning(true);
      }
    }
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowWebviewWarning(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleCloseWarning = () => {
    setShowWebviewWarning(false);
  };

  return (
    <div className="p-6 relative">
      <h1 className="text-3xl font-bold mb-6 text-[var(--foreground)]">{t('welcome.title')}</h1>
      <p className="text-[var(--foreground)] mb-4">{t('welcome.description')}</p>
      <Link href="/transactions" className="bg-[rgb(131,190,195)] text-neutral-700 px-4 py-2 rounded hover:bg-[rgb(143,207,214)]">
        {t('welcome.go_to_transactions')}
      </Link>
      {showWebviewWarning && (
        <div className="fixed top-4 right-4 bg-white border-2 border-red-500 rounded-lg shadow-lg p-4 max-w-sm z-50">
          <button
            onClick={handleCloseWarning}
            className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold border-none"
            aria-label={t('welcome.close_warning')}
          >
            X
          </button>
          <p className="text-[var(--foreground)] text-sm selectable text-red-500">
            {t('welcome.webview2_warning')}{' '}
            <a
              href="https://developer.microsoft.com/en-us/microsoft-edge/webview2/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              here
            </a>
          </p>
        </div>
      )}
    </div>
  );
}