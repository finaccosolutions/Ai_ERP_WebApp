import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeSettings {
  primaryGradient: string;
  panelBg: string;
  sidebarBg: string;
  textColor: string;
  headingColor: string;
  borderRadius: string;
  shadowLevel: string;
  fontSize: 'sm' | 'md' | 'lg';
}

interface ThemeContextType {
  theme: ThemeSettings;
  updateTheme: (updates: Partial<ThemeSettings>) => void;
  resetTheme: () => void;
}

const defaultTheme: ThemeSettings = {
  primaryGradient: 'from-[#9BE7C4] via-[#A7D8DE] to-[#B3E5FC]',
  panelBg: 'bg-slate-100',
  sidebarBg: 'bg-slate-800',
  textColor: '#333333',
  headingColor: '#1F2937',
  borderRadius: 'rounded-2xl',
  shadowLevel: 'shadow-xl',
  fontSize: 'md'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem('erp-theme');
    if (savedTheme) {
      setTheme(JSON.parse(savedTheme));
    }
  }, []);

  const updateTheme = (updates: Partial<ThemeSettings>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    localStorage.setItem('erp-theme', JSON.stringify(newTheme));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    localStorage.removeItem('erp-theme');
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
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