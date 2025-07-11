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
  type?: 'button' | 'submit' | 'reset';
}

function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  className = '',
  icon,
  type = 'button'
}: ButtonProps) {
  const { theme } = useTheme();

  const baseClasses = `
    inline-flex items-center justify-center font-medium transition-all duration-200
    ${theme.borderRadius} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transform hover:scale-105'}
  `;

  const variants = {
    primary: `bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 ${theme.shadowLevel} shadow-lg`,
    secondary: `${theme.isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-600 text-white hover:bg-gray-700'} ${theme.shadowLevel}`,
    outline: `border-2 ${theme.isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`,
    ghost: `${theme.isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
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