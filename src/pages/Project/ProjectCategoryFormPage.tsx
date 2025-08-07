// src/pages/Project/ProjectCategoryFormPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Save, ArrowLeft, Layers, Calendar, DollarSign, Info } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

interface ProjectCategory {
  id: string;
  name: string;
  description: string | null;
  is_recurring_category: boolean;
  recurrence_frequency: string | null;
  recurrence_due_day: number | null;
  recurrence_due_month: number | null;
  billing_type: string;
  created_at: string;
  updated_at: string;
}

function ProjectCategoryFormPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get ID from URL for edit mode
  const location = useLocation(); // Use useLocation to access state

  const [formData, setFormData] = useState({
    id: '',
    name: location.state?.initialName || '', // Pre-fill name if passed from ProjectFormPage
    description: '',
    isRecurringCategory: false,
    recurrenceFrequency: '',
    recurrenceDueDay: '',
    recurrenceDueMonth: '',
    billingType: 'fixed_price',
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!id;

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      if (isEditMode) {
        await fetchCategoryData(id as string);
      } else {
        resetForm();
        // If initialName is passed, set it
        if (location.state?.initialName) {
          setFormData(prev => ({ ...prev, name: location.state.initialName }));
        }
      }
      setLoading(false);
    };

    if (currentCompany?.id) {
      initializeForm();
    }
  }, [currentCompany?.id, id, isEditMode, location.state]);

  const fetchCategoryData = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_categories')
        .select('*')
        .eq('id', categoryId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          name: data.name,
          description: data.description || '',
          isRecurringCategory: data.is_recurring_category,
          recurrenceFrequency: data.recurrence_frequency || '',
          recurrenceDueDay: data.recurrence_due_day?.toString() || '',
          recurrenceDueMonth: data.recurrence_due_month?.toString() || '',
          billingType: data.billing_type,
        });
      }
    } catch (err: any) {
      showNotification(`Error loading project category: ${err.message}`, 'error');
      console.error('Error loading project category:', err);
      navigate('/project/categories');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      isRecurringCategory: false,
      recurrenceFrequency: '',
      recurrenceDueDay: '',
      recurrenceDueMonth: '',
      billingType: 'fixed_price',
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showNotification('Category Name is required.', 'error');
      return false;
    }
    if (formData.isRecurringCategory) {
      if (!formData.recurrenceFrequency) {
        showNotification('Recurrence Frequency is required for recurring categories.', 'error');
        return false;
      }
      // MODIFIED: Added validation for recurrence due day/month based on frequency
      if (formData.recurrenceFrequency === 'weekly' && (!formData.recurrenceDueDay || parseInt(formData.recurrenceDueDay) < 1 || parseInt(formData.recurrenceDueDay) > 7)) {
        showNotification('Due Day (1-7 for Mon-Sun) is required for weekly recurrence.', 'error');
        return false;
      }
      if (formData.recurrenceFrequency === 'monthly' && (!formData.recurrenceDueDay || parseInt(formData.recurrenceDueDay) < 1 || parseInt(formData.recurrenceDueDay) > 31)) {
        showNotification('Due Day of the month (1-31) is required for monthly recurrence.', 'error');
        return false;
      }
      if (formData.recurrenceFrequency === 'yearly' && (!formData.recurrenceDueDay || !formData.recurrenceDueMonth || parseInt(formData.recurrenceDueDay) < 1 || parseInt(formData.recurrenceDueDay) > 31 || parseInt(formData.recurrenceDueMonth) < 1 || parseInt(formData.recurrenceDueMonth) > 12)) {
        showNotification('Due Day (1-31) and Month (1-12) are required for yearly recurrence.', 'error');
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
      const categoryToSave = {
        company_id: currentCompany.id,
        name: formData.name,
        description: formData.description || null,
        is_recurring_category: formData.isRecurringCategory,
        recurrence_frequency: formData.isRecurringCategory ? formData.recurrenceFrequency || null : null,
        recurrence_due_day: formData.isRecurringCategory && formData.recurrenceDueDay ? parseInt(formData.recurrenceDueDay) : null,
        recurrence_due_month: formData.isRecurringCategory && formData.recurrenceDueMonth ? parseInt(formData.recurrenceDueMonth) : null,
        billing_type: formData.billingType,
      };

      if (formData.id) {
        const { error } = await supabase
          .from('project_categories')
          .update(categoryToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Project category updated successfully!', 'success');
      } else {
        const { data, error } = await supabase
          .from('project_categories')
          .insert(categoryToSave)
          .select('id, name')
          .single(); // Select the new ID and name
        if (error) throw error;
        showNotification('Project category created successfully!', 'success');

        // If navigated from ProjectFormPage, return the new category ID
        if (location.state?.fromProjectForm && location.state?.returnPath) {
          navigate(location.state.returnPath, {
            replace: true,
            state: {
              createdCategoryId: data.id,
              createdCategoryName: data.name,
              projectFormData: location.state.projectFormData, // Pass original project form data back
              fromProjectCategoryCreation: true // Flag for ProjectFormPage to know it's a return
            }
          });
          return; // Exit early to prevent navigating to list page
        }
      }
      navigate('/project/categories');
      resetForm();
    } catch (err: any) {
      showNotification(`Failed to save project category: ${err.message}`, 'error');
      console.error('Save project category error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const recurrenceFrequencies = [
    { id: 'daily', name: 'Daily' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'quarterly', name: 'Quarterly' },
    { id: 'yearly', name: 'Yearly' },
  ];

  const billingTypes = [
    { id: 'fixed_price', name: 'Fixed Price' },
    { id: 'time_based', name: 'Time & Material' },
    { id: 'recurring', name: 'Recurring' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {isEditMode ? 'Edit Project Category' : 'Create New Project Category'}
          </h1>
          <p className={theme.textSecondary}>
            {isEditMode ? 'Update project category details.' : 'Define a new type of project.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => {
          if (location.state?.fromProjectForm && location.state?.returnPath) {
            navigate(location.state.returnPath, {
              replace: true,
              state: {
                projectFormData: location.state.projectFormData,
                fromProjectCategoryCreation: true, // Keep this flag for ProjectFormPage to restore data
              },
            });
          } else {
            navigate('/project/categories');
          }
        }} icon={<ArrowLeft size={16} />}>
          Back to Categories List
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
              <Info size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Category Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Category Name"
                value={formData.name}
                onChange={(val) => handleInputChange('name', val)}
                placeholder="e.g., Annual Maintenance Contract, Software Development"
                required
              />
              <FormField
                label="Description"
                value={formData.description}
                onChange={(val) => handleInputChange('description', val)}
                placeholder="Brief description of this project category"
                className="md:col-span-2"
              />
              <MasterSelectField
                label="Billing Type"
                value={billingTypes.find(type => type.id === formData.billingType)?.name || ''}
                onValueChange={(val) => handleInputChange('billingType', val)}
                onSelect={(id) => handleInputChange('billingType', id)}
                options={billingTypes}
                placeholder="Select Billing Type"
                required
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <Calendar size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Recurrence Settings (Optional)
            </h3>
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="isRecurringCategory"
                checked={formData.isRecurringCategory}
                onChange={(e) => handleInputChange('isRecurringCategory', e.target.checked)}
                className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]"
              />
              <label htmlFor="isRecurringCategory" className={`text-sm font-medium ${theme.textPrimary}`}>
                This is a Recurring Project Category
              </label>
            </div>
            {formData.isRecurringCategory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MasterSelectField
                  label="Recurrence Frequency"
                  value={recurrenceFrequencies.find(freq => freq.id === formData.recurrenceFrequency)?.name || ''}
                  onValueChange={(val) => handleInputChange('recurrenceFrequency', val)}
                  onSelect={(id) => handleInputChange('recurrenceFrequency', id)}
                  options={recurrenceFrequencies}
                  placeholder="Select Frequency"
                  required
                />
                {/* MODIFIED: Conditional fields for recurrence due day/month */}
                {formData.recurrenceFrequency === 'weekly' && (
                  <FormField
                    label="Due Day of Week (1=Mon, 7=Sun)"
                    type="number"
                    value={formData.recurrenceDueDay}
                    onChange={(val) => handleInputChange('recurrenceDueDay', val)}
                    placeholder="e.g., 5 for Friday"
                    required
                  />
                )}
                {formData.recurrenceFrequency === 'monthly' && (
                  <FormField
                    label="Due Day of Month (1-31)"
                    type="number"
                    value={formData.recurrenceDueDay}
                    onChange={(val) => handleInputChange('recurrenceDueDay', val)}
                    placeholder="e.g., 15"
                    required
                  />
                )}
                {formData.recurrenceFrequency === 'yearly' && (
                  <>
                    <FormField
                      label="Due Day of Month (1-31)"
                      type="number"
                      value={formData.recurrenceDueDay}
                      onChange={(val) => handleInputChange('recurrenceDueDay', val)}
                      placeholder="e.g., 1"
                      required
                    />
                    <FormField
                      label="Due Month (1-12)"
                      type="number"
                      value={formData.recurrenceDueMonth}
                      onChange={(val) => handleInputChange('recurrenceDueMonth', val)}
                      placeholder="e.g., 1 for January"
                      required
                    />
                  </>
                )}
              </div>
            )}
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => {
              if (location.state?.fromProjectForm && location.state?.returnPath) {
                navigate(location.state.returnPath, {
                  replace: true,
                  state: {
                    projectFormData: location.state.projectFormData,
                    fromProjectCategoryCreation: true, // Keep this flag for ProjectFormPage to restore data
                  },
                });
              } else {
                navigate('/project/categories');
              }
            }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} icon={<Save size={16} />}>
              {isSubmitting ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProjectCategoryFormPage;
