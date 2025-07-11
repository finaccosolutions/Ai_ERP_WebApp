import React from 'react';
import { Building, FileText, Package, CreditCard, TrendingUp, Plus } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function Purchase() {
  const { theme } = useTheme();

  const purchaseModules = [
    { name: 'Vendors', icon: Building, count: 145, color: 'bg-blue-500' },
    { name: 'Purchase Orders', icon: FileText, count: 23, color: 'bg-green-500' },
    { name: 'Goods Receipt', icon: Package, count: 18, color: 'bg-purple-500' },
    { name: 'Bills', icon: CreditCard, count: 12, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Management</h1>
          <p className="text-gray-600">Manage vendors, purchase orders, and procurement</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Purchase Suggestions')} />
          <Button icon={<Plus size={16} />}>New Purchase Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {purchaseModules.map((module) => {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Purchase Orders</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">PO-{String(i).padStart(3, '0')}</p>
                <p className="text-sm text-gray-600">Vendor {i}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">${(i * 1500).toLocaleString()}</p>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Pending
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Purchase;