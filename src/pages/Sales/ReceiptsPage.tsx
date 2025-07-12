import React from 'react';
import { Plus, Receipt, Search } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function ReceiptsPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Receipts</h1>
          <p className={theme.textSecondary}>Record and manage customer payments and receipts.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Receipt Suggestions')} />
          <Button icon={<Plus size={16} />}>Record New Receipt</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Receipts List</h3>
        {/* Placeholder for receipts list table/grid */}
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Receipts list and management will appear here.</p>
        </div>
        {/* AI Feature Idea: Auto-match payments to invoices, predict delayed payments */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Delayed Payment Prediction')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default ReceiptsPage;
