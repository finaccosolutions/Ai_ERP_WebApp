import React from 'react';
import { BarChart3, TrendingUp, FileText, Download, Plus } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function Reports() {
  const { theme } = useTheme();

  const reportCategories = [
    { name: 'Financial Reports', count: 25, icon: TrendingUp, color: 'bg-blue-500' },
    { name: 'Sales Reports', count: 18, icon: BarChart3, color: 'bg-green-500' },
    { name: 'Inventory Reports', count: 12, icon: FileText, color: 'bg-purple-500' },
    { name: 'Custom Reports', count: 8, icon: FileText, color: 'bg-orange-500' },
  ];

  const popularReports = [
    { name: 'Profit & Loss Statement', category: 'Financial', lastGenerated: '2 hours ago' },
    { name: 'Sales Summary', category: 'Sales', lastGenerated: '1 day ago' },
    { name: 'Inventory Valuation', category: 'Inventory', lastGenerated: '3 days ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate insights and reports for business decisions</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="analyze" onSuggest={() => console.log('AI Report Analysis')} />
          <Button icon={<Plus size={16} />}>Custom Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.name} hover className="p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{category.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{category.count}</p>
                </div>
                <div className={`p-3 ${category.color} ${theme.borderRadius}`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Reports</h3>
        <div className="space-y-3">
          {popularReports.map((report, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{report.name}</p>
                <p className="text-sm text-gray-600">{report.category}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{report.lastGenerated}</span>
                <Button size="sm" variant="outline" icon={<Download size={14} />}>
                  Generate
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Reports;