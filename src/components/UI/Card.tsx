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
        ? `bg-gradient-to-br ${theme.primaryGradient}` 
        : `${theme.panelBg} bg-white`
      }
      ${theme.borderRadius} ${theme.shadowLevel} 
      ${hover ? 'hover:shadow-2xl' : ''} 
      transition-all duration-300 
      ${className}
    `}>
      {children}
    </div>
  );
}

export default Card;