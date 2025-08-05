// src/components/Modals/TaskListFilterModal.tsx
import React from 'react';
import { X, Filter, Search, Calendar, Users, ClipboardCheck } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import AIButton from '../UI/AIButton';
import MasterSelectField from '../UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

interface TaskListFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    name: string;
    status: string;
    assignedTo: string;
    dueDateBefore: string;
    dueDateAfter: string;
    priority: string;
  };
  onApplyFilters: (filters: TaskListFilterModalProps['filters']) => void;
  onFilterChange: (key: keyof TaskListFilterModalProps['filters'], value: string) => void;
}

function TaskListFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onFilterChange,
}: TaskListFilterModalProps) {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();

  const [availableEmployees, setAvailableEmployees] = React.useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    if (currentCompany?.id) {
      fetchMasterData(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const fetchMasterData = async (companyId: string) => {
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('first_name', { ascending: true });
      if (employeesError) throw employeesError;
      setAvailableEmployees(employeesData.map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}` })) || []);
    } catch (err) {
      console.error('Error fetching master data for filter:', err);
    }
  };

  if (!isOpen) return null;

  const handleClearFilters = () => {
    onApplyFilters({
      name: '',
      status: 'all',
      assignedTo: '',
      dueDateBefore: '',
      dueDateAfter: '',
      priority: 'all',
    });
  };

  const handleAISuggestFilter = async () => {
    try {
      const aiPrompt = `Suggest relevant filters for task lists based on common project management needs. Consider task name, status, assigned employee, due date range, and priority. Provide suggestions in a structured format.`;
      const aiResponse = await suggestWithAI({ query: aiPrompt, context: 'task_list_filters' });

      if (aiResponse && aiResponse.suggestions && aiResponse.suggestions.length > 0) {
        const suggestedFilters = aiResponse.suggestions[0].filterData; // Assuming AI returns filterData
        if (suggestedFilters) {
          onApplyFilters({ ...filters, ...suggestedFilters });
        } else {
          console.warn('AI did not return specific filter data.');
        }
      }
    } catch (error) {
      console.error('AI filter suggestion error:', error);
    }
  };

  const taskStatuses = [
    { id: 'all', name: 'All Statuses' },
    { id: 'open', name: 'To-Do' },
    { id: 'in_progress', name: 'Working' },
    { id: 'on_hold', name: 'On Hold' },
    { id: 'completed', name: 'Done' },
  ];

  const taskPriorities = [
    { id: 'all', name: 'All Priorities' },
    { id: 'low', name: 'Low' },
    { id: 'medium', name: 'Medium' },
    { id: 'high', name: 'High' },
    { id: 'critical', name: 'Critical' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <Card className={`w-full max-w-4xl ${theme.cardBg}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`
                w-10 h-10 rounded-lg bg-gradient-to-r ${theme.primaryGradient}
                flex items-center justify-center text-white
              `}>
                <Filter size={20} />
              </div>
              <div>
                <h3 className={`font-semibold ${theme.textPrimary}`}>
                  Filter Tasks
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`${theme.textMuted} hover:${theme.textPrimary}`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <FormField
              label="Task Name"
              value={filters.name}
              onChange={(val) => onFilterChange('name', val)}
              placeholder="e.g., Develop Login"
              icon={<ClipboardCheck size={18} />}
            />
            <MasterSelectField
              label="Status"
              value={taskStatuses.find(status => status.id === filters.status)?.name || ''}
              onValueChange={(val) => onFilterChange('status', val)}
              onSelect={(id) => onFilterChange('status', id)}
              options={taskStatuses}
              placeholder="Filter by Status"
            />
            <MasterSelectField
              label="Assigned To"
              value={availableEmployees.find(emp => emp.id === filters.assignedTo)?.name || ''}
              onValueChange={(val) => onFilterChange('assignedTo', val)}
              onSelect={(id) => onFilterChange('assignedTo', id)}
              options={[{ id: 'all', name: 'All Staff' }, ...availableEmployees]}
              placeholder="Filter by Assigned To"
            />
            <MasterSelectField
              label="Priority"
              value={taskPriorities.find(priority => priority.id === filters.priority)?.name || ''}
              onValueChange={(val) => onFilterChange('priority', val)}
              onSelect={(id) => onFilterChange('priority', id)}
              options={taskPriorities}
              placeholder="Filter by Priority"
            />
            <FormField
              label="Due Date After"
              type="date"
              value={filters.dueDateAfter}
              onChange={(val) => onFilterChange('dueDateAfter', val)}
              icon={<Calendar size={18} />}
            />
            <FormField
              label="Due Date Before"
              type="date"
              value={filters.dueDateBefore}
              onChange={(val) => onFilterChange('dueDateBefore', val)}
              icon={<Calendar size={18} />}
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <AIButton variant="suggest" onSuggest={handleAISuggestFilter} />
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button type="button" onClick={() => onApplyFilters(filters)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default TaskListFilterModal;
