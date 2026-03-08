'use client';

/**
 * useTheme Hook
 * Manages theme selection and persistence
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { themes, defaultTheme, getThemeCSSVariables, type Theme, type ThemeId } from '@/theme/themes';
import { STORAGE_KEYS } from '@/lib/constants';
import { getStorageItem, setStorageItem } from '@/lib/helpers';

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultThemeId?: ThemeId;
}

export function ThemeProvider({ children, defaultThemeId = 'dark' }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState<ThemeId>(defaultThemeId);
  const [mounted, setMounted] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const savedThemeId = getStorageItem<ThemeId>(STORAGE_KEYS.THEME, defaultThemeId);
    if (savedThemeId && themes[savedThemeId]) {
      setThemeId(savedThemeId);
    }
    setMounted(true);
  }, [defaultThemeId]);

  // Apply theme CSS variables to document
  useEffect(() => {
    if (!mounted) return;

    const theme = themes[themeId];
    const cssVars = getThemeCSSVariables(theme);
    
    // Set data-theme attribute for CSS selectors
    document.documentElement.setAttribute('data-theme', themeId);
    
    // Apply CSS variables
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [themeId, mounted]);

  const setTheme = useCallback((id: ThemeId) => {
    if (themes[id]) {
      setThemeId(id);
      setStorageItem(STORAGE_KEYS.THEME, id);
    }
  }, []);

  const value: ThemeContextValue = {
    theme: themes[themeId],
    themeId,
    setTheme,
    availableThemes: Object.values(themes),
  };

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeContext };
export default useTheme;
