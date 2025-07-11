import React from 'react';
import { Bot, Sparkles, Brain } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from './Button';

interface AIButtonProps {
  onSuggest?: () => void;
  onTeach?: () => void;
  variant?: 'suggest' | 'teach' | 'analyze';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function AIButton({ onSuggest, onTeach, variant = 'suggest', size = 'md', className = '' }: AIButtonProps) {
  const { isAIEnabled } = useAI();
  const { theme } = useTheme();

  if (!isAIEnabled) return null;

  const config = {
    suggest: {
      icon: <Sparkles size={16} />,
      text: 'Suggest with AI',
      onClick: onSuggest,
      variant: 'primary' as const
    },
    teach: {
      icon: <Brain size={16} />,
      text: 'Teach AI',
      onClick: onTeach,
      variant: 'secondary' as const
    },
    analyze: {
      icon: <Bot size={16} />,
      text: 'AI Analyze',
      onClick: onSuggest,
      variant: 'outline' as const
    }
  };

  const currentConfig = config[variant];

  return (
    <Button
      icon={currentConfig.icon}
      onClick={currentConfig.onClick}
      variant={currentConfig.variant}
      size={size}
      className={`${className} animate-pulse`}
    >
      {currentConfig.text}
    </Button>
  );
}

export default AIButton;