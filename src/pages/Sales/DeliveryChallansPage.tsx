import React from 'react';
import { Plus, Truck, Search } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function DeliveryChallansPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Delivery Challans</h1>
          <p className={theme.textSecondary}>Generate and manage delivery challans for dispatched goods.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Challan Suggestions')} />
          <Button icon={<Plus size={16} />}>Create New Challan</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Delivery Challans List</h3>
        {/* Placeholder for delivery challans list table/grid */}
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Delivery challans list and management will appear here.</p>
        </div>
        {/* AI Feature Idea: Route optimization, delivery time prediction */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Route Optimization')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default DeliveryChallansPage;
