// src/pages/CRM/ActivityFormPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Save, ArrowLeft, Activity, Calendar, Clock, Users, FileText, Target, Mail, Phone } from 'lucide-react';
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

function ActivityFormPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get ID from URL for edit mode

  const [formData, setFormData] = useState({
    id: '',
    activityType: 'task',
    subject: '',
    description: '',
    activityDate: new Date().toISOString().split('T'),
    activityTime: new Date().toTimeString().split(' ').substring(0, 5), // HH:MM
    durationMinutes: 0,
    status: 'open',
    priority: 'medium',
    assignedToId: '',
    assignedToName: '', // For MasterSelectField display
    referenceType: '', // lead, customer, opportunity
    referenceId: '',
    referenceName: '', // For MasterSelectField display
  });

  const [availableEmployees, setAvailableEmployees] = useState<{ id: string; name: string }[]>([]);
  const [availableReferences, setAvailableReferences] = useState<{ id: string; name: string; type: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!id;

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      await fetchMasterData(currentCompany?.id as string);
      if (isEditMode) {
        await fetchActivityData(id as string);
      } else {
        resetForm();
      }
      setLoading(false);
    };

    if (currentCompany?.id) {
      initializeForm();
    }
  }, [currentCompany?.id, id, isEditMode]);

  const fetchMasterData = async (companyId: string) => {
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .eq('status', 'active');
      if (employeesError) throw employeesError;
      setAvailableEmployees(employeesData.map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}` })) || []);

      // Fetch leads, customers, opportunities for reference
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, lead_name')
        .eq('company_id', companyId);
      if (leadsError) throw leadsError;

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('company_id', companyId);
      if (customersError) throw customersError;

      const { data: opportunitiesData, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select('id, opportunity_name')
        .eq('company_id', companyId);
      if (opportunitiesError) throw opportunitiesError;

      const allReferences = [
        ...(leadsData || []).map(l => ({ id: l.id, name: l.lead_name, type: 'lead' })),
        ...(customersData || []).map(c => ({ id: c.id, name: c.name, type: 'customer' })),
        ...(opportunitiesData || []).map(o => ({ id: o.id, name: o.opportunity_name, type: 'opportunity' })),
      ];
      setAvailableReferences(allReferences);

    } catch (error) {
      console.error('Error fetching master data:', error);
      showNotification('Failed to load employees or references.', 'error');
    }
  };

  const fetchActivityData = async (activityId: string) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          assigned_to:employees ( first_name, last_name )
        `)
        .eq('id', activityId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (error) throw error;

      if (data) {
        let referenceName = '';
        if (data.reference_type && data.reference_id) {
          const ref = availableReferences.find(r => r.id === data.reference_id && r.type === data.reference_type);
          referenceName = ref ? ref.name : '';
        }

        setFormData({
          id: data.id,
          activityType: data.activity_type,
          subject: data.subject,
          description: data.description || '',
          activityDate: data.activity_date,
          activityTime: data.activity_time || '',
          durationMinutes: data.duration_minutes || 0,
          status: data.status,
          priority: data.priority || 'medium',
          assignedToId: data.assigned_to_id || '',
          assignedToName: data.assigned_to ? `${data.assigned_to.first_name} ${data.assigned_to.last_name}` : '',
          referenceType: data.reference_type || '',
          referenceId: data.reference_id || '',
          referenceName: referenceName,
        });
      }
    } catch (err: any) {
      showNotification(`Error loading activity: ${err.message}`, 'error');
      console.error('Error loading activity:', err);
      navigate('/crm/activities');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssignedToSelect = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, assignedToId: id, assignedToName: name }));
  };

  const handleReferenceSelect = (id: string, name: string, data: { type: string }) => {
    setFormData(prev => ({ ...prev, referenceId: id, referenceName: name, referenceType: data.type }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      activityType: 'task',
      subject: '',
      description: '',
      activityDate: new Date().toISOString().split('T'),
      activityTime: new Date().toTimeString().split(' ').substring(0, 5),
      durationMinutes: 0,
      status: 'open',
      priority: 'medium',
      assignedToId: '',
      assignedToName: '',
      referenceType: '',
      referenceId: '',
      referenceName: '',
    });
  };

  const validateForm = () => {
    if (!formData.subject.trim()) {
      showNotification('Subject is required.', 'error');
      return false;
    }
    if (!formData.activityDate) {
      showNotification('Activity Date is required.', 'error');
      return false;
    }
    if (formData.activityType === 'call' || formData.activityType === 'meeting') {
      if (!formData.durationMinutes || formData.durationMinutes <= 0) {
        showNotification('Duration must be greater than 0 for calls/meetings.', 'error');
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
      const activityToSave = {
        company_id: currentCompany.id,
        activity_type: formData.activityType,
        subject: formData.subject,
        description: formData.description || null,
        activity_date: formData.activityDate,
        activity_time: formData.activityTime || null,
        duration_minutes: formData.durationMinutes || null,
        status: formData.status,
        priority: formData.priority,
        assigned_to_id: formData.assignedToId || null,
        reference_type: formData.referenceType || null,
        reference_id: formData.referenceId || null,
        created_by: (await supabase.auth.getUser()).data.user?.id, // Correctly get user ID
      };

      if (formData.id) {
        const { error } = await supabase
          .from('activities')
          .update(activityToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Activity updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('activities')
          .insert(activityToSave);
        if (error) throw error;
        showNotification('Activity created successfully!', 'success');
      }
      navigate('/crm/activities');
      resetForm();
    } catch (err: any) {
      showNotification(`Failed to save activity: ${err.message}`, 'error');
      console.error('Save activity error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activityTypes = [
    { id: 'task', name: 'Task' },
    { id: 'call', name: 'Call' },
    { id: 'email', name: 'Email' },
    { id: 'meeting', name: 'Meeting' },
    { id: 'note', name: 'Note' },
  ];

  const activityStatuses = [
    { id: 'open', name: 'Open' },
    { id: 'completed', name: 'Completed' },
    { id: 'cancelled', name: 'Cancelled' },
  ];

  const activityPriorities = [
    { id: 'low', name: 'Low' },
    { id: 'medium', name: 'Medium' },
    { id: 'high', name: 'High' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {isEditMode ? 'Edit Activity' : 'Log New Activity'}
          </h1>
          <p className={theme.textSecondary}>
            {isEditMode ? 'Update activity details.' : 'Record a new customer interaction.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/crm/activities')} icon={<ArrowLeft size={16} />}>
          Back to Activities List
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
              <Activity size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Activity Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Activity Type</label>
                <select
                  value={formData.activityType}
                  onChange={(e) => handleInputChange('activityType', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  {activityTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <FormField
                label="Subject"
                value={formData.subject}
                onChange={(val) => handleInputChange('subject', val)}
                placeholder="e.g., Follow-up on proposal, Call with John Doe"
                required
              />
              <FormField
                label="Activity Date"
                type="date"
                value={formData.activityDate}
                onChange={(val) => handleInputChange('activityDate', val)}
                required
                icon={<Calendar size={18} />}
              />
              <FormField
                label="Activity Time"
                type="time"
                value={formData.activityTime}
                onChange={(val) => handleInputChange('activityTime', val)}
                icon={<Clock size={18} />}
              />
              {(formData.activityType === 'call' || formData.activityType === 'meeting') && (
                <FormField
                  label="Duration (minutes)"
                  type="number"
                  value={formData.durationMinutes.toString()}
                  onChange={(val) => handleInputChange('durationMinutes', parseInt(val) || 0)}
                  icon={<Clock size={18} />}
                />
              )}
              <MasterSelectField
                label="Assigned To"
                value={formData.assignedToName}
                onValueChange={(val) => handleInputChange('assignedToName', val)}
                onSelect={handleAssignedToSelect}
                options={availableEmployees}
                placeholder="Select Employee"
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  {activityStatuses.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  {activityPriorities.map(priority => (
                    <option key={priority.id} value={priority.id}>{priority.name}</option>
                  ))}
                </select>
              </div>
              <MasterSelectField
                label="Reference (Lead/Customer/Opportunity)"
                value={formData.referenceName}
                onValueChange={(val) => handleInputChange('referenceName', val)}
                onSelect={handleReferenceSelect}
                options={availableReferences}
                placeholder="Link to Lead, Customer, or Opportunity"
                className="md:col-span-2"
              />
              <FormField
                label="Description"
                value={formData.description}
                onChange={(val) => handleInputChange('description', val)}
                placeholder="Detailed notes about the activity"
                className="md:col-span-2"
              />
            </div>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/crm/activities')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} icon={<Save size={16} />}>
              {isSubmitting ? 'Saving...' : 'Save Activity'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ActivityFormPage;
