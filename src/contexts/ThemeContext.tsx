import React, { createContext, useContext, useEffect, useState } from 'react';
import { useProfile } from '../hooks/useProfile';

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const { profile, updateProfile } = useProfile();
  
  // Initialize theme from localStorage and then from profile when it loads
  useEffect(() => {
    // First check localStorage for any saved preference
    const savedTheme = localStorage.getItem('autopen_theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      // If no localStorage value, check for system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  // When profile loads, use its preference (this overrides localStorage)
  useEffect(() => {
    if (profile && profile.dark_mode !== undefined && profile.dark_mode !== null) {
      setDarkMode(profile.dark_mode);
    }
  }, [profile]);

  // Apply dark mode class to html element
  useEffect(() => {
    // Log the current dark mode state for debugging
    console.log('Dark mode is now:', darkMode ? 'enabled' : 'disabled');
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Also save to localStorage for quicker loading on next visit
    localStorage.setItem('autopen_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = async () => {
    // Log the toggle action for debugging
    console.log('Toggling dark mode from', darkMode, 'to', !darkMode);
    
    // Toggle the state locally first for immediate UI feedback
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    // Save to localStorage regardless of profile update success
    localStorage.setItem('autopen_theme', newMode ? 'dark' : 'light');
    
    // Then update the profile in database if user is logged in
    if (profile) {
      try {
        // Try to update the profile, but handle the case where the column doesn't exist yet
        const result = await updateProfile({ dark_mode: newMode });
        
        if (result.error) {
          console.log('Could not save theme to profile, using localStorage only');
          // The error is already logged in updateProfile function
        } else {
          console.log('Theme preference saved to profile');
        }
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        // Even if the database update fails, we've already updated localStorage
      }
    }
  };

  const value = {
    darkMode,
    toggleDarkMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
