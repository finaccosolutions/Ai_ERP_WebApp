import React from 'react';
import { Calculator, FileText, TrendingUp, DollarSign, Plus } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function Accounting() {
  const { theme } = useTheme();

  const accountingModules = [
    { name: 'Chart of Accounts', icon: Calculator, count: 250, color: 'bg-blue-500' },
    { name: 'Journal Entries', icon: FileText, count: 48, color: 'bg-green-500' },
    { name: 'Trial Balance', icon: TrendingUp, count: 1, color: 'bg-purple-500' },
    { name: 'Fixed Assets', icon: DollarSign, count: 15, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounting</h1>
          <p className="text-gray-600">Financial accounting and reporting</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Accounting Suggestions')} />
          <Button icon={<Plus size={16} />}>New Journal Entry</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {accountingModules.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.name} hover className="p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{module.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{module.count}</p>
                </div>
                <div className={`p-3 ${module.color} ${theme.borderRadius}`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">$284,750</p>
            <p className="text-sm text-gray-600">Total Assets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">$128,340</p>
            <p className="text-sm text-gray-600">Total Liabilities</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">$156,410</p>
            <p className="text-sm text-gray-600">Equity</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Accounting;