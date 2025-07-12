import React from 'react';
import { Plus, FileText, Search } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function SalesQuotationsPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Quotations</h1>
          <p className={theme.textSecondary}>Create, manage, and track your sales quotations.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Quotation Suggestions')} />
          <Button icon={<Plus size={16} />}>Create New Quotation</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Quotations List</h3>
        {/* Placeholder for quotations list table/grid */}
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Sales quotations list and management will appear here.</p>
        </div>
        {/* AI Feature Idea: Auto-generate quotes, win probability prediction */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Win Probability')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default SalesQuotationsPage;
