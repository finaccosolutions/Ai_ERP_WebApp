import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import DropdownPortal from './DropdownPortal';

interface MasterSelectFieldProps {
  label: string;
  value: string; // This is now the selected ID
  onValueChange: (value: string) => void; // This updates the parent's state with the selected ID
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
  value, // This `value` is the ID of the selected option from the parent
  onValueChange, // This `onValueChange` is expected to update the parent's state with the ID
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
}, ref) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [internalSearchTerm, setInternalSearchTerm] = useState(''); // Internal state for the input field's text
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to synchronize internalSearchTerm with the `name` of the `value` prop (ID)
  // This ensures the input field displays the name corresponding to the selected ID
  useEffect(() => {
    const selectedOption = options.find(option => option.id === value);
    if (selectedOption) {
      setInternalSearchTerm(selectedOption.name);
    } else if (value === '') {
      // If value is cleared by parent, clear internal search term
      setInternalSearchTerm('');
    }
    // If value is a string that doesn't match an ID, it means it's a typed value
    // In this case, internalSearchTerm should already reflect the typed value from handleInputChange
  }, [value, options]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getSearchTerm: () => internalSearchTerm,
    getFilteredOptions: () => filteredOptions,
    openDropdown: () => setIsOpen(true),
    closeDropdown: () => setIsOpen(false),
    selectOption: (id: string) => {
      const option = options.find(opt => opt.id === id);
      if (option) {
        setInternalSearchTerm(option.name); // Update internal text
        onValueChange(option.id); // Update parent's ID state
        onSelect(option.id, option.name, option); // Trigger onSelect callback
        setIsOpen(false);
      }
    },
  }));

  const filteredOptions = options.filter(option =>
    option && (option.name || '').toLowerCase().includes(internalSearchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalSearchTerm(e.target.value); // Update internal text state
    // Do NOT call onValueChange here with e.target.value directly, as it expects an ID.
    // The parent's state (value) will only be updated when an option is selected.
    setIsOpen(true); // Open dropdown on typing
  };

  const handleInternalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) onKeyDown(e);
    if (e.key === 'F2' && onF2Press) {
      e.preventDefault();
      // Pass the current text in the input field, not the selected ID
      onF2Press(internalSearchTerm.trim(), fieldIndex, masterType);
      setIsOpen(false);
    } else if (e.key === 'Enter' && allowCreation && onNewValueConfirmed) {
      const exactMatch = options.find(opt => opt.name.toLowerCase() === internalSearchTerm.trim().toLowerCase());
      if (!exactMatch && internalSearchTerm.trim()) {
        e.preventDefault();
        onNewValueConfirmed(internalSearchTerm.trim(), fieldIndex, masterType);
        setIsOpen(false);
      } else if (exactMatch) {
        e.preventDefault();
        handleOptionClick(exactMatch);
      }
    }
  };

  const handleOptionClick = (option: { id: string; name: string; [key: string]: any }) => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current); // Clear timeout if an option is clicked
    setInternalSearchTerm(option.name); // Update internal text
    onValueChange(option.id); // Update parent's ID state
    onSelect(option.id, option.name, option); // Trigger onSelect callback
    setIsOpen(false);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Set a timeout to allow handleOptionClick to fire before closing
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      // If the input value doesn't match any option after blur, clear the parent's value
      const selectedOption = options.find(opt => opt.id === value);
      if (!selectedOption && value !== '') {
        // If the current value (ID) in parent state doesn't correspond to a name
        // and the input text doesn't match a name, clear the parent's value.
        // This handles cases where user types something and clicks away without selecting.
        const typedTextMatchesOption = options.some(opt => opt.name.toLowerCase() === internalSearchTerm.toLowerCase());
        if (!typedTextMatchesOption) {
          onValueChange(''); // Clear the parent's ID state
          setInternalSearchTerm(''); // Clear internal text
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
          value={internalSearchTerm} // Controlled by internalSearchTerm
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
                onMouseDown={(e) => e.preventDefault()} // Prevent blur from closing popover immediately
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
