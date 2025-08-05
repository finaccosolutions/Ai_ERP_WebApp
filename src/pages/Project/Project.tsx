import React from 'react';
import { ClipboardCheck, Plus } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function Project() {
  const { theme } = useTheme();

  const projectStats = [
    { name: 'Total Projects', value: '0', icon: ClipboardCheck, color: 'bg-blue-500' },
    { name: 'In Progress', value: '0', icon: ClipboardCheck, color: 'bg-green-500' },
    { name: 'Due Soon', value: '0', icon: ClipboardCheck, color: 'bg-orange-500' },
    { name: 'Completed', value: '0', icon: ClipboardCheck, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600">Manage your projects, tasks, and time tracking</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Project Suggestions')} />
          <Button icon={<Plus size={16} />}>Create New Project</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projectStats.map((stat) => {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>No recent projects found. Create a new project to get started.</p>
        </div>
      </Card>
    </div>
  );
}

export default Project;