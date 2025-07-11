import React, { createContext, useContext, useState } from 'react';

interface AIContextType {
  isAIEnabled: boolean;
  confidence: 'high' | 'medium' | 'low';
  toggleAI: () => void;
  suggestWithAI: (data: any) => Promise<any>;
  teachAI: (data: any) => Promise<void>;
  processDocument: (file: File) => Promise<any>;
  voiceCommand: (command: string) => Promise<any>;
  createVoucherFromText: (text: string) => Promise<any>;
  smartSearch: (query: string) => Promise<any>;
  auditAnalysis: (data: any) => Promise<any>;
  complianceCheck: (data: any) => Promise<any>;
  predictiveAnalysis: (data: any) => Promise<any>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('high');

  const toggleAI = () => {
    setIsAIEnabled(!isAIEnabled);
  };

  const callGeminiAPI = async (prompt: string) => {
    try {
      // Check if API key is valid
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Gemini API is temporarily unavailable. Please try again later.');
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Gemini API configuration.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      // Return a fallback response instead of throwing to prevent app crashes
      return null;
    }
  };

  const suggestWithAI = async (data: any) => {
    if (!isAIEnabled) return data;

    try {
      const prompt = `As an ERP AI assistant, analyze this data and provide suggestions for improvement or auto-completion. Focus on accuracy and compliance. Data: ${JSON.stringify(data)}. Return only JSON format with suggestions, confidence level, and any warnings.`;
      const response = await callGeminiAPI(prompt);
      
      if (!response) {
        return { 
          suggestion: 'AI service temporarily unavailable', 
          confidence: 'low',
          warnings: ['AI suggestions not available']
        };
      }
      
      try {
        return JSON.parse(response);
      } catch {
        return { 
          suggestion: response, 
          confidence: 'medium',
          warnings: []
        };
      }
    } catch (error) {
      console.error('AI Suggestion Error:', error);
      return data;
    }
  };

  const teachAI = async (data: any) => {
    if (!isAIEnabled) return;

    try {
      const prompt = `Learn from this ERP correction: ${JSON.stringify(data)}. This is the correct way to handle similar situations in the future. Remember this pattern for future suggestions.`;
      await callGeminiAPI(prompt);
    } catch (error) {
      console.error('AI Teaching Error:', error);
    }
  };

  const processDocument = async (file: File) => {
    if (!isAIEnabled) return null;

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const prompt = `Extract structured data from this business document (invoice, receipt, bank statement, etc.). 
      Return data in JSON format with fields like: 
      - documentType (invoice/receipt/statement/etc)
      - amount (total amount)
      - date (transaction date)
      - vendor/customer (party name)
      - items (array of line items with name, quantity, rate)
      - tax (tax amount and type)
      - bankDetails (if bank statement)
      - gstNumber (if GST invoice)
      - hsnCode (if applicable)
      - confidence (high/medium/low)
      
      For bank statements, extract all transactions with dates, amounts, and descriptions.`;
      
      // For demo purposes, return mock extracted data based on file type
      const fileType = file.type;
      if (fileType.includes('pdf') || fileType.includes('image')) {
        return {
          documentType: 'invoice',
          amount: 15000.00,
          date: new Date().toISOString().split('T')[0],
          vendor: 'ABC Suppliers Pvt Ltd',
          gstNumber: '27AABCU9603R1ZX',
          items: [
            { name: 'Product A', quantity: 10, rate: 1200.00, hsnCode: '8471' },
            { name: 'Service Charges', quantity: 1, rate: 3000.00, hsnCode: '998314' }
          ],
          tax: {
            cgst: 1350.00,
            sgst: 1350.00,
            igst: 0,
            total: 2700.00
          },
          confidence: 'high'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Document Processing Error:', error);
      return null;
    }
  };

  const voiceCommand = async (command: string) => {
    if (!isAIEnabled) return null;

    try {
      const prompt = `Process this voice command for ERP system: "${command}". 
      Understand the intent and return structured action in JSON format with:
      - action (create_invoice/search/report/etc)
      - module (sales/purchase/accounting/etc)
      - data (extracted parameters)
      - confidence (high/medium/low)
      - preview (human readable summary)
      
      Examples:
      "Create GST invoice for 10 units of Product X to ABC Traders" → create_invoice action
      "Show me sales in June 2024" → search/report action
      "What's my TDS liability this quarter" → report action`;
      
      const response = await callGeminiAPI(prompt);
      
      try {
        return JSON.parse(response);
      } catch {
        return { 
          action: 'search', 
          query: command, 
          confidence: 'medium',
          preview: `Searching for: ${command}`
        };
      }
    } catch (error) {
      console.error('Voice Command Error:', error);
      return null;
    }
  };

  const createVoucherFromText = async (text: string) => {
    if (!isAIEnabled) return null;

    try {
      const prompt = `Create a voucher/journal entry from this description: "${text}"
      Return JSON with:
      - voucherType (sales/purchase/journal/payment/receipt)
      - date (suggested date)
      - party (customer/vendor if applicable)
      - amount (total amount)
      - entries (array of debit/credit entries with account, amount)
      - narration (proper accounting narration)
      - confidence (high/medium/low)
      - gstApplicable (boolean)
      - taxDetails (if GST applicable)
      
      Example: "Paid office rent 50000 via HDFC Bank" should create payment voucher`;
      
      const response = await callGeminiAPI(prompt);
      
      try {
        return JSON.parse(response);
      } catch {
        return {
          voucherType: 'journal',
          narration: text,
          confidence: 'low',
          entries: []
        };
      }
    } catch (error) {
      console.error('Voucher Creation Error:', error);
      return null;
    }
  };

  const smartSearch = async (query: string) => {
    if (!isAIEnabled) return null;

    try {
      const prompt = `Process this ERP search query: "${query}"
      Return JSON with:
      - searchType (transactions/reports/masters/analytics)
      - filters (date range, amount range, party, etc)
      - reportType (if requesting report)
      - sqlHints (suggested database filters)
      - confidence (high/medium/low)
      
      Examples:
      "Show sales in June 2024" → report search with date filter
      "Unpaid invoices over 30 days" → transaction search with aging filter
      "Top 5 customers by revenue" → analytics search`;
      
      const response = await callGeminiAPI(prompt);
      
      try {
        return JSON.parse(response);
      } catch {
        return {
          searchType: 'general',
          query: query,
          confidence: 'medium'
        };
      }
    } catch (error) {
      console.error('Smart Search Error:', error);
      return null;
    }
  };

  const auditAnalysis = async (data: any) => {
    if (!isAIEnabled) return null;

    try {
      const prompt = `Analyze this financial data for audit exceptions and compliance issues:
      ${JSON.stringify(data)}
      
      Return JSON with:
      - exceptions (array of potential issues)
      - riskLevel (high/medium/low)
      - recommendations (suggested actions)
      - complianceFlags (regulatory concerns)
      - confidence (high/medium/low)
      
      Look for: duplicate entries, unusual amounts, missing documentation, tax calculation errors, etc.`;
      
      const response = await callGeminiAPI(prompt);
      
      try {
        return JSON.parse(response);
      } catch {
        return {
          exceptions: [],
          riskLevel: 'low',
          recommendations: ['Review data manually'],
          confidence: 'low'
        };
      }
    } catch (error) {
      console.error('Audit Analysis Error:', error);
      return null;
    }
  };

  const complianceCheck = async (data: any) => {
    if (!isAIEnabled) return null;

    try {
      const prompt = `Check this data for GST/tax compliance issues:
      ${JSON.stringify(data)}
      
      Return JSON with:
      - complianceStatus (compliant/issues/critical)
      - issues (array of compliance problems)
      - suggestions (how to fix issues)
      - deadlines (upcoming filing deadlines)
      - confidence (high/medium/low)`;
      
      const response = await callGeminiAPI(prompt);
      
      try {
        return JSON.parse(response);
      } catch {
        return {
          complianceStatus: 'unknown',
          issues: [],
          suggestions: [],
          confidence: 'low'
        };
      }
    } catch (error) {
      console.error('Compliance Check Error:', error);
      return null;
    }
  };

  const predictiveAnalysis = async (data: any) => {
    if (!isAIEnabled) return null;

    try {
      const prompt = `Perform predictive analysis on this business data:
      ${JSON.stringify(data)}
      
      Return JSON with:
      - predictions (revenue/expense forecasts)
      - trends (identified patterns)
      - recommendations (business suggestions)
      - riskFactors (potential issues)
      - confidence (high/medium/low)`;
      
      const response = await callGeminiAPI(prompt);
      
      if (!response) {
        return {
          predictions: [],
          trends: [],
          recommendations: ['AI analysis temporarily unavailable'],
          confidence: 'low'
        };
      }
      
      try {
        return JSON.parse(response);
      } catch {
        return {
          predictions: [],
          trends: [],
          recommendations: [],
          confidence: 'low'
        };
      }
    } catch (error) {
      console.error('Predictive Analysis Error:', error);
      return null;
    }
  };

  return (
    <AIContext.Provider value={{
      isAIEnabled,
      confidence,
      toggleAI,
      suggestWithAI,
      teachAI,
      processDocument,
      voiceCommand,
      createVoucherFromText,
      smartSearch,
      auditAnalysis,
      complianceCheck,
      predictiveAnalysis
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}