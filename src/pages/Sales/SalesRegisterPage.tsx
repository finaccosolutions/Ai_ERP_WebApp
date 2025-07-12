import React from 'react';
import { BookOpenText, Search, FileText } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function SalesRegisterPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Register</h1>
          <p className={theme.textSecondary}>View a comprehensive register of all sales transactions.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="analyze" onSuggest={() => console.log('AI Register Analysis')} />
          <Button icon={<FileText size={16} />}>Export Register</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Transactions Register</h3>
        {/* Placeholder for sales register table */}
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Sales register with all transactions will appear here.</p>
        </div>
        {/* AI Feature Idea: Identify anomalies, summarize key trends */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="audit" onSuggest={() => console.log('AI Anomaly Detection')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default SalesRegisterPage;
