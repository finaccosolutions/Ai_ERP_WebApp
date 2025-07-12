import React from 'react';
import { CalendarCheck, Search, Clock } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function CustomerAgingReportPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Customer Aging Report</h1>
          <p className={theme.textSecondary}>Analyze the age of your outstanding receivables.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="analyze" onSuggest={() => console.log('AI Aging Analysis')} />
          <Button icon={<Clock size={16} />}>Generate Report</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Aging Report Details</h3>
        {/* Placeholder for customer aging report details */}
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Customer aging report details will appear here.</p>
        </div>
        {/* AI Feature Idea: Identify high-risk accounts, predict write-offs */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Risk Assessment')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default CustomerAgingReportPage;
