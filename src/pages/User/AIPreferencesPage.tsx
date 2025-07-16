// src/pages/User/AIPreferencesPage.tsx
import React, { useState, useEffect } from 'react';
import { Bot, Settings, Lightbulb, Zap, Brain, MessageSquare, Save, Search, Bell } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';

function AIPreferencesPage() {
  const { theme } = useTheme();
  const { isAIEnabled, toggleAI } = useAI();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [aiSettings, setAiSettings] = useState<any>({
    globalAIEnabled: isAIEnabled, // Reflects global state from context
    enableSuggestions: true,
    enableVoiceCommands: true,
    enableDocumentProcessing: true,
    suggestionConfidenceThreshold: 'medium', // high, medium, low
    aiResponseVerbosity: 'normal', // concise, normal, verbose
    aiLearningEnabled: true, // Allow AI to learn from user corrections
    aiSearchEnabled: true, // Enable AI-powered search features
    aiReportGenerationEnabled: true, // Enable AI to generate reports
    aiNotificationEnabled: true, // Enable AI to send notifications
    aiNotificationThreshold: 'high', // Only notify for high confidence insights
    aiModel: 'Gemini 2.0 Flash', // Display AI model
    apiKeyStatus: 'Configured', // Display API key status
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch user AI preferences from database on component mount
    const fetchAIPreferences = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('preferences') // Assuming AI preferences are part of the 'preferences' JSONB
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user AI preferences:', error);
        } else if (data?.preferences) {
          setAiSettings((prev: any) => ({ ...prev, ...data.preferences.ai || {} })); // Load nested AI preferences
        }
      }
    };
    fetchAIPreferences();
  }, [user]);

  const handleAISettingChange = (field: string, value: any) => {
    setAiSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveAIPreferences = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        showNotification('User not authenticated.', 'error');
        return;
      }

      // Update the nested 'ai' object within 'preferences'
      const { error } = await supabase
        .from('user_profiles')
        .update({ preferences: { ...user.preferences, ai: aiSettings } }) // Merge with existing preferences
        .eq('id', user.id);

      if (error) throw error;

      // If global AI toggle is changed, update the context
      if (aiSettings.globalAIEnabled !== isAIEnabled) {
        toggleAI(); // This will update the global AI context state
      }
      
      showNotification('AI Preferences saved successfully!', 'success');
    } catch (error: any) {
      console.error('Error saving AI preferences:', error);
      showNotification(error.message || 'Failed to save AI preferences.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>AI Preferences</h1>
          <p className={theme.textSecondary}>Customize your AI assistant experience.</p>
        </div>
        <Button onClick={handleSaveAIPreferences} disabled={loading} icon={<Save size={16} />}>
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
          <Bot size={20} className="mr-2 text-[#6AC8A3]" />
          General AI Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="globalAIEnabled"
              checked={aiSettings.globalAIEnabled}
              onChange={(e) => handleAISettingChange('globalAIEnabled', e.target.checked)}
              className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
            />
            <label htmlFor="globalAIEnabled" className={`text-sm font-medium ${theme.textPrimary}`}>
              Globally Enable/Disable AI Features
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableSuggestions"
              checked={aiSettings.enableSuggestions}
              onChange={(e) => handleAISettingChange('enableSuggestions', e.target.checked)}
              className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
            />
            <label htmlFor="enableSuggestions" className={`text-sm font-medium ${theme.textPrimary}`}>
              Enable AI Suggestions
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableVoiceCommands"
              checked={aiSettings.enableVoiceCommands}
              onChange={(e) => handleAISettingChange('enableVoiceCommands', e.target.checked)}
              className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
            />
            <label htmlFor="enableVoiceCommands" className={`text-sm font-medium ${theme.textPrimary}`}>
              Enable Voice Commands
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableDocumentProcessing"
              checked={aiSettings.enableDocumentProcessing}
              onChange={(e) => handleAISettingChange('enableDocumentProcessing', e.target.checked)}
              className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
            />
            <label htmlFor="enableDocumentProcessing" className={`text-sm font-medium ${theme.textPrimary}`}>
              Enable Document Processing
            </label>
          </div>
        </div>

        <h3 className={`text-lg font-semibold ${theme.textPrimary} mt-6 mb-4 flex items-center`}>
          <Lightbulb size={20} className="mr-2 text-[#6AC8A3]" />
          Suggestion & Response
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${theme.textPrimary}`}>
              Suggestion Confidence Threshold
            </label>
            <select
              value={aiSettings.suggestionConfidenceThreshold}
              onChange={(e) => handleAISettingChange('suggestionConfidenceThreshold', e.target.value)}
              className={`
                w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
              `}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${theme.textPrimary}`}>
              AI Response Verbosity
            </label>
            <select
              value={aiSettings.aiResponseVerbosity}
              onChange={(e) => handleAISettingChange('aiResponseVerbosity', e.target.value)}
              className={`
                w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
              `}
            >
              <option value="concise">Concise</option>
              <option value="normal">Normal</option>
              <option value="verbose">Verbose</option>
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="aiLearningEnabled"
              checked={aiSettings.aiLearningEnabled}
              onChange={(e) => handleAISettingChange('aiLearningEnabled', e.target.checked)}
              className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
            />
            <label htmlFor="aiLearningEnabled" className={`text-sm font-medium ${theme.textPrimary}`}>
              Allow AI to Learn from My Corrections
            </label>
          </div>
        </div>

        <h3 className={`text-lg font-semibold ${theme.textPrimary} mt-6 mb-4 flex items-center`}>
          <Brain size={20} className="mr-2 text-[#6AC8A3]" />
          Advanced AI Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="aiSearchEnabled"
              checked={aiSettings.aiSearchEnabled}
              onChange={(e) => handleAISettingChange('aiSearchEnabled', e.target.checked)}
              className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
            />
            <label htmlFor="aiSearchEnabled" className={`text-sm font-medium ${theme.textPrimary}`}>
              Enable AI-Powered Smart Search
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="aiReportGenerationEnabled"
              checked={aiSettings.aiReportGenerationEnabled}
              onChange={(e) => handleAISettingChange('aiReportGenerationEnabled', e.target.checked)}
              className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
            />
            <label htmlFor="aiReportGenerationEnabled" className={`text-sm font-medium ${theme.textPrimary}`}>
              Enable AI-Driven Report Generation
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="aiNotificationEnabled"
              checked={aiSettings.aiNotificationEnabled}
              onChange={(e) => handleAISettingChange('aiNotificationEnabled', e.target.checked)}
              className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
            />
            <label htmlFor="aiNotificationEnabled" className={`text-sm font-medium ${theme.textPrimary}`}>
              Enable AI Notifications
            </label>
          </div>
          {aiSettings.aiNotificationEnabled && (
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                AI Notification Threshold
              </label>
              <select
                value={aiSettings.aiNotificationThreshold}
                onChange={(e) => handleAISettingChange('aiNotificationThreshold', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                `}
              >
                <option value="high">High Confidence Only</option>
                <option value="medium">Medium Confidence and Above</option>
                <option value="low">All Confidence Levels</option>
              </select>
            </div>
          )}
        </div>

        <h3 className={`text-lg font-semibold ${theme.textPrimary} mt-6 mb-4 flex items-center`}>
          <Zap size={20} className="mr-2 text-[#6AC8A3]" />
          AI Model & Integration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="AI Model"
            value={aiSettings.aiModel}
            readOnly
          />
          <FormField
            label="API Key Status"
            value={aiSettings.apiKeyStatus}
            readOnly
          />
        </div>
      </Card>
    </div>
  );
}

export default AIPreferencesPage;
