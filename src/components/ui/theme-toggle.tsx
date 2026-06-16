import React from 'react';
import { Button, Tooltip } from 'antd';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks';

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Tooltip title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
      <Button
        onClick={toggleTheme}
        className="text-header-return! hover:text-primary! w-10! h-10! border-none! p-0! shadow-none! bg-transparent! flex items-center justify-center shrink-0"
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </Button>
    </Tooltip>
  );
};

export default ThemeToggle;
