'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import NotesModal from './NotesModal';
import { useTranslation } from 'react-i18next';

const navItems = [
  { name: 'sidebar.transactions', path: '/transactions' },
  { name: 'sidebar.settings', path: '/settings' },
  { name: 'sidebar.archive', path: '/archive' },
];

const Sidebar = () => {
  const pathname = usePathname();
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="w-64 bg-[var(--background)] text-[var(--foreground)] h-screen fixed flex flex-col p-4 border-r border-[var(--foreground)] z-[10]">
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`block p-2 rounded hover:bg-slate-600 hover:text-white ${
                  pathname === item.path ? 'bg-slate-800 bg-opacity-50 text-white' : ''
                }`}
              >
                {t(item.name)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <button
          onClick={() => setIsNotesModalOpen(true)}
          className="group h-[10rem] w-auto mx-auto mb-[4.4rem] object-contain border-none"
          aria-label={t('sidebar.open_notes')}
        >
          <Image
            src="/logo2.png"
            alt="Finance App"
            width={300}
            height={300}
            className="h-full w-auto transition-all duration-100 group-hover:scale-105 group-hover:brightness-100 group-hover:filter group-hover:drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]"
          />
        </button>
      </div>
      {isNotesModalOpen && <NotesModal onClose={() => setIsNotesModalOpen(false)} />}
    </div>
  );
};

export default Sidebar;