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
        : `${theme.cardBg} border ${theme.borderColor}`
      }
      ${theme.borderRadius} ${theme.shadowLevel} 
      ${hover ? `hover:${theme.shadowHover} transform hover:-translate-y-1 transition-all duration-300 cursor-pointer` : ''} 
      ${hover && !gradient ? `hover:border-[#6AC8A3] hover:shadow-[#6AC8A3]/10` : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

export default Card;