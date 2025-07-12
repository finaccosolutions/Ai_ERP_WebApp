import React from 'react';
import { Plus, ShoppingCart, Search } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function SalesOrdersPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Orders</h1>
          <p className={theme.textSecondary}>Manage customer sales orders and fulfillment.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Order Suggestions')} />
          <Button icon={<Plus size={16} />}>Create New Order</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Orders List</h3>
        {/* Placeholder for sales orders list table/grid */}
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Sales orders list and management will appear here.</p>
        </div>
        {/* AI Feature Idea: Order fulfillment optimization, stock availability check */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="analyze" onSuggest={() => console.log('AI Fulfillment Analysis')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default SalesOrdersPage;
