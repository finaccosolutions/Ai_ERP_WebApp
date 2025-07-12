import React from 'react';
import { Plus, FileText, Search } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { Link } from 'react-router-dom';

function SalesInvoicesListPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Invoices</h1>
          <p className={theme.textSecondary}>Manage your sales invoices, track payments, and generate reports.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Invoice Suggestions')} />
          <Link to="/sales/invoices/create">
            <Button icon={<Plus size={16} />}>Create New Invoice</Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Invoices List</h3>
        {/* Placeholder for sales invoices list table/grid */}
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Sales invoices list and management will appear here.</p>
        </div>
        {/* AI Feature Idea: Invoice auto-generation from orders, payment prediction */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Payment Prediction')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default SalesInvoicesListPage;
