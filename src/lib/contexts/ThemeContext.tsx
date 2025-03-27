import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../utils';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure light mode is the default by explicitly setting 'light'
  const [theme, setThemeValue] = useLocalStorage<Theme>('autopen-theme', 'light');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Enforce light mode on initial load
  useEffect(() => {
    // Make sure we remove any dark mode classes on initial load
    document.documentElement.classList.remove('dark');
    
    // Then set the state based on saved theme
    setIsDarkMode(theme === 'dark');
  }, []);

  // Apply dark mode class to html element when theme changes
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
    setIsDarkMode(newTheme === 'dark');
  };

  // Toggle between light and dark
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