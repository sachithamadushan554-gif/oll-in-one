import React from 'react';
import type { Theme } from '../hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeSwitcherProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme }) => {
  const baseClasses = 'p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const activeClasses = 'bg-indigo-600 text-white';
  const inactiveClasses = 'text-stone-500 hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-700';

  return (
    <div className="flex items-center gap-1 bg-stone-200 dark:bg-stone-900/50 p-1 rounded-lg">
      <button
        onClick={() => setTheme('light')}
        className={`${baseClasses} ${theme === 'light' ? activeClasses : inactiveClasses}`}
        aria-label="Switch to light theme"
        title="Light"
      >
        <Sun className="h-5 w-5" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`${baseClasses} ${theme === 'dark' ? activeClasses : inactiveClasses}`}
        aria-label="Switch to dark theme"
        title="Dark"
      >
        <Moon className="h-5 w-5" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`${baseClasses} ${theme === 'system' ? activeClasses : inactiveClasses}`}
        aria-label="Switch to system theme"
        title="System"
      >
        <Monitor className="h-5 w-5" />
      </button>
    </div>
  );
};
