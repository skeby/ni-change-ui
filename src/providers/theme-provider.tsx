import { useEffect, type ReactNode } from 'react';
import AntdProvider from './antd-provider';
import { useTheme } from '../hooks';

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const {
    isDarkMode,
    primary,
    primaryForeground,
    primaryTint,
    primaryLight,
    secondary,
    secondaryForeground,
    secondaryTint,
    secondaryLight,
  } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--primary-foreground', primaryForeground);
    document.documentElement.style.setProperty('--primary-tint', primaryTint);
    document.documentElement.style.setProperty('--primary-light', primaryLight);
    document.documentElement.style.setProperty('--secondary', secondary);
    document.documentElement.style.setProperty('--secondary-foreground', secondaryForeground);
    document.documentElement.style.setProperty('--secondary-tint', secondaryTint);
    document.documentElement.style.setProperty('--secondary-light', secondaryLight);
  }, [
    primary,
    primaryForeground,
    primaryTint,
    primaryLight,
    secondary,
    secondaryForeground,
    secondaryTint,
    secondaryLight,
  ]);

  return <AntdProvider>{children}</AntdProvider>;
};

export default ThemeProvider;
