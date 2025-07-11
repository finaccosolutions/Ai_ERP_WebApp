import React from 'react';
import { Shield, FileText, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useCompany } from '../../contexts/CompanyContext';

function Compliance() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();

  const complianceStats = [
    { name: 'Tax Returns', value: '12', icon: FileText, color: 'bg-blue-500' },
    { name: 'Pending Filings', value: '3', icon: AlertTriangle, color: 'bg-red-500' },
    { name: 'Compliant', value: '98%', icon: CheckCircle, color: 'bg-green-500' },
    { name: 'Audits', value: '2', icon: Shield, color: 'bg-purple-500' },
  ];

  const taxType = currentCompany?.taxConfig.type || 'GST';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance & Taxation</h1>
          <p className="text-gray-600">Manage {taxType} compliance and regulatory requirements</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Compliance Suggestions')} />
          <Button icon={<Plus size={16} />}>File Return</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {complianceStats.map((stat) => {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
        <div className="space-y-3">
          {[
            { title: 'GST Return Filing', due: '2024-01-20', priority: 'high' },
            { title: 'TDS Return', due: '2024-01-25', priority: 'medium' },
            { title: 'Annual Filing', due: '2024-03-31', priority: 'low' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-600">Due: {item.due}</p>
              </div>
              <span className={`
                px-2 py-1 text-xs rounded-full
                ${item.priority === 'high' ? 'bg-red-100 text-red-800' :
                  item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'}
              `}>
                {item.priority} priority
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Compliance;