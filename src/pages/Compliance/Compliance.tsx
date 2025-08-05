// src/pages/Compliance/Compliance.tsx
import React, { useState } from 'react'; // MODIFIED: Added useState
import { Shield, FileText, AlertTriangle, CheckCircle, Plus, Calendar } from 'lucide-react'; // MODIFIED: Added Calendar
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField'; // MODIFIED: Added FormField
import { useTheme } from '../../contexts/ThemeContext';
import { useCompany } from '../../contexts/CompanyContext';
import { COUNTRIES } from '../../constants/geoData';

function Compliance() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();

  // Get country-specific compliance modules
  const countryConfig = COUNTRIES.find(c => c.code === currentCompany?.country);
  const complianceModules = countryConfig?.complianceModules || {};
  const taxType = currentCompany?.taxConfig.type || 'GST';

  const complianceStats = [
    { name: 'Tax Returns', value: '12', icon: FileText, color: 'bg-blue-500' },
    { name: 'Pending Filings', value: '3', icon: AlertTriangle, color: 'bg-red-500' },
    { name: 'Compliant', value: '98%', icon: CheckCircle, color: 'bg-green-500' },
    { name: 'Audits', value: '2', icon: Shield, color: 'bg-purple-500' },
  ];

  const upcomingDeadlines = [];

  // Dynamically add deadlines based on compliance modules
  if (complianceModules.gstr1Enabled) {
    upcomingDeadlines.push({ title: 'GSTR-1 Filing', due: '2024-01-20', priority: 'high' });
  }
  if (complianceModules.gstr3bEnabled) {
    upcomingDeadlines.push({ title: 'GSTR-3B Filing', due: '2024-01-20', priority: 'high' });
  }
  if (complianceModules.ewayBillEnabled) {
    upcomingDeadlines.push({ title: 'E-Way Bill Reconciliation', due: '2024-01-25', priority: 'medium' });
  }
  if (complianceModules.tdsEnabled) {
    upcomingDeadlines.push({ title: 'TDS Return', due: '2024-01-31', priority: 'medium' });
  }
  if (complianceModules.tcsEnabled) {
    upcomingDeadlines.push({ title: 'TCS Return', due: '2024-01-31', priority: 'medium' });
  }
  if (complianceModules.vatReturnsEnabled) {
    upcomingDeadlines.push({ title: 'VAT Return Filing', due: '2024-02-15', priority: 'high' });
  }
  if (complianceModules.salesTaxReportsEnabled) {
    upcomingDeadlines.push({ title: 'Sales Tax Filing', due: '2024-02-20', priority: 'high' });
  }
  if (complianceModules.consumptionTaxReturnsEnabled) {
    upcomingDeadlines.push({ title: 'Consumption Tax Filing', due: '2024-03-10', priority: 'high' });
  }
  if (complianceModules.basLodgementEnabled) {
    upcomingDeadlines.push({ title: 'BAS Lodgement', due: '2024-03-20', priority: 'high' });
  }
  if (complianceModules.federalTaxFormsEnabled) {
    upcomingDeadlines.push({ title: 'Federal Tax Forms', due: '2024-04-15', priority: 'medium' });
  }
  if (complianceModules.gstHstReturnsEnabled) {
    upcomingDeadlines.push({ title: 'GST/HST Returns', due: '2024-04-30', priority: 'high' });
  }
  if (complianceModules.vatDeclarationEnabled) {
    upcomingDeadlines.push({ title: 'VAT Declaration', due: '2024-05-10', priority: 'high' });
  }

  // MODIFIED: State for recurring task form
  const [showRecurringTaskForm, setShowRecurringTaskForm] = useState(false);
  const [recurringTaskData, setRecurringTaskData] = useState({
    taskName: '',
    taskType: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    recurrenceFrequency: '',
    recurrenceDueDate: '',
  });

  const handleRecurringTaskChange = (field: string, value: any) => {
    setRecurringTaskData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveRecurringTask = () => {
    console.log('Saving recurring task:', recurringTaskData);
    // Logic to save to compliance_tasks table
    // You would typically call a Supabase insert here
    setShowRecurringTaskForm(false);
    setRecurringTaskData({
      taskName: '', taskType: '', description: '', dueDate: '', priority: 'medium',
      recurrenceFrequency: '', recurrenceDueDate: ''
    });
  };

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
          {/* MODIFIED: Button to show recurring task form */}
          <Button icon={<Calendar size={16} />} onClick={() => setShowRecurringTaskForm(true)}>
            Add Recurring Task
          </Button>
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

      {/* MODIFIED: Recurring Task Form */}
      {showRecurringTaskForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Recurring Compliance Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Task Name"
              value={recurringTaskData.taskName}
              onChange={(val) => handleRecurringTaskChange('taskName', val)}
              placeholder="e.g., GSTR-1 Filing"
              required
            />
            <FormField
              label="Task Type"
              value={recurringTaskData.taskType}
              onChange={(val) => handleRecurringTaskChange('taskType', val)}
              placeholder="e.g., Tax Filing, Audit"
            />
            <FormField
              label="Description"
              value={recurringTaskData.description}
              onChange={(val) => handleRecurringTaskChange('description', val)}
              placeholder="Detailed description of the task"
              className="md:col-span-2"
            />
            <FormField
              label="Due Date (First Instance)"
              type="date"
              value={recurringTaskData.dueDate}
              onChange={(val) => handleRecurringTaskChange('dueDate', val)}
              required
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={recurringTaskData.priority}
                onChange={(e) => handleRecurringTaskChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Recurrence Frequency</label>
              <select
                value={recurringTaskData.recurrenceFrequency}
                onChange={(e) => handleRecurringTaskChange('recurrenceFrequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            {recurringTaskData.recurrenceFrequency && (
              <FormField
                label="Recurrence Due Date (e.g., 10 for 10th of month)"
                value={recurringTaskData.recurrenceDueDate}
                onChange={(val) => handleRecurringTaskChange('recurrenceDueDate', val)}
                placeholder="e.g., 10, 20, 31"
              />
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowRecurringTaskForm(false)}>Cancel</Button>
            <Button onClick={handleSaveRecurringTask}>Save Recurring Task</Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
        <div className="space-y-3">
          {upcomingDeadlines.length > 0 ? (
            upcomingDeadlines.map((item, index) => (
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
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No upcoming compliance deadlines found for your country.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Compliance;