import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Mic, 
  Upload, 
  X, 
  Sparkles, 
  Brain,
  FileText,
  MessageCircle
} from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: 'high' | 'medium' | 'low';
}

function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { suggestWithAI, processDocument, voiceCommand } = useAI();
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'ai',
        content: 'Hello! I\'m your AI assistant. I can help you with:\n\n• Creating invoices and orders\n• Analyzing business data\n• Processing documents\n• Voice commands\n• Smart suggestions\n\nHow can I help you today?',
        timestamp: new Date(),
        confidence: 'high'
      }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Process the message with AI
      const response = await suggestWithAI({ query: input, context: 'chat' });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.response || 'I can help you with that. Could you provide more details?',
        timestamp: new Date(),
        confidence: response.confidence || 'medium'
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
        confidence: 'low'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceCommand = async () => {
    setIsListening(true);
    
    try {
      // Mock voice recognition - in production, use Web Speech API
      setTimeout(async () => {
        const mockCommand = "Create a sales invoice for customer ABC Corp";
        const result = await voiceCommand(mockCommand);
        
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: `🎤 ${mockCommand}`,
          timestamp: new Date()
        };

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `I'll help you create a sales invoice for ABC Corp. Let me gather the necessary information...`,
          timestamp: new Date(),
          confidence: 'high'
        };

        setMessages(prev => [...prev, userMessage, aiMessage]);
        setIsListening(false);
      }, 2000);
    } catch (error) {
      setIsListening(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const result = await processDocument(file);
      
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `📄 Uploaded: ${file.name}`,
        timestamp: new Date()
      };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I've analyzed your document. Here's what I found:\n\n• Amount: $${result.amount}\n• Date: ${result.date}\n• Vendor: ${result.vendor}\n• Items: ${result.items.length} items\n\nWould you like me to create an entry based on this information?`,
        timestamp: new Date(),
        confidence: result.confidence
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'I couldn\'t process this document. Please try again with a different file.',
        timestamp: new Date(),
        confidence: 'low'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (confidence?: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      <div className={`
        w-96 h-96 bg-white ${theme.borderRadius} ${theme.shadowLevel} 
        flex flex-col border border-gray-200
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-4 border-b border-gray-200
          bg-gradient-to-r ${theme.primaryGradient}
        `}>
          <div className="flex items-center space-x-2">
            <Bot size={20} className="text-white" />
            <h3 className="font-semibold text-white">AI Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-xs px-3 py-2 rounded-lg text-sm
                  ${message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                  }
                `}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.confidence && (
                  <div className={`text-xs mt-1 ${getConfidenceColor(message.confidence)}`}>
                    Confidence: {message.confidence}
                  </div>
                )}
                <div className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing}
              className={`
                p-2 bg-gradient-to-r ${theme.primaryGradient} text-white 
                rounded-lg hover:opacity-90 disabled:opacity-50
              `}
            >
              <Send size={16} />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleVoiceCommand}
                disabled={isListening}
                className={`
                  p-2 rounded-lg transition-colors
                  ${isListening 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <Mic size={16} />
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <Upload size={16} />
              </button>
            </div>
            
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Sparkles size={12} />
              <span>AI Powered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;