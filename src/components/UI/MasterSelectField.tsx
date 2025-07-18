// src/components/UI/MasterSelectField.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface MasterSelectFieldProps {
  label: string;
  value: string; // The displayed name
  onValueChange: (value: string) => void; // For typing
  onSelect: (selectedId: string, selectedName: string, additionalData?: any) => void; // When an option is selected
  options: { id: string; name: string; [key: string]: any }[]; // Array of master data
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
  allowCreation?: boolean; // New prop to allow creation
  onNewValue?: (value: string) => void; // Callback for new value creation
}

function MasterSelectField({
  label,
  value,
  onValueChange,
  onSelect,
  options,
  placeholder,
  required = false,
  error,
  className = '',
  disabled = false,
  allowCreation = false, // Default to false
  onNewValue,
}: MasterSelectFieldProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // When focus is lost, check for new value if creation is allowed
        if (allowCreation && onNewValue && searchTerm.trim() !== '') {
          const found = options.some(option => option && option.name && option.name.toLowerCase() === searchTerm.toLowerCase());
          if (!found) {
            onNewValue(searchTerm.trim());
          }
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchTerm, options, allowCreation, onNewValue]); // Added dependencies

  const filteredOptions = options.filter(option =>
    // Ensure option is not null/undefined and option.name is safely accessed
    option && (option.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onValueChange(e.target.value);
    setIsOpen(true); // Open dropdown when typing
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && allowCreation && onNewValue && searchTerm.trim() !== '') {
      const found = options.some(option => option && option.name && option.name.toLowerCase() === searchTerm.toLowerCase());
      if (!found) {
        onNewValue(searchTerm.trim());
        setIsOpen(false); // Close dropdown after triggering new value
      }
    }
  };

  const handleOptionClick = (option: { id: string; name: string; [key: string]: any }) => {
    setSearchTerm(option.name);
    onSelect(option.id, option.name, option); // Pass additional data
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown} // Add keydown handler
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full pl-10 pr-3 py-3 border ${theme.inputBorder}
            ${theme.borderRadius} ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
            focus:ring-2 focus:${theme.inputFocus} focus:border-transparent
            transition-all duration-300 hover:border-[#6AC8A3]
            placeholder:${theme.textMuted}
            ${error ? 'border-red-500 ring-2 ring-red-200' : ''}
          `}
        />
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <ChevronDown size={18} className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-400`} />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className={`
          absolute z-50 w-full mt-1 ${theme.cardBg} border ${theme.borderColor}
          ${theme.borderRadius} ${theme.shadowLevel} max-h-60 overflow-y-auto
        `}>
          {filteredOptions.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionClick(option)}
              className={`
                w-full text-left px-4 py-2 text-sm
                ${theme.textPrimary} hover:bg-[#6AC8A3]/10
              `}
            >
              {option.name}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default MasterSelectField;
