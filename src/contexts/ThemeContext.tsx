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
}

interface ThemeContextType {
  theme: ThemeSettings;
  updateTheme: (updates: Partial<ThemeSettings>) => void;
  resetTheme: () => void;
  toggleDarkMode: () => void;
}

const lightTheme: ThemeSettings = {
  // Main gradient: Soft green → Muted teal → Cool blue
  primaryGradient: 'from-[#6AC8A3] via-[#76C0C8] to-[#81CFEA]',
  primaryGradientHover: 'from-[#5BB394] via-[#67B1B9] to-[#72C0DB]',
  
  // Backgrounds
  sidebarBg: 'bg-slate-900',
  topNavBg: 'bg-slate-900',
  panelBg: 'bg-slate-200',
  cardBg: 'bg-slate-100',
  
  // Text colors
  textPrimary: 'text-slate-900', // Dark grey for headings
  textSecondary: 'text-slate-800', // Grey-black for normal text
  textMuted: 'text-slate-600',
  
  // Borders and inputs
  borderColor: 'border-slate-300',
  inputBg: 'bg-slate-100',
  inputBorder: 'border-slate-300',
  inputFocus: 'ring-[#6AC8A3] border-[#6AC8A3]',
  
  // Hover effects
  hoverAccent: '#6AC8A3',
  
  // Design elements
  borderRadius: 'rounded-xl',
  shadowLevel: 'shadow-lg',
  shadowHover: 'shadow-2xl',
  fontSize: 'md',
  isDark: false
};

const darkTheme: ThemeSettings = {
  // Main gradient: Darker version for dark mode
  primaryGradient: 'from-[#5BB394] via-[#67B1B9] to-[#72C0DB]',
  primaryGradientHover: 'from-[#4CA485] via-[#58A2AA] to-[#63B1CC]',
  
  // Backgrounds
  sidebarBg: 'bg-slate-900',
  topNavBg: 'bg-slate-800',
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
  inputFocus: 'ring-[#6AC8A3] border-[#6AC8A3]',
  
  // Hover effects
  hoverAccent: '#6AC8A3',
  
  // Design elements
  borderRadius: 'rounded-xl',
  shadowLevel: 'shadow-2xl',
  shadowHover: 'shadow-3xl',
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