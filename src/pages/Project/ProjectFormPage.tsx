// src/pages/Project/ProjectFormPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Save, ArrowLeft, ClipboardCheck, Users, Calendar, DollarSign, FileText } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate, useParams } from 'react-router-dom';

interface CustomerOption {
  id: string;
  name: string;
}

interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  name: string; // Combined for display
}

function ProjectFormPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get ID from URL for edit mode

  const [formData, setFormData] = useState({
    id: '',
    projectName: '',
    customerId: '',
    customerName: '', // For MasterSelectField display
    startDate: '',
    dueDate: '',
    billingType: 'fixed_price',
    assignedStaffId: '',
    assignedStaffName: '', // For MasterSelectField display
    status: 'not_started',
    description: '',
    isRecurring: false,
    recurrenceFrequency: '',
    recurrenceDueDate: '',
  });

  const [availableCustomers, setAvailableCustomers] = useState<CustomerOption[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<EmployeeOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!id;

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      await fetchMastersData(currentCompany?.id as string);
      if (isEditMode) {
        await fetchProjectData(id as string);
      } else {
        resetForm();
      }
      setLoading(false);
    };

    if (currentCompany?.id) {
      initializeForm();
    }
  }, [currentCompany?.id, id, isEditMode]);

  const fetchMastersData = async (companyId: string) => {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (customersError) throw customersError;
      setAvailableCustomers(customersData || []);

      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .eq('status', 'active');
      if (employeesError) throw employeesError;
      setAvailableEmployees(employeesData.map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}`, first_name: emp.first_name, last_name: emp.last_name })) || []);

    } catch (error) {
      console.error('Error fetching master data:', error);
      showNotification('Failed to load customers or employees.', 'error');
    }
  };

  const fetchProjectData = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customers ( name ),
          employees ( first_name, last_name )
        `)
        .eq('id', projectId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          projectName: data.project_name,
          customerId: data.customer_id || '',
          customerName: data.customers?.name || '',
          startDate: data.start_date,
          dueDate: data.due_date,
          billingType: data.billing_type,
          assignedStaffId: data.assigned_staff_id || '',
          assignedStaffName: data.employees ? `${data.employees.first_name} ${data.employees.last_name}` : '',
          status: data.status,
          description: data.description || '',
          isRecurring: data.is_recurring,
          recurrenceFrequency: data.is_recurring ? data.recurrence_frequency || '' : '',
          recurrenceDueDate: data.is_recurring ? data.recurrence_due_date || '' : '',
        });
      }
    } catch (err: any) {
      showNotification(`Error loading project: ${err.message}`, 'error');
      console.error('Error loading project:', err);
      navigate('/project/list');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, customerId: id, customerName: name }));
  };

  const handleEmployeeSelect = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, assignedStaffId: id, assignedStaffName: name }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      projectName: '',
      customerId: '',
      customerName: '',
      startDate: '',
      dueDate: '',
      billingType: 'fixed_price',
      assignedStaffId: '',
      assignedStaffName: '',
      status: 'not_started',
      description: '',
      isRecurring: false,
      recurrenceFrequency: '',
      recurrenceDueDate: '',
    });
  };

  const validateForm = () => {
    if (!formData.projectName.trim()) {
      showNotification('Project Name is required.', 'error');
      return false;
    }
    if (!formData.startDate) {
      showNotification('Start Date is required.', 'error');
      return false;
    }
    if (!formData.dueDate) {
      showNotification('Due Date is required.', 'error');
      return false;
    }
    if (new Date(formData.startDate) > new Date(formData.dueDate)) {
      showNotification('Due Date cannot be before Start Date.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!currentCompany?.id) {
      showNotification('Company information is missing. Please select a company.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const projectToSave = {
        company_id: currentCompany.id,
        project_name: formData.projectName,
        customer_id: formData.customerId || null,
        start_date: formData.startDate,
        due_date: formData.dueDate,
        billing_type: formData.billingType,
        assigned_staff_id: formData.assignedStaffId || null,
        status: formData.status,
        description: formData.description || null,
        is_recurring: formData.isRecurring,
        recurrence_frequency: formData.isRecurring ? formData.recurrenceFrequency || null : null,
        recurrence_due_date: formData.isRecurring ? formData.recurrenceDueDate || null : null,
        created_by: supabase.auth.getUser().then(res => res.data.user?.id).catch(() => null), // Assuming created_by is current user
      };

      if (formData.id) {
        const { error } = await supabase
          .from('projects')
          .update(projectToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Project updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('projects')
          .insert(projectToSave);
        if (error) throw error;
        showNotification('Project created successfully!', 'success');
      }
      navigate('/project/list');
      resetForm();
    } catch (err: any) {
      showNotification(`Failed to save project: ${err.message}`, 'error');
      console.error('Save project error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {isEditMode ? 'Edit Project' : 'Create New Project'}
          </h1>
          <p className={theme.textSecondary}>
            {isEditMode ? 'Update project details and milestones.' : 'Start a new project and define its scope.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/project/list')} icon={<ArrowLeft size={16} />}>
          Back to Projects List
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <ClipboardCheck size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Project Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Project Name"
                value={formData.projectName}
                onChange={(val) => handleInputChange('projectName', val)}
                placeholder="e.g., Website Redesign, ERP Implementation"
                required
              />
              <MasterSelectField
                label="Customer"
                value={formData.customerName}
                onValueChange={(val) => handleInputChange('customerName', val)}
                onSelect={handleCustomerSelect}
                options={availableCustomers}
                placeholder="Select Customer (Optional)"
              />
              <FormField
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(val) => handleInputChange('startDate', val)}
                required
              />
              <FormField
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(val) => handleInputChange('dueDate', val)}
                required
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Billing Type</label>
                <select
                  value={formData.billingType}
                  onChange={(e) => handleInputChange('billingType', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  <option value="fixed_price">Fixed Price</option>
                  <option value="time_based">Time Based</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>
              <MasterSelectField
                label="Assigned To"
                value={formData.assignedStaffName}
                onValueChange={(val) => handleInputChange('assignedStaffName', val)}
                onSelect={handleEmployeeSelect}
                options={availableEmployees}
                placeholder="Assign Staff (Optional)"
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_client">Waiting for Client</option>
                  <option value="completed">Completed</option>
                  <option value="billed">Billed</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <FormField
                label="Description"
                value={formData.description}
                onChange={(val) => handleInputChange('description', val)}
                placeholder="Detailed project description and scope"
                className="md:col-span-2"
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <Calendar size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Recurrence (Optional)
            </h3>
            <div className="flex items-center space-x-3 mb-4">
              <input type="checkbox" id="isRecurring" checked={formData.isRecurring} onChange={(e) => handleInputChange('isRecurring', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
              <label htmlFor="isRecurring" className={`text-sm font-medium ${theme.textPrimary}`}>Is Recurring Project</label>
            </div>
            {formData.isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>Recurrence Frequency</label>
                  <select
                    value={formData.recurrenceFrequency}
                    onChange={(e) => handleInputChange('recurrenceFrequency', e.target.value)}
                    className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                  >
                    <option value="">Select Frequency</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <FormField
                  label="Recurrence Due Date"
                  type="date"
                  value={formData.recurrenceDueDate}
                  onChange={(val) => handleInputChange('recurrenceDueDate', val)}
                />
              </div>
            )}
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/project/list')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} icon={<Save size={16} />}>
              {isSubmitting ? 'Saving...' : 'Save Project'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProjectFormPage;
