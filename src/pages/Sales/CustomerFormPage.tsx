// src/pages/Sales/CustomerFormPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, Building, CreditCard, Save, ArrowLeft,
  Globe, Tag, Users, Info, DollarSign, Calendar, FileText, Truck,
  Home, // Icon for Basic Info
  BookUser, // Icon for Billing Address (previously AddressBook)
  Package, // Icon for Shipping Address
  PhoneCall, // Icon for Contact Details
  Landmark, // Icon for Financial & Tax
  ClipboardList, // Icon for Other Details
  Briefcase, // General icon for company/business info
  ArrowRight, // For next tab navigation
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import MasterSelectField, { MasterSelectFieldRef } from '../../components/UI/MasterSelectField'; // Import MasterSelectFieldRef
import { useTheme } from '../../contexts/ThemeContext'; // CORRECTED LINE: Added 'from'
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext'; // CORRECTED LINE: Added 'from'
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'; // Import useLocation
import { COUNTRIES, getCountryByCode, getPhoneCountryCodes } from '../../constants/geoData';
import CreateCustomerGroupModal from '../../components/Modals/CreateCustomerGroupModal'; // New import
import CreatePriceListModal from '../../components/Modals/CreatePriceListModal'; // New import
import ConfirmationModal from '../../components/UI/ConfirmationModal'; // Import ConfirmationModal

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
  const location = useLocation(); // Initialize useLocation

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

  // Master creation modal states (these will be bypassed for direct navigation)
  const [showCreateCustomerGroupModal, setShowCreateCustomerGroupModal] = useState(false);
  const [showCreatePriceListModal, setShowCreatePriceListModal] = useState(false);
  const [newMasterValue, setNewMasterValue] = useState(''); // To hold the value typed by user for new master

  // New state for confirmation modal for customer group creation
  const [showCreateGroupConfirmModal, setShowCreateGroupConfirmModal] = useState(false);
  const [pendingNewGroupName, setPendingNewGroupName] = useState('');

  // State for the value currently typed in the customer group MasterSelectField
  const [typedCustomerGroupName, setTypedCustomerGroupName] = useState('');

  // Ref for Customer Group MasterSelectField
  const customerGroupRef = useRef<MasterSelectFieldRef>(null);
  // Ref for managing blur timeout to prevent conflict with onSelect
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic tax labels
  const [taxRegMainLabel, setTaxRegMainLabel] = useState('Tax ID');
  const [taxRegSecondaryLabel, setTaxRegSecondaryLabel] = useState('Secondary Tax ID');
  const [taxRegTertiaryLabel, setTaxRegTertiaryLabel] = useState('Tertiary Tax ID');

  // Tab state
  const [activeTab, setActiveTab] = useState('basic-info');

  // State for "Same as Billing Address" checkbox
  const [sameAsBilling, setSameAsBilling] = useState(false);

  // Add a state for isNewCustomer
  const [isNewCustomer, setIsNewCustomer] = useState(!id);

  const tabs = [
    { id: 'basic-info', label: 'Basic Info', icon: Home },
    { id: 'billing-address', label: 'Billing Address', icon: BookUser },
    { id: 'shipping-address', label: 'Shipping Address', icon: Package },
    { id: 'contact-details', label: 'Contact Details', icon: PhoneCall },
    { id: 'financial-tax', label: 'Financial & Tax', icon: Landmark },
    { id: 'other-details', label: 'Other Details', icon: ClipboardList },
  ];

  useEffect(() => {
    if (currentCompany?.id) {
      fetchCustomerGroups();
      fetchPriceLists();
      // Auto-fill country based on company's country
      const companyCountryCode = currentCompany.country;
      setSelectedBillingCountry(companyCountryCode);
      setSelectedShippingCountry(companyCountryCode);
      setFormData(prev => ({
        ...prev,
        billingAddress: { ...prev.billingAddress, country: companyCountryCode },
        shippingAddress: { ...prev.shippingAddress, country: companyCountryCode },
      }));

      // MODIFICATION: Generate customer code if it's a new customer
      if (!id) { // Only generate if it's a new customer
        generateCustomerCode(currentCompany.id);
      }
    }
  }, [currentCompany?.id, id]); // Add 'id' to dependency array

  useEffect(() => {
    if (id && currentCompany?.id) {
      fetchCustomerData(id);
    }
  }, [id, currentCompany?.id]);

  // Effect to handle return from CustomerGroupsPage
  useEffect(() => {
    // Check for the specific flag indicating return from group creation
    if (location.state?.fromCustomerGroupCreation) {
      // Restore customer form data
      if (location.state.customerFormData) {
        setFormData(location.state.customerFormData);
        // Also restore selected countries for addresses and phone
        setSelectedBillingCountry(location.state.customerFormData.billingAddress?.country || '');
        setSelectedShippingCountry(location.state.customerFormData.shippingAddress?.country || '');
        const phoneCountryCode = getPhoneCountryCodes().find(c => location.state.customerFormData.phone?.startsWith(c.dialCode));
        if (phoneCountryCode) setSelectedPhoneCountryCode(phoneCountryCode.dialCode);
      }

      // Pre-select newly created customer group
      if (location.state.createdGroupId && location.state.createdGroupName) {
        setFormData(prev => ({ ...prev, customerGroupId: location.state.createdGroupId }));
        setTypedCustomerGroupName(location.state.createdGroupName); // Update typed name state
        // Ensure the MasterSelectField updates its display value
        // This might require a slight delay or a direct call to the ref if options aren't immediately available
        fetchCustomerGroups().then(() => { // Re-fetch to ensure new group is in options
          customerGroupRef.current?.selectOption(location.state.createdGroupId);
        });
        showNotification(`Customer Group "${location.state.createdGroupName}" created and selected!`, 'success');
      }

      // Clear the state to prevent re-triggering on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);


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
    // Auto-fill phone country code based on billing country
    const phoneCountry = getPhoneCountryCodes().find(c => c.code === selectedBillingCountry);
    if (phoneCountry) {
      setSelectedPhoneCountryCode(phoneCountry.dialCode);
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
        // Determine the phone country code from the stored phone number
        let initialPhoneCountryCode = '+91'; // Default
        let cleanPhone = data.phone || '';
        let cleanMobile = data.mobile || '';

        const phoneCountryCodes = getPhoneCountryCodes();
        for (const country of phoneCountryCodes) {
          if (data.phone?.startsWith(country.dialCode)) {
            initialPhoneCountryCode = country.dialCode;
            cleanPhone = data.phone.substring(country.dialCode.length);
            break;
          }
        }
        // Do the same for mobile if it's different
        for (const country of phoneCountryCodes) {
          if (data.mobile?.startsWith(country.dialCode)) {
            initialPhoneCountryCode = country.dialCode; // Assuming phone and mobile use the same country code for simplicity
            cleanMobile = data.mobile.substring(country.dialCode.length);
            break;
          }
        }
        setSelectedPhoneCountryCode(initialPhoneCountryCode);

        setFormData({
          id: data.id,
          customerCode: data.customer_code || '',
          name: data.name || '',
          customerType: data.customer_type || 'individual',
          email: data.email || '',
          phone: cleanPhone, // Use cleaned phone number
          mobile: cleanMobile, // Use cleaned mobile number
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
          paymentTerms: data.payment_terms,
          customerGroupId: data.customer_group_id || '',
          notes: data.notes || '',
          isActive: data.is_active || true,
        });
        setSelectedBillingCountry(data.billing_address?.country || '');
        setSelectedShippingCountry(data.shipping_address?.country || '');
      }
    } catch (err: any) {
      showNotification(`Error loading customer: ${err.message}`, 'error');
      console.error('Error loading customer:', err);
      navigate('/sales/customers'); // Redirect back to list on error
    } finally {
      setLoading(false);
    }
  };

  const generateCustomerCode = async (companyId: string) => {
    try {
      const { count, error } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (error) throw error;

      const nextNumber = (count || 0) + 1;
      const newCustomerCode = `CUST-${String(nextNumber).padStart(4, '0')}`; // e.g., CUST-0001
      setFormData(prev => ({ ...prev, customerCode: newCustomerCode }));
    } catch (err) {
      console.error('Error generating customer code:', err);
      showNotification('Failed to generate customer code. Please enter manually.', 'error');
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

  const handleSameAsBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSameAsBilling(isChecked);
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: { ...prev.billingAddress },
      }));
      setSelectedShippingCountry(selectedBillingCountry);
    } else {
      // Clear shipping address or reset to initial empty state
      setFormData(prev => ({
        ...prev,
        shippingAddress: { street1: '', street2: '', city: '', state: '', country: selectedBillingCountry, zipCode: '' },
      }));
      setSelectedShippingCountry(selectedBillingCountry); // Keep country same as billing by default
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Customer Name is required.';
    if (!formData.customerCode.trim()) newErrors.customerCode = 'Customer Code is required.';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format.';

    // Dynamic tax field validation based on billing country
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
        shipping_address: sameAsBilling ? formData.billingAddress : formData.shippingAddress, // Use billing if sameAsBilling
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

  // This function is now primarily for price list, as customer group uses direct navigation
  const handleNewMasterValue = (type: 'customerGroup' | 'priceList', value: string) => {
    setNewMasterValue(value);
    if (type === 'priceList') {
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

  // New: Handle confirmation for new customer group creation
   const handleNewCustomerGroupConfirmed = (newGroupName: string) => {
    const existingGroup = customerGroups.find(group => group.name.toLowerCase() === newGroupName.toLowerCase());

    if (existingGroup) {
      // Group already exists, select it and notify
      customerGroupRef.current?.selectOption(existingGroup.id);
      showNotification(`Customer Group "${existingGroup.name}" already exists and has been selected.`, 'info');
    } else {
      // Group does not exist, ask for confirmation to create
      setPendingNewGroupName(newGroupName);
      setShowCreateGroupConfirmModal(true);
    }
  };

  const confirmCreateNewGroup = () => {
    setShowCreateGroupConfirmModal(false); // Close the confirmation modal
    if (pendingNewGroupName.trim()) {
      navigate('/sales/customer-groups', {
        state: {
          fromCustomerForm: true,
          newGroupName: pendingNewGroupName,
          customerFormData: formData, // Pass the entire current form data
          returnPath: location.pathname // Pass the current path for return
        }
      });
    }
    setPendingNewGroupName(''); // Clear pending name
  };


  const handleNextTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
      setFormErrors({}); // Clear errors when moving to next tab
    }
  };

  const handlePreviousTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
      setFormErrors({}); // Clear errors when moving to previous tab
    }
  };

  // Function to handle blur event on MasterSelectField for Customer Group
  const handleCustomerGroupBlur = () => {
    // Clear any existing timeout to prevent multiple triggers
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Set a new timeout to allow onSelect to fire first if an option was clicked
    blurTimeoutRef.current = setTimeout(() => {
      const currentInputValue = customerGroupRef.current?.getSearchTerm();

      // Only proceed if there's a value and it's not empty after trimming
      if (currentInputValue && currentInputValue.trim() !== '') {
        const exists = customerGroups.some(group => group.name.toLowerCase() === currentInputValue.toLowerCase());

        // If the value does not exist in the current options, trigger confirmation
        if (!exists) {
          handleNewCustomerGroupConfirmed(currentInputValue.trim());
        }
      }
    }, 150); // Small delay (e.g., 150ms) to differentiate blur from click-selection
  };

  // Modified onSelect handler for MasterSelectField to clear blur timeout
  const handleCustomerGroupSelect = (id: string, name: string) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null; // Clear the timeout if an option is selected
    }
    handleInputChange('customerGroupId', id);
    // Update the typed name state to reflect the selected option
    // This is important because the MasterSelectField's value is now controlled by typedCustomerGroupName
    setTypedCustomerGroupName(name);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
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
        {/* Tab Navigation */}
        <Card className="p-4">
           <nav className="flex justify-between items-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex flex-col items-center px-4 py-2 text-sm font-medium transition-colors duration-300
                    ${isActive
                      ? `bg-emerald-100 text-emerald-800 border-b-2 border-emerald-500 shadow-sm`
                      : `text-emerald-700 hover:bg-emerald-50` // Modified line
                    }
                  `}
                  disabled={viewOnly} // Disable tab switching in viewOnly mode
                >
                  <Icon size={20} className="mb-1" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Tab Content */}
        <Card className="p-6">
          {activeTab === 'basic-info' && (
            <>
              <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                <Info size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  readOnly={true} // MODIFICATION: Make read-only
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
                      focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
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
                  ref={customerGroupRef} // Attach ref here
                  label="Customer Group"
                  value={typedCustomerGroupName} // Use the new state for the input value
                  onValueChange={setTypedCustomerGroupName} // Update the new state on type
                  onSelect={handleCustomerGroupSelect} // Use the modified select handler
                  options={customerGroups}
                  placeholder="Select customer group"
                  readOnly={viewOnly}
                  allowCreation={true} // Enable creation
                  onNewValueConfirmed={handleNewCustomerGroupConfirmed} // Use the new handler for direct navigation
                  onBlur={handleCustomerGroupBlur} // Add the blur handler
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
                    className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]"
                    disabled={viewOnly}
                  />
                  <label htmlFor="isActive" className={`text-sm font-medium ${theme.textPrimary}`}>
                    Is Active
                  </label>
                </div>
              </div>
            </>
          )}

          {activeTab === 'billing-address' && (
            <>
              <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                <MapPin size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                Billing Address
              </h3>
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
                  // MODIFICATION START: Ensure value is always a string
                  value={COUNTRIES.find(c => c.code === selectedBillingCountry)?.name || ''}
                  // MODIFICATION END
                  onValueChange={(val) => { /* For typing */ }}
                  onSelect={(id) => {
                    setSelectedBillingCountry(id);
                    handleAddressChange('billingAddress', 'country', id);
                    handleAddressChange('billingAddress', 'state', ''); // Clear state when country changes
                  }}
                  options={COUNTRIES.map(c => ({ id: c.code, name: c.name, dialCode: c.dialCode }))}
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
            </>
          )}

          {activeTab === 'shipping-address' && (
            <>
              <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                <Truck size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                Shipping Address (Optional)
              </h3>
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="sameAsBilling"
                  checked={sameAsBilling}
                  onChange={handleSameAsBillingChange}
                  className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]"
                  disabled={viewOnly}
                />
                <label htmlFor="sameAsBilling" className={`text-sm font-medium ${theme.textPrimary}`}>
                  Same as Billing Address
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Address Line 1"
                  value={formData.shippingAddress.street1}
                  onChange={(val) => handleAddressChange('shippingAddress', 'street1', val)}
                  placeholder="Street address, P.O. box"
                  readOnly={viewOnly || sameAsBilling}
                />
                <FormField
                  label="Address Line 2"
                  value={formData.shippingAddress.street2}
                  onChange={(val) => handleAddressChange('shippingAddress', 'street2', val)}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  readOnly={viewOnly || sameAsBilling}
                />
                <FormField
                  label="City"
                  value={formData.shippingAddress.city}
                  onChange={(val) => handleAddressChange('shippingAddress', 'city', val)}
                  placeholder="City"
                  readOnly={viewOnly || sameAsBilling}
                />
                <FormField
                  label="ZIP Code"
                  value={formData.shippingAddress.zipCode}
                  onChange={(val) => handleAddressChange('shippingAddress', 'zipCode', val)}
                  placeholder="ZIP Code"
                  readOnly={viewOnly || sameAsBilling}
                />
                <MasterSelectField
                  label="Country"
                  // MODIFICATION START: Ensure value is always a string
                  value={COUNTRIES.find(c => c.code === selectedShippingCountry)?.name || ''}
                  // MODIFICATION END
                  onValueChange={(val) => { /* For typing */ }}
                  onSelect={(id) => {
                    setSelectedShippingCountry(id);
                    handleAddressChange('shippingAddress', 'country', id);
                    handleAddressChange('shippingAddress', 'state', ''); // Clear state when country changes
                  }}
                  options={COUNTRIES.map(c => ({ id: c.code, name: c.name }))}
                  placeholder="Select Country"
                  readOnly={viewOnly || sameAsBilling}
                />
                <MasterSelectField
                  label="State"
                  value={getStatesForCountry(selectedShippingCountry).find(s => s.id === formData.shippingAddress.state)?.name || ''}
                  onValueChange={(val) => { /* For typing */ }}
                  onSelect={(id) => handleAddressChange('shippingAddress', 'state', id)}
                  options={getStatesForCountry(selectedShippingCountry)}
                  placeholder="Select State"
                  disabled={!selectedShippingCountry || viewOnly || sameAsBilling}
                  readOnly={viewOnly || sameAsBilling}
                />
              </div>
            </>
          )}

          {activeTab === 'contact-details' && (
            <>
              <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                <PhoneCall size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                Contact Details
              </h3>
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
                    value={selectedPhoneCountryCode} // Display only the dialCode in the input field
                    onValueChange={() => {}} // No typing for this field
                    onSelect={(selectedId, selectedName, selectedOption) => setSelectedPhoneCountryCode(selectedOption.dialCode)} // Use selectedOption.dialCode
                    options={getPhoneCountryCodes()} // Use the modified function
                    placeholder="Code"
                    className="w-1/4"
                    readOnly={viewOnly}
                  />
                  <FormField
                    label="Phone"
                    value={formData.phone}
                    onChange={(val) => handleInputChange('phone', val)}
                    placeholder="1234567890"
                    icon={<Phone size={18} />}
                    className="w-3/4"
                    readOnly={viewOnly}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <MasterSelectField
                    label="Code"
                    value={selectedPhoneCountryCode} // Display only the dialCode in the input field
                    onValueChange={() => {}} // No typing for this field
                    onSelect={(selectedId, selectedName, selectedOption) => setSelectedPhoneCountryCode(selectedOption.dialCode)} // Use selectedOption.dialCode
                    options={getPhoneCountryCodes()} // Use the modified function
                    placeholder="Code"
                    className="w-1/4"
                    readOnly={viewOnly}
                  />
                  <FormField
                    label="Mobile"
                    value={formData.mobile}
                    onChange={(val) => handleInputChange('mobile', val)}
                    placeholder="9876543210"
                    icon={<Phone size={18} />}
                    className="w-3/4"
                    readOnly={viewOnly}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'financial-tax' && (
            <>
              <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                <DollarSign size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                Financial & Tax Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </>
          )}

          {activeTab === 'other-details' && (
            <>
              <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                <ClipboardList size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                Other Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </>
          )}
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

      {/* Modals for creating new masters (these are now bypassed for direct navigation for customer groups) */}
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
          initialName={pendingNewGroupName} // Pass the typed value
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

      {/* Confirmation Modal for Customer Group Creation */}
      <ConfirmationModal
        isOpen={showCreateGroupConfirmModal}
        onClose={() => {
          setShowCreateGroupConfirmModal(false);
          setPendingNewGroupName(''); // Clear pending name if cancelled
        }}
        onConfirm={confirmCreateNewGroup}
        title="Create New Customer Group?"
        message={`The customer group "${pendingNewGroupName}" does not exist. Do you want to create it?`}
        confirmText="Yes, Create Group"
      />
    </div>
  );
}

export default CustomerFormPage; 