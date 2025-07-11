import React, { useState } from 'react';
import { HelpCircle, Bot, Sparkles, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';

interface AIFormHelperProps {
  fieldName: string;
  fieldValue?: any;
  context?: string;
  onSuggestion?: (suggestion: any) => void;
  onTeach?: (correction: any) => void;
}

function AIFormHelper({ fieldName, fieldValue, context, onSuggestion, onTeach }: AIFormHelperProps) {
  const [showHelper, setShowHelper] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { suggestWithAI, teachAI } = useAI();
  const { theme } = useTheme();

  const handleAskAI = async () => {
    setIsLoading(true);
    try {
      const prompt = `Explain why the field "${fieldName}" is required in ${context || 'this form'}. 
                     Current value: ${fieldValue || 'empty'}. 
                     Provide helpful guidance for the user.`;
      
      const response = await suggestWithAI({ 
        field: fieldName, 
        value: fieldValue, 
        context,
        question: 'why_required'
      });
      
      setSuggestion(response);
    } catch (error) {
      setSuggestion({ 
        explanation: 'This field is required for proper data entry and compliance.',
        confidence: 'low'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestValue = async () => {
    setIsLoading(true);
    try {
      const response = await suggestWithAI({ 
        field: fieldName, 
        context,
        action: 'suggest_value'
      });
      
      setSuggestion(response);
      if (onSuggestion && response?.suggestedValue) {
        onSuggestion(response.suggestedValue);
      }
    } catch (error) {
      setSuggestion({ 
        explanation: 'Unable to generate suggestion at this time.',
        confidence: 'low'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeachCorrection = async () => {
    if (onTeach) {
      const correction = {
        field: fieldName,
        incorrectValue: fieldValue,
        context,
        timestamp: new Date().toISOString()
      };
      
      await teachAI(correction);
      onTeach(correction);
      
      setSuggestion({
        explanation: 'Thank you! I\'ve learned from this correction.',
        confidence: 'high',
        type: 'success'
      });
    }
  };

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getConfidenceIcon = (confidence?: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle size={16} />;
      case 'medium': return <AlertTriangle size={16} />;
      case 'low': return <AlertTriangle size={16} />;
      default: return <Bot size={16} />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowHelper(!showHelper)}
        className={`
          p-1 rounded-full transition-all duration-300 hover:scale-110
          ${theme.textMuted} hover:text-[#6AC8A3]
        `}
        title="Ask AI about this field"
      >
        <HelpCircle size={16} />
      </button>

      {showHelper && (
        <div className={`
          absolute top-full right-0 mt-2 w-80 ${theme.cardBg} border ${theme.borderColor}
          ${theme.borderRadius} ${theme.shadowLevel} z-50 p-4
        `}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Bot size={16} className="text-[#6AC8A3]" />
              <span className={`text-sm font-medium ${theme.textPrimary}`}>
                AI Field Helper
              </span>
            </div>
            <button
              onClick={() => setShowHelper(false)}
              className={`${theme.textMuted} hover:${theme.textPrimary} transition-colors`}
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex space-x-2">
              <button
                onClick={handleAskAI}
                disabled={isLoading}
                className={`
                  flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded-lg
                  hover:bg-blue-200 transition-colors disabled:opacity-50
                `}
              >
                Why required?
              </button>
              <button
                onClick={handleSuggestValue}
                disabled={isLoading}
                className={`
                  flex-1 px-3 py-2 text-xs bg-green-100 text-green-800 rounded-lg
                  hover:bg-green-200 transition-colors disabled:opacity-50
                `}
              >
                Suggest value
              </button>
            </div>

            {fieldValue && (
              <button
                onClick={handleTeachCorrection}
                className={`
                  w-full px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded-lg
                  hover:bg-orange-200 transition-colors
                `}
              >
                This is wrong - teach AI
              </button>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6AC8A3]"></div>
              </div>
            )}

            {suggestion && !isLoading && (
              <div className={`
                p-3 rounded-lg border
                ${getConfidenceColor(suggestion.confidence)}
              `}>
                <div className="flex items-start space-x-2">
                  {getConfidenceIcon(suggestion.confidence)}
                  <div className="flex-1">
                    <p className="text-sm">
                      {suggestion.explanation || suggestion.suggestion}
                    </p>
                    {suggestion.suggestedValue && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-xs font-medium">Suggested:</p>
                        <p className="text-sm">{suggestion.suggestedValue}</p>
                      </div>
                    )}
                    {suggestion.confidence && (
                      <p className="text-xs mt-1 opacity-75">
                        Confidence: {suggestion.confidence}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIFormHelper;