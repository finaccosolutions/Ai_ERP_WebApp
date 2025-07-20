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
  allowCreation?: boolean; // New prop to allow creation
  onNewValueConfirmed?: (value: string) => void; // Callback for new value creation confirmed by F2/Enter
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void; // New prop for keydown events
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void; // <--- ADD THIS PROP
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
  allowCreation = false, // Default to false
  onNewValueConfirmed, // Destructure new prop
  onKeyDown, // Destructure new prop
  onBlur, // <--- DESTRUCTURE THE NEW PROP HERE
}, ref) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input element

  useEffect(() => {
    setSearchTerm(value);
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
    // Ensure option is not null/undefined and option.name is safely accessed
    option && (option.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Expose imperative handle methods
  useImperativeHandle(ref, () => ({
    getSearchTerm: () => searchTerm,
    getFilteredOptions: () => filteredOptions,
    openDropdown: () => setIsOpen(true),
    closeDropdown: () => setIsOpen(false),
    selectOption: (id: string) => {
      const option = options.find(opt => opt.id === id);
      if (option) {
        setSearchTerm(option.name);
        onSelect(option.id, option.name, option);
        setIsOpen(false);
      }
    },
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onValueChange(e.target.value);
    setIsOpen(true); // Open dropdown when typing
  };

  const handleInternalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) {
      onKeyDown(e); // Pass the event to the external handler first
    }

    // Trigger new value confirmation on F2 or Enter if no matching option
    if (allowCreation && onNewValueConfirmed) {
      if (e.key === 'F2') {
        e.preventDefault(); // Prevent default F2 behavior (e.g., browser dev tools)
        if (searchTerm.trim() !== '') {
          onNewValueConfirmed(searchTerm.trim());
          setIsOpen(false); // Close dropdown immediately
        }
      } else if (e.key === 'Enter') {
        if (filteredOptions.length === 0 && searchTerm.trim() !== '') {
          e.preventDefault(); // Prevent form submission or other default behavior
          onNewValueConfirmed(searchTerm.trim());
          setIsOpen(false); // Close dropdown immediately
        } else if (filteredOptions.length === 1) {
          e.preventDefault(); // Prevent form submission
          handleOptionClick(filteredOptions[0]);
        }
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
      {label && ( // Only render label if it's not empty
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
          onKeyDown={handleInternalKeyDown} // Use the internal handler
          onBlur={(e) => { // <--- PASS THE onBlur PROP HERE
            setIsOpen(false); // Internal logic to close dropdown
            if (onBlur) onBlur(e); // Call the external onBlur handler
          }}
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
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)} // Toggle dropdown on icon click
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-transform"
          disabled={disabled}
        >
          <ChevronDown size={18} className={`${isOpen ? 'rotate-180' : ''}`} />
        </button>
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
});

export default MasterSelectField;

