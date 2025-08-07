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

interface ProjectCategoryOption { // NEW
  id: string;
  name: string;
  is_recurring_category: boolean;
  recurrence_frequency: string | null;
  recurrence_due_day: number | null;
  recurrence_due_month: number | null;
  billing_type: string;
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
    projectCategoryId: '', // Changed from categoryType
    projectCategoryName: '', // For MasterSelectField display
    projectOwnerId: '', // NEW: Project Owner
    projectOwnerName: '', // For MasterSelectField display
    assignedTeamMembers: [] as string[], // NEW: Assigned Team Members (array of employee IDs)
    startDate: '',
    actualDueDate: '', // Changed from dueDate
    expectedValue: 0, // NEW: Expected Value / Contract Amount
    status: 'not_started',
    description: '',
  });

  const [availableCustomers, setAvailableCustomers] = useState<CustomerOption[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<EmployeeOption[]>([]);
  const [availableProjectCategories, setAvailableProjectCategories] = useState<ProjectCategoryOption[]>([]); // NEW

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
        // If returned from ProjectCategoryFormPage after creating a new category
        if (location.state?.fromProjectCategoryCreation && location.state?.projectFormData) {
          setFormData(location.state.projectFormData); // Restore previous form data
          if (location.state.createdCategoryId) {
            // Set the newly created category
            setFormData(prev => ({
              ...prev,
              projectCategoryId: location.state.createdCategoryId,
              projectCategoryName: location.state.createdCategoryName
            }));
          }
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

      // NEW: Fetch Project Categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('project_categories')
        .select('id, name, is_recurring_category, recurrence_frequency, recurrence_due_day, recurrence_due_month, billing_type')
        .eq('company_id', companyId);
      if (categoriesError) throw categoriesError;
      setAvailableProjectCategories(categoriesData || []);

    } catch (error) {
      console.error('Error fetching master data:', error);
      showNotification('Failed to load customers, employees, or project categories.', 'error');
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
          project_team_members ( employee_id, employees ( first_name, last_name ) ),
          project_categories ( name, is_recurring_category, recurrence_frequency, recurrence_due_day, recurrence_due_month, billing_type )
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
          projectCategoryId: data.project_category_id || '', // Changed from categoryType
          projectCategoryName: data.project_categories?.name || '', // For MasterSelectField display
          projectOwnerId: data.project_owner_id || '',
          projectOwnerName: data.project_owner ? `${data.project_owner.first_name} ${data.project_owner.last_name}` : '',
          assignedTeamMembers: data.project_team_members?.map(tm => tm.employee_id) || [],
          startDate: data.start_date,
          actualDueDate: data.actual_due_date, // Changed from due_date
          expectedValue: data.expected_value || 0,
          status: data.status,
          description: data.description || '',
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

  const handleProjectCategorySelect = (id: string, name: string, data: ProjectCategoryOption) => { // NEW
    setFormData(prev => ({ ...prev, projectCategoryId: id, projectCategoryName: name }));
    // Automatically set billing type from category if it's not already set or if category changes
    // This logic is now handled in ProjectCategoryFormPage, but keeping this for reference if needed
    // if (data.billing_type && formData.billingType === 'fixed_price') { // Only auto-set if default
    //   setFormData(prev => ({ ...prev, billingType: data.billing_type }));
    // }
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
      projectCategoryId: '',
      projectCategoryName: '',
      projectOwnerId: '',
      projectOwnerName: '',
      assignedTeamMembers: [],
      startDate: '',
      actualDueDate: '',
      expectedValue: 0,
      status: 'not_started',
      description: '',
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
    if (!formData.projectCategoryId) { // NEW: Project Category is required
      showNotification('Project Category is required.', 'error');
      return false;
    }

    const selectedCategory = availableProjectCategories.find(cat => cat.id === formData.projectCategoryId);

    if (!selectedCategory?.is_recurring_category) { // If not a recurring category, actual_due_date is required
      if (!formData.actualDueDate) {
        showNotification('Due Date is required for non-recurring projects.', 'error');
        return false;
      }
      if (new Date(formData.startDate) > new Date(formData.actualDueDate)) {
        showNotification('Due Date cannot be before Start Date.', 'error');
        return false;
      }
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
        project_category_id: formData.projectCategoryId || null, // Changed from category_type
        project_owner_id: formData.projectOwnerId || null,
        start_date: formData.startDate,
        actual_due_date: formData.actualDueDate || null, // Changed from due_date, set to null if not required by category
        expected_value: formData.expectedValue,
        status: formData.status,
        description: formData.description || null,
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

  const projectStatuses = [
    { id: 'not_started', name: 'Not Started' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'waiting_for_client', name: 'Waiting for Client' },
    { id: 'completed', name: 'Completed' },
    { id: 'billed', name: 'Billed' },
    { id: 'closed', name: 'Closed' },
  ];

  const selectedCategory = availableProjectCategories.find(cat => cat.id === formData.projectCategoryId);
  const isRecurringCategorySelected = selectedCategory?.is_recurring_category;

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
                label="Project Category" // Changed from Category / Type
                value={formData.projectCategoryName}
                onValueChange={(val) => handleInputChange('projectCategoryName', val)}
                onSelect={handleProjectCategorySelect}
                options={availableProjectCategories}
                placeholder="Select Project Category"
                required
                allowCreation={true} // Allow creating new categories
                onNewValueConfirmed={(name) => navigate('/project/categories/new', { state: { initialName: name, fromProjectForm: true, projectFormData: formData, returnPath: location.pathname + location.search } })}
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
              {/* Conditional Due Date based on category recurrence */}
              {!isRecurringCategorySelected && (
                <FormField
                  label="Due Date" // Changed from Due Date
                  type="date"
                  value={formData.actualDueDate}
                  onChange={(val) => handleInputChange('actualDueDate', val)}
                  required={!isRecurringCategorySelected}
                />
              )}
              <FormField
                label="Expected Value / Contract Amount"
                type="number"
                value={formData.expectedValue.toString()}
                onChange={(val) => handleInputChange('expectedValue', parseFloat(val) || 0)}
                icon={<DollarSign size={18} />}
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
