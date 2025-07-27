// src/pages/Sales/CustomerAgingReportPage.tsx
import React, { useState } from 'react';
import { CalendarCheck, Search, Clock, Filter, Users, RefreshCw, ArrowLeft } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom'; // Add this line

function CustomerAgingReportPage() {
  const { theme } = useTheme();
  const navigate = useNavigate(); // Initialize useNavigate

  const [filters, setFilters] = useState({
    asOfDate: new Date().toISOString().split('T'),
    customerGroup: '',
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateReport = () => {
    console.log('Generating aging report with filters:', filters);
    // Logic to generate aging report data
  };

  const agingData = [
    { customer: 'ABC Corp', totalOutstanding: 15000, current: 0, '1-30': 0, '31-60': 0, '61-90': 15000, '90+': 0 },
    { customer: 'Global Traders', totalOutstanding: 2500, current: 2500, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
    { customer: 'XYZ Solutions', totalOutstanding: 8000, current: 8000, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Customer Aging Report</h1>
          <p className={theme.textSecondary}>Analyze the age of your outstanding receivables.</p>
        </div>
        <div className="flex space-x-2">
          {/* Add this button */}
          <Button variant="outline" onClick={() => navigate('/sales')} icon={<ArrowLeft size={16} />} className="text-gray-600 hover:text-gray-800">
            Back
          </Button>
          <AIButton variant="analyze" onSuggest={() => console.log('AI Aging Analysis')} />
          <Button icon={<Clock size={16} />} onClick={handleGenerateReport}>Generate Report</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="As of Date" type="date" value={filters.asOfDate} onChange={(val) => handleFilterChange('asOfDate', val)} icon={<Calendar size={18} />} />
          <FormField label="Customer Group" value={filters.customerGroup} onChange={(val) => handleFilterChange('customerGroup', val)} icon={<Users size={18} />} />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleGenerateReport} icon={<Filter size={16} />}>Apply Filters</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Aging Report Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Outstanding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">1-30 Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">31-60 Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">61-90 Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">90+ Days</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agingData.map((data, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{data.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{data.totalOutstanding.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{data.current.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{data['1-30'].toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{data['31-60'].toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{data['61-90'].toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{data['90+'].toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {agingData.length === 0 && (
          <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500 mt-4">
            <p>No aging data found based on current filters.</p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Risk Assessment')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default CustomerAgingReportPage;

