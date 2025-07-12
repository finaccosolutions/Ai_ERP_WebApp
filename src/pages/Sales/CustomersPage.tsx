import React from 'react';
import { Plus, Search, Users } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function CustomersPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Customer Master</h1>
          <p className={theme.textSecondary}>Manage your customer profiles and details.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Customer Suggestions')} />
          <Button icon={<Plus size={16} />}>Add New Customer</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Customer List</h3>
        {/* Placeholder for customer list table/grid */}
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Customer list and management options will appear here.</p>
        </div>
        {/* AI Feature Idea: Duplicate detection, customer segmentation */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="audit" onSuggest={() => console.log('AI Duplicate Check')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default CustomersPage;
