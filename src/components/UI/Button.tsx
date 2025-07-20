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
    inline-flex items-center justify-center font-medium transition-all duration-300
    ${theme.borderRadius} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transform hover:scale-105'}
  `;

  const variants = {
    primary: `
      bg-gradient-to-r ${theme.primaryGradient} text-white 
      hover:bg-gradient-to-r hover:${theme.primaryGradientHover}
      shadow-md hover:shadow-lg
      hover:shadow-[${theme.hoverAccent}]/25
    `,
    secondary: `
      ${theme.cardBg} ${theme.textPrimary} hover:bg-slate-300 
      ${theme.isDark ? 'hover:bg-slate-600' : ''} shadow-md
    `,
    outline: `
      border-2 ${theme.borderColor} ${theme.textPrimary} 
      hover:border-[${theme.hoverAccent}] hover:text-[${theme.hoverAccent}] 
      ${theme.buttonOutlineHoverClass}
    `,
    ghost: `
      ${theme.textPrimary} 
      ${theme.buttonGhostHoverClass}
      hover:text-[${theme.hoverAccent}]
    `
  };

  // Define the sizes object
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-2.5 text-lg',
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