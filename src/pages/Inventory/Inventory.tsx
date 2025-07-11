import React from 'react';
import { Package, Warehouse, AlertTriangle, BarChart3, Plus } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function Inventory() {
  const { theme } = useTheme();

  const inventoryStats = [
    { name: 'Total Items', value: '8,945', icon: Package, color: 'bg-blue-500' },
    { name: 'Low Stock', value: '23', icon: AlertTriangle, color: 'bg-red-500' },
    { name: 'Locations', value: '8', icon: Warehouse, color: 'bg-green-500' },
    { name: 'Value', value: '$1.2M', icon: BarChart3, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track stock levels, locations, and valuations</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Inventory Suggestions')} />
          <Button icon={<Plus size={16} />}>Add Item</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventoryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} hover className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 ${stat.color} ${theme.borderRadius}`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
              <div>
                <p className="font-medium text-gray-900">Product {i}</p>
                <p className="text-sm text-gray-600">Current Stock: {i * 5} units</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-600">Reorder Level: {i * 10} units</p>
                <Button size="sm" variant="outline">Reorder</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Inventory;