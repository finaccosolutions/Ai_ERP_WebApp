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
  onF2Press?: (value: string) => void; // Modified: Removed fieldIndex and masterType from here
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
  value, // The ID from parent state
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
  onF2Press, // Destructure onF2Press
}, ref) => { // Accept ref
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [internalSearchTerm, setInternalSearchTerm] = useState(''); // Text displayed in input
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internalSearchTerm with the name corresponding to the `value` prop (ID)
  // This useEffect should only run when the `value` prop changes from the parent,
  // and the internalSearchTerm doesn't already reflect that selection.
  useEffect(() => {
    const selectedOption = options.find(opt => opt.id === value);
    if (selectedOption && selectedOption.name !== internalSearchTerm) {
      setInternalSearchTerm(selectedOption.name);
    } else if (!selectedOption && value === '' && internalSearchTerm !== '') {
      // If parent clears value, and internalSearchTerm is not already empty, clear it.
      setInternalSearchTerm('');
    }
  }, [value, options]); // Depend on value and options

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

  const filteredOptions = options.filter(option =>
    option && (option.name || '').toLowerCase().includes(internalSearchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalSearchTerm(e.target.value);
    setIsOpen(true); // Open dropdown on typing
    // Do NOT call onValueChange here. It's only called on explicit selection.
    // This allows the user to type freely without immediately updating the parent's ID state.
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
        inputRef.current?.blur(); // Allow parent's onKeyDown to proceed to next field
      }
    } else if (e.key === 'F2' && onF2Press) { // Handle F2 press
      e.preventDefault();
      onF2Press(internalSearchTerm.trim()); // Pass current search term
      setIsOpen(false); // Close dropdown on F2 press
    }
  };

  const handleOptionClick = (option: Option) => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setInternalSearchTerm(option.name);
    onValueChange(option.id); // Update parent's ID state
    onSelect(option.id, option.name, option);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      const typedText = internalSearchTerm.trim();
      const selectedOption = options.find(opt => opt.id === value); // Option corresponding to parent's ID

      if (typedText === '') {
        // If input is empty, clear parent's value
        onValueChange('');
        setInternalSearchTerm('');
      } else if (selectedOption && selectedOption.name.toLowerCase() === typedText.toLowerCase()) {
        // If typed text matches the currently selected option, do nothing (it's already selected)
        // This handles case where user types the selected value again
      } else {
        // User typed something, but it's not the currently selected option
        const matchingOption = options.find(opt => opt.name.toLowerCase() === typedText.toLowerCase());
        if (matchingOption) {
          // If typed text matches an existing option, select it
          onValueChange(matchingOption.id);
          onSelect(matchingOption.id, matchingOption.name, matchingOption);
          setInternalSearchTerm(matchingOption.name); // Ensure display is exact match
        } else {
          // If typed text does not match any existing option, clear parent's value and internal text
          onValueChange('');
          setInternalSearchTerm('');
          // Optionally, show a notification that the value is invalid
          // showNotification('Invalid selection. Please choose from the list or create a new one.', 'error');
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
          value={internalSearchTerm}
          onChange={handleInputChange}
          onFocus={() => { setIsOpen(true); inputRef.current?.select(); }}
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
          <div ref={dropdownRef} className={`mt-1 ${theme.isDark ? 'bg-gray-700' : 'bg-blue-50'} border ${theme.borderColor}
            ${theme.borderRadius} ${theme.shadowLevel} max-h-60 overflow-y-auto`}>
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
