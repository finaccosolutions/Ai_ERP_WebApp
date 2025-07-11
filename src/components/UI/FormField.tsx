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
      <label className={`block text-sm font-medium ${theme.isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
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
            w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border border-gray-300 
            ${theme.borderRadius} focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${theme.isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white'}
            ${error ? 'border-red-500' : ''}
          `}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default FormField;