// src/pages/Sales/SalesRegisterPage.tsx
import React, { useState } from 'react';
import { BookOpenText, Search, FileText, Filter, Calendar, Users, RefreshCw, ArrowLeft } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom'; // Add this line

function SalesRegisterPage() {
  const { theme } = useTheme();
  const navigate = useNavigate(); // Initialize useNavigate

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    invoiceNo: '',
    customerName: '',
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateRegister = () => {
    console.log('Generating sales register with filters:', filters);
    // Logic to fetch and display sales register data
  };

  const salesRegisterEntries = [
    { id: '1', invoiceNo: 'INV-001', date: '2024-07-01', customer: 'ABC Corp', total: 15000, status: 'Paid' },
    { id: '2', invoiceNo: 'INV-002', date: '2024-07-02', customer: 'XYZ Solutions', total: 22000, status: 'Pending' },
    { id: '3', invoiceNo: 'INV-003', date: '2024-07-03', customer: 'Global Traders', total: 5000, status: 'Partially Paid' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Register</h1>
          <p className={theme.textSecondary}>View a comprehensive register of all sales transactions.</p>
        </div>
        <div className="flex space-x-2">
          {/* Add this button */}
          <Button variant="outline" onClick={() => navigate('/sales')} icon={<ArrowLeft size={16} />} className="text-gray-600 hover:text-gray-800">
            Back
          </Button>
          <AIButton variant="analyze" onSuggest={() => console.log('AI Register Analysis')} />
          <Button icon={<FileText size={16} />} onClick={handleGenerateRegister}>Export Register</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Register Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField label="Start Date" type="date" value={filters.startDate} onChange={(val) => handleFilterChange('startDate', val)} icon={<Calendar size={18} />} />
          <FormField label="End Date" type="date" value={filters.endDate} onChange={(val) => handleFilterChange('endDate', val)} icon={<Calendar size={18} />} />
          <FormField label="Invoice No." value={filters.invoiceNo} onChange={(val) => handleFilterChange('invoiceNo', val)} />
          <FormField label="Customer Name" value={filters.customerName} onChange={(val) => handleFilterChange('customerName', val)} icon={<Users size={18} />} />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleGenerateRegister} icon={<Filter size={16} />}>Apply Filters</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Transactions Register</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesRegisterEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.invoiceNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{entry.total.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {salesRegisterEntries.length === 0 && (
          <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500 mt-4">
            <p>No sales register entries found based on current filters.</p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="audit" onSuggest={() => console.log('AI Anomaly Detection')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default SalesRegisterPage;

