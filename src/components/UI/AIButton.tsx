import React from 'react';
import { Bot, Sparkles, Brain, Search, FileText, Mic, Upload, Calculator, TrendingUp, Shield } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from './Button';

interface AIButtonProps {
  onSuggest?: () => void;
  onTeach?: () => void;
  variant?: 'suggest' | 'teach' | 'analyze' | 'voice' | 'document' | 'search' | 'calculate' | 'predict' | 'audit';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  context?: string;
  data?: any;
}

function AIButton({ 
  onSuggest, 
  onTeach, 
  variant = 'suggest', 
  size = 'md', 
  className = '',
  context,
  data
}: AIButtonProps) {
  const { isAIEnabled } = useAI();
  const { theme } = useTheme();

  if (!isAIEnabled) return null;

  const config = {
    suggest: {
      icon: <Sparkles size={16} />,
      text: 'AI Suggest',
      onClick: onSuggest,
      variant: 'primary' as const,
      tooltip: 'Get AI suggestions for this form'
    },
    teach: {
      icon: <Brain size={16} />,
      text: 'Teach AI',
      onClick: onTeach,
      variant: 'secondary' as const,
      tooltip: 'Teach AI the correct way to handle this'
    },
    analyze: {
      icon: <TrendingUp size={16} />,
      text: 'AI Analyze',
      onClick: onSuggest,
      variant: 'outline' as const,
      tooltip: 'Get AI analysis and insights'
    },
    voice: {
      icon: <Mic size={16} />,
      text: 'Voice Command',
      onClick: onSuggest,
      variant: 'outline' as const,
      tooltip: 'Use voice commands'
    },
    document: {
      icon: <FileText size={16} />,
      text: 'AI Extract',
      onClick: onSuggest,
      variant: 'outline' as const,
      tooltip: 'Extract data from documents'
    },
    search: {
      icon: <Search size={16} />,
      text: 'Smart Search',
      onClick: onSuggest,
      variant: 'outline' as const,
      tooltip: 'AI-powered search'
    },
    calculate: {
      icon: <Calculator size={16} />,
      text: 'AI Calculate',
      onClick: onSuggest,
      variant: 'outline' as const,
      tooltip: 'AI-assisted calculations'
    },
    predict: {
      icon: <TrendingUp size={16} />,
      text: 'AI Predict',
      onClick: onSuggest,
      variant: 'outline' as const,
      tooltip: 'Predictive analysis'
    },
    audit: {
      icon: <Shield size={16} />,
      text: 'AI Audit',
      onClick: onSuggest,
      variant: 'outline' as const,
      tooltip: 'AI audit and compliance check'
    }
  };

  const currentConfig = config[variant];

  return (
    <div className="relative group">
      <Button
        icon={currentConfig.icon}
        onClick={currentConfig.onClick}
        variant={currentConfig.variant}
        size={size}
        className={`
          ${className} 
          animate-pulse-soft hover:shadow-[${theme.hoverAccent}]/25
          relative overflow-hidden
        `}
      >
        {currentConfig.text}
        
        {/* AI Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent 
                       transform -skew-x-12 -translate-x-full group-hover:translate-x-full 
                       transition-transform duration-1000 ease-out" />
      </Button>
      
      {/* Tooltip */}
      <div className={`
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        px-3 py-2 ${theme.cardBg} ${theme.textPrimary} text-xs ${theme.borderRadius}
        opacity-0 invisible group-hover:opacity-100 group-hover:visible
        transition-all duration-300 whitespace-nowrap z-50 ${theme.shadowLevel}
        border ${theme.borderColor}
      `}>
        {currentConfig.tooltip}
        <div className={`absolute top-full left-1/2 transform -translate-x-1/2 
                      border-4 border-transparent border-b-gray-800`} />
      </div>
    </div>
  );
}

export default AIButton;