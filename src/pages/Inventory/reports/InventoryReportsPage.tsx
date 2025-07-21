// src/pages/Inventory/reports/InventoryReportsPage.tsx
import React, { useState } from 'react';
import {
  PieChart, LayoutGrid, ListOrdered, Clock, DollarSign, TrendingUp,
  Search, Filter, Calendar, Package, Users, BarChart3, MapPin, ArrowLeft
} from 'lucide-react'; 
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

function InventoryReportsPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    warehouse: '',
    itemGroup: '',
    item: '',
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateReport = (reportType: string) => {
    console.log(`Generating ${reportType} with filters:`, filters);
    // Logic to fetch and process report data based on reportType and filters
    // This would typically involve calling a backend API or Supabase function
  };

  const reportModules = [
    { name: 'Stock Summary Report', description: 'Item-wise closing stock, opening, inwards, outwards.', icon: PieChart, action: 'stock_summary' },
    { name: 'Warehouse-wise Stock Report', description: 'Stock levels per warehouse.', icon: LayoutGrid, action: 'warehouse_stock' },
    { name: 'Reorder Report', description: 'Items below reorder level.', icon: ListOrdered, action: 'reorder_report' },
    { name: 'Batch Expiry Report', description: 'Track expiring batches.', icon: Clock, action: 'batch_expiry' },
    { name: 'Stock Valuation Report', description: 'Financial value of current stock.', icon: DollarSign, action: 'stock_valuation' },
    { name: 'Fast-moving / Slow-moving Items Report', description: 'Identify sales velocity of items.', icon: TrendingUp, action: 'movement_report' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Inventory Reports</h1>
          <p className={theme.textSecondary}>Generate insights and reports for inventory analysis.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/inventory')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <AIButton variant="analyze" onSuggest={() => console.log('AI Report Analysis')} />
          <Button icon={<BarChart3 size={16} />}>Custom Report</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Start Date" type="date" value={filters.startDate} onChange={(val) => handleFilterChange('startDate', val)} icon={<Calendar size={18} />} />
          <FormField label="End Date" type="date" value={filters.endDate} onChange={(val) => handleFilterChange('endDate', val)} icon={<Calendar size={18} />} />
          <FormField label="Warehouse" value={filters.warehouse} onChange={(val) => handleFilterChange('warehouse', val)} icon={<MapPin size={18} />} />
          <FormField label="Item Group" value={filters.itemGroup} onChange={(val) => handleFilterChange('itemGroup', val)} icon={<Users size={18} />} />
          <FormField label="Item" value={filters.item} onChange={(val) => handleFilterChange('item', val)} icon={<Package size={18} />} />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => handleGenerateReport('all')} icon={<Filter size={16} />}>Apply Filters</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Available Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportModules.map((module, index) => {
            const Icon = module.icon;
            const colors = [
              'bg-gradient-to-br from-emerald-50 to-emerald-100',
              'bg-gradient-to-br from-sky-50 to-sky-100',
              'bg-gradient-to-br from-purple-50 to-purple-100',
              'bg-gradient-to-br from-orange-50 to-orange-100',
              'bg-gradient-to-br from-teal-50 to-teal-100',
              'bg-gradient-to-br from-indigo-50 to-indigo-100',
            ];
            const textColor = [
              'text-emerald-800',
              'text-sky-800',
              'text-purple-800',
              'text-orange-800',
              'text-teal-800',
              'text-indigo-800',
            ];
            const iconBg = [
              'bg-emerald-500',
              'bg-sky-500',
              'bg-purple-500',
              'bg-orange-500',
              'bg-teal-500',
              'bg-indigo-500',
            ];

            return (
              <Card
                key={module.name}
                hover
                className={`
                  p-4 cursor-pointer group relative overflow-hidden flex-1 flex flex-col justify-between
                  ${colors[index % colors.length]}
                  transform transition-all duration-300 ease-in-out
                  hover:translate-y-[-6px] hover:shadow-2xl hover:ring-2 hover:ring-[${theme.hoverAccent}] hover:ring-opacity-75
                `}
                onClick={() => handleGenerateReport(module.action)}
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
                <div className="relative z-10">
                  <h3
                    className={`text-xl font-bold ${textColor[index % textColor.length]} group-hover:text-[${theme.hoverAccent}] transition-colors`}
                  >
                    {module.name}
                  </h3>
                  <p className={`text-sm ${theme.textMuted}`}>
                    {module.description}
                  </p>
                </div>
                <div className="flex items-center justify-end mt-3 relative z-10">
                  <div
                    className={`
                      p-3 rounded-2xl shadow-md
                      ${iconBg[index % iconBg.length]} text-white
                      group-hover:scale-125 transition-transform duration-300
                    `}
                  >
                    <Icon size={24} className="text-white" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Report Output</h3>
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>Report results will appear here after generation.</p>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Inventory Forecasting')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default InventoryReportsPage;
