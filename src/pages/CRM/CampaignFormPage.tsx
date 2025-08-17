// src/pages/CRM/CampaignFormPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Save, ArrowLeft, Megaphone, Calendar, DollarSign, Users, TrendingUp, FileText } from 'lucide-react';
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

function CampaignFormPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get ID from URL for edit mode

  const [formData, setFormData] = useState({
    id: '',
    campaignName: '',
    campaignType: 'email',
    status: 'planning',
    startDate: '',
    endDate: '',
    budget: 0,
    expectedLeads: 0,
    actualLeads: 0,
    expectedRevenue: 0,
    actualRevenue: 0,
    description: '',
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!id;

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      if (isEditMode) {
        await fetchCampaignData(id as string);
      } else {
        resetForm();
      }
      setLoading(false);
    };

    if (currentCompany?.id) {
      initializeForm();
    }
  }, [currentCompany?.id, id, isEditMode]);

  const fetchCampaignData = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          campaignName: data.campaign_name,
          campaignType: data.campaign_type,
          status: data.status,
          startDate: data.start_date || '',
          endDate: data.end_date || '',
          budget: data.budget || 0,
          expectedLeads: data.expected_leads || 0,
          actualLeads: data.actual_leads || 0,
          expectedRevenue: data.expected_revenue || 0,
          actualRevenue: data.actual_revenue || 0,
          description: data.description || '',
        });
      }
    } catch (err: any) {
      showNotification(`Error loading campaign: ${err.message}`, 'error');
      console.error('Error loading campaign:', err);
      navigate('/crm/campaigns');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      campaignName: '',
      campaignType: 'email',
      status: 'planning',
      startDate: '',
      endDate: '',
      budget: 0,
      expectedLeads: 0,
      actualLeads: 0,
      expectedRevenue: 0,
      actualRevenue: 0,
      description: '',
    });
  };

  const validateForm = () => {
    if (!formData.campaignName.trim()) {
      showNotification('Campaign Name is required.', 'error');
      return false;
    }
    if (!formData.startDate) {
      showNotification('Start Date is required.', 'error');
      return false;
    }
    if (!formData.endDate) {
      showNotification('End Date is required.', 'error');
      return false;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      showNotification('End Date cannot be before Start Date.', 'error');
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
      const campaignToSave = {
        company_id: currentCompany.id,
        campaign_name: formData.campaignName,
        campaign_type: formData.campaignType,
        status: formData.status,
        start_date: formData.startDate,
        end_date: formData.endDate,
        budget: formData.budget,
        expected_leads: formData.expectedLeads,
        actual_leads: formData.actualLeads,
        expected_revenue: formData.expectedRevenue,
        actual_revenue: formData.actualRevenue,
        description: formData.description,
        created_by: (await supabase.auth.getUser()).data.user?.id, // Correctly get user ID
      };

      if (formData.id) {
        const { error } = await supabase
          .from('campaigns')
          .update(campaignToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Campaign updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('campaigns')
          .insert(campaignToSave);
        if (error) throw error;
        showNotification('Campaign created successfully!', 'success');
      }
      navigate('/crm/campaigns');
      resetForm();
    } catch (err: any) {
      showNotification(`Failed to save campaign: ${err.message}`, 'error');
      console.error('Save campaign error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {isEditMode ? 'Edit Campaign' : 'Create New Campaign'}
          </h1>
          <p className={theme.textSecondary}>
            {isEditMode ? 'Update campaign details and goals.' : 'Plan and launch a new marketing initiative.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/crm/campaigns')} icon={<ArrowLeft size={16} />}>
          Back to Campaigns List
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
              <Megaphone size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Campaign Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Campaign Name"
                value={formData.campaignName}
                onChange={(val) => handleInputChange('campaignName', val)}
                placeholder="e.g., Summer Sale 2024, New Product Launch"
                required
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Campaign Type</label>
                <select
                  value={formData.campaignType}
                  onChange={(e) => handleInputChange('campaignType', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  <option value="email">Email</option>
                  <option value="social_media">Social Media</option>
                  <option value="print">Print</option>
                  <option value="event">Event</option>
                  <option value="webinar">Webinar</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <FormField
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(val) => handleInputChange('startDate', val)}
                required
              />
              <FormField
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(val) => handleInputChange('endDate', val)}
                required
              />
              <FormField
                label="Budget"
                type="number"
                value={formData.budget.toString()}
                onChange={(val) => handleInputChange('budget', parseFloat(val) || 0)}
                icon={<DollarSign size={18} />}
              />
              <FormField
                label="Expected Leads"
                type="number"
                value={formData.expectedLeads.toString()}
                onChange={(val) => handleInputChange('expectedLeads', parseInt(val) || 0)}
                icon={<Users size={18} />}
              />
              <FormField
                label="Actual Leads"
                type="number"
                value={formData.actualLeads.toString()}
                onChange={(val) => handleInputChange('actualLeads', parseInt(val) || 0)}
                icon={<Users size={18} />}
              />
              <FormField
                label="Expected Revenue"
                type="number"
                value={formData.expectedRevenue.toString()}
                onChange={(val) => handleInputChange('expectedRevenue', parseFloat(val) || 0)}
                icon={<TrendingUp size={18} />}
              />
              <FormField
                label="Actual Revenue"
                type="number"
                value={formData.actualRevenue.toString()}
                onChange={(val) => handleInputChange('actualRevenue', parseFloat(val) || 0)}
                icon={<TrendingUp size={18} />}
              />
              <FormField
                label="Description"
                value={formData.description}
                onChange={(val) => handleInputChange('description', val)}
                placeholder="Detailed description of the campaign"
                className="md:col-span-2"
              />
            </div>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/crm/campaigns')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} icon={<Save size={16} />}>
              {isSubmitting ? 'Saving...' : 'Save Campaign'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CampaignFormPage;
