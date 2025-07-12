import React from 'react';
import { BarChart3, Search, Users } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function CustomerWiseSalesSummaryPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Customer-wise Sales Summary</h1>
          <p className={theme.textSecondary}>Review sales performance broken down by individual customers.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="analyze" onSuggest={() => console.log('AI Customer Summary Analysis')} />
          <Button icon={<Users size={16} />}>View All Customers</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Summary by Customer</h3>
        {/* Placeholder for customer-wise sales summary table/charts */}
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Customer-wise sales summary data will appear here.</p>
        </div>
        {/* AI Feature Idea: Identify high-value customers, suggest cross-selling opportunities */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Cross-Sell Suggestions')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default CustomerWiseSalesSummaryPage;