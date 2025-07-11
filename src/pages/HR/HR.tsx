import React from 'react';
import { Users, Clock, DollarSign, Calendar, Plus } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function HR() {
  const { theme } = useTheme();

  const hrStats = [
    { name: 'Total Employees', value: '245', icon: Users, color: 'bg-blue-500' },
    { name: 'Present Today', value: '238', icon: Clock, color: 'bg-green-500' },
    { name: 'Payroll (Monthly)', value: '$125K', icon: DollarSign, color: 'bg-purple-500' },
    { name: 'Leave Requests', value: '12', icon: Calendar, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Human Resources</h1>
          <p className="text-gray-600">Manage employees, attendance, and payroll</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI HR Suggestions')} />
          <Button icon={<Plus size={16} />}>Add Employee</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {hrStats.map((stat) => {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {[
            { activity: 'John Doe submitted leave request', time: '2 hours ago', type: 'leave' },
            { activity: 'Payroll processed for January', time: '1 day ago', type: 'payroll' },
            { activity: 'New employee onboarded', time: '3 days ago', type: 'employee' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{item.activity}</p>
                <p className="text-sm text-gray-600">{item.time}</p>
              </div>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {item.type}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default HR;