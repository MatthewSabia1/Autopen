import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../utils';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeValue] = useLocalStorage<Theme>('autopen-theme', 'system');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Function to determine if dark mode should be applied
  const getSystemTheme = (): boolean => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // Initially set dark mode based on the theme setting
  useEffect(() => {
    if (theme === 'system') {
      setIsDarkMode(getSystemTheme());
    } else {
      setIsDarkMode(theme === 'dark');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setIsDarkMode(mediaQuery.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Utility function to set theme and trigger dark mode update
  const setTheme = (newTheme: Theme) => {
    setThemeValue(newTheme);
  };

  // Toggle between light and dark (ignoring system)
  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};