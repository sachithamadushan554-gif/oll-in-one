import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedPrefs = window.localStorage.getItem('theme');
        if (typeof storedPrefs === 'string') {
            return storedPrefs as Theme;
        }
    }
    return 'system';
};


export const useTheme = () => {
  const [theme, _setTheme] = useState<Theme>(getInitialTheme);

  const applyTheme = useCallback((themeToApply: Theme) => {
    const root = window.document.documentElement;
    const isDark =
      themeToApply === 'dark' ||
      (themeToApply === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (localStorage.getItem('theme') === 'system') {
            applyTheme('system');
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [applyTheme]);
  
  const setTheme = (newTheme: Theme) => {
      window.localStorage.setItem('theme', newTheme);
      _setTheme(newTheme);
  }

  return { theme, setTheme };
};