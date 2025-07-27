// src/pages/Sales/CustomerOutstandingPage.tsx
import React, { useState } from 'react';
import { UserCheck, Search, DollarSign, Filter, Calendar, RefreshCw, ArrowLeft } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom'; // Add this line

function CustomerOutstandingPage() {
  const { theme } = useTheme();
  const navigate = useNavigate(); // Initialize useNavigate

  const [filters, setFilters] = useState({
    customerName: '',
    minAmount: '',
    maxAmount: '',
    dueDateBefore: '',
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    // Logic to filter outstanding data
  };

  const outstandingInvoices = [
    { id: '1', invoiceNo: 'INV-001', customer: 'ABC Corp', dueDate: '2024-06-30', amount: 15000, outstanding: 15000, status: 'Overdue' },
    { id: '2', invoiceNo: 'INV-003', customer: 'Global Traders', dueDate: '2024-07-15', amount: 5000, outstanding: 2500, status: 'Partially Paid' },
    { id: '3', invoiceNo: 'INV-007', customer: 'XYZ Solutions', dueDate: '2024-08-10', amount: 8000, outstanding: 8000, status: 'Pending' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Customer Outstanding</h1>
          <p className={theme.textSecondary}>View and manage outstanding payments from customers.</p>
        </div>
        <div className="flex space-x-2">
          {/* Add this button */}
          <Button variant="outline" onClick={() => navigate('/sales')} icon={<ArrowLeft size={16} />} className="text-gray-600 hover:text-gray-800">
            Back
          </Button>
          <AIButton variant="analyze" onSuggest={() => console.log('AI Outstanding Analysis')} />
          <Button icon={<DollarSign size={16} />}>Collect Payment</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Filter Outstanding</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Customer Name" value={filters.customerName} onChange={(val) => handleFilterChange('customerName', val)} />
          <FormField label="Min Amount" type="number" value={filters.minAmount} onChange={(val) => handleFilterChange('minAmount', val)} />
          <FormField label="Max Amount" type="number" value={filters.maxAmount} onChange={(val) => handleFilterChange('maxAmount', val)} />
          <FormField label="Due Date Before" type="date" value={filters.dueDateBefore} onChange={(val) => handleFilterChange('dueDateBefore', val)} icon={<Calendar size={18} />} />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleApplyFilters} icon={<Filter size={16} />}>Apply Filters</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Outstanding Payments List</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {outstandingInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{invoice.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{invoice.outstanding.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm">View Invoice</Button>
                    <Button variant="ghost" size="sm">Record Payment</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {outstandingInvoices.length === 0 && (
          <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500 mt-4">
            <p>No outstanding payments found based on current filters.</p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Collection Strategy')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default CustomerOutstandingPage;

