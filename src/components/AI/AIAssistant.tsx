import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Mic,
  Upload,
  X,
  Sparkles,
  Brain,
  FileText,
  Bot,
  MicOff, // Added MicOff for clarity
  Search,
  AlertTriangle, // Added for token warning message
} from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string; // Current module context
  data?: any; // Current form/page data
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  actionable?: boolean;
  action?: any;
}

function AIAssistant({ isOpen, onClose, context = 'general', data }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'document' | 'search'>('chat');
  const [tokenWarningMessage, setTokenWarningMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    suggestWithAI,
    processDocument,
    voiceCommand,
    createVoucherFromText,
    smartSearch,
    complianceCheck,
  } = useAI();
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = getContextualWelcome();
      setMessages([{
        id: '1',
        type: 'ai',
        content: welcomeMessage,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, context]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getContextualWelcome = () => {
    const contextMessages = {
      sales: 'Hello! I can help you with:\n\n• Creating sales invoices from voice commands\n• Suggesting customer details\n• Processing uploaded invoices\n• Analyzing sales trends\n• GST compliance checks\n\nTry: "Create invoice for 10 units of Product A to ABC Corp"',
      purchase: 'Hi! I can assist with:\n\n• Creating purchase orders\n• Vendor suggestions\n• 3-way matching (PO+GRN+Bill)\n• Processing vendor invoices\n• Payment recommendations\n\nTry: "Create PO for office supplies from XYZ Vendor"',
      accounting: 'Welcome! I can help with:\n\n• Creating journal entries from descriptions\n• Suggesting account heads\n• Bank reconciliation\n• Tax calculations\n• Audit analysis\n\nTry: "Create journal entry for office rent payment 50000"',
      inventory: 'Hello! I can assist with:\n\n• Stock level predictions\n• Reorder suggestions\n• Batch tracking\n• Valuation analysis\n• Movement tracking\n\nTry: "Show me items below reorder level"',
      reports: 'Hi! I can help generate:\n\n• Custom reports from natural language\n• Trend analysis\n• Compliance reports\n• Predictive insights\n• Data visualization\n\nTry: "Show me top 5 customers by revenue this quarter"',
      compliance: 'Welcome! I can assist with:\n\n• GST return preparation\n• Compliance checks\n• Deadline reminders\n• Tax calculations\n• Audit support\n\nTry: "Check my GST compliance for this month"',
      general: 'Hello! I\'m your AI assistant. I can help you with:\n\n• Creating vouchers and invoices\n• Processing documents\n• Smart search and reports\n• Compliance checks\n• Voice commands\n• Predictive analysis\n\nWhat would you like to do today?'
    };

    return contextMessages[context as keyof typeof contextMessages] || contextMessages.general;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Token usage warning heuristic
    if (input.length > 500) {
      setTokenWarningMessage('Your input is very long. This might consume more processing resources.');
    } else {
      setTokenWarningMessage(null);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsProcessing(true);

    try {
      let aiResponseData;
      let aiMessageContent: string;
      let actionable = false;
      let actionData: any = null;

      if (currentInput.toLowerCase().includes('create') && (currentInput.toLowerCase().includes('invoice') || currentInput.toLowerCase().includes('voucher'))) {
        aiResponseData = await createVoucherFromText(currentInput);
        if (aiResponseData) {
          aiMessageContent = `I'll help you create a ${aiResponseData.voucherType}:\n\n**Party:** ${aiResponseData.party || 'Not specified'}\n**Amount:** ₹${aiResponseData.amount || 0}\n**Narration:** ${aiResponseData.narration}\n\nShall I proceed with creating this entry?`;
          actionable = true;
          actionData = aiResponseData;
        } else {
          aiMessageContent = 'I could not understand your request to create a voucher. Please try again with more details.';
        }
      } else if (currentInput.toLowerCase().includes('show') || currentInput.toLowerCase().includes('report') || currentInput.toLowerCase().includes('analysis')) {
        aiResponseData = await smartSearch(currentInput);
        if (aiResponseData) {
          aiMessageContent = `I understand you want to ${aiResponseData.searchType}. Here's what I found:\n\n**Search Type:** ${aiResponseData.searchType}\n**Filters:** ${JSON.stringify(aiResponseData.filters || {})}\n\nWould you like me to generate this report?`;
          actionable = true;
          actionData = aiResponseData;
        } else {
          aiMessageContent = 'I could not process your search or report request. Please try again.';
        }
      } else if (currentInput.toLowerCase().includes('compliance') || currentInput.toLowerCase().includes('gst') || currentInput.toLowerCase().includes('tax')) {
        aiResponseData = await complianceCheck({ query: currentInput, context: data });
        if (aiResponseData) {
          aiMessageContent = `**Compliance Status:** ${aiResponseData.complianceStatus}\n\n**Issues Found:** ${aiResponseData.issues?.length || 0}\n\n${aiResponseData.suggestions?.map((s: string) => `• ${s}`).join('\n') || 'No specific suggestions'}\n\nWould you like a detailed compliance report?`;
          actionable = true;
          actionData = aiResponseData;
        } else {
          aiMessageContent = 'I could not perform the compliance check. Please try again.';
        }
      } else {
        // General AI suggestion handling, including greetings
        aiResponseData = await suggestWithAI({ query: currentInput, context, data });

        // Since suggestWithAI is now guaranteed to return a structured object with a 'suggestions' array
        if (aiResponseData && aiResponseData.suggestions && aiResponseData.suggestions.length > 0) {
          aiMessageContent = aiResponseData.suggestions[0].suggestion || 'I received a response, but it was empty. Can you please rephrase?';
          // You can add logic here to set 'actionable' and 'actionData' based on the suggestion's actions if needed
        } else {
          // Fallback if for some reason 'suggestions' array is empty or not as expected (should be rare now)
          aiMessageContent = 'I am having trouble generating a response right now. Please try again.';
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiMessageContent,
        timestamp: new Date(),
        actionable: actionable,
        action: actionData
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I apologize, but I encountered an error. Please try again or rephrase your request.',
        timestamp: new Date(),
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
        const mockCommands = [
          "Create a GST invoice for 10 units of Product X to ABC Traders",
          "Show me unpaid invoices over 30 days old",
          "What's my TDS liability this quarter",
          "Create journal entry for office rent payment 50000",
          "Show me top 5 customers by revenue"
        ];

        const mockCommand = mockCommands[Math.floor(Math.random() * mockCommands.length)];
        const result = await voiceCommand(mockCommand);

        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: `🎤 ${mockCommand}`,
          timestamp: new Date()
        };

        let aiMessageContent = `I heard: "${mockCommand}"\n\n**Action:** ${result?.action || 'process'}\n**Module:** ${result?.module || context}\n**Preview:** ${result?.preview || 'Processing your request...'}\n\nShall I proceed?`;

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiMessageContent,
          timestamp: new Date(),
          actionable: true,
          action: result
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

      if (result) {
        let aiMessageContent = `I've analyzed your ${result.documentType}:\n\n**Amount:** ₹${result.amount?.toLocaleString()}\n**Date:** ${result.date}\n**Party:** ${result.vendor || result.customer}\n**GST Number:** ${result.gstNumber || 'Not found'}\n**Items:** ${result.items?.length || 0} items\n**Tax:** ₹${result.tax?.total || 0}\n\nWould you like me to create an entry based on this information?`;

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiMessageContent,
          timestamp: new Date(),
          actionable: true,
          action: result
        };
        setMessages(prev => [...prev, userMessage, aiMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'I couldn\'t process this document. Please try again with a clearer image or different file format.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Error processing document. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      <div className={`
        w-96 h-[600px] ${theme.cardBg} ${theme.borderRadius} ${theme.shadowLevel}
        flex flex-col border ${theme.borderColor}
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-4 border-b ${theme.borderColor}
          bg-gradient-to-r ${theme.primaryGradient}
        `}>
          <div className="flex items-center space-x-2">
            <MessageSquare size={20} className="text-white" />
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <span className="text-xs text-white/80 capitalize">({context})</span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${theme.borderColor}`}>
          {[
            { id: 'chat', icon: Bot, label: 'Chat' },
            { id: 'voice', icon: Mic, label: 'Voice' },
            { id: 'document', icon: FileText, label: 'Document' },
            { id: 'search', icon: Search, label: 'Search' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex-1 flex items-center justify-center space-x-1 py-2 text-xs transition-all
                ${activeTab === tab.id
                  ? `bg-gradient-to-r ${theme.primaryGradient} text-white`
                  : `${theme.textMuted} hover:${theme.textPrimary}`
                }
              `}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
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
                    : `${theme.inputBg} ${theme.textPrimary} border ${theme.borderColor}`
                  }
                `}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {message.actionable && (
                  <div className="mt-2 space-x-2">
                    <button className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                      Accept
                    </button>
                    <button className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600">
                      Modify
                    </button>
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
              <div className={`${theme.inputBg} px-3 py-2 rounded-lg border ${theme.borderColor}`}>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${theme.borderColor}`}>
          {activeTab === 'chat' && (
            <>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className={`
                    flex-1 px-3 py-2 border ${theme.inputBorder} rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${theme.inputBg} ${theme.textPrimary}
                  `}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isProcessing}
                  className={`
                    p-2 bg-gradient-to-r ${theme.primaryGradient} text-white
                    rounded-lg hover:opacity-90 disabled:opacity-50 transition-all
                  `}
                >
                  <Send size={16} />
                </button>
              </div>

              {tokenWarningMessage && (
                <div className="mt-2 text-sm text-yellow-600 flex items-center">
                  <AlertTriangle size={16} className="mr-1" />
                  {tokenWarningMessage}
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleVoiceCommand}
                    disabled={isListening}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${isListening
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : `${theme.inputBg} ${theme.textMuted} hover:${theme.textPrimary}`
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
                    className={`p-2 ${theme.inputBg} ${theme.textMuted} rounded-lg hover:${theme.textPrimary} transition-colors`}
                  >
                    <Upload size={16} />
                  </button>
                </div>

                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Sparkles size={12} />
                  <span>AI Powered</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'voice' && (
            <div className="text-center space-y-4">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`
                  w-20 h-20 rounded-full transition-all transform hover:scale-105
                  ${isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : `bg-gradient-to-r ${theme.primaryGradient} text-white hover:opacity-90`
                  }
                  flex items-center justify-center
                `}
              >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
              <p className={`text-sm ${theme.textMuted}`}>
                {isListening ? 'Listening... Speak your command' : 'Tap to speak'}
              </p>
              <div className="text-xs text-gray-500">
                <p>Try saying:</p>
                <p>"Create invoice for ABC Corp"</p>
                <p>"Show me sales report"</p>
              </div>
            </div>
          )}

          {activeTab === 'document' && (
            <div className="text-center space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`
                  w-full p-8 border-2 border-dashed ${theme.borderColor} rounded-lg
                  hover:border-blue-500 transition-colors
                  flex flex-col items-center space-y-2
                `}
              >
                <Upload size={32} className={theme.textMuted} />
                <p className={`text-sm ${theme.textPrimary}`}>Upload Document</p>
                <p className="text-xs text-gray-500">
                  PDF, Images, Bank Statements
                </p>
              </button>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Smart search: 'Show sales in June 2024'"
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${theme.inputBg} ${theme.textPrimary}
                `}
              />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button className="p-2 bg-blue-100 text-blue-800 rounded">Sales Reports</button>
                <button className="p-2 bg-green-100 text-green-800 rounded">Outstanding</button>
                <button className="p-2 bg-purple-100 text-purple-800 rounded">Tax Reports</button>
                <button className="p-2 bg-orange-100 text-orange-800 rounded">Analytics</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;
