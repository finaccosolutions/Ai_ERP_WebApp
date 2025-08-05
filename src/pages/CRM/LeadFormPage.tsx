// src/pages/CRM/LeadFormPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Save, ArrowLeft, Users, Mail, Phone, Building, Tag, Calendar, Info, TrendingUp } from 'lucide-react';
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
import ConfirmationModal from '../../components/UI/ConfirmationModal';

interface Lead {
  id: string;
  lead_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  lead_source_id: string | null;
  territory_id: string | null;
  status: string;
  lead_owner_id: string | null;
  annual_revenue: number | null;
  no_of_employees: number | null;
  industry: string | null;
  address: any | null;
  notes: string | null;
  next_contact_date: string | null;
  converted_customer_id: string | null;
  converted_date: string | null;
  created_at: string;
  updated_at: string;
}

function LeadFormPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get ID from URL for edit mode

  const [formData, setFormData] = useState({
    id: '',
    leadName: '',
    companyName: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    leadSourceId: '',
    territoryId: '',
    status: 'open',
    leadOwnerId: '',
    annualRevenue: 0,
    noOfEmployees: 0,
    industry: '',
    address: { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
    notes: '',
    nextContactDate: '',
  });

  const [availableSources, setAvailableSources] = useState<{ id: string; name: string }[]>([]);
  const [availableTerritories, setAvailableTerritories] = useState<{ id: string; name: string }[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<{ id: string; name: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!id;

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      await fetchMastersData(currentCompany?.id as string);
      if (isEditMode) {
        await fetchLeadData(id as string);
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
      const { data: sourcesData, error: sourcesError } = await supabase
        .from('lead_sources')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (sourcesError) throw sourcesError;
      setAvailableSources(sourcesData || []);

      const { data: territoriesData, error: territoriesError } = await supabase
        .from('territories')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (territoriesError) throw territoriesError;
      setAvailableTerritories(territoriesData || []);

      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .eq('status', 'active');
      if (employeesError) throw employeesError;
      setAvailableEmployees(employeesData.map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}` })) || []);

    } catch (error) {
      console.error('Error fetching master data:', error);
      showNotification('Failed to load lead sources, territories, or employees.', 'error');
    }
  };

  const fetchLeadData = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          leadName: data.lead_name,
          companyName: data.company_name || '',
          email: data.email || '',
          phone: data.phone || '',
          mobile: data.mobile || '',
          website: data.website || '',
          leadSourceId: data.lead_source_id || '',
          territoryId: data.territory_id || '',
          status: data.status,
          leadOwnerId: data.lead_owner_id || '',
          annualRevenue: data.annual_revenue || 0,
          noOfEmployees: data.no_of_employees || 0,
          industry: data.industry || '',
          address: data.address || { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
          notes: data.notes || '',
          nextContactDate: data.next_contact_date || '',
        });
      }
    } catch (err: any) {
      showNotification(`Error loading lead: ${err.message}`, 'error');
      console.error('Error loading lead:', err);
      navigate('/crm/leads');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: keyof typeof formData['address'], value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      leadName: '',
      companyName: '',
      email: '',
      phone: '',
      mobile: '',
      website: '',
      leadSourceId: '',
      territoryId: '',
      status: 'open',
      leadOwnerId: '',
      annualRevenue: 0,
      noOfEmployees: 0,
      industry: '',
      address: { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
      notes: '',
      nextContactDate: '',
    });
  };

  const validateForm = () => {
    if (!formData.leadName.trim()) {
      showNotification('Lead Name is required.', 'error');
      return false;
    }
    if (!formData.email.trim() && !formData.phone.trim() && !formData.mobile.trim()) {
      showNotification('At least one contact method (Email, Phone, or Mobile) is required.', 'error');
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
      const leadToSave = {
        company_id: currentCompany.id,
        lead_name: formData.leadName,
        company_name: formData.companyName || null,
        email: formData.email || null,
        phone: formData.phone || null,
        mobile: formData.mobile || null,
        website: formData.website || null,
        lead_source_id: formData.leadSourceId || null,
        territory_id: formData.territoryId || null,
        status: formData.status,
        lead_owner_id: formData.leadOwnerId || null,
        annual_revenue: formData.annualRevenue,
        no_of_employees: formData.noOfEmployees,
        industry: formData.industry || null,
        address: formData.address,
        notes: formData.notes || null,
        next_contact_date: formData.nextContactDate || null,
      };

      if (formData.id) {
        const { error } = await supabase
          .from('leads')
          .update(leadToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Lead updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('leads')
          .insert(leadToSave);
        if (error) throw error;
        showNotification('Lead created successfully!', 'success');
      }
      navigate('/crm/leads');
      resetForm();
    } catch (err: any) {
      showNotification(`Failed to save lead: ${err.message}`, 'error');
      console.error('Save lead error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {isEditMode ? 'Edit Lead' : 'Add New Lead'}
          </h1>
          <p className={theme.textSecondary}>
            {isEditMode ? 'Update lead details and track progress.' : 'Capture new sales enquiries and potential customers.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/crm/leads')} icon={<ArrowLeft size={16} />}>
          Back to Leads List
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
              Lead Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Lead Name"
                value={formData.leadName}
                onChange={(val) => handleInputChange('leadName', val)}
                placeholder="e.g., John Doe"
                required
              />
              <FormField
                label="Company Name"
                value={formData.companyName}
                onChange={(val) => handleInputChange('companyName', val)}
                placeholder="e.g., ABC Corp"
              />
              <FormField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(val) => handleInputChange('email', val)}
                placeholder="john.doe@example.com"
                icon={<Mail size={18} />}
              />
              <FormField
                label="Phone"
                value={formData.phone}
                onChange={(val) => handleInputChange('phone', val)}
                placeholder="+1 123-456-7890"
                icon={<Phone size={18} />}
              />
              <FormField
                label="Mobile"
                value={formData.mobile}
                onChange={(val) => handleInputChange('mobile', val)}
                placeholder="+1 987-654-3210"
                icon={<Phone size={18} />}
              />
              <FormField
                label="Website"
                value={formData.website}
                onChange={(val) => handleInputChange('website', val)}
                placeholder="https://www.example.com"
              />
              <MasterSelectField
                label="Lead Source"
                value={availableSources.find(src => src.id === formData.leadSourceId)?.name || ''}
                onValueChange={(val) => {}}
                onSelect={(id) => handleInputChange('leadSourceId', id)}
                options={availableSources}
                placeholder="Select Source"
              />
              <MasterSelectField
                label="Assigned Salesperson"
                value={availableEmployees.find(emp => emp.id === formData.leadOwnerId)?.name || ''}
                onValueChange={(val) => {}}
                onSelect={(id) => handleInputChange('leadOwnerId', id)}
                options={availableEmployees}
                placeholder="Select Salesperson"
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  <option value="open">Open</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <FormField
                label="Next Contact Date"
                type="date"
                value={formData.nextContactDate}
                onChange={(val) => handleInputChange('nextContactDate', val)}
                icon={<Calendar size={18} />}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <Building size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Company Details (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Annual Revenue"
                type="number"
                value={formData.annualRevenue.toString()}
                onChange={(val) => handleInputChange('annualRevenue', parseFloat(val) || 0)}
                icon={<TrendingUp size={18} />}
              />
              <FormField
                label="No. of Employees"
                type="number"
                value={formData.noOfEmployees.toString()}
                onChange={(val) => handleInputChange('noOfEmployees', parseInt(val) || 0)}
                icon={<Users size={18} />}
              />
              <FormField
                label="Industry"
                value={formData.industry}
                onChange={(val) => handleInputChange('industry', val)}
                placeholder="e.g., Technology, Manufacturing"
              />
              <MasterSelectField
                label="Territory"
                value={availableTerritories.find(terr => terr.id === formData.territoryId)?.name || ''}
                onValueChange={(val) => {}}
                onSelect={(id) => handleInputChange('territoryId', id)}
                options={availableTerritories}
                placeholder="Select Territory"
              />
              <FormField
                label="Address Line 1"
                value={formData.address.street1 || ''}
                onChange={(val) => handleAddressChange('street1', val)}
                placeholder="Street address, P.O. box"
                className="md:col-span-2"
              />
              <FormField
                label="Address Line 2"
                value={formData.address.street2 || ''}
                onChange={(val) => handleAddressChange('street2', val)}
                placeholder="Apartment, suite, unit, building, floor, etc."
                className="md:col-span-2"
              />
              <FormField
                label="City"
                value={formData.address.city || ''}
                onChange={(val) => handleAddressChange('city', val)}
                placeholder="City"
              />
              <FormField
                label="State"
                value={formData.address.state || ''}
                onChange={(val) => handleAddressChange('state', val)}
                placeholder="State"
              />
              <FormField
                label="Country"
                value={formData.address.country || ''}
                onChange={(val) => handleAddressChange('country', val)}
                placeholder="Country"
              />
              <FormField
                label="ZIP Code"
                value={formData.address.zipCode || ''}
                onChange={(val) => handleAddressChange('zipCode', val)}
                placeholder="ZIP Code"
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <Tag size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Notes
            </h3>
            <FormField
              label="Notes"
              value={formData.notes}
              onChange={(val) => handleInputChange('notes', val)}
              placeholder="Any additional notes about this lead"
              className="md:col-span-2"
            />
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/crm/leads')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} icon={<Save size={16} />}>
              {isSubmitting ? 'Saving...' : 'Save Lead'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default LeadFormPage;
