import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
}

function Card({ children, className = '', gradient = false, hover = false }: CardProps) {
  const { theme } = useTheme();

  return (
    <div className={`
      ${gradient 
        ? `bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600` 
        : `${theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`
      }
      ${theme.borderRadius} ${theme.shadowLevel} 
      ${hover ? `hover:shadow-2xl transform hover:-translate-y-1 ${theme.isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}` : ''} 
      transition-all duration-300 
      ${className}
    `}>
      {children}
    </div>
  );
}

export default Card;