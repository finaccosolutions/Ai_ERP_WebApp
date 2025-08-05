// src/pages/Sales/CustomerFormPage.tsx
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
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import { COUNTRIES, getCountryByCode } from '../../constants/geoData';

interface Customer {
  id: string;
  customer_code: string;
  name: string;
  customer_type: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  tax_id: string | null;
  pan: string | null;
  gstin: string | null;
  billing_address: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  } | null;
  shipping_address: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  } | null;
  credit_limit: number | null;
  credit_days: number | null;
  price_list_id: string | null;
  territory: string | null;
  payment_terms: string | null;
  is_active: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer_group_id: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  tax_registration_type: string | null;
}

function CustomerFormPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get ID from URL for edit mode
  const location = useLocation(); // Use useLocation to access state

  const [formData, setFormData] = useState({
    id: '',
    customerCode: '',
    name: '',
    customerType: 'individual',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    taxId: '',
    pan: '',
    gstin: '',
    billingAddress: { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
    shippingAddress: { street1: '', street2: '', city: '', state: '', country: '' },
    creditLimit: 0,
    creditDays: 0,
    priceListId: '',
    territory: '',
    paymentTerms: '',
    isActive: true,
    notes: '',
    customerGroupId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    taxRegistrationType: '',
  });

  const [availableCustomerGroups, setAvailableCustomerGroups] = useState<{ id: string; name: string }[]>([]);
  const [availablePriceLists, setAvailablePriceLists] = useState<{ id: string; name: string }[]>([]);
  const [availableTerritories, setAvailableTerritories] = useState<{ id: string; name: string }[]>([]);
  const [availableStates, setAvailableStates] = useState<{ id: string; name: string }[]>([]); // For billing/shipping address states

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!id;
  const isViewMode = location.search.includes('viewOnly=true');

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      await fetchMastersData(currentCompany?.id as string);
      if (isEditMode) {
        await fetchCustomerData(id as string);
      } else {
        resetForm();
        // Handle return from customer group creation
        if (location.state?.fromCustomerGroupCreation && location.state?.customerFormData) {
          setFormData(location.state.customerFormData);
          if (location.state.createdGroupId) {
            setFormData(prev => ({ ...prev, customerGroupId: location.state.createdGroupId }));
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
      const { data: groupsData, error: groupsError } = await supabase
        .from('customer_groups')
        .select('id, name')
        .eq('company_id', companyId);
      if (groupsError) throw groupsError;
      setAvailableCustomerGroups(groupsData || []);

      const { data: priceListsData, error: priceListsError } = await supabase
        .from('price_lists')
        .select('id, name')
        .eq('company_id', companyId);
      if (priceListsError) throw priceListsError;
      setAvailablePriceLists(priceListsData || []);

      const { data: territoriesData, error: territoriesError } = await supabase
        .from('territories')
        .select('id, name')
        .eq('company_id', companyId);
      if (territoriesError) throw territoriesError;
      setAvailableTerritories(territoriesData || []);

      // Fetch country-specific states
      const countryConfig = getCountryByCode(currentCompany?.country || '');
      if (countryConfig) {
        setAvailableStates(countryConfig.states.map(s => ({ id: s.code, name: s.name })));
      }

    } catch (error) {
      console.error('Error fetching master data:', error);
      showNotification('Failed to load customer groups, price lists, or territories.', 'error');
    }
  };

  const fetchCustomerData = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          customerCode: data.customer_code,
          name: data.name,
          customerType: data.customer_type || 'individual',
          email: data.email || '',
          phone: data.phone || '',
          mobile: data.mobile || '',
          website: data.website || '',
          taxId: data.tax_id || '',
          pan: data.pan || '',
          gstin: data.gstin || '',
          billingAddress: data.billing_address || { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
          shippingAddress: data.shipping_address || { street1: '', street2: '', city: '', state: '', country: '' },
          creditLimit: data.credit_limit || 0,
          creditDays: data.credit_days || 0,
          priceListId: data.price_list_id || '',
          territory: data.territory || '',
          paymentTerms: data.payment_terms || '',
          isActive: data.is_active || true,
          notes: data.notes || '',
          customerGroupId: data.customer_group_id || '',
          bankName: data.bank_name || '',
          accountNumber: data.account_number || '',
          ifscCode: data.ifsc_code || '',
          taxRegistrationType: data.tax_registration_type || '',
        });
      }
    } catch (err: any) {
      showNotification(`Error loading customer: ${err.message}`, 'error');
      console.error('Error loading customer:', err);
      navigate('/sales/customers');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (addressType: 'billingAddress' | 'shippingAddress', field: keyof typeof formData['billingAddress'], value: string) => {
    setFormData(prev => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value,
      },
    }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      customerCode: '',
      name: '',
      customerType: 'individual',
      email: '',
      phone: '',
      mobile: '',
      website: '',
      taxId: '',
      pan: '',
      gstin: '',
      billingAddress: { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
      shippingAddress: { street1: '', street2: '', city: '', state: '', country: '' },
      creditLimit: 0,
      creditDays: 0,
      priceListId: '',
      territory: '',
      paymentTerms: '',
      isActive: true,
      notes: '',
      customerGroupId: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      taxRegistrationType: '',
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showNotification('Customer Name is required.', 'error');
      return false;
    }
    if (!formData.customerCode.trim()) {
      showNotification('Customer Code is required.', 'error');
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
      const customerToSave = {
        company_id: currentCompany.id,
        customer_code: formData.customerCode,
        name: formData.name,
        customer_type: formData.customerType,
        email: formData.email || null,
        phone: formData.phone || null,
        mobile: formData.mobile || null,
        website: formData.website || null,
        tax_id: formData.taxId || null,
        pan: formData.pan || null,
        gstin: formData.gstin || null,
        billing_address: formData.billingAddress,
        shipping_address: formData.shippingAddress,
        credit_limit: formData.creditLimit,
        credit_days: formData.creditDays,
        price_list_id: formData.priceListId || null,
        territory: formData.territory || null,
        payment_terms: formData.paymentTerms || null,
        is_active: formData.isActive,
        notes: formData.notes || null,
        customer_group_id: formData.customerGroupId || null,
        bank_name: formData.bankName || null,
        account_number: formData.accountNumber || null,
        ifsc_code: formData.ifscCode || null,
        tax_registration_type: formData.taxRegistrationType || null,
      };

      if (formData.id) {
        const { error } = await supabase
          .from('customers')
          .update(customerToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Customer updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('customers')
          .insert(customerToSave);
        if (error) throw error;
        showNotification('Customer created successfully!', 'success');
      }
      navigate('/sales/customers');
      resetForm();
    } catch (err: any) {
      showNotification(`Failed to save customer: ${err.message}`, 'error');
      console.error('Save customer error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomerGroup = () => {
    navigate('/sales/customer-groups', {
      state: {
        fromCustomerForm: true,
        returnPath: location.pathname + location.search, // Pass current path including query params
        customerFormData: formData, // Pass current form data
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {isEditMode ? (isViewMode ? 'View Customer' : 'Edit Customer') : 'Add New Customer'}
          </h1>
          <p className={theme.textSecondary}>
            {isEditMode ? (isViewMode ? 'Review customer details.' : 'Update customer information.') : 'Add a new customer to your database.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/sales/customers')} icon={<ArrowLeft size={16} />}>
          Back to Customers List
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
              General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Customer Name"
                value={formData.name}
                onChange={(val) => handleInputChange('name', val)}
                placeholder="e.g., ABC Corp, John Doe"
                required
                readOnly={isViewMode}
              />
              <FormField
                label="Customer Code"
                value={formData.customerCode}
                onChange={(val) => handleInputChange('customerCode', val)}
                placeholder="e.g., CUST-001"
                required
                readOnly={isViewMode || isEditMode} // Code is usually not editable after creation
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Customer Type</label>
                <select
                  value={formData.customerType}
                  onChange={(e) => handleInputChange('customerType', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                  disabled={isViewMode}
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </div>
              <FormField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(val) => handleInputChange('email', val)}
                placeholder="customer@example.com"
                icon={<Mail size={18} />}
                readOnly={isViewMode}
              />
              <FormField
                label="Phone"
                value={formData.phone}
                onChange={(val) => handleInputChange('phone', val)}
                placeholder="+1 123-456-7890"
                icon={<Phone size={18} />}
                readOnly={isViewMode}
              />
              <FormField
                label="Mobile"
                value={formData.mobile}
                onChange={(val) => handleInputChange('mobile', val)}
                placeholder="+1 987-654-3210"
                icon={<Phone size={18} />}
                readOnly={isViewMode}
              />
              <FormField
                label="Website"
                value={formData.website}
                onChange={(val) => handleInputChange('website', val)}
                placeholder="https://www.example.com"
                readOnly={isViewMode}
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Tax Registration Type</label>
                <select
                  value={formData.taxRegistrationType}
                  onChange={(e) => handleInputChange('taxRegistrationType', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                  disabled={isViewMode}
                >
                  <option value="">Select Type</option>
                  <option value="regular">Regular</option>
                  <option value="composition">Composition</option>
                  <option value="unregistered">Unregistered</option>
                </select>
              </div>
              <FormField
                label="Tax ID"
                value={formData.taxId}
                onChange={(val) => handleInputChange('taxId', val)}
                placeholder="e.g., VAT ID, EIN"
                readOnly={isViewMode}
              />
              <FormField
                label="PAN"
                value={formData.pan}
                onChange={(val) => handleInputChange('pan', val)}
                placeholder="Permanent Account Number"
                readOnly={isViewMode}
              />
              <FormField
                label="GSTIN"
                value={formData.gstin}
                onChange={(val) => handleInputChange('gstin', val)}
                placeholder="Goods and Services Tax Identification Number"
                readOnly={isViewMode}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <Building size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className={`text-md font-semibold ${theme.textPrimary} mb-2`}>Billing Address</h4>
                <FormField
                  label="Street 1"
                  value={formData.billingAddress.street1 || ''}
                  onChange={(val) => handleAddressChange('billingAddress', 'street1', val)}
                  readOnly={isViewMode}
                />
                <FormField
                  label="Street 2"
                  value={formData.billingAddress.street2 || ''}
                  onChange={(val) => handleAddressChange('billingAddress', 'street2', val)}
                  readOnly={isViewMode}
                />
                <FormField
                  label="City"
                  value={formData.billingAddress.city || ''}
                  onChange={(val) => handleAddressChange('billingAddress', 'city', val)}
                  readOnly={isViewMode}
                />
                <FormField
                  label="State"
                  value={formData.billingAddress.state || ''}
                  onChange={(val) => handleAddressChange('billingAddress', 'state', val)}
                  readOnly={isViewMode}
                />
                <FormField
                  label="Country"
                  value={formData.billingAddress.country || ''}
                  onChange={(val) => handleAddressChange('billingAddress', 'country', val)}
                  readOnly={isViewMode}
                />
                <FormField
                  label="ZIP Code"
                  value={formData.billingAddress.zipCode || ''}
                  onChange={(val) => handleAddressChange('billingAddress', 'zipCode', val)}
                  readOnly={isViewMode}
                />
              </div>
              <div>
                <h4 className={`text-md font-semibold ${theme.textPrimary} mb-2`}>Shipping Address</h4>
                <FormField
                  label="Street 1"
                  value={formData.shippingAddress.street1 || ''}
                  onChange={(val) => handleAddressChange('shippingAddress', 'street1', val)}
                  readOnly={isViewMode}
                />
                <FormField
                  label="Street 2"
                  value={formData.shippingAddress.street2 || ''}
                  onChange={(val) => handleAddressChange('shippingAddress', 'street2', val)}
                  readOnly={isViewMode}
                />
                <FormField
                  label="City"
                  value={formData.shippingAddress.city || ''}
                  onChange={(val) => handleAddressChange('shippingAddress', 'city', val)}
                  readOnly={isViewMode}
                />
                <FormField
                  label="State"
                  value={formData.shippingAddress.state || ''}
                  onChange={(val) => handleAddressChange('shippingAddress', 'state', val)}
                  readOnly={isViewMode}
                />
                <FormField
                  label="Country"
                  value={formData.shippingAddress.country || ''}
                  onChange={(val) => handleAddressChange('shippingAddress', 'country', val)}
                  readOnly={isViewMode}
                />
                <FormField
                  label="ZIP Code"
                  value={formData.shippingAddress.zipCode || ''}
                  onChange={(val) => handleAddressChange('shippingAddress', 'zipCode', val)}
                  readOnly={isViewMode}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <Tag size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Financial & Other Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Credit Limit"
                type="number"
                value={formData.creditLimit.toString()}
                onChange={(val) => handleInputChange('creditLimit', parseFloat(val) || 0)}
                icon={<DollarSign size={18} />}
                readOnly={isViewMode}
              />
              <FormField
                label="Credit Days"
                type="number"
                value={formData.creditDays.toString()}
                onChange={(val) => handleInputChange('creditDays', parseInt(val) || 0)}
                icon={<Calendar size={18} />}
                readOnly={isViewMode}
              />
              <MasterSelectField
                label="Price List"
                value={availablePriceLists.find(pl => pl.id === formData.priceListId)?.name || ''}
                onValueChange={(val) => {}}
                onSelect={(id) => handleInputChange('priceListId', id)}
                options={availablePriceLists}
                placeholder="Select Price List"
                readOnly={isViewMode}
              />
              <MasterSelectField
                label="Customer Group"
                value={availableCustomerGroups.find(cg => cg.id === formData.customerGroupId)?.name || ''}
                onValueChange={(val) => {}}
                onSelect={(id) => handleInputChange('customerGroupId', id)}
                options={availableCustomerGroups}
                placeholder="Select Customer Group"
                readOnly={isViewMode}
                allowCreation={true}
                onNewValueConfirmed={(name) => handleCreateCustomerGroup()}
              />
              <MasterSelectField
                label="Territory"
                value={availableTerritories.find(t => t.id === formData.territory)?.name || ''}
                onValueChange={(val) => {}}
                onSelect={(id) => handleInputChange('territory', id)}
                options={availableTerritories}
                placeholder="Select Territory"
                readOnly={isViewMode}
              />
              <FormField
                label="Payment Terms"
                value={formData.paymentTerms}
                onChange={(val) => handleInputChange('paymentTerms', val)}
                placeholder="e.g., Net 30, Due on Receipt"
                readOnly={isViewMode}
              />
              <FormField
                label="Bank Name"
                value={formData.bankName}
                onChange={(val) => handleInputChange('bankName', val)}
                readOnly={isViewMode}
              />
              <FormField
                label="Account Number"
                value={formData.accountNumber}
                onChange={(val) => handleInputChange('accountNumber', val)}
                readOnly={isViewMode}
              />
              <FormField
                label="IFSC Code"
                value={formData.ifscCode}
                onChange={(val) => handleInputChange('ifscCode', val)}
                readOnly={isViewMode}
              />
              <FormField
                label="Notes"
                value={formData.notes}
                onChange={(val) => handleInputChange('notes', val)}
                placeholder="Any additional notes about this customer"
                className="md:col-span-2"
                readOnly={isViewMode}
              />
              <div className="flex items-center space-x-3 md:col-span-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" disabled={isViewMode} />
                <label htmlFor="isActive" className={`text-sm font-medium ${theme.textPrimary}`}>Is Active</label>
              </div>
            </div>
          </Card>

          {!isViewMode && (
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/sales/customers')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} icon={<Save size={16} />}>
                {isSubmitting ? 'Saving...' : 'Save Customer'}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

export default CustomerFormPage;
