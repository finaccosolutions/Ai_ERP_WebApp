// src/components/UI/Card.tsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
  overflowVisible?: boolean;
  backgroundIcon?: React.ReactNode; // NEW: Add this prop for background icon
}

function Card({ children, className = '', gradient = false, hover = false, overflowVisible = false, backgroundIcon }: CardProps) {
  const { theme } = useTheme();

  return (
    <div className={`
      relative // Added relative for absolute positioning of backgroundIcon
      ${gradient 
        ? `bg-gradient-to-br ${theme.primaryGradient}` 
        : `${theme.cardBg} border ${theme.borderColor}`
      }
      ${theme.borderRadius} ${theme.shadowLevel} 
      ${hover ? `hover:${theme.shadowHover} transform hover:-translate-y-1 transition-all duration-300 cursor-pointer` : ''} 
      ${hover && !gradient ? `hover:border-[#6AC8A3] hover:shadow-[#6AC8A3]/10` : ''}
      ${!overflowVisible ? 'overflow-hidden' : ''}
      ${className}
    `}>
      {backgroundIcon && ( // Render background icon if provided
        <div className="absolute inset-0 flex items-center justify-center opacity-10 z-0">
          {backgroundIcon}
        </div>
      )}
      <div className="relative z-10"> {/* Ensure children are above background icon */}
        {children}
      </div>
    </div>
  );
}

export default Card;
