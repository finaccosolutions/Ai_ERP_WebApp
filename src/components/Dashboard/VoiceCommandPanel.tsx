import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Send, 
  Volume2, 
  VolumeX,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { useTheme } from '../../contexts/ThemeContext';

interface VoiceCommandPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: string) => void;
}

function VoiceCommandPanel({ isOpen, onClose, onCommand }: VoiceCommandPanelProps) {
  const { theme } = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const voiceSuggestions = [
    "What's my total revenue this month?",
    "Show me top 5 customers by sales",
    "List all overdue invoices",
    "What's my cash flow for this quarter?",
    "Show expense breakdown by category",
    "How many pending purchase orders?",
    "What's my profit margin this year?",
    "Show me GST liability this month"
  ];

  useEffect(() => {
    if (isOpen) {
      setSuggestions(voiceSuggestions.slice(0, 4));
    }
  }, [isOpen]);

  const startListening = () => {
    setIsListening(true);
    setTranscript('');
    
    // Mock voice recognition - in production, use Web Speech API
    setTimeout(() => {
      const mockCommands = [
        "Show me total revenue for this month",
        "What are my top customers by sales value",
        "List all pending invoices over thirty days",
        "Show me cash flow analysis for current quarter"
      ];
      
      const mockTranscript = mockCommands[Math.floor(Math.random() * mockCommands.length)];
      setTranscript(mockTranscript);
      setIsListening(false);
    }, 3000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const handleSendCommand = async () => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    try {
      await onCommand(transcript);
      setTranscript('');
      onClose();
    } catch (error) {
      console.error('Voice command error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setTranscript(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <Card className={`w-full max-w-md ${theme.cardBg} border ${theme.borderColor}`}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-4 border-b ${theme.borderColor}
          bg-gradient-to-r from-emerald-500 to-emerald-600
        `}>
          <div className="flex items-center space-x-2">
            <Mic size={20} className="text-white" />
            <h3 className="font-semibold text-white">Voice Commands</h3>
            <Sparkles size={16} className="text-white animate-pulse" />
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Voice Input Area */}
          <div className="text-center">
            <div className={`
              relative w-32 h-32 mx-auto mb-4 rounded-full border-4 transition-all duration-300
              ${isListening 
                ? 'border-red-500 bg-red-50 animate-pulse' 
                : 'border-[${theme.hoverAccent}] bg-[${theme.hoverAccent}]/10'
              }
              flex items-center justify-center cursor-pointer hover:scale-105
            `}>
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`
                  w-20 h-20 rounded-full transition-all duration-300
                  ${isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-[${theme.hoverAccent}] hover:bg-emerald-600'
                  }
                  flex items-center justify-center text-white shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
              
              {/* Listening Animation */}
              {isListening && (
                <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
              )}
            </div>
            
            <p className={`text-sm ${theme.textMuted} mb-2`}>
              {isListening 
                ? 'Listening... Speak your command' 
                : isProcessing
                  ? 'Processing your command...'
                  : 'Tap to start voice command'
              }
            </p>
          </div>

          {/* Transcript Display */}
          <div className="space-y-3">
            <label className={`block text-sm font-medium ${theme.textPrimary}`}>
              Voice Command
            </label>
            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your voice command will appear here, or type manually..."
                rows={3}
                className={`
                  w-full px-3 py-2 border ${theme.borderColor} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary} resize-none
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              />
              {transcript && (
                <button
                  onClick={handleSendCommand}
                  disabled={isProcessing}
                  className={`
                    absolute bottom-2 right-2 p-2 bg-[${theme.hoverAccent}] text-white rounded-lg
                    hover:bg-emerald-600 transition-colors disabled:opacity-50
                  `}
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-3">
            <h4 className={`text-sm font-medium ${theme.textPrimary} flex items-center`}>
              <MessageSquare size={16} className="mr-2" />
              Quick Commands
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`
                    p-3 text-left text-sm border ${theme.borderColor} rounded-lg
                    ${theme.inputBg} hover:border-[${theme.hoverAccent}] hover:bg-[${theme.hoverAccent}]/5
                    transition-all duration-300 group
                  `}
                >
                  <span className={`${theme.textPrimary} group-hover:text-[${theme.hoverAccent}]`}>
                    "{suggestion}"
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendCommand}
              disabled={!transcript.trim() || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Send Command'}
            </Button>
          </div>

          {/* Tips */}
          <div className={`p-3 bg-sky-50 border border-sky-200 rounded-lg`}>
            <h5 className="text-sm font-medium text-sky-800 mb-1">Tips:</h5>
            <ul className="text-xs text-sky-700 space-y-1">
              <li>• Speak clearly and at normal pace</li>
              <li>• Use specific terms like "this month", "Q1", "overdue"</li>
              <li>• Ask for reports, summaries, or specific data</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default VoiceCommandPanel;