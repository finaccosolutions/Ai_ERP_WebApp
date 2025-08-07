// src/pages/Project/TaskFormPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Save, ArrowLeft, ClipboardCheck, Users, Calendar, FileText, Clock, Tag } from 'lucide-react'; // ADDED Clock, Tag
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

interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  name: string; // Combined for display
}

function TaskFormPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>(); // Get projectId and taskId from URL

  const [formData, setFormData] = useState({
    id: '',
    taskName: '',
    assignedToId: '',
    assignedToName: '', // For MasterSelectField display
    status: 'open',
    startDate: '', // NEW: Start Date
    dueDate: '',
    priority: 'medium', // NEW: Priority
    description: '',
    estimatedDurationMinutes: 0, // ADDED: estimatedDurationMinutes
  });

  const [availableEmployees, setAvailableEmployees] = useState<EmployeeOption[]>([]);
  const [projectDetails, setProjectDetails] = useState<any>(null); // To display project name

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!taskId;

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      await fetchProjectDetails(projectId as string); // Fetch project details first
      await fetchEmployees(currentCompany?.id as string);
      if (isEditMode) {
        await fetchTaskData(taskId as string);
      } else {
        resetForm();
      }
      setLoading(false);
    };

    if (currentCompany?.id) {
      initializeForm();
    }
  }, [currentCompany?.id, projectId, taskId, isEditMode]);

  const fetchProjectDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('project_name')
        .eq('id', id)
        .eq('company_id', currentCompany?.id)
        .single();
      if (error) throw error;
      setProjectDetails(data);
    } catch (err: any) {
      showNotification(`Error fetching project details: ${err.message}`, 'error');
      console.error('Error fetching project details:', err);
      navigate('/project/list'); // Redirect if project not found
    }
  };

  const fetchEmployees = async (companyId: string) => {
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .eq('status', 'active');
      if (employeesError) throw employeesError;
      setAvailableEmployees(employeesData.map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}`, first_name: emp.first_name, last_name: emp.last_name })) || []);

    } catch (error) {
      console.error('Error fetching employees:', error);
      showNotification('Failed to load employees.', 'error');
    }
  };

  const fetchTaskData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          employees ( first_name, last_name )
        `)
        .eq('id', id)
        .eq('project_id', projectId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          taskName: data.task_name,
          assignedToId: data.assigned_to_id || '',
          assignedToName: data.employees ? `${data.employees.first_name} ${data.employees.last_name}` : '',
          status: data.status,
          startDate: data.start_date || '',
          dueDate: data.due_date || '',
          priority: data.priority || 'medium',
          description: data.description || '',
          estimatedDurationMinutes: data.estimated_duration_minutes || 0, // ADDED
        });
      }
    } catch (err: any) {
      showNotification(`Error loading task: ${err.message}`, 'error');
      console.error('Error loading task:', err);
      navigate(`/project/${projectId}/tasks`);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmployeeSelect = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, assignedToId: id, assignedToName: name }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      taskName: '',
      assignedToId: '',
      assignedToName: '',
      status: 'open',
      startDate: '',
      dueDate: '',
      priority: 'medium',
      description: '',
      estimatedDurationMinutes: 0, // ADDED
    });
  };

  const validateForm = () => {
    if (!formData.taskName.trim()) {
      showNotification('Task Name is required.', 'error');
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
    // ADDED: Validation for estimatedDurationMinutes
    if (formData.estimatedDurationMinutes < 0) {
      showNotification('Estimated Duration cannot be negative.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!projectId) {
      showNotification('Project ID is missing.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const taskToSave = {
        project_id: projectId,
        task_name: formData.taskName,
        assigned_to_id: formData.assignedToId || null,
        status: formData.status,
        start_date: formData.startDate,
        due_date: formData.dueDate,
        priority: formData.priority,
        description: formData.description || null,
        estimated_duration_minutes: formData.estimatedDurationMinutes, // ADDED
      };

      if (formData.id) {
        const { error } = await supabase
          .from('tasks')
          .update(taskToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Task updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert(taskToSave);
        if (error) throw error;
        showNotification('Task created successfully!', 'success');
      }
      navigate(`/project/${projectId}/tasks`);
      resetForm();
    } catch (err: any) {
      showNotification(`Failed to save task: ${err.message}`, 'error');
      console.error('Save task error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const taskStatuses = [
    { id: 'open', name: 'To-Do' },
    { id: 'in_progress', name: 'Working' },
    { id: 'on_hold', name: 'On Hold' },
    { id: 'completed', name: 'Done' },
  ];

  const taskPriorities = [
    { id: 'low', name: 'Low' },
    { id: 'medium', name: 'Medium' },
    { id: 'high', name: 'High' },
    { id: 'critical', name: 'Critical' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {isEditMode ? 'Edit Task' : 'Create New Task'} for {projectDetails?.project_name || 'Project'}
          </h1>
          <p className={theme.textSecondary}>
            {isEditMode ? 'Update task details and assignments.' : 'Add a new task to this project.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/project/${projectId}/tasks`)} icon={<ArrowLeft size={16} />}>
          Back to Tasks List
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
              Task Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Task Name"
                value={formData.taskName}
                onChange={(val) => handleInputChange('taskName', val)}
                placeholder="e.g., Develop Login Page, Prepare Project Report"
                required
              />
              <MasterSelectField
                label="Assigned To"
                value={formData.assignedToName}
                onValueChange={(val) => handleInputChange('assignedToName', val)}
                onSelect={(id) => handleEmployeeSelect(id, availableEmployees.find(emp => emp.id === id)?.name || '')} // MODIFIED: Pass name to handleEmployeeSelect
                options={availableEmployees}
                placeholder="Assign Employee (Optional)"
              />
              <MasterSelectField
                label="Status"
                value={taskStatuses.find(status => status.id === formData.status)?.name || ''}
                onValueChange={(val) => handleInputChange('status', val)}
                onSelect={(id) => handleInputChange('status', id)}
                options={taskStatuses}
                placeholder="Select Status"
              />
              <MasterSelectField
                label="Priority"
                value={taskPriorities.find(priority => priority.id === formData.priority)?.name || ''}
                onValueChange={(val) => handleInputChange('priority', val)}
                onSelect={(id) => handleInputChange('priority', id)}
                options={taskPriorities}
                placeholder="Select Priority"
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
              <FormField // ADDED: Estimated Duration
                label="Estimated Duration (Minutes)"
                type="number"
                value={formData.estimatedDurationMinutes.toString()}
                onChange={(val) => handleInputChange('estimatedDurationMinutes', parseFloat(val) || 0)}
                icon={<Clock size={18} />}
              />
              <FormField
                label="Description"
                value={formData.description}
                onChange={(val) => handleInputChange('description', val)}
                placeholder="Detailed task description"
                className="md:col-span-2"
              />
            </div>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate(`/project/${projectId}/tasks`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} icon={<Save size={16} />}>
              {isSubmitting ? 'Saving...' : 'Save Task'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default TaskFormPage;
