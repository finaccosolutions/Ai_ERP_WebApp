// src/components/UI/FormField.tsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import AIFormHelper from './AIFormHelper';
import { Eye, EyeOff } from 'lucide-react'; // Import Eye icons

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
  readOnly?: boolean;
  // New props for password visibility toggle
  showToggleVisibility?: boolean;
  onToggleVisibility?: () => void;
  isPasswordVisible?: boolean;
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
  readOnly = false,
  showToggleVisibility = false, // Default to false
  onToggleVisibility,
  isPasswordVisible,
}: FormFieldProps) {
  const { theme } = useTheme();

  // ADD THIS CONSOLE.LOG
  console.log(`FormField: Label="${label}", Value="${value}"`);

  // Determine padding based on icon and toggle visibility
  const paddingLeft = icon ? 'pl-10' : 'pl-3';
  const paddingRight = showToggleVisibility ? 'pr-10' : (onAISuggestion && !readOnly ? 'pr-10' : 'pr-3');

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className={`block text-sm font-medium ${theme.textPrimary}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {aiHelper && !readOnly && (
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
          type={showToggleVisibility && !isPasswordVisible ? "password" : type} // Use internal type for password toggle
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          className={`
            w-full ${paddingLeft} ${paddingRight} py-2.5 border ${theme.inputBorder}
            ${theme.borderRadius} ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
            focus:ring-2 focus:${theme.inputFocus} focus:border-transparent
            transition-all duration-300 hover:border-[${theme.hoverAccent}]
            placeholder:${theme.textMuted}
            ${error ? 'border-red-500 ring-2 ring-red-200' : ''}
            ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
          `}
        />

        {showToggleVisibility && onToggleVisibility && (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {onAISuggestion && value && !readOnly && !showToggleVisibility && ( // Only show AI suggestion indicator if not readOnly and no password toggle
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