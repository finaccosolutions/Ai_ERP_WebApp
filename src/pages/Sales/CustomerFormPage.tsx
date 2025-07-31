// src/pages/Sales/CustomerFormPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User, Mail, Phone, MapPin, Building, CreditCard, Save, ArrowLeft,
  Globe, Tag, Users, Info, DollarSign, Calendar, FileText, Truck,
  Home, // Icon for Basic Info
  BookUser, // Icon for Billing Address (now part of combined tab)
  Package, // Icon for Shipping Address (now part of combined tab)
  PhoneCall, // Icon for Contact Details (now part of combined tab)
  Landmark, // Icon for Financial & Tax
  ClipboardList, // Icon for Other Details
  Briefcase, // General icon for company/business info
  ArrowRight, // For next tab navigation
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import MasterSelectField, { MasterSelectFieldRef } from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { COUNTRIES, getCountryByCode, getPhoneCountryCodes, GST_REGISTRATION_TYPES, VAT_REGISTRATION_TYPES } from '../../constants/geoData'; // Import new constants
import CreateCustomerGroupModal from '../../components/Modals/CreateCustomerGroupModal';
import CreatePriceListModal from '../../components/Modals/CreatePriceListModal';
import ConfirmationModal from '../../components/UI/ConfirmationModal';

interface CustomerFormData {
  id?: string;
  customerCode: string;
  name: string;
  customerType: string;
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
  // NEW: Banking Details
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  // NEW: Tax Registration Type
  taxRegistrationType: string;
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
  const location = useLocation();

  // Define the tabs array here
  const tabs = [
    { id: 'basic-info', label: 'Basic Info', icon: Home },
    { id: 'contact-address', label: 'Contact & Address', icon: PhoneCall }, // Combined tab
    { id: 'financial-tax', label: 'Financial & Tax', icon: Landmark },
    { id: 'other-details', label: 'Other Details', icon: ClipboardList },
  ];

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
    // NEW: Banking Details
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    // NEW: Tax Registration Type
    taxRegistrationType: '',
  });

  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [customerGroups, setCustomerGroups] = useState<{ id: string; name: string }[]>([]);
  const [priceLists, setPriceLists] = useState<{ id: string; name: string }[]>([]);

  const [selectedBillingCountry, setSelectedBillingCountry] = useState<string>('');
  const [selectedShippingCountry, setSelectedShippingCountry] = useState<string>('');
  const [selectedPhoneCountryCode, setSelectedPhoneCountryCode] = useState<string>('+91'); // Default to India

  // Master creation modal states
  const [showCreateCustomerGroupModal, setShowCreateCustomerGroupModal] = useState(false);
  const [showCreatePriceListModal, setShowCreatePriceListModal] = useState(false);
  const [newMasterValue, setNewMasterValue] = useState('');

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

  // Flag to check if navigated from Sales Invoice Create Page
  const fromSalesInvoiceCreate = location.state?.fromInvoiceCreation === true;

  useEffect(() => {
    if (currentCompany?.id) {
      fetchCustomerGroups();
      fetchPriceLists();

      // Auto-fill country based on company's country for new customers
      if (isNewCustomer) {
        const companyCountryCode = currentCompany.country;
        setSelectedBillingCountry(companyCountryCode);
        setSelectedShippingCountry(companyCountryCode);
        setFormData(prev => ({
          ...prev,
          billingAddress: { ...prev.billingAddress, country: companyCountryCode },
          shippingAddress: { ...prev.shippingAddress, country: companyCountryCode },
        }));
      }

      // Generate customer code if it's a new customer
      if (isNewCustomer) {
        generateCustomerCode(currentCompany.id);
      } else {
        fetchCustomerData(id as string);
      }
    }

    // Handle navigation back from customer group creation
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
    } else if (location.state?.fromInvoiceCreation && location.state?.initialName) {
      // Handle initialName from SalesInvoiceCreatePage
      setFormData(prev => ({ ...prev, name: location.state.initialName }));
      // Clear the state to prevent re-triggering on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [currentCompany?.id, id, location.pathname, isNewCustomer]);


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
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from('customer_groups')
      .select('id, name')
      .eq('company_id', currentCompany?.id);
    if (error) {
      console.error('CustomerFormPage: Error fetching customer groups:', error);
    } else {
      setCustomerGroups(data || []);
    }
  };

  const fetchPriceLists = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from('price_lists')
      .select('id, name')
      .eq('company_id', currentCompany?.id);
    if (error) {
      console.error('CustomerFormPage: Error fetching price lists:', error);
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

      if (error) {
        console.error('CustomerFormPage: Error fetching customer data:', error);
        throw error;
      }

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
          // NEW: Banking Details
          bankName: data.bank_name || '',
          accountNumber: data.account_number || '',
          ifscCode: data.ifsc_code || '',
          // NEW: Tax Registration Type
          taxRegistrationType: data.tax_registration_type || '',
        });
        setSelectedBillingCountry(data.billing_address?.country || '');
        setSelectedShippingCountry(data.shipping_address?.country || '');
      }
    } catch (err: any) {
      showNotification(`Error loading customer: ${err.message}`, 'error');
      console.error('CustomerFormPage: Caught error loading customer:', err);
      navigate('/sales/customers'); // Redirect back to list on error
    } finally {
      setLoading(false);
    }
  };

  const generateCustomerCode = async (companyId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const { count, error } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (error) {
        console.error('CustomerFormPage: Error counting customers for code generation:', error);
        throw error;
      }

      const nextNumber = (count || 0) + 1;
      const newCustomerCode = `CUST-${String(nextNumber).padStart(4, '0')}`; // e.g., CUST-0001
      setFormData(prev => ({ ...prev, customerCode: newCustomerCode }));
    } catch (err: any) {
      console.error('CustomerFormPage: Caught error generating customer code:', err);
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
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address.';

    // Validate billing address country and state
    if (!formData.billingAddress.country) newErrors.billingCountry = 'Billing Country is required.';
    if (!formData.billingAddress.state) newErrors.billingState = 'Billing State is required.';

    // Validate shipping address country and state if not same as billing
    if (!sameAsBilling) {
      if (!formData.shippingAddress.country) newErrors.shippingCountry = 'Shipping Country is required.';
      if (!formData.shippingAddress.state) newErrors.shippingState = 'Shipping State is required.';
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
        gstin: formData.gstin, // GSTIN is not compulsory at DB level
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
        // NEW: Banking Details
        bank_name: formData.bankName || null,
        account_number: formData.accountNumber || null,
        ifsc_code: formData.ifscCode || null,
        // NEW: Tax Registration Type
        tax_registration_type: formData.taxRegistrationType || null,
      };


      let newCustomerId = formData.id;
      if (formData.id) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update(customerToSave)
          .eq('id', formData.id);
        if (error) {
          console.error('CustomerFormPage: Error updating customer:', error);
          throw error;
        }
        showNotification('Customer updated successfully!', 'success');
      } else {
        // Create new customer
        const { data, error } = await supabase
          .from('customers')
          .insert(customerToSave)
          .select('id, name')
          .single();
        if (error) {
          console.error('CustomerFormPage: Error creating customer:', error);
          throw error;
        }
        newCustomerId = data.id;
        showNotification('Customer created successfully!', 'success');
      }

      if (fromSalesInvoiceCreate) {
        navigate(location.state.returnPath, {
          replace: true,
          state: {
            fromInvoiceCreation: true,
            createdId: newCustomerId,
            createdName: formData.name,
            masterType: 'customer'
          }
        });
      } else {
        navigate('/sales/customers'); // Redirect back to list
      }
    } catch (err: any) {
      showNotification(`Failed to save customer: ${err.message}`, 'error');
      console.error('CustomerFormPage: Caught error saving customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatesForCountry = (countryCode: string) => {
    const country = COUNTRIES.find(country => country.code === countryCode);
    return country ? country.states.map(s => ({ id: s.code, name: s.name })) : [];
  };

  const customerTypeOptions = COUNTRIES.find(c => c.code === selectedBillingCountry)?.customerTypes || [
    { code: 'individual', name: 'Individual' },
    { code: 'company', name: 'Company' },
  ];

  // New: Handle confirmation for new customer group creation
   const handleNewCustomerGroupConfirmed = (newGroupName: string) => {
    const existingGroup = customerGroups.find(group => group.name.toLowerCase() === newGroupName.toLowerCase());

    if (existingGroup) {
      // Group already exists, select it and notify
      customerGroupRef.current?.selectOption(existingGroup.id);
      showNotification(`Customer Group "${existingGroup.name}" already exists and has been selected!`, 'info');
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
  const handleCustomerGroupBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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

  // Get tax registration types based on country
  const getTaxRegistrationTypes = () => {
    const countryData = getCountryByCode(selectedBillingCountry);
    if (countryData) {
      if (countryData.taxConfig.type === 'GST') {
        return GST_REGISTRATION_TYPES.map(type => ({ id: type.id, name: type.name }));
      } else if (countryData.taxConfig.type === 'VAT') {
        return VAT_REGISTRATION_TYPES.map(type => ({ id: type.id, name: type.name }));
      }
    }
    return [];
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
        {!fromSalesInvoiceCreate && (
          <Button variant="outline" onClick={() => navigate('/sales/customers')} icon={<ArrowLeft size={16} />}>
            Back to Customer List
          </Button>
        )}
        {fromSalesInvoiceCreate && (
          <Button variant="outline" onClick={() => navigate(location.state.returnPath, { replace: true, state: { fromInvoiceCreation: true } })} icon={<ArrowLeft size={16} />}>
            Cancel
          </Button>
        )}
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
                      : `text-emerald-700 hover:bg-emerald-50 ${theme.isDark ? 'hover:bg-gray-700' : ''}`
                    }
                  `}
                  disabled={viewOnly}
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
              <h3 className={`text-lg font-semibold text-blue-600 mb-4 flex items-center`}>
                <Info size={20} className="mr-2" />
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
                  readOnly={true}
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
                  ref={customerGroupRef}
                  label="Customer Group"
                  value={typedCustomerGroupName}
                  onValueChange={setTypedCustomerGroupName}
                  onSelect={handleCustomerGroupSelect}
                  options={customerGroups}
                  placeholder="Select customer group"
                  readOnly={viewOnly}
                  allowCreation={true}
                  onNewValueConfirmed={handleNewCustomerGroupConfirmed}
                  onBlur={handleCustomerGroupBlur}
                  onF2Press={handleNewCustomerGroupConfirmed} // Pass onF2Press
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

          {activeTab === 'contact-address' && (
            <>
              <h3 className={`text-lg font-semibold text-green-600 mb-4 flex items-center`}>
                <PhoneCall size={20} className="mr-2" />
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
                    value={selectedPhoneCountryCode}
                    onValueChange={() => {}}
                    onSelect={(selectedId, selectedName, selectedOption) => setSelectedPhoneCountryCode(selectedOption.dialCode)}
                    options={getPhoneCountryCodes()}
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
                    value={selectedPhoneCountryCode}
                    onValueChange={() => {}}
                    onSelect={(selectedId, selectedName, selectedOption) => setSelectedPhoneCountryCode(selectedOption.dialCode)}
                    options={getPhoneCountryCodes()}
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

              <h3 className={`text-lg font-semibold text-purple-600 mt-6 mb-4 flex items-center`}>
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
                  value={selectedBillingCountry}
                  onValueChange={(val) => { /* For typing */ }}
                  onSelect={(id) => {
                    setSelectedBillingCountry(id);
                    handleAddressChange('billingAddress', 'country', id);
                    handleAddressChange('billingAddress', 'state', ''); // Clear state when country changes
                  }}
                  options={COUNTRIES.map(c => ({ id: c.code, name: c.name, dialCode: c.dialCode }))}
                  placeholder="Select Country"
                  required // Made compulsory
                  readOnly={viewOnly}
                />
                <MasterSelectField
                  label="State"
                  value={formData.billingAddress.state}
                  onValueChange={(val) => { /* For typing */ }}
                  onSelect={(id) => handleAddressChange('billingAddress', 'state', id)}
                  options={getStatesForCountry(selectedBillingCountry)}
                  placeholder="Select State"
                  disabled={!selectedBillingCountry || viewOnly}
                  required // Made compulsory
                  readOnly={viewOnly}
                />
              </div>

              <h3 className={`text-lg font-semibold text-orange-600 mt-6 mb-4 flex items-center`}>
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
                  value={selectedShippingCountry}
                  onValueChange={(val) => { /* For typing */ }}
                  onSelect={(id) => {
                    setSelectedShippingCountry(id);
                    handleAddressChange('shippingAddress', 'country', id);
                    handleAddressChange('shippingAddress', 'state', ''); // Clear state when country changes
                  }}
                  options={COUNTRIES.map(c => ({ id: c.code, name: c.name }))}
                  placeholder="Select Country"
                  required // Made compulsory
                  readOnly={viewOnly || sameAsBilling}
                />
                <MasterSelectField
                  label="State"
                  value={formData.shippingAddress.state}
                  onValueChange={(val) => { /* For typing */ }}
                  onSelect={(id) => handleAddressChange('shippingAddress', 'state', id)}
                  options={getStatesForCountry(selectedShippingCountry)}
                  placeholder="Select State"
                  disabled={!selectedShippingCountry || viewOnly || sameAsBilling}
                  required // Made compulsory
                  readOnly={viewOnly || sameAsBilling}
                />
              </div>
            </>
          )}

          {activeTab === 'financial-tax' && (
            <>
              <h3 className={`text-lg font-semibold text-red-600 mb-4 flex items-center`}>
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
                  allowCreation={true}
                  onNewValueConfirmed={(val) => {
                    setNewMasterValue(val);
                    setShowCreatePriceListModal(true);
                  }}
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
                          // Removed 'required' prop for GSTIN
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
                        <MasterSelectField
                          label="GST Registration Type"
                          value={GST_REGISTRATION_TYPES.find(type => type.id === formData.taxRegistrationType)?.name || ''}
                          onValueChange={(val) => {}}
                          onSelect={(id) => handleInputChange('taxRegistrationType', id)}
                          options={GST_REGISTRATION_TYPES.map(type => ({ id: type.id, name: type.name }))}
                          placeholder="Select Type"
                          readOnly={viewOnly}
                        />
                      </>
                    );
                  } else if (countryTaxConfig.type === 'VAT' || countryTaxConfig.type === 'Sales Tax' || countryTaxConfig.type === 'Consumption Tax' || countryTaxConfig.type === 'GST/PST/HST') {
                    return (
                      <>
                        <FormField
                          label={taxRegMainLabel}
                          value={formData.taxId}
                          onChange={(val) => handleInputChange('taxId', val)}
                          placeholder={`e.g., ${taxRegMainLabel}`}
                          // Removed 'required' prop for taxId
                          readOnly={viewOnly}
                        />
                        {countryTaxConfig.type === 'VAT' && (
                          <MasterSelectField
                            label="VAT Registration Type"
                            value={VAT_REGISTRATION_TYPES.find(type => type.id === formData.taxRegistrationType)?.name || ''}
                            onValueChange={(val) => {}}
                            onSelect={(id) => handleInputChange('taxRegistrationType', id)}
                            options={VAT_REGISTRATION_TYPES.map(type => ({ id: type.id, name: type.name }))}
                            placeholder="Select Type"
                            readOnly={viewOnly}
                          />
                        )}
                      </>
                    );
                  }
                  return null;
                })()}
              </div>

              <h3 className={`text-lg font-semibold text-teal-600 mt-6 mb-4 flex items-center`}>
                <Landmark size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                Banking Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Bank Name"
                  value={formData.bankName}
                  onChange={(val) => handleInputChange('bankName', val)}
                  placeholder="e.g., State Bank of India"
                  readOnly={viewOnly}
                />
                <FormField
                  label="Account Number"
                  value={formData.accountNumber}
                  onChange={(val) => handleInputChange('accountNumber', val)}
                  placeholder="e.g., 1234567890"
                  readOnly={viewOnly}
                />
                <FormField
                  label="IFSC Code"
                  value={formData.ifscCode}
                  onChange={(val) => handleInputChange('ifscCode', val)}
                  placeholder="e.g., SBIN0000001"
                  readOnly={viewOnly}
                />
              </div>
            </>
          )}

          {activeTab === 'other-details' && (
            <>
              <h3 className={`text-lg font-semibold text-gray-600 mb-4 flex items-center`}>
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
            <Button type="button" variant="outline" onClick={() => {
              if (fromSalesInvoiceCreate) {
                navigate(location.state.returnPath, { replace: true, state: { fromInvoiceCreation: true } });
              } else {
                navigate('/sales/customers');
              }
            }}>
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
          initialName={pendingNewGroupName}
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
