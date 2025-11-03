'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ArchiveFilterContextType {
  selectedYear: string;
  selectedMonth: string;
  setSelectedYear: (year: string) => void;
  setSelectedMonth: (month: string) => void;
  resetFilters: () => void;
}

const ArchiveFilterContext = createContext<ArchiveFilterContextType | undefined>(undefined);

export const ArchiveFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const resetFilters = () => {
    setSelectedYear('');
    setSelectedMonth('');
  };

  return (
    <ArchiveFilterContext.Provider
      value={{
        selectedYear,
        selectedMonth,
        setSelectedYear,
        setSelectedMonth,
        resetFilters,
      }}
    >
      {children}
    </ArchiveFilterContext.Provider>
  );
};

export const useArchiveFilter = () => {
  const context = useContext(ArchiveFilterContext);
  if (!context) {
    throw new Error('useArchiveFilter must be used within ArchiveFilterProvider');
  }
  return context;
};