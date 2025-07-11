import React from 'react';
import { Users, TrendingUp, Phone, Mail, Plus } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function CRM() {
  const { theme } = useTheme();

  const crmStats = [
    { name: 'Total Leads', value: '1,247', icon: Users, color: 'bg-blue-500' },
    { name: 'Conversion Rate', value: '24%', icon: TrendingUp, color: 'bg-green-500' },
    { name: 'Follow-ups', value: '89', icon: Phone, color: 'bg-orange-500' },
    { name: 'Campaigns', value: '12', icon: Mail, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Relationship Management</h1>
          <p className="text-gray-600">Manage leads, customers, and sales pipeline</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI CRM Suggestions')} />
          <Button icon={<Plus size={16} />}>Add Lead</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {crmStats.map((stat) => {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Pipeline</h3>
        <div className="space-y-3">
          {[
            { company: 'ABC Corp', contact: 'John Smith', stage: 'Proposal', value: '$25,000' },
            { company: 'XYZ Ltd', contact: 'Jane Doe', stage: 'Negotiation', value: '$18,500' },
            { company: 'Demo Inc', contact: 'Mike Johnson', stage: 'Follow-up', value: '$12,000' },
          ].map((lead, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{lead.company}</p>
                <p className="text-sm text-gray-600">{lead.contact}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{lead.value}</p>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {lead.stage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default CRM;