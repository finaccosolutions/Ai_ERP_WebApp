import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  className = '',
  icon
}: ButtonProps) {
  const { theme } = useTheme();

  const baseClasses = `
    inline-flex items-center justify-center font-medium transition-all duration-200
    ${theme.borderRadius} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;

  const variants = {
    primary: `bg-gradient-to-r ${theme.primaryGradient} text-white hover:opacity-90 ${theme.shadowLevel}`,
    secondary: `bg-gray-600 text-white hover:bg-gray-700 ${theme.shadowLevel}`,
    outline: `border-2 border-gray-300 text-gray-700 hover:bg-gray-50`,
    ghost: `text-gray-700 hover:bg-gray-100`
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

export default Button;