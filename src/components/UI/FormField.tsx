import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface FormFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  error?: string;
  className?: string;
}

function FormField({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  icon,
  error,
  className = ''
}: FormFieldProps) {
  const { theme } = useTheme();

  return (
    <div className={`relative ${className}`}>
      <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.textMuted} z-10`}>
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`
            w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border ${theme.inputBorder}
            ${theme.borderRadius} ${theme.inputBg} ${theme.textPrimary}
            focus:ring-2 focus:${theme.inputFocus} focus:border-transparent
            transition-all duration-300 hover:border-[#6AC8A3]
            placeholder:${theme.textMuted}
            ${error ? 'border-red-500 ring-2 ring-red-200' : ''}
          `}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default FormField;