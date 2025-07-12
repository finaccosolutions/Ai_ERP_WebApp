import React, { useState } from 'react';
import { PieChart, Search, BarChart3, Filter, Calendar, Package, Users } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import DashboardChart from '../../components/Dashboard/DashboardChart'; // Reusing DashboardChart
import { useTheme } from '../../contexts/ThemeContext';

function SalesAnalysisPage() {
  const { theme } = useTheme();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    product: '',
    customer: '',
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateAnalysis = () => {
    console.log('Generating sales analysis with filters:', filters);
    // Logic to fetch and process sales analysis data
  };

  // Mock data for charts
  const salesOverTimeData = [
    { month: 'Jan', sales: 120000 },
    { month: 'Feb', sales: 150000 },
    { month: 'Mar', sales: 130000 },
    { month: 'Apr', sales: 180000 },
    { month: 'May', sales: 160000 },
    { month: 'Jun', sales: 200000 },
  ];

  const salesByCategoryData = [
    { name: 'Electronics', value: 400000 },
    { name: 'Apparel', value: 250000 },
    { name: 'Home Goods', value: 150000 },
    { name: 'Books', value: 100000 },
  ];

  const topCustomersData = [
    { name: 'ABC Corp', value: 300000 },
    { name: 'XYZ Solutions', value: 200000 },
    { name: 'Global Traders', value: 150000 },
    { name: 'Tech Innovations', value: 100000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Analysis</h1>
          <p className={theme.textSecondary}>Gain detailed insights into your sales performance.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="analyze" onSuggest={() => console.log('AI Sales Analysis')} />
          <Button icon={<BarChart3 size={16} />} onClick={handleGenerateAnalysis}>Generate Analysis</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Analysis Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField label="Start Date" type="date" value={filters.startDate} onChange={(val) => handleFilterChange('startDate', val)} icon={<Calendar size={18} />} />
          <FormField label="End Date" type="date" value={filters.endDate} onChange={(val) => handleFilterChange('endDate', val)} icon={<Calendar size={18} />} />
          <FormField label="Product" value={filters.product} onChange={(val) => handleFilterChange('product', val)} icon={<Package size={18} />} />
          <FormField label="Customer" value={filters.customer} onChange={(val) => handleFilterChange('customer', val)} icon={<Users size={18} />} />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleGenerateAnalysis} icon={<Filter size={16} />}>Apply Filters</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Over Time</h3>
          <DashboardChart data={salesOverTimeData} type="line" height={300} />
        </Card>

        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales by Category</h3>
          <DashboardChart data={salesByCategoryData} type="pie" height={300} />
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Top Customers by Sales</h3>
          <DashboardChart data={topCustomersData} type="bar" height={300} />
        </Card>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Performance Overview</h3>
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Detailed sales performance metrics and tables will appear here.</p>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Sales Forecasting')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default SalesAnalysisPage;
