import React, { createContext, useContext, useState } from 'react';

interface AIContextType {
  isAIEnabled: boolean;
  confidence: 'high' | 'medium' | 'low';
  toggleAI: () => void;
  suggestWithAI: (data: any) => Promise<any>;
  teachAI: (data: any) => Promise<void>;
  processDocument: (file: File) => Promise<any>;
  voiceCommand: (command: string) => Promise<any>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

const GEMINI_API_KEY = 'AIzaSyDYY-jiLmJ68-6HL0HiDgxRLexdrpdvPhg';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('high');

  const toggleAI = () => {
    setIsAIEnabled(!isAIEnabled);
  };

  const callGeminiAPI = async (prompt: string) => {
    try {
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

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  };

  const suggestWithAI = async (data: any) => {
    if (!isAIEnabled) return data;

    try {
      const prompt = `Based on the following ERP data, suggest improvements or auto-fill missing information: ${JSON.stringify(data)}. Return only JSON format response.`;
      const response = await callGeminiAPI(prompt);
      
      // Parse JSON response
      try {
        return JSON.parse(response);
      } catch {
        return { suggestion: response, confidence: 'medium' };
      }
    } catch (error) {
      console.error('AI Suggestion Error:', error);
      return data;
    }
  };

  const teachAI = async (data: any) => {
    if (!isAIEnabled) return;

    try {
      const prompt = `Learn from this ERP transaction pattern: ${JSON.stringify(data)}. This is correct data for future reference.`;
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

      const prompt = `Extract structured data from this business document (invoice, receipt, etc.). Return data in JSON format with fields like: amount, date, vendor, items, tax, etc.`;
      
      // For demo purposes, return mock extracted data
      return {
        documentType: 'invoice',
        amount: 1500.00,
        date: new Date().toISOString().split('T')[0],
        vendor: 'Demo Vendor',
        items: [
          { name: 'Product A', quantity: 2, rate: 750.00 }
        ],
        tax: 270.00,
        confidence: 'high'
      };
    } catch (error) {
      console.error('Document Processing Error:', error);
      return null;
    }
  };

  const voiceCommand = async (command: string) => {
    if (!isAIEnabled) return null;

    try {
      const prompt = `Process this voice command for ERP system: "${command}". Return structured action in JSON format with fields: action, module, data, confidence.`;
      const response = await callGeminiAPI(prompt);
      
      try {
        return JSON.parse(response);
      } catch {
        return { action: 'search', query: command, confidence: 'medium' };
      }
    } catch (error) {
      console.error('Voice Command Error:', error);
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
      voiceCommand
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