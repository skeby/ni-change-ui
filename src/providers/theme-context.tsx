/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useState } from 'react';
import { NI_CHANGE_THEME } from '../static/theme';

export type ThemeMode = 'light' | 'dark';
const STORAGE_KEY = 'ni-change-theme';

export interface ThemeContextType {
  theme: ThemeMode;
  isDarkMode: boolean;
  toggleTheme: () => void;
  primary: string;
  primaryForeground: string;
  primaryTint: string;
  primaryLight: string;
  secondary: string;
  secondaryForeground: string;
  secondaryTint: string;
  secondaryLight: string;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'dark' || stored === 'light') return stored;
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode: theme === 'dark',
        toggleTheme,
        ...NI_CHANGE_THEME,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
