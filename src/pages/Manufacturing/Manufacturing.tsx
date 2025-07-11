import React from 'react';
import { Settings, FileText, Package, Clock, Plus } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function Manufacturing() {
  const { theme } = useTheme();

  const manufacturingStats = [
    { name: 'Active BOMs', value: '156', icon: FileText, color: 'bg-blue-500' },
    { name: 'Work Orders', value: '24', icon: Settings, color: 'bg-green-500' },
    { name: 'In Production', value: '8', icon: Package, color: 'bg-orange-500' },
    { name: 'Completed', value: '142', icon: Clock, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manufacturing</h1>
          <p className="text-gray-600">Manage production, BOMs, and work orders</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Manufacturing Suggestions')} />
          <Button icon={<Plus size={16} />}>New Work Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {manufacturingStats.map((stat) => {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Schedule</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Work Order WO-{String(i).padStart(3, '0')}</p>
                <p className="text-sm text-gray-600">Product {i} - {i * 100} units</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Due: {new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  In Progress
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Manufacturing;