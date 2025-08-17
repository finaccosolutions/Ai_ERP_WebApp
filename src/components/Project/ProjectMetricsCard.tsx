// src/components/Project/ProjectMetricsCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../UI/Card';

interface ProjectMetricsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  colorClass: string; // Tailwind class for background color, e.g., 'bg-blue-500'
  path?: string; // Optional path to navigate to
  onClick?: () => void; // Optional click handler
}

function ProjectMetricsCard({
  title,
  value,
  description,
  icon: Icon,
  colorClass,
  path,
  onClick,
}: ProjectMetricsCardProps) {
  const { theme } = useTheme();

  const content = (
    <Card
      hover
      className={`
        p-4 cursor-pointer group relative overflow-hidden flex-1 flex flex-col justify-between
        ${colorClass} bg-opacity-10 border border-opacity-20
        transform transition-all duration-300 ease-in-out
        hover:translate-y-[-6px] hover:shadow-2xl hover:ring-2 hover:ring-[${theme.hoverAccent}] hover:ring-opacity-75
      `}
    >
      <div className="relative z-10">
        <h3 className={`text-lg font-bold ${colorClass.replace('bg-', 'text-')} group-hover:text-[${theme.hoverAccent}] transition-colors`}>
          {title}
        </h3>
        <p className={`text-sm ${theme.textMuted}`}>{description}</p>
      </div>
      <div className="flex items-center justify-between mt-3 relative z-10">
        <p className={`text-2xl font-bold ${colorClass.replace('bg-', 'text-')}`}>{value}</p>
        <div
          className={`
            p-3 rounded-2xl shadow-md
            ${colorClass} text-white
            group-hover:scale-125 transition-transform duration-300
          `}
        >
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </Card>
  );

  if (path) {
    return <Link to={path}>{content}</Link>;
  }
  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }
  return content;
}

export default ProjectMetricsCard;
