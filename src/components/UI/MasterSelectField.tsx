// src/components/UI/MasterSelectField.tsx
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
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
  readOnly?: boolean; // NEW: Add readOnly prop
  allowCreation?: boolean; // New prop to allow creation
  onNewValueConfirmed?: (value: string, fieldIndex?: number, masterType?: string) => void; // Callback for new value creation confirmed by F2/Enter
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void; // New prop for keydown events
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  fieldIndex?: number; // Optional index for identifying which item/ledger row this field belongs to
  masterType?: string; // Optional type for the master (e.g., 'item', 'customer', 'account')
}

export interface MasterSelectFieldRef {
  getSearchTerm: () => string;
  getFilteredOptions: () => { id: string; name: string; [key: string]: any }[];
  openDropdown: () => void;
  closeDropdown: () => void;
  selectOption: (id: string) => void;
}

const MasterSelectField = forwardRef<MasterSelectFieldRef, MasterSelectFieldProps>(({
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
  readOnly = false, // NEW: Default readOnly to false
  allowCreation = false,
  onNewValueConfirmed,
  onKeyDown,
  onBlur,
  fieldIndex, // Receive fieldIndex
  masterType, // Receive masterType
}, ref) => {
  const { theme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || ''); // Initialize with empty string if value is null/undefined

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchTerm(value || ''); // Also update with empty string if value becomes null/undefined
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(option =>
    // MODIFICATION: Ensure option itself is not null/undefined before accessing its properties
    option && (option.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
 
  useImperativeHandle(ref, () => ({
    getSearchTerm: () => searchTerm,
    getFilteredOptions: () => filteredOptions,
    openDropdown: () => setIsOpen(true),
    closeDropdown: () => setIsOpen(false),
    selectOption: (id: string) => {
      const option = options.find(opt => opt.id === id);
      if (option) {
        setSearchTerm(option.name); // This will display the full name in the input
        onSelect(option.id, option.name, option);
        setIsOpen(false);
      }
    },
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onValueChange(e.target.value);
    setIsOpen(true);
  };

  const handleInternalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
    }

    if (allowCreation && onNewValueConfirmed) {
      if (e.key === 'F2') {
        e.preventDefault();
        // F2 always prompts for creation if text is present or not
        onNewValueConfirmed(searchTerm.trim(), fieldIndex, masterType); // Pass fieldIndex and masterType
        setIsOpen(false);
      } else if (e.key === 'Enter') {
        // Enter prompts for creation only if no exact match is found
        const exactMatch = options.find(option => option.name.toLowerCase() === searchTerm.trim().toLowerCase());
        if (!exactMatch && searchTerm.trim() !== '') {
          e.preventDefault();
          onNewValueConfirmed(searchTerm.trim(), fieldIndex, masterType); // Pass fieldIndex and masterType
          setIsOpen(false);
        } else if (exactMatch) {
          e.preventDefault();
          handleOptionClick(exactMatch); // Select the exact match
        }
      }
    }
  };

  const handleOptionClick = (option: { id: string; name: string; [key: string]: any }) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    setSearchTerm(option.name); // This will display the full name in the input
    onSelect(option.id, option.name, option);
    setIsOpen(false);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Set a timeout to allow click events on options to fire first
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      if (onBlur) onBlur(e);
    }, 150); // Small delay (e.g., 150ms) to differentiate blur from click-selection
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInternalKeyDown}
          onBlur={handleBlur} // Use the new handleBlur
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly} // NEW: Apply readOnly prop
          className={`
            w-full pl-10 pr-3 py-2.5 border ${theme.inputBorder}
            ${theme.borderRadius} ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
            focus:ring-2 focus:${theme.inputFocus} focus:border-transparent
            transition-all duration-300 hover:border-[${theme.hoverAccent}]
            placeholder:${theme.textMuted}
            ${error ? 'border-red-500 ring-2 ring-2 ring-red-200' : ''}
            ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
          `}
        />
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-transform"
          disabled={disabled || readOnly} // NEW: Disable button if readOnly
        >
          <ChevronDown size={18} className={`${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className={`
          absolute z-50 w-full mt-1 ${theme.isDark ? 'bg-gray-700' : 'bg-white'} border ${theme.borderColor}
          ${theme.borderRadius} ${theme.shadowLevel} max-h-60 overflow-y-auto
        `}>
          {filteredOptions.map(option => (
            <button
              key={option.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // Prevent blur on mousedown
              onClick={() => handleOptionClick(option)}
              className={`
                w-full text-left px-4 py-2 text-sm
                ${theme.textPrimary} ${theme.isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}
                flex items-center justify-between
              `}
            >
              <span>{option.name}</span>
              {option.is_system_defined && ( // NEW: Display "System" tag for system-defined units
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  System
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

export default MasterSelectField;
