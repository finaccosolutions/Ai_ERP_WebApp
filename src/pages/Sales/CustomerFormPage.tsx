// src/pages/Sales/CustomerFormPage.tsx
import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Building, CreditCard, Save, ArrowLeft,
  Globe, Tag, Users, Info, DollarSign, Calendar, FileText, Truck,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { COUNTRIES, getCountryByCode, getPhoneCountryCodes } from '../../constants/geoData';
import CreateCustomerGroupModal from '../../components/Modals/CreateCustomerGroupModal'; // New import
import CreatePriceListModal from '../../components/Modals/CreatePriceListModal'; // New import

interface CustomerFormData {
  id?: string;
  customerCode: string;
  name: string;
  customerType: string; // Changed to string to accommodate more types
  email: string;
  phone: string;
  mobile: string;
  website: string;
  taxId: string;
  pan: string;
  gstin: string;
  billingAddress: {
    street1: string;
    street2: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  shippingAddress: {
    street1: string;
    street2: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  creditLimit: number;
  creditDays: number;
  priceListId: string;
  territory: string;
  paymentTerms: string;
  customerGroupId: string;
  notes: string;
  isActive: boolean;
}

function CustomerFormPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const viewOnly = searchParams.get('viewOnly') === 'true';

  const [formData, setFormData] = useState<CustomerFormData>({
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
    shippingAddress: { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
    creditLimit: 0,
    creditDays: 30,
    priceListId: '',
    territory: '',
    paymentTerms: '',
    customerGroupId: '',
    notes: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [customerGroups, setCustomerGroups] = useState<{ id: string; name: string }[]>([]);
  const [priceLists, setPriceLists] = useState<{ id: string; name: string }[]>([]);

  const [selectedBillingCountry, setSelectedBillingCountry] = useState<string>('');
  const [selectedShippingCountry, setSelectedShippingCountry] = useState<string>('');
  const [selectedPhoneCountryCode, setSelectedPhoneCountryCode] = useState<string>('+91'); // Default to India

  // Section expansion states
  const [showBasicInfo, setShowBasicInfo] = useState(true);
  const [showBillingAddress, setShowBillingAddress] = useState(true);
  const [showShippingAddress, setShowShippingAddress] = useState(true);
  const [showContactDetails, setShowContactDetails] = useState(true);
  const [showFinancialTax, setShowFinancialTax] = useState(true);
  const [showOtherDetails, setShowOtherDetails] = useState(true);

  // Master creation modal states
  const [showCreateCustomerGroupModal, setShowCreateCustomerGroupModal] = useState(false);
  const [showCreatePriceListModal, setShowCreatePriceListModal] = useState(false);
  const [newMasterValue, setNewMasterValue] = useState(''); // To hold the value typed by user for new master

  // Dynamic tax labels
  const [taxRegMainLabel, setTaxRegMainLabel] = useState('Tax ID');
  const [taxRegSecondaryLabel, setTaxRegSecondaryLabel] = useState('Secondary Tax ID');
  const [taxRegTertiaryLabel, setTaxRegTertiaryLabel] = useState('Tertiary Tax ID');

  useEffect(() => {
    if (currentCompany?.id) {
      fetchCustomerGroups();
      fetchPriceLists();
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    if (id && currentCompany?.id) {
      fetchCustomerData(id);
    }
  }, [id, currentCompany?.id]);

  // Effect to update tax labels based on billing country
  useEffect(() => {
    const countryData = getCountryByCode(selectedBillingCountry);
    if (countryData?.taxConfig?.registrationLabels) {
      setTaxRegMainLabel(countryData.taxConfig.registrationLabels.main || 'Tax ID');
      setTaxRegSecondaryLabel(countryData.taxConfig.registrationLabels.secondary || 'Secondary Tax ID');
      setTaxRegTertiaryLabel(countryData.taxConfig.registrationLabels.tertiary || 'Tertiary Tax ID');
    } else {
      setTaxRegMainLabel('Tax ID');
      setTaxRegSecondaryLabel('Secondary Tax ID');
      setTaxRegTertiaryLabel('Tertiary Tax ID');
    }
  }, [selectedBillingCountry]);

  const fetchCustomerGroups = async () => {
    const { data, error } = await supabase
      .from('customer_groups')
      .select('id, name')
      .eq('company_id', currentCompany?.id);
    if (error) {
      console.error('Error fetching customer groups:', error);
    } else {
      setCustomerGroups(data || []);
    }
  };

  const fetchPriceLists = async () => {
    const { data, error } = await supabase
      .from('price_lists')
      .select('id, name')
      .eq('company_id', currentCompany?.id);
    if (error) {
      console.error('Error fetching price lists:', error);
    } else {
      setPriceLists(data || []);
    }
  };

  const fetchCustomerData = async (customerId: string) => {
    setLoading(true);
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
          customerCode: data.customer_code || '',
          name: data.name || '',
          customerType: data.customer_type || 'individual',
          email: data.email || '',
          phone: data.phone?.replace(getPhoneCountryCodes().find(c => c.dialCode === selectedPhoneCountryCode)?.dialCode || '', '') || '', // Remove country code for display
          mobile: data.mobile?.replace(getPhoneCountryCodes().find(c => c.dialCode === selectedPhoneCountryCode)?.dialCode || '', '') || '', // Remove country code for display
          website: data.website || '',
          taxId: data.tax_id || '',
          pan: data.pan || '',
          gstin: data.gstin || '',
          billingAddress: data.billing_address || { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
          shippingAddress: data.shipping_address || { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
          creditLimit: data.credit_limit || 0,
          creditDays: data.credit_days || 30,
          priceListId: data.price_list_id || '',
          territory: data.territory || '',
          paymentTerms: data.payment_terms || '',
          customerGroupId: data.customer_group_id || '',
          notes: data.notes || '',
          isActive: data.is_active || true,
        });
        setSelectedBillingCountry(data.billing_address?.country || '');
        setSelectedShippingCountry(data.shipping_address?.country || '');
        // Attempt to set phone country code if available in stored phone/mobile
        const phoneCountryCode = getPhoneCountryCodes().find(c => data.phone?.startsWith(c.dialCode));
        if (phoneCountryCode) setSelectedPhoneCountryCode(phoneCountryCode.dialCode);
      }
    } catch (err: any) {
      showNotification(`Error loading customer: ${err.message}`, 'error');
      console.error('Error loading customer:', err);
      navigate('/sales/customers'); // Redirect back to list on error
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (addressType: 'billingAddress' | 'shippingAddress', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Customer Name is required.';
    if (!formData.customerCode.trim()) newErrors.customerCode = 'Customer Code is required.';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format.';

    // Dynamic tax field validation based on country
    const countryTaxConfig = getCountryByCode(selectedBillingCountry)?.taxConfig;
    if (countryTaxConfig) {
      if (countryTaxConfig.type === 'GST') {
        if (!formData.gstin.trim()) newErrors.gstin = `${taxRegMainLabel} is required.`;
        // PAN is generally required for companies in India, but not strictly validated here
      } else if (countryTaxConfig.type === 'VAT' || countryTaxConfig.type === 'Sales Tax') {
        if (!formData.taxId.trim()) newErrors.taxId = `${taxRegMainLabel} is required.`;
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification('Please correct the errors in the form.', 'error');
      return;
    }
    if (!currentCompany?.id || !user?.id) {
      showNotification('Company or user information is missing. Please log in and select a company.', 'error');
      return;
    }

    setLoading(true);
    try {
      const customerToSave = {
        company_id: currentCompany.id,
        customer_code: formData.customerCode,
        name: formData.name,
        customer_type: formData.customerType,
        email: formData.email,
        // Prepend country code to phone and mobile
        phone: formData.phone ? `${selectedPhoneCountryCode}${formData.phone}` : null,
        mobile: formData.mobile ? `${selectedPhoneCountryCode}${formData.mobile}` : null,
        website: formData.website,
        tax_id: formData.taxId,
        pan: formData.pan,
        gstin: formData.gstin,
        billing_address: formData.billingAddress,
        shipping_address: formData.shippingAddress,
        credit_limit: formData.creditLimit,
        credit_days: formData.creditDays,
        price_list_id: formData.priceListId || null,
        territory: formData.territory,
        payment_terms: formData.paymentTerms,
        customer_group_id: formData.customerGroupId || null,
        notes: formData.notes,
        is_active: formData.isActive,
      };

      if (formData.id) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update(customerToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Customer updated successfully!', 'success');
      } else {
        // Create new customer
        const { error } = await supabase
          .from('customers')
          .insert(customerToSave);
        if (error) throw error;
        showNotification('Customer created successfully!', 'success');
      }
      navigate('/sales/customers'); // Redirect back to list
    } catch (err: any) {
      showNotification(`Failed to save customer: ${err.message}`, 'error');
      console.error('Save customer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatesForCountry = (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    return country ? country.states.map(s => ({ id: s.code, name: s.name })) : [];
  };

  const customerTypeOptions = COUNTRIES.find(c => c.code === selectedBillingCountry)?.customerTypes || [
    { code: 'individual', name: 'Individual' },
    { code: 'company', name: 'Company' },
  ];

  const toggleSection = (setter: React.Dispatch<React.SetStateAction<boolean>>, state: boolean) => {
    setter(!state);
  };

  const handleNewMasterValue = (type: 'customerGroup' | 'priceList', value: string) => {
    setNewMasterValue(value);
    if (type === 'customerGroup') {
      showNotification(
        `Customer group "${value}" not found. Do you want to create it?`,
        'info',
        {
          action: () => setShowCreateCustomerGroupModal(true),
          actionText: 'Create New',
        }
      );
    } else if (type === 'priceList') {
      showNotification(
        `Price list "${value}" not found. Do you want to create it?`,
        'info',
        {
          action: () => setShowCreatePriceListModal(true),
          actionText: 'Create New',
        }
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6AC8A3]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {id ? (viewOnly ? 'View Customer' : 'Edit Customer') : 'Add New Customer'}
          </h1>
          <p className={theme.textSecondary}>
            {id ? (viewOnly ? 'View customer details.' : 'Update customer information.') : 'Enter new customer details.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/sales/customers')} icon={<ArrowLeft size={16} />}>
          Back to Customer List
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection(setShowBasicInfo, showBasicInfo)}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
              <Info size={20} className="mr-2 text-[#6AC8A3]" />
              Basic Information
            </h3>
            {showBasicInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showBasicInfo ? 'max-h-screen' : 'max-h-0'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Adjusted grid */}
              <FormField
                label="Customer Name"
                value={formData.name}
                onChange={(val) => handleInputChange('name', val)}
                placeholder="e.g., ABC Corp"
                required
                error={formErrors.name}
                readOnly={viewOnly}
              />
              <FormField
                label="Customer Code"
                value={formData.customerCode}
                onChange={(val) => handleInputChange('customerCode', val)}
                placeholder="e.g., CUST001"
                required
                error={formErrors.customerCode}
                readOnly={viewOnly}
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                  Customer Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customerType}
                  onChange={(e) => handleInputChange('customerType', e.target.value)}
                  className={`
                    w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                    ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
                    focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    ${viewOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                  `}
                  disabled={viewOnly}
                >
                  {customerTypeOptions.map(type => (
                    <option key={type.code} value={type.code}>{type.name}</option>
                  ))}
                </select>
              </div>
              <MasterSelectField
                label="Customer Group"
                value={customerGroups.find(g => g.id === formData.customerGroupId)?.name || ''}
                onValueChange={(val) => { /* This is for typing, actual selection is onSelect */ }}
                onSelect={(id) => handleInputChange('customerGroupId', id)}
                options={customerGroups}
                placeholder="Select customer group"
                readOnly={viewOnly}
                allowCreation={true} // Enable creation
                onNewValue={(val) => handleNewMasterValue('customerGroup', val)} // Handle new value
              />
              <FormField
                label="Website"
                value={formData.website}
                onChange={(val) => handleInputChange('website', val)}
                placeholder="https://www.example.com"
                readOnly={viewOnly}
              />
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                  disabled={viewOnly}
                />
                <label htmlFor="isActive" className={`text-sm font-medium ${theme.textPrimary}`}>
                  Is Active
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Details */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection(setShowContactDetails, showContactDetails)}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
              <Phone size={20} className="mr-2 text-[#6AC8A3]" />
              Contact Details
            </h3>
            {showContactDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showContactDetails ? 'max-h-screen' : 'max-h-0'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(val) => handleInputChange('email', val)}
                placeholder="customer@example.com"
                icon={<Mail size={18} />}
                error={formErrors.email}
                readOnly={viewOnly}
              />
                <div className="flex items-end gap-2">
                <MasterSelectField
                  label="Code"
                  value={selectedPhoneCountryCode}
                  onValueChange={() => {}} // Not used for typing here
                  onSelect={(selectedOption) => setSelectedPhoneCountryCode(selectedOption.id)}
                  options={getPhoneCountryCodes()}
                  placeholder="Code"
                  className="w-1/4" // Removed {/* Adjusted width */}
                  readOnly={viewOnly}
                />
                <FormField
                  label="Phone"
                  value={formData.phone}
                  onChange={(val) => handleInputChange('phone', val)}
                  placeholder="1234567890"
                  icon={<Phone size={18} />}
                  className="w-3/4" // Removed {/* Adjusted width */}
                  readOnly={viewOnly}
                />
              </div>
              <div className="flex items-end gap-2">
                <MasterSelectField
                  label="Code"
                  value={selectedPhoneCountryCode}
                  onValueChange={() => {}} // Not used for typing here
                  onSelect={(selectedOption) => setSelectedPhoneCountryCode(selectedOption.id)}
                  options={getPhoneCountryCodes()}
                  placeholder="Code"
                  className="w-1/4" // Removed {/* Adjusted width */}
                  readOnly={viewOnly}
                />
                <FormField
                  label="Mobile"
                  value={formData.mobile}
                  onChange={(val) => handleInputChange('mobile', val)}
                  placeholder="9876543210"
                  icon={<Phone size={18} />}
                  className="w-3/4" // Removed {/* Adjusted width */}
                  readOnly={viewOnly}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Billing Address */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection(setShowBillingAddress, showBillingAddress)}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
              <MapPin size={20} className="mr-2 text-[#6AC8A3]" />
              Billing Address
            </h3>
            {showBillingAddress ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showBillingAddress ? 'max-h-screen' : 'max-h-0'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Address Line 1"
                value={formData.billingAddress.street1}
                onChange={(val) => handleAddressChange('billingAddress', 'street1', val)}
                placeholder="Street address, P.O. box"
                readOnly={viewOnly}
              />
              <FormField
                label="Address Line 2"
                value={formData.billingAddress.street2}
                onChange={(val) => handleAddressChange('billingAddress', 'street2', val)}
                placeholder="Apartment, suite, unit, building, floor, etc."
                readOnly={viewOnly}
              />
              <FormField
                label="City"
                value={formData.billingAddress.city}
                onChange={(val) => handleAddressChange('billingAddress', 'city', val)}
                placeholder="City"
                readOnly={viewOnly}
              />
              <FormField
                label="ZIP Code"
                value={formData.billingAddress.zipCode}
                onChange={(val) => handleAddressChange('billingAddress', 'zipCode', val)}
                placeholder="ZIP Code"
                readOnly={viewOnly}
              />
              <MasterSelectField
                label="Country"
                value={COUNTRIES.find(c => c.code === selectedBillingCountry)?.name || ''}
                onValueChange={(val) => { /* For typing */ }}
                onSelect={(id) => {
                  setSelectedBillingCountry(id);
                  handleAddressChange('billingAddress', 'country', id);
                  handleAddressChange('billingAddress', 'state', ''); // Clear state when country changes
                }}
                options={COUNTRIES.map(c => ({ id: c.code, name: c.name }))}
                placeholder="Select Country"
                readOnly={viewOnly}
              />
              <MasterSelectField
                label="State"
                value={getStatesForCountry(selectedBillingCountry).find(s => s.id === formData.billingAddress.state)?.name || ''}
                onValueChange={(val) => { /* For typing */ }}
                onSelect={(id) => handleAddressChange('billingAddress', 'state', id)}
                options={getStatesForCountry(selectedBillingCountry)}
                placeholder="Select State"
                disabled={!selectedBillingCountry || viewOnly}
                readOnly={viewOnly}
              />
            </div>
          </div>
        </Card>

        {/* Shipping Address */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection(setShowShippingAddress, showShippingAddress)}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
              <Truck size={20} className="mr-2 text-[#6AC8A3]" />
              Shipping Address (Optional)
            </h3>
            {showShippingAddress ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showShippingAddress ? 'max-h-screen' : 'max-h-0'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Address Line 1"
                value={formData.shippingAddress.street1}
                onChange={(val) => handleAddressChange('shippingAddress', 'street1', val)}
                placeholder="Street address, P.O. box"
                readOnly={viewOnly}
              />
              <FormField
                label="Address Line 2"
                value={formData.shippingAddress.street2}
                onChange={(val) => handleAddressChange('shippingAddress', 'street2', val)}
                placeholder="Apartment, suite, unit, building, floor, etc."
                readOnly={viewOnly}
              />
              <FormField
                label="City"
                value={formData.shippingAddress.city}
                onChange={(val) => handleAddressChange('shippingAddress', 'city', val)}
                placeholder="City"
                readOnly={viewOnly}
              />
              <FormField
                label="ZIP Code"
                value={formData.shippingAddress.zipCode}
                onChange={(val) => handleAddressChange('shippingAddress', 'zipCode', val)}
                placeholder="ZIP Code"
                readOnly={viewOnly}
              />
              <MasterSelectField
                label="Country"
                value={COUNTRIES.find(c => c.code === selectedShippingCountry)?.name || ''}
                onValueChange={(val) => { /* For typing */ }}
                onSelect={(id) => {
                  setSelectedShippingCountry(id);
                  handleAddressChange('shippingAddress', 'country', id);
                  handleAddressChange('shippingAddress', 'state', ''); // Clear state when country changes
                }}
                options={COUNTRIES.map(c => ({ id: c.code, name: c.name }))}
                placeholder="Select Country"
                readOnly={viewOnly}
              />
              <MasterSelectField
                label="State"
                value={getStatesForCountry(selectedShippingCountry).find(s => s.id === formData.shippingAddress.state)?.name || ''}
                onValueChange={(val) => { /* For typing */ }}
                onSelect={(id) => handleAddressChange('shippingAddress', 'state', id)}
                options={getStatesForCountry(selectedShippingCountry)}
                placeholder="Select State"
                disabled={!selectedShippingCountry || viewOnly}
                readOnly={viewOnly}
              />
            </div>
          </div>
        </Card>

        {/* Financial & Tax Details */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection(setShowFinancialTax, showFinancialTax)}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
              <DollarSign size={20} className="mr-2 text-[#6AC8A3]" />
              Financial & Tax Details
            </h3>
            {showFinancialTax ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showFinancialTax ? 'max-h-screen' : 'max-h-0'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Adjusted grid */}
              <FormField
                label="Credit Limit"
                type="number"
                value={formData.creditLimit.toString()}
                onChange={(val) => handleInputChange('creditLimit', parseFloat(val) || 0)}
                icon={<CreditCard size={18} />}
                readOnly={viewOnly}
              />
              <FormField
                label="Credit Days"
                type="number"
                value={formData.creditDays.toString()}
                onChange={(val) => handleInputChange('creditDays', parseInt(val) || 0)}
                icon={<Calendar size={18} />}
                readOnly={viewOnly}
              />
              <MasterSelectField
                label="Price List"
                value={priceLists.find(pl => pl.id === formData.priceListId)?.name || ''}
                onValueChange={(val) => { /* For typing */ }}
                onSelect={(id) => handleInputChange('priceListId', id)}
                options={priceLists}
                placeholder="Select Price List"
                readOnly={viewOnly}
                allowCreation={true} // Enable creation
                onNewValue={(val) => handleNewMasterValue('priceList', val)} // Handle new value
              />
              <FormField
                label="Payment Terms"
                value={formData.paymentTerms}
                onChange={(val) => handleInputChange('paymentTerms', val)}
                placeholder="e.g., Net 30, Due on receipt"
                readOnly={viewOnly}
              />

              {/* Dynamic Tax Fields based on selectedBillingCountry */}
              {(() => {
                const countryTaxConfig = getCountryByCode(selectedBillingCountry)?.taxConfig;
                if (!countryTaxConfig) return null;

                if (countryTaxConfig.type === 'GST') {
                  return (
                    <>
                      <FormField
                        label={taxRegMainLabel}
                        value={formData.gstin}
                        onChange={(val) => handleInputChange('gstin', val)}
                        placeholder={`e.g., ${taxRegMainLabel}`}
                        required={true} // GSTIN is typically required for GST
                        error={formErrors.gstin}
                        readOnly={viewOnly}
                      />
                      <FormField
                        label={taxRegSecondaryLabel}
                        value={formData.pan}
                        onChange={(val) => handleInputChange('pan', val)}
                        placeholder={`e.g., ${taxRegSecondaryLabel}`}
                        readOnly={viewOnly}
                      />
                      {countryTaxConfig.registrationLabels?.tertiary && (
                        <FormField
                          label={taxRegTertiaryLabel}
                          value={formData.taxId} // Using taxId for tertiary if available
                          onChange={(val) => handleInputChange('taxId', val)}
                          placeholder={`e.g., ${taxRegTertiaryLabel}`}
                          readOnly={viewOnly}
                        />
                      )}
                    </>
                  );
                } else if (countryTaxConfig.type === 'VAT' || countryTaxConfig.type === 'Sales Tax') {
                  return (
                    <FormField
                      label={taxRegMainLabel}
                      value={formData.taxId}
                      onChange={(val) => handleInputChange('taxId', val)}
                      placeholder={`e.g., ${taxRegMainLabel}`}
                      required={true}
                      error={formErrors.taxId}
                      readOnly={viewOnly}
                    />
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </Card>

        {/* Other Details */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection(setShowOtherDetails, showOtherDetails)}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
              <FileText size={20} className="mr-2 text-[#6AC8A3]" />
              Other Details
            </h3>
            {showOtherDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showOtherDetails ? 'max-h-screen' : 'max-h-0'}`}>
            <FormField
              label="Territory"
              value={formData.territory}
              onChange={(val) => handleInputChange('territory', val)}
              placeholder="e.g., North Region, South Zone"
              readOnly={viewOnly}
            />
            <FormField
              label="Notes"
              value={formData.notes}
              onChange={(val) => handleInputChange('notes', val)}
              placeholder="Any additional notes about the customer"
              readOnly={viewOnly}
            />
          </div>
        </Card>

        {!viewOnly && (
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/sales/customers')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} icon={<Save size={16} />}>
              {loading ? 'Saving...' : (id ? 'Update Customer' : 'Save Customer')}
            </Button>
          </div>
        )}
      </form>

      {/* Modals for creating new masters */}
      {showCreateCustomerGroupModal && (
        <CreateCustomerGroupModal
          isOpen={showCreateCustomerGroupModal}
          onClose={() => setShowCreateCustomerGroupModal(false)}
          onSuccess={(newGroup) => {
            fetchCustomerGroups(); // Refresh list
            setFormData(prev => ({ ...prev, customerGroupId: newGroup.id })); // Select new group
            setShowCreateCustomerGroupModal(false);
            showNotification(`Customer Group "${newGroup.name}" created!`, 'success');
          }}
          initialName={newMasterValue}
        />
      )}

      {showCreatePriceListModal && (
        <CreatePriceListModal
          isOpen={showCreatePriceListModal}
          onClose={() => setShowCreatePriceListModal(false)}
          onSuccess={(newList) => {
            fetchPriceLists(); // Refresh list
            setFormData(prev => ({ ...prev, priceListId: newList.id })); // Select new list
            setShowCreatePriceListModal(false);
            showNotification(`Price List "${newList.name}" created!`, 'success');
          }}
          initialName={newMasterValue}
        />
      )}
    </div>
  );
}

export default CustomerFormPage;
