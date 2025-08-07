// src/components/Modals/ProjectListFilterModal.tsx
import React from 'react';
import { X, Filter, Search, Calendar, Users, DollarSign, FileText, Check } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import AIButton from '../UI/AIButton';
import MasterSelectField from '../UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

interface ProjectListFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    customer: string;
    assignedStaff: string;
    status: string;
    projectCategory: string; // Changed from billingType
    startDate: string;
    endDate: string;
    isRecurring: string;
    overdue: string;
    upcoming_due: string;
  };
  onApplyFilters: (filters: ProjectListFilterModalProps['filters']) => void;
  onFilterChange: (key: keyof ProjectListFilterModalProps['filters'], value: string) => void;
}

function ProjectListFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onFilterChange,
}: ProjectListFilterModalProps) {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();

  const [availableCustomers, setAvailableCustomers] = React.useState<{ id: string; name: string }[]>([]);
  const [availableStaff, setAvailableStaff] = React.useState<{ id: string; name: string }[]>([]);
  const [availableProjectCategories, setAvailableProjectCategories] = React.useState<{ id: string; name: string }[]>([]); // NEW

  React.useEffect(() => {
    if (currentCompany?.id) {
      fetchMasterData(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const fetchMasterData = async (companyId: string) => {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (customersError) throw customersError;
      setAvailableCustomers(customersData || []);

      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('first_name', { ascending: true });
      if (employeesError) throw employeesError;
      setAvailableStaff(employeesData.map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}` })) || []);

      // NEW: Fetch Project Categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('project_categories')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name', { ascending: true });
      if (categoriesError) throw categoriesError;
      setAvailableProjectCategories(categoriesData || []);

    } catch (err) {
      console.error('Error fetching master data for filter:', err);
    }
  };

  if (!isOpen) return null;

  const handleClearFilters = () => {
    onApplyFilters({
      customer: '',
      assignedStaff: '',
      status: 'all',
      projectCategory: '', // Changed from billingType
      startDate: '',
      endDate: '',
      isRecurring: 'all',
      overdue: 'false',
      upcoming_due: 'false',
    });
  };

  const handleAISuggestFilter = async () => {
    try {
      const aiPrompt = `Suggest relevant filters for project lists based on common project management needs. Consider customer, assigned staff, status, project category, date ranges, and recurrence. Provide suggestions in a structured format.`;
      const aiResponse = await suggestWithAI({ query: aiPrompt, context: 'project_list_filters' });

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

  const projectStatuses = [
    { id: 'all', name: 'All Statuses' },
    { id: 'not_started', name: 'Not Started' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'waiting_for_client', name: 'Waiting for Client' },
    { id: 'completed', name: 'Completed' },
    { id: 'billed', name: 'Billed' },
    { id: 'closed', name: 'Closed' },
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
                  Filter Projects
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
            <MasterSelectField
              label="Customer"
              value={availableCustomers.find(cust => cust.id === filters.customer)?.name || ''}
              onValueChange={(val) => onFilterChange('customer', val)}
              onSelect={(id) => onFilterChange('customer', id)}
              options={[{ id: 'all', name: 'All Customers' }, ...availableCustomers]}
              placeholder="Select Customer"
            />
            <MasterSelectField
              label="Assigned Staff"
              value={availableStaff.find(staff => staff.id === filters.assignedStaff)?.name || ''}
              onValueChange={(val) => onFilterChange('assignedStaff', val)}
              onSelect={(id) => onFilterChange('assignedStaff', id)}
              options={[{ id: 'all', name: 'All Staff' }, ...availableStaff]}
              placeholder="Select Staff"
            />
            <MasterSelectField
              label="Status"
              value={projectStatuses.find(status => status.id === filters.status)?.name || ''}
              onValueChange={(val) => onFilterChange('status', val)}
              onSelect={(id) => onFilterChange('status', id)}
              options={projectStatuses}
              placeholder="Select Status"
            />
            <MasterSelectField // NEW: Project Category Filter
              label="Project Category"
              value={availableProjectCategories.find(cat => cat.id === filters.projectCategory)?.name || ''}
              onValueChange={(val) => onFilterChange('projectCategory', val)}
              onSelect={(id) => onFilterChange('projectCategory', id)}
              options={[{ id: 'all', name: 'All Categories' }, ...availableProjectCategories]}
              placeholder="Select Category"
            />
            <FormField
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(val) => onFilterChange('startDate', val)}
              icon={<Calendar size={18} />}
            />
            <FormField
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(val) => onFilterChange('endDate', val)}
              icon={<Calendar size={18} />}
            />
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Is Recurring
              </label>
              <select
                value={filters.isRecurring}
                onChange={(e) => onFilterChange('isRecurring', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                <option value="all">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="overdue"
                checked={filters.overdue === 'true'}
                onChange={(e) => onFilterChange('overdue', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]"
              />
              <label htmlFor="overdue" className={`text-sm font-medium ${theme.textPrimary}`}>
                Show Overdue Projects
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="upcoming_due"
                checked={filters.upcoming_due === 'true'}
                onChange={(e) => onFilterChange('upcoming_due', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]"
              />
              <label htmlFor="upcoming_due" className={`text-sm font-medium ${theme.textPrimary}`}>
                Show Upcoming Due (7 days)
              </label>
            </div>
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

export default ProjectListFilterModal;