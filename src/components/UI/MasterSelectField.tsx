// src/components/UI/MasterSelectField.tsx
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import DropdownPortal from './DropdownPortal';

type Option = {
  id: string;
  name: string;
  [key: string]: any;
};

type MasterSelectFieldProps = {
  label: string;
  value: string; // This is the selected ID from the parent
  onValueChange: (id: string) => void; // Callback to update the parent's state with the selected ID
  onSelect: (selectedId: string, selectedName: string, additionalData?: any) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  allowCreation?: boolean;
  onNewValueConfirmed?: (value: string, fieldIndex?: number, masterType?: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  fieldIndex?: number;
  masterType?: string;
  onF2Press?: (currentSearchTerm: string) => void;
  displayValue?: string;
  disableTyping?: boolean; // NEW: Prop to disable typing and filtering
};

export interface MasterSelectFieldRef {
  getSearchTerm: () => string;
  getFilteredOptions: () => Option[];
  openDropdown: () => void;
  closeDropdown: () => void;
  selectOption: (id: string) => void;
  focus: () => void;
}

const MasterSelectField = forwardRef<HTMLInputElement, MasterSelectFieldProps>(({
  label,
  value,
  onValueChange,
  onSelect,
  options,
  placeholder = '',
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
  displayValue,
  disableTyping = false, // NEW: Default to false
}, ref) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (displayValue !== undefined) {
      setInternalSearchTerm(displayValue);
    } else {
      const selectedOption = options.find(opt => opt.id === value);
      if (selectedOption && selectedOption.name !== internalSearchTerm) {
        setInternalSearchTerm(selectedOption.name);
      } else if (!selectedOption && value === '' && internalSearchTerm !== '') {
        setInternalSearchTerm('');
      }
    }
  }, [value, options, displayValue]);

  useImperativeHandle(ref, () => ({
    getSearchTerm: () => internalSearchTerm,
    getFilteredOptions: () => filteredOptions,
    openDropdown: () => setIsOpen(true),
    closeDropdown: () => setIsOpen(false),
    selectOption: (id: string) => {
      const option = options.find(opt => opt.id === id);
      if (option) {
        setInternalSearchTerm(option.name);
        onValueChange(option.id);
        onSelect(option.id, option.name, option);
        setIsOpen(false);
      }
    },
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  // NEW: Conditional filtering logic
  const filteredOptions = disableTyping
    ? options // If typing is disabled, always show all options
    : options.filter(option =>
        option && (option.name || '').toLowerCase().includes(internalSearchTerm.toLowerCase())
      );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disableTyping) { // Only update search term if typing is allowed
      setInternalSearchTerm(e.target.value);
    }
    setIsOpen(true);
  };

  const handleInternalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) onKeyDown(e);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prevIndex =>
        prevIndex < filteredOptions.length - 1 ? prevIndex + 1 : prevIndex
      );
      if (dropdownRef.current && highlightedIndex < filteredOptions.length - 1) {
        const nextItem = dropdownRef.current.children[highlightedIndex + 1] as HTMLElement;
        nextItem?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prevIndex =>
        prevIndex > 0 ? prevIndex - 1 : 0
      );
      if (dropdownRef.current && highlightedIndex > 0) {
        const prevItem = dropdownRef.current.children[highlightedIndex - 1] as HTMLElement;
        prevItem?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex !== -1 && filteredOptions[highlightedIndex]) {
        handleOptionClick(filteredOptions[highlightedIndex]);
      } else if (allowCreation && onNewValueConfirmed && internalSearchTerm.trim()) {
        const exactMatch = options.find(opt => opt.name.toLowerCase() === internalSearchTerm.trim().toLowerCase());
        if (!exactMatch) {
          onNewValueConfirmed(internalSearchTerm.trim(), fieldIndex, masterType);
          setIsOpen(false);
        }
      } else {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === 'F2' && onF2Press) {
      e.preventDefault();
      onF2Press(internalSearchTerm.trim());
      setIsOpen(false);
    }
  };

  const handleOptionClick = (option: Option) => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setInternalSearchTerm(option.name);
    onValueChange(option.id);
    onSelect(option.id, option.name, option);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      const typedText = internalSearchTerm.trim();
      const selectedOption = options.find(opt => opt.id === value);

      if (typedText === '') {
        onValueChange('');
        setInternalSearchTerm('');
      } else if (selectedOption && selectedOption.name.toLowerCase() === typedText.toLowerCase()) {
        // Value is already correctly set and displayed
      } else {
        const matchingOption = options.find(opt => opt.name.toLowerCase() === typedText.toLowerCase());
        if (matchingOption) {
          onValueChange(matchingOption.id);
          onSelect(matchingOption.id, matchingOption.name, matchingOption);
          setInternalSearchTerm(matchingOption.name);
        } else {
          onValueChange('');
          setInternalSearchTerm('');
        }
      }
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
          value={displayValue !== undefined ? displayValue : internalSearchTerm}
          onChange={handleInputChange}
          onFocus={() => { setIsOpen(true); setHighlightedIndex(-1); inputRef.current?.select(); }}
          onKeyDown={handleInternalKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly || disableTyping} // NEW: Make readOnly if disableTyping is true
          className={`
            w-full pl-10 pr-3 py-2.5 border ${theme.inputBorder}
            ${theme.borderRadius} ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
            focus:ring-2 focus:${theme.inputFocus} focus:border-transparent
            transition-all duration-300 hover:border-[${theme.hoverAccent}]
            placeholder:${theme.textMuted}
            ${error ? 'border-red-500 ring-2 ring-2 ring-red-200' : ''}
            ${readOnly || disableTyping ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
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
          <div ref={dropdownRef} className={`mt-1 ${theme.isDark ? 'bg-gray-700' : 'bg-blue-50'} border ${theme.borderColor}
            ${theme.borderRadius} ${theme.shadowLevel} max-h-60 overflow-y-auto min-w-max`} // NEW: Added min-w-max
            style={{ width: getDropdownPosition().width }}
            >
            {filteredOptions.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleOptionClick(option)}
                className={`w-full text-left px-4 py-2 text-sm ${theme.textPrimary}
                  ${theme.isDark ? 'hover:bg-gray-600' : 'hover:bg-blue-200'}
                  ${index === highlightedIndex ? (theme.isDark ? 'bg-gray-600' : 'bg-blue-200') : ''}
                  flex items-center justify-between`}
              >
                <span>{option.flag ? `${option.flag} ${option.name} (${option.dialCode})` : option.name}</span>
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
