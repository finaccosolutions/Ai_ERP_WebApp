// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeSettings {
  primaryGradient: string;
  primaryGradientHover: string;
  sidebarBg: string;
  topNavBg: string;
  panelBg: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderColor: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  hoverAccent: string;
  borderRadius: string;
  shadowLevel: string;
  shadowHover: string;
  fontSize: 'sm' | 'md' | 'lg';
  isDark: boolean;
  // New properties for button hover backgrounds
  buttonOutlineHoverBg: string;
  buttonGhostHoverBg: string;
}

const lightTheme: ThemeSettings = {
  // Main gradient: Using the new emerald colors
  primaryGradient: 'from-emerald-400 via-emerald-300 to-emerald-200',
  primaryGradientHover: 'from-emerald-700 via-emerald-600 to-emerald-500', // Darker emerald shades for hover
  
  // Backgrounds
  sidebarBg: 'bg-gradient-to-b from-slate-800 to-slate-900',
  topNavBg: 'bg-gradient-to-r from-slate-800 to-slate-900',
  panelBg: 'bg-slate-200',
  cardBg: 'bg-slate-100',
  
  // Text colors
  textPrimary: 'text-gray-950', // Dark grey for headings
  textSecondary: 'text-gray-750', // Grey-black for normal text
  textMuted: 'text-slate-600',
  
  // Borders and inputs
  borderColor: 'border-slate-300',
  inputBg: 'bg-slate-100',
  inputBorder: 'border-slate-300',
  inputFocus: 'ring-emerald-400 border-emerald-400', // Using new base emerald
  
  // Hover effects
  hoverAccent: '#34D399', // New emerald-400 base
  
  // Design elements
  borderRadius: 'rounded-2xl',
  shadowLevel: 'shadow-lg',
  shadowHover: 'shadow-xl',
  fontSize: 'md',
  isDark: false,

  // Button specific hover backgrounds
  buttonOutlineHoverBg: 'bg-emerald-100', // Clearly green, not white-ish
  buttonGhostHoverBg: 'bg-emerald-200', // Clearly green, not white-ish
};

const darkTheme: ThemeSettings = {
  // Main gradient: Using the new emerald colors
  primaryGradient: 'from-emerald-400 via-emerald-300 to-emerald-200', // Consistent with light for primary
  primaryGradientHover: 'from-emerald-700 via-emerald-600 to-emerald-500', // Darker emerald shades for hover
  
  // Backgrounds
  sidebarBg: 'bg-gradient-to-b from-slate-900 to-black',
  topNavBg: 'bg-gradient-to-r from-slate-900 to-slate-800',
  panelBg: 'bg-slate-800',
  cardBg: 'bg-slate-700',
  
  // Text colors
  textPrimary: 'text-white',
  textSecondary: 'text-slate-200',
  textMuted: 'text-slate-400',
  
  // Borders and inputs
  borderColor: 'border-slate-600',
  inputBg: 'bg-slate-700',
  inputBorder: 'border-slate-600',
  inputFocus: 'ring-emerald-400 border-emerald-400', // Using new base emerald
  
  // Hover effects
  hoverAccent: '#34D399', // New emerald-400 base
  
  // Design elements
  borderRadius: 'rounded-2xl',
  shadowLevel: 'shadow-lg',
  shadowHover: 'shadow-xl',
  fontSize: 'md',
  isDark: true,

  // Button specific hover backgrounds
  buttonOutlineHoverBg: 'bg-emerald-900', // Dark emerald for outline hover
  buttonGhostHoverBg: 'bg-emerald-800', // Darker emerald for ghost hover
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(lightTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem('erp-theme');
    const savedDarkMode = localStorage.getItem('erp-dark-mode');
    
    if (savedTheme) {
      const parsedTheme = JSON.parse(savedTheme);
      setTheme(parsedTheme);
    } else if (savedDarkMode === 'true') {
      setTheme(darkTheme);
    }
  }, []);

  const updateTheme = (updates: Partial<ThemeSettings>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    localStorage.setItem('erp-theme', JSON.stringify(newTheme));
  };

  const resetTheme = () => {
    setTheme(lightTheme);
    localStorage.removeItem('erp-theme');
    localStorage.removeItem('erp-dark-mode');
  };

  const toggleDarkMode = () => {
    const newTheme = theme.isDark ? lightTheme : darkTheme;
    setTheme(newTheme);
    localStorage.setItem('erp-theme', newTheme.isDark.toString()); // Store only dark mode preference
    localStorage.removeItem('erp-theme'); // Remove the full theme object to ensure it defaults to light/dark based on preference
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme, toggleDarkMode }}>
      <div className={theme.isDark ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}