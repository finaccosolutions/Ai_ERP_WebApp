import React from 'react';
import { Plus, Tag, Percent } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function SalesPriceListPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Price List / Discount Rules</h1>
          <p className={theme.textSecondary}>Define and manage your product pricing and discount rules.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Pricing Suggestions')} />
          <Button icon={<Plus size={16} />}>Add New Price List</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Price Lists & Discounts</h3>
        {/* Placeholder for price list and discount rules table/grid */}
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Price lists and discount rules management will appear here.</p>
        </div>
        {/* AI Feature Idea: AI discount engine, optimal pricing suggestions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Optimal Pricing')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default SalesPriceListPage;
