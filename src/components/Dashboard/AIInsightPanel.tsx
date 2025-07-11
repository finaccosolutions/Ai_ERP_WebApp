import React, { useState } from 'react';
import { 
  Bot, 
  EyeOff, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  Target,
  Zap,
  Brain
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { useTheme } from '../../contexts/ThemeContext';

interface AIInsight {
  type: 'prediction' | 'alert' | 'suggestion' | 'trend';
  title: string;
  message: string;
  confidence: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  actionable?: boolean;
  action?: string;
}

interface AIInsightPanelProps {
  insights: AIInsight[];
  onToggle: () => void;
  onRefresh: () => void;
}

function AIInsightPanel({ insights, onToggle, onRefresh }: AIInsightPanelProps) {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return <TrendingUp size={16} className="text-blue-500" />;
      case 'alert':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'suggestion':
        return <Lightbulb size={16} className="text-yellow-500" />;
      case 'trend':
        return <Target size={16} className="text-green-500" />;
      default:
        return <Brain size={16} className="text-purple-500" />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Mock insights if none provided
  const mockInsights: AIInsight[] = [
    {
      type: 'prediction',
      title: 'Revenue Forecast',
      message: 'Based on current trends, expect 18% revenue growth in Q2',
      confidence: 'high',
      impact: 'high',
      actionable: true,
      action: 'View Forecast Details'
    },
    {
      type: 'alert',
      title: 'Cash Flow Alert',
      message: 'Projected cash shortage in 45 days if current spending continues',
      confidence: 'medium',
      impact: 'high',
      actionable: true,
      action: 'Review Cash Flow'
    },
    {
      type: 'suggestion',
      title: 'Cost Optimization',
      message: 'Consider renegotiating vendor terms to improve margins by 3%',
      confidence: 'high',
      impact: 'medium',
      actionable: true,
      action: 'View Vendors'
    },
    {
      type: 'trend',
      title: 'Customer Behavior',
      message: 'Premium customers showing 25% increase in order frequency',
      confidence: 'high',
      impact: 'medium',
      actionable: false
    }
  ];

  const displayInsights = insights.length > 0 ? insights : mockInsights;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-semibold ${theme.textPrimary} flex items-center`}>
          <Bot size={20} className="mr-2 text-[#6AC8A3]" />
          AI Business Insights
          <div className="ml-2 w-2 h-2 bg-[#6AC8A3] rounded-full animate-pulse" />
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`
              p-1 rounded-lg transition-colors
              ${refreshing ? 'text-gray-400' : 'text-[#6AC8A3] hover:text-[#5DBF99]'}
            `}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600"
          >
            <EyeOff size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {displayInsights.map((insight, index) => (
          <div 
            key={index}
            className={`
              p-4 rounded-xl border-l-4 transition-all duration-300
              ${getImpactColor(insight.impact)} hover:shadow-md cursor-pointer
            `}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getInsightIcon(insight.type)}
                <h4 className={`font-medium ${theme.textPrimary}`}>
                  {insight.title}
                </h4>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`
                  px-2 py-1 text-xs rounded-full ${getConfidenceColor(insight.confidence)}
                `}>
                  {insight.confidence}
                </span>
                <span className={`
                  px-2 py-1 text-xs rounded-full
                  ${insight.impact === 'high' 
                    ? 'bg-red-100 text-red-800' 
                    : insight.impact === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }
                `}>
                  {insight.impact} impact
                </span>
              </div>
            </div>
            
            <p className={`text-sm ${theme.textMuted} mb-3`}>
              {insight.message}
            </p>
            
            {insight.actionable && (
              <div className="flex items-center justify-between">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs"
                >
                  {insight.action || 'Take Action'}
                </Button>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Zap size={12} />
                  <span>AI Powered</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Bot size={14} />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <button className="text-[#6AC8A3] hover:text-[#5DBF99] font-medium text-sm transition-colors">
            View All Insights →
          </button>
        </div>
      </div>
    </Card>
  );
}

export default AIInsightPanel;