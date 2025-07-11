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
  isDark: boolean;
}

interface ThemeContextType {
  theme: ThemeSettings;
  updateTheme: (updates: Partial<ThemeSettings>) => void;
  resetTheme: () => void;
  toggleDarkMode: () => void;
}

const lightTheme: ThemeSettings = {
  primaryGradient: 'from-blue-500 via-purple-500 to-indigo-600',
  panelBg: 'bg-white',
  sidebarBg: 'bg-gray-900',
  textColor: '#374151',
  headingColor: '#111827',
  borderRadius: 'rounded-xl',
  shadowLevel: 'shadow-lg',
  fontSize: 'md',
  isDark: false
};

const darkTheme: ThemeSettings = {
  primaryGradient: 'from-blue-500 via-purple-500 to-indigo-600',
  panelBg: 'bg-gray-800',
  sidebarBg: 'bg-gray-900',
  textColor: '#E5E7EB',
  headingColor: '#F9FAFB',
  borderRadius: 'rounded-xl',
  shadowLevel: 'shadow-2xl',
  fontSize: 'md',
  isDark: true
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
    localStorage.setItem('erp-theme', JSON.stringify(newTheme));
    localStorage.setItem('erp-dark-mode', newTheme.isDark.toString());
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