// src/components/UI/MasterSelectField.tsx
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import DropdownPortal from './DropdownPortal';

interface MasterSelectFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (selectedId: string, selectedName: string, additionalData?: any) => void;
  options: { id: string; name: string; [key: string]: any }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  allowCreation?: boolean;
  onNewValueConfirmed?: (value: string, fieldIndex?: number, masterType?: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  fieldIndex?: number;
  masterType?: string;
  onF2Press?: (value: string, fieldIndex?: number, masterType?: string) => void;
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
  readOnly = false,
  allowCreation = false,
  onNewValueConfirmed,
  onKeyDown,
  onBlur,
  fieldIndex,
  masterType,
  onF2Press,
}, ref) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
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
        setSearchTerm(option.name);
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
    if (onKeyDown) onKeyDown(e);
    if (e.key === 'F2' && onF2Press) {
      e.preventDefault();
      onF2Press(searchTerm.trim(), fieldIndex, masterType);
      setIsOpen(false);
    } else if (e.key === 'Enter' && allowCreation && onNewValueConfirmed) {
      const exactMatch = options.find(opt => opt.name.toLowerCase() === searchTerm.trim().toLowerCase());
      if (!exactMatch && searchTerm.trim()) {
        e.preventDefault();
        onNewValueConfirmed(searchTerm.trim(), fieldIndex, masterType);
        setIsOpen(false);
      } else if (exactMatch) {
        e.preventDefault();
        handleOptionClick(exactMatch);
      }
    }
  };

  const handleOptionClick = (option: { id: string; name: string; [key: string]: any }) => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setSearchTerm(option.name);
    onSelect(option.id, option.name, option);
    setIsOpen(false);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      if (onBlur) onBlur(e);
    }, 150);
  };

  const getDropdownPosition = () => {
    if (!inputRef.current) return { top: 0, left: 0, width: 0 };
    const rect = inputRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    };
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
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          className={`
            w-full pl-10 pr-3 py-2.5 border ${theme.inputBorder}
            ${theme.borderRadius} ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
            focus:ring-2 focus:${theme.inputFocus} focus:border-transparent
            transition-all duration-300 hover:border-[${theme.hoverAccent}]
            placeholder:${theme.textMuted}
            ${error ? 'border-red-500 ring-2 ring-red-200' : ''}
            ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
          `}
        />
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          disabled={disabled || readOnly}
        >
          <ChevronDown size={18} className={`${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <DropdownPortal style={getDropdownPosition()}>
          <div className={`mt-1 ${theme.isDark ? 'bg-gray-700' : 'bg-blue-50'} border ${theme.borderColor}
            ${theme.borderRadius} ${theme.shadowLevel} max-h-60 overflow-y-auto`}>
            {filteredOptions.map(option => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleOptionClick(option)}
                className={`w-full text-left px-4 py-2 text-sm ${theme.textPrimary}
                  ${theme.isDark ? 'hover:bg-gray-60' : 'hover:bg-blue-200'}
                  flex items-center justify-between`}
              >
                <span>{option.name}</span>
                {option.is_system_defined && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    System
                  </span>
                )}
              </button>
            ))}
          </div>
        </DropdownPortal>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
});

export default MasterSelectField;
