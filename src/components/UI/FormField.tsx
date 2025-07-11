// src/components/UI/FormField.tsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import AIFormHelper from './AIFormHelper';

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
  aiHelper?: boolean;
  context?: string;
  onAISuggestion?: (suggestion: any) => void;
  onAITeach?: (correction: any) => void;
  readOnly?: boolean; // Add readOnly prop
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
  className = '',
  aiHelper = false,
  context,
  onAISuggestion,
  onAITeach,
  readOnly = false, // Default to false
}: FormFieldProps) {
  const { theme } = useTheme();

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className={`block text-sm font-medium ${theme.textPrimary}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {aiHelper && !readOnly && ( // Only show AI helper if not readOnly
          <AIFormHelper
            fieldName={label}
            fieldValue={value}
            context={context}
            onSuggestion={onAISuggestion}
            onTeach={onAITeach}
          />
        )}
      </div>

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
          readOnly={readOnly} // Apply readOnly prop
          className={`
            w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border ${theme.inputBorder}
            ${theme.borderRadius} ${theme.inputBg} ${theme.textPrimary}
            focus:ring-2 focus:${theme.inputFocus} focus:border-transparent
            transition-all duration-300 hover:border-[#6AC8A3]
            placeholder:${theme.textMuted}
            ${error ? 'border-red-500 ring-2 ring-red-200' : ''}
            ${onAISuggestion && !readOnly ? 'pr-10' : ''}
            ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''} // Styling for readOnly
          `}
        />

        {onAISuggestion && value && !readOnly && ( // Only show AI suggestion indicator if not readOnly
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="AI suggestion available" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default FormField;
