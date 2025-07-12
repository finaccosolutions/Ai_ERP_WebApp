import React from 'react';
import { UserCheck, Search, DollarSign } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function CustomerOutstandingPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Customer Outstanding</h1>
          <p className={theme.textSecondary}>View and manage outstanding payments from customers.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="analyze" onSuggest={() => console.log('AI Outstanding Analysis')} />
          <Button icon={<DollarSign size={16} />}>Collect Payment</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Outstanding Payments List</h3>
        {/* Placeholder for customer outstanding list table/grid */}
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Customer outstanding payments list and management will appear here.</p>
        </div>
        {/* AI Feature Idea: Prioritize collections, suggest payment plans */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Collection Strategy')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default CustomerOutstandingPage;
