// src/pages/CRM/OpportunityFormPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Save, ArrowLeft, Target, DollarSign, Calendar, Users, FileText, TrendingUp } from 'lucide-react';
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

function OpportunityFormPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get ID from URL for edit mode

  const [formData, setFormData] = useState({
    id: '',
    opportunityName: '',
    customerId: '',
    customerName: '', // For MasterSelectField display
    leadId: '',
    leadName: '', // For MasterSelectField display
    opportunityOwnerId: '',
    opportunityOwnerName: '', // For MasterSelectField display
    opportunityAmount: 0,
    probability: 0,
    stage: 'prospecting',
    expectedCloseDate: '',
    actualCloseDate: '',
    nextStep: '',
    description: '',
    competitor: '',
  });

  const [availableCustomers, setAvailableCustomers] = useState<{ id: string; name: string }[]>([]);
  const [availableLeads, setAvailableLeads] = useState<{ id: string; name: string }[]>([]);
  const [availableOwners, setAvailableOwners] = useState<{ id: string; name: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!id;

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      await fetchMasterData(currentCompany?.id as string);
      if (isEditMode) {
        await fetchOpportunityData(id as string);
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
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (customersError) throw customersError;
      setAvailableCustomers(customersData || []);

      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, lead_name')
        .eq('company_id', companyId)
        .eq('status', 'qualified'); // Only qualified leads can become opportunities
      if (leadsError) throw leadsError;
      setAvailableLeads(leadsData.map(lead => ({ id: lead.id, name: lead.lead_name })) || []);

      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .eq('status', 'active');
      if (employeesError) throw employeesError;
      setAvailableOwners(employeesData.map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}` })) || []);

    } catch (error) {
      console.error('Error fetching master data:', error);
      showNotification('Failed to load customers, leads, or employees.', 'error');
    }
  };

  const fetchOpportunityData = async (opportunityId: string) => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          customers ( name ),
          leads ( lead_name ),
          opportunity_owner:employees ( first_name, last_name )
        `)
        .eq('id', opportunityId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          opportunityName: data.opportunity_name,
          customerId: data.customer_id || '',
          customerName: data.customers?.name || '',
          leadId: data.lead_id || '',
          leadName: data.leads?.lead_name || '',
          opportunityOwnerId: data.opportunity_owner_id || '',
          opportunityOwnerName: data.opportunity_owner ? `${data.opportunity_owner.first_name} ${data.opportunity_owner.last_name}` : '',
          opportunityAmount: data.opportunity_amount || 0,
          probability: data.probability || 0,
          stage: data.stage,
          expectedCloseDate: data.expected_close_date || '',
          actualCloseDate: data.actual_close_date || '',
          nextStep: data.next_step || '',
          description: data.description || '',
          competitor: data.competitor || '',
        });
      }
    } catch (err: any) {
      showNotification(`Error loading opportunity: ${err.message}`, 'error');
      console.error('Error loading opportunity:', err);
      navigate('/crm/opportunities');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, customerId: id, customerName: name }));
  };

  const handleLeadSelect = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, leadId: id, leadName: name }));
  };

  const handleOwnerSelect = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, opportunityOwnerId: id, opportunityOwnerName: name }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      opportunityName: '',
      customerId: '',
      customerName: '',
      leadId: '',
      leadName: '',
      opportunityOwnerId: '',
      opportunityOwnerName: '',
      opportunityAmount: 0,
      probability: 0,
      stage: 'prospecting',
      expectedCloseDate: '',
      actualCloseDate: '',
      nextStep: '',
      description: '',
      competitor: '',
    });
  };

  const validateForm = () => {
    if (!formData.opportunityName.trim()) {
      showNotification('Opportunity Name is required.', 'error');
      return false;
    }
    if (!formData.customerId && !formData.leadId) {
      showNotification('Either a Customer or a Lead must be linked.', 'error');
      return false;
    }
    if (formData.opportunityAmount < 0) {
      showNotification('Opportunity Amount cannot be negative.', 'error');
      return false;
    }
    if (formData.probability < 0 || formData.probability > 100) {
      showNotification('Probability must be between 0 and 100.', 'error');
      return false;
    }
    if (formData.expectedCloseDate && formData.actualCloseDate && new Date(formData.actualCloseDate) < new Date(formData.expectedCloseDate)) {
      showNotification('Actual Close Date cannot be before Expected Close Date.', 'error');
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
      const opportunityToSave = {
        company_id: currentCompany.id,
        opportunity_name: formData.opportunityName,
        customer_id: formData.customerId || null,
        lead_id: formData.leadId || null,
        opportunity_owner_id: formData.opportunityOwnerId || null,
        opportunity_amount: formData.opportunityAmount,
        probability: formData.probability,
        stage: formData.stage,
        expected_close_date: formData.expectedCloseDate || null,
        actual_close_date: formData.actualCloseDate || null,
        next_step: formData.nextStep || null,
        description: formData.description || null,
        competitor: formData.competitor || null,
      };

      if (formData.id) {
        const { error } = await supabase
          .from('opportunities')
          .update(opportunityToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Opportunity updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('opportunities')
          .insert(opportunityToSave);
        if (error) throw error;
        showNotification('Opportunity created successfully!', 'success');
      }
      navigate('/crm/opportunities');
      resetForm();
    } catch (err: any) {
      showNotification(`Failed to save opportunity: ${err.message}`, 'error');
      console.error('Save opportunity error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const opportunityStages = [
    { id: 'prospecting', name: 'Prospecting' },
    { id: 'qualification', name: 'Qualification' },
    { id: 'proposal', name: 'Proposal' },
    { id: 'negotiation', name: 'Negotiation' },
    { id: 'closed_won', name: 'Closed Won' },
    { id: 'closed_lost', name: 'Closed Lost' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {isEditMode ? 'Edit Opportunity' : 'Add New Opportunity'}
          </h1>
          <p className={theme.textSecondary}>
            {isEditMode ? 'Update opportunity details and progress.' : 'Create a new sales opportunity.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/crm/opportunities')} icon={<ArrowLeft size={16} />}>
          Back to Opportunities List
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
              <Target size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Opportunity Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Opportunity Name"
                value={formData.opportunityName}
                onChange={(val) => handleInputChange('opportunityName', val)}
                placeholder="e.g., Enterprise Software Deal, Project X"
                required
              />
              <MasterSelectField
                label="Linked Customer"
                value={formData.customerName}
                onValueChange={(val) => handleInputChange('customerName', val)}
                onSelect={handleCustomerSelect}
                options={availableCustomers}
                placeholder="Select Customer (Optional)"
              />
              <MasterSelectField
                label="Linked Lead"
                value={formData.leadName}
                onValueChange={(val) => handleInputChange('leadName', val)}
                onSelect={handleLeadSelect}
                options={availableLeads}
                placeholder="Select Lead (Optional)"
              />
              <MasterSelectField
                label="Opportunity Owner"
                value={formData.opportunityOwnerName}
                onValueChange={(val) => handleInputChange('opportunityOwnerName', val)}
                onSelect={handleOwnerSelect}
                options={availableOwners}
                placeholder="Select Owner"
              />
              <FormField
                label="Opportunity Amount"
                type="number"
                value={formData.opportunityAmount.toString()}
                onChange={(val) => handleInputChange('opportunityAmount', parseFloat(val) || 0)}
                icon={<DollarSign size={18} />}
              />
              <FormField
                label="Probability (%)"
                type="number"
                value={formData.probability.toString()}
                onChange={(val) => handleInputChange('probability', parseFloat(val) || 0)}
                placeholder="0-100"
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => handleInputChange('stage', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  {opportunityStages.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
              </div>
              <FormField
                label="Expected Close Date"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(val) => handleInputChange('expectedCloseDate', val)}
                icon={<Calendar size={18} />}
              />
              <FormField
                label="Actual Close Date"
                type="date"
                value={formData.actualCloseDate}
                onChange={(val) => handleInputChange('actualCloseDate', val)}
                icon={<Calendar size={18} />}
              />
              <FormField
                label="Next Step"
                value={formData.nextStep}
                onChange={(val) => handleInputChange('nextStep', val)}
                placeholder="e.g., Schedule demo, Send proposal"
              />
              <FormField
                label="Competitor"
                value={formData.competitor}
                onChange={(val) => handleInputChange('competitor', val)}
                placeholder="e.g., Competitor A"
              />
              <FormField
                label="Description"
                value={formData.description}
                onChange={(val) => handleInputChange('description', val)}
                placeholder="Detailed description of the opportunity"
                className="md:col-span-2"
              />
            </div>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/crm/opportunities')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} icon={<Save size={16} />}>
              {isSubmitting ? 'Saving...' : 'Save Opportunity'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default OpportunityFormPage;

