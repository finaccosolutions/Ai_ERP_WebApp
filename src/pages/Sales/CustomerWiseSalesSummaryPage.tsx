// src/pages/Sales/CustomerWiseSalesSummaryPage.tsx
import React, { useState } from 'react';
import { BarChart3, Search, Users, Filter, Calendar, RefreshCw, ArrowLeft } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom'; // Add this line

function CustomerWiseSalesSummaryPage() {
  const { theme } = useTheme();
  const navigate = useNavigate(); // Initialize useNavigate

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customerGroup: '',
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateSummary = () => {
    console.log('Generating customer-wise sales summary with filters:', filters);
    // Logic to fetch and display customer-wise sales summary data
  };

  const customerSalesSummary = [
    { customer: 'ABC Corp', totalSales: 350000, avgOrderValue: 15000, orderCount: 23 },
    { customer: 'XYZ Solutions', totalSales: 280000, avgOrderValue: 12000, orderCount: 24 },
    { customer: 'Global Traders', totalSales: 190000, avgOrderValue: 10000, orderCount: 19 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Customer-wise Sales Summary</h1>
          <p className={theme.textSecondary}>Review sales performance broken down by individual customers.</p>
        </div>
        <div className="flex space-x-2">
          {/* Add this button */}
          <Button variant="outline" onClick={() => navigate('/sales')} icon={<ArrowLeft size={16} />} className="text-gray-600 hover:text-gray-800">
            Back
          </Button>
          <AIButton variant="analyze" onSuggest={() => console.log('AI Customer Summary Analysis')} />
          <Button icon={<Users size={16} />} onClick={handleGenerateSummary}>Generate Summary</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Summary Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Start Date" type="date" value={filters.startDate} onChange={(val) => handleFilterChange('startDate', val)} icon={<Calendar size={18} />} />
          <FormField label="End Date" type="date" value={filters.endDate} onChange={(val) => handleFilterChange('endDate', val)} icon={<Calendar size={18} />} />
          <FormField label="Customer Group" value={filters.customerGroup} onChange={(val) => handleFilterChange('customerGroup', val)} icon={<Users size={18} />} />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleGenerateSummary} icon={<Filter size={16} />}>Apply Filters</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Summary by Customer</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Order Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Count</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customerSalesSummary.map((summary, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{summary.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{summary.totalSales.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{summary.avgOrderValue.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{summary.orderCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm">View Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customerSalesSummary.length === 0 && (
          <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500 mt-4">
            <p>No customer-wise sales summary found based on current filters.</p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Cross-Sell Suggestions')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default CustomerWiseSalesSummaryPage;

