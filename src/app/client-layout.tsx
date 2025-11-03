'use client';

import './globals.css';
import { SettingsProvider } from './context/SettingsContext';
import { TransactionProvider } from './context/TransactionContext';
import { NotesProvider } from './context/NotesContext';
import Sidebar from './components/Sidebar';
import { ArchiveFilterProvider } from './context/ArchiveFilterContext';
import { useSettings } from './context/SettingsContext';
import { useEffect } from 'react';
import i18n from './i18n';

// Child component to handle layout and language sync
const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { language } = useSettings();

  // Sync i18next language with SettingsContext language
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 ml-64">{children}</main>
    </div>
  );
};

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SettingsProvider>
      <TransactionProvider>
        <NotesProvider>
         <ArchiveFilterProvider>
          <LayoutContent>{children}</LayoutContent>
         </ArchiveFilterProvider>
        </NotesProvider>
      </TransactionProvider>
    </SettingsProvider>
  );
};

export default ClientLayout;