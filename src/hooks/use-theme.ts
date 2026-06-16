import { useContext } from 'react';
import { ThemeContext } from '../providers/theme-context';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }
  return context;
};

export default useTheme;
