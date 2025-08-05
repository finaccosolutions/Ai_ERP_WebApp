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
import { useNavigate, useParams, useLocation } from 'react-router-dom';

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
  const location = useLocation(); // Use useLocation to access state

  const [formData, setFormData] = useState({
    id: '',
    projectName: '',
    customerId: '',
    customerName: '', // For MasterSelectField display
    referenceNo: '', // NEW: Reference No / Contract No
    categoryType: '', // NEW: Category / Type
    projectOwnerId: '', // NEW: Project Owner
    projectOwnerName: '', // For MasterSelectField display
    assignedTeamMembers: [] as string[], // NEW: Assigned Team Members (array of employee IDs)
    startDate: '',
    dueDate: '',
    expectedValue: 0, // NEW: Expected Value / Contract Amount
    billingType: 'fixed_price',
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
        // Pre-fill customer if navigated from Lead Conversion
        if (location.state?.customerId && location.state?.customerName) {
          setFormData(prev => ({
            ...prev,
            customerId: location.state.customerId,
            customerName: location.state.customerName
          }));
        }
      }
      setLoading(false);
    };

    if (currentCompany?.id) {
      initializeForm();
    }
  }, [currentCompany?.id, id, isEditMode, location.state]);

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
          project_owner:employees!projects_project_owner_id_fkey ( first_name, last_name ),
          project_team_members ( employee_id, employees ( first_name, last_name ) )
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
          referenceNo: data.reference_no || '',
          categoryType: data.category_type || '',
          projectOwnerId: data.project_owner_id || '',
          projectOwnerName: data.project_owner ? `${data.project_owner.first_name} ${data.project_owner.last_name}` : '',
          assignedTeamMembers: data.project_team_members?.map(tm => tm.employee_id) || [],
          startDate: data.start_date,
          dueDate: data.due_date,
          expectedValue: data.expected_value || 0,
          billingType: data.billing_type,
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

  const handleProjectOwnerSelect = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, projectOwnerId: id, projectOwnerName: name }));
  };

  const handleTeamMembersSelect = (selectedIds: string[]) => {
    setFormData(prev => ({ ...prev, assignedTeamMembers: selectedIds }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      projectName: '',
      customerId: '',
      customerName: '',
      referenceNo: '',
      categoryType: '',
      projectOwnerId: '',
      projectOwnerName: '',
      assignedTeamMembers: [],
      startDate: '',
      dueDate: '',
      expectedValue: 0,
      billingType: 'fixed_price',
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
    if (formData.isRecurring && !formData.recurrenceFrequency) {
      showNotification('Recurrence Frequency is required for recurring projects.', 'error');
      return false;
    }
    if (formData.isRecurring && !formData.recurrenceDueDate) {
      showNotification('Recurrence Due Date is required for recurring projects.', 'error');
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
        reference_no: formData.referenceNo || null,
        category_type: formData.categoryType || null,
        project_owner_id: formData.projectOwnerId || null,
        start_date: formData.startDate,
        due_date: formData.dueDate,
        expected_value: formData.expectedValue,
        billing_type: formData.billingType,
        status: formData.status,
        description: formData.description || null,
        is_recurring: formData.isRecurring,
        recurrence_frequency: formData.isRecurring ? formData.recurrenceFrequency || null : null,
        recurrence_due_date: formData.isRecurring ? formData.recurrenceDueDate || null : null,
        created_by: (await supabase.auth.getUser()).data.user?.id || null,
      };

      let currentProjectId = formData.id;
      if (formData.id) {
        const { error } = await supabase
          .from('projects')
          .update(projectToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Project updated successfully!', 'success');
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert(projectToSave)
          .select('id')
          .single();
        if (error) throw error;
        currentProjectId = data.id;
        showNotification('Project created successfully!', 'success');
      }

      // Handle project team members
      if (currentProjectId) {
        await supabase.from('project_team_members').delete().eq('project_id', currentProjectId);
        if (formData.assignedTeamMembers.length > 0) {
          const teamMembersToInsert = formData.assignedTeamMembers.map(employeeId => ({
            project_id: currentProjectId,
            employee_id: employeeId,
          }));
          const { error: teamMembersError } = await supabase.from('project_team_members').insert(teamMembersToInsert);
          if (teamMembersError) throw teamMembersError;
        }
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

  const categoryTypes = [
    { id: 'gst_filing', name: 'GST Filing' },
    { id: 'audit', name: 'Audit' },
    { id: 'installation', name: 'Installation' },
    { id: 'amc_service', name: 'AMC Service' },
    { id: 'software_project', name: 'Software Project' },
    { id: 'other', name: 'Other' },
  ];

  const billingTypes = [
    { id: 'fixed_price', name: 'Fixed Price' },
    { id: 'time_based', name: 'Time & Material' },
    { id: 'recurring', name: 'Recurring' },
  ];

  const recurrenceFrequencies = [
    { id: 'daily', name: 'Daily' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'quarterly', name: 'Quarterly' },
    { id: 'yearly', name: 'Yearly' },
  ];

  const projectStatuses = [
    { id: 'not_started', name: 'Not Started' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'waiting_for_client', name: 'Waiting for Client' },
    { id: 'completed', name: 'Completed' },
    { id: 'billed', name: 'Billed' },
    { id: 'closed', name: 'Closed' },
  ];

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
              General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Project / Job Name"
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
                placeholder="Select Customer"
              />
              <FormField
                label="Reference No / Contract No"
                value={formData.referenceNo}
                onChange={(val) => handleInputChange('referenceNo', val)}
                placeholder="e.g., PO-12345, CON-XYZ"
              />
              <MasterSelectField
                label="Category / Type"
                value={categoryTypes.find(type => type.id === formData.categoryType)?.name || ''}
                onValueChange={(val) => handleInputChange('categoryType', val)}
                onSelect={(id) => handleInputChange('categoryType', id)}
                options={categoryTypes}
                placeholder="Select Category"
              />
              <MasterSelectField
                label="Project Owner / Assigned Manager"
                value={formData.projectOwnerName}
                onValueChange={(val) => handleInputChange('projectOwnerName', val)}
                onSelect={handleProjectOwnerSelect}
                options={availableEmployees}
                placeholder="Select Project Owner"
              />
              <MasterSelectField
                label="Assigned Team Members"
                value={formData.assignedTeamMembers.map(id => availableEmployees.find(emp => emp.id === id)?.name || '').join(', ')}
                onValueChange={(val) => {}} // Multi-select handles its own input
                onSelect={(id, name, data) => {
                  // Toggle selection for multi-select
                  const newSelection = formData.assignedTeamMembers.includes(id)
                    ? formData.assignedTeamMembers.filter(memberId => memberId !== id)
                    : [...formData.assignedTeamMembers, id];
                  handleTeamMembersSelect(newSelection);
                }}
                options={availableEmployees}
                placeholder="Select Team Members"
                isMultiSelect={true}
                selectedValues={formData.assignedTeamMembers}
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
              <FormField
                label="Expected Value / Contract Amount"
                type="number"
                value={formData.expectedValue.toString()}
                onChange={(val) => handleInputChange('expectedValue', parseFloat(val) || 0)}
                icon={<DollarSign size={18} />}
              />
              <MasterSelectField
                label="Billing Type"
                value={billingTypes.find(type => type.id === formData.billingType)?.name || ''}
                onValueChange={(val) => handleInputChange('billingType', val)}
                onSelect={(id) => handleInputChange('billingType', id)}
                options={billingTypes}
                placeholder="Select Billing Type"
              />
              <MasterSelectField
                label="Status"
                value={projectStatuses.find(status => status.id === formData.status)?.name || ''}
                onValueChange={(val) => handleInputChange('status', val)}
                onSelect={(id) => handleInputChange('status', id)}
                options={projectStatuses}
                placeholder="Select Status"
              />
              <FormField
                label="Description / Scope of Work"
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
                <MasterSelectField
                  label="Frequency"
                  value={recurrenceFrequencies.find(freq => freq.id === formData.recurrenceFrequency)?.name || ''}
                  onValueChange={(val) => handleInputChange('recurrenceFrequency', val)}
                  onSelect={(id) => handleInputChange('recurrenceFrequency', id)}
                  options={recurrenceFrequencies}
                  placeholder="Select Frequency"
                  required
                />
                <FormField
                  label="Due day/date (e.g., 11 for 11th of month)"
                  value={formData.recurrenceDueDate}
                  onChange={(val) => handleInputChange('recurrenceDueDate', val)}
                  placeholder="e.g., 11, 25, or a specific date"
                  required
                />
              </div>
            )}
          </Card>

          {/* Attachments Section (Placeholder - actual implementation would involve Supabase Storage) */}
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <FileText size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Attachments
            </h3>
            <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg text-gray-500 cursor-pointer hover:border-blue-500 transition-colors">
              <input type="file" multiple className="hidden" />
              <p>Drag & drop files here, or click to browse</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">Max file size: 5MB. Supported formats: PDF, DOCX, JPG, PNG.</p>
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
