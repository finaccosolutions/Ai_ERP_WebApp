import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Users,
  Calendar,
  Shield,
  Save,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Briefcase, // Used for Company Info tab
  User, // Used for Contact tab
  ReceiptText, // Used for Tax tab
  BookMarked, // Used for Books tab
  SlidersHorizontal, // Used for Preferences tab
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';

// --- ALL STATIC DATA DEFINED HERE, ABOVE THE COMPONENT FUNCTION ---
const countries = [
  {
    id: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    taxType: 'GST',
    timezone: 'Asia/Kolkata',
    dialCode: '+91',
    fiscalYearStartMonth: 3, // April (0-indexed)
    states: [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
      'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
      'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
      'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh'
    ]
  },
  {
    id: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    taxType: 'VAT', // Using VAT for generic sales tax/custom tax
    timezone: 'America/New_York',
    dialCode: '+1',
    fiscalYearStartMonth: 0, // January
    states: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
      'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
      'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
      'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
      'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
      'Wisconsin', 'Wyoming'
    ]
  },
  {
    id: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    taxType: 'VAT',
    timezone: 'Asia/Dubai',
    dialCode: '+971',
    fiscalYearStartMonth: 0, // January
    states: ['Abu Dhabi', 'Ajman', 'Dubai', 'Fujairah', 'Ras Al Khaimah', 'Sharjah', 'Umm Al Quwain']
  },
  {
    id: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    taxType: 'VAT',
    timezone: 'Asia/Riyadh',
    dialCode: '+966',
    fiscalYearStartMonth: 0, // January
    states: [] // Add specific regions if needed
  },
  {
    id: 'QA',
    name: 'Qatar',
    flag: '🇶🇦',
    currency: 'QAR',
    taxType: 'VAT',
    timezone: 'Asia/Qatar',
    dialCode: '+974',
    fiscalYearStartMonth: 0, // January
    states: []
  },
  {
    id: 'KW',
    name: 'Kuwait',
    flag: '🇰🇼',
    currency: 'KWD',
    taxType: 'VAT',
    timezone: 'Asia/Kuwait',
    dialCode: '+965',
    fiscalYearStartMonth: 0, // January
    states: []
  },
  {
    id: 'BH',
    name: 'Bahrain',
    flag: '🇧🇭',
    currency: 'BHD',
    taxType: 'VAT',
    timezone: 'Asia/Bahrain',
    dialCode: '+973',
    fiscalYearStartMonth: 0, // January
    states: []
  },
  {
    id: 'OM',
    name: 'Oman',
    flag: '🇴🇲',
    currency: 'OMR',
    taxType: 'VAT',
    timezone: 'Asia/Muscat',
    dialCode: '+968',
    fiscalYearStartMonth: 0, // January
    states: []
  },
  {
    id: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    taxType: 'VAT',
    timezone: 'Europe/London',
    dialCode: '+44',
    fiscalYearStartMonth: 3, // April
    states: ['England', 'Scotland', 'Wales', 'Northern Ireland']
  },
  {
    id: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    taxType: 'VAT', // Using VAT for generic sales tax/custom tax
    timezone: 'America/Toronto',
    dialCode: '+1',
    fiscalYearStartMonth: 0, // January
    states: [
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
      'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
      'Quebec', 'Saskatchewan', 'Yukon'
    ]
  },
  {
    id: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    taxType: 'GST',
    timezone: 'Australia/Sydney',
    dialCode: '+61',
    fiscalYearStartMonth: 6, // July
    states: [
      'New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia',
      'Tasmania', 'Australian Capital Territory', 'Northern Territory'
    ]
  },
  {
    id: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    taxType: 'VAT',
    timezone: 'Europe/Berlin',
    dialCode: '+49',
    fiscalYearStartMonth: 0, // January
    states: [
      'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
      'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia',
      'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein',
      'Thuringia'
    ]
  }
];

const currencies = [
  { id: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { id: 'USD', name: 'US Dollar', symbol: '$' },
  { id: 'EUR', name: 'Euro', symbol: '€' },
  { id: 'GBP', name: 'British Pound', symbol: '£' },
  { id: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { id: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { id: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { id: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { id: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
  { id: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  { id: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
  { id: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.' },
  { id: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { id: 'SGD', name: 'Singapore Dollar', symbol: '$' },
];

const languages = [
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'Hindi' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'ar', name: 'Arabic' },
];

const companyTypes = [
  { id: 'private_limited', name: 'Private Limited Company' },
  { id: 'public_limited', name: 'Public Limited Company' },
  { id: 'partnership', name: 'Partnership' },
  { id: 'sole_proprietorship', name: 'Sole Proprietorship' },
  { id: 'llp', name: 'Limited Liability Partnership (LLP)' },
  { id: 'opc', name: 'One Person Company (OPC)' },
  { id: 'non_profit', name: 'Non-Profit Organization' },
  { id: 'other', name: 'Other' }
];

const industries = [
  { id: 'technology', name: 'Technology' },
  { id: 'manufacturing', name: 'Manufacturing' },
  { id: 'retail', name: 'Retail' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'finance', name: 'Finance' },
  { id: 'education', name: 'Education' },
  { id: 'real_estate', name: 'Real Estate' },
  { id: 'construction', name: 'Construction' },
  { id: 'transportation', name: 'Transportation' },
  { id: 'food_beverage', name: 'Food & Beverage' },
  { id: 'professional_services', name: 'Professional Services' },
  { id: 'media_entertainment', name: 'Media & Entertainment' },
  { id: 'agriculture', name: 'Agriculture' },
  { id: 'other', name: 'Other' }
];

const employeeCounts = [
  { id: '1-10', name: '1-10' },
  { id: '11-50', name: '11-50' },
  { id: '51-200', name: '51-200' },
  { id: '201-500', name: '201-500' },
  { id: '501-1000', name: '501-1000' },
  { id: '1000+', name: '1000+' }
];

const revenueRanges = [
  { id: 'under_100k', name: 'Under $100K' },
  { id: '100k-500k', name: '$100K - $500K' },
  { id: '500k-1m', name: '$500K - $1M' },
  { id: '1m-5m', name: '$1M - $5M' },
  { id: '5m-10m', name: '$5M - $10M' },
  { id: 'over_10m', name: 'Over $10M' }
];

const gstRegistrationTypes = [
  { id: 'regular', name: 'Regular' },
  { id: 'composition', name: 'Composition' },
  { id: 'unregistered', name: 'Unregistered' },
];

const filingFrequencies = [
  { id: 'monthly', name: 'Monthly' },
  { id: 'quarterly', name: 'Quarterly' },
];

const vatRegistrationTypes = [
  { id: 'standard', name: 'Standard' },
  { id: 'exempt', name: 'Exempt' },
];

const filingCycles = [
  { id: 'monthly', name: 'Monthly' },
  { id: 'quarterly', name: 'Quarterly' },
  { id: 'annually', name: 'Annually' },
];

const decimalPlacesOptions = [
  { id: '0', name: '0 (1,234)' },
  { id: '1', name: '1 (1,234.5)' },
  { id: '2', name: '2 (1,234.56)' },
  { id: '3', name: '3 (1,234.567)' },
  { id: '4', name: '4 (1,234.5678)' },
];

const dateFormats = [
  { id: 'DD-MM-YYYY', name: 'DD-MM-YYYY' },
  { id: 'MM/DD/YYYY', name: 'MM/DD/YYYY' },
  { id: 'YYYY-MM-DD', name: 'YYYY-MM-DD' },
];


function CompanySettings() {
  const { currentCompany, refreshCompanies } = useCompany();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPhoneCountryDropdown, setShowPhoneCountryDropdown] = useState(false);

  const [activeTab, setActiveTab] = useState('company_info');

  const tabs = [
    { id: 'company_info', label: 'Company Info', icon: Briefcase },
    { id: 'contact', label: 'Contact', icon: User },
    { id: 'tax', label: 'Tax', icon: ReceiptText },
    { id: 'books', label: 'Books', icon: BookMarked },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  ];

  const [formData, setFormData] = useState<any>({
    companyName: '',
    legalName: '',
    industry: '',
    businessType: '',
    registrationNo: '',
    country: '',
    state: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    zipCode: '',
    languagePreference: '',
    companyLogo: null, // URL string if loaded, File object if new upload
    timezone: '',

    contactPersonName: '',
    designation: '',
    email: '',
    mobile: '',
    phoneCountry: '',
    alternateContactNumber: '',

    taxSystem: '',
    taxConfig: { enabled: true, rates: [] },
    gstin: '',
    pan: '',
    tan: '',
    gstRegistrationType: '',
    filingFrequency: '',
    tdsApplicable: false,
    tcsApplicable: false,
    trnVatNumber: '',
    vatRegistrationType: '',
    filingCycle: '',

    booksStartDate: '',
    fiscalYearStartDate: '',
    fiscalYearEndDate: '',
    defaultCurrency: '',
    decimalPlaces: 2,
    multiCurrencySupport: false,
    autoRounding: false,

    defaultLanguage: '', // Redundant, will map to languagePreference
    dateFormat: '',
    enableBatchTracking: false,
    enableCostCenterAllocation: false,
    enableMultiUserAccess: false,
    allowAiSuggestions: true,
    companyPassword: '',
    enableCompanyPassword: false,
    allowSplitByPeriod: false,
    enableBarcodeSupport: false,
    allowAutoVoucherCreationAI: true,

    companyType: '',
    employeeCount: '',
    annualRevenue: '',
    inventoryTracking: true
  });

  useEffect(() => {
    if (currentCompany) {
      // Map currentCompany data to formData state
      setFormData({
        companyName: currentCompany.name || '',
        legalName: currentCompany.settings?.legalName || '',
        industry: currentCompany.settings?.industry || industries[0].id,
        businessType: currentCompany.settings?.businessType || companyTypes[0].id,
        registrationNo: currentCompany.settings?.registrationNo || '',
        country: currentCompany.country || countries[0].id,
        state: currentCompany.address?.state || '',
        city: currentCompany.address?.city || '',
        addressLine1: currentCompany.address?.street1 || '',
        addressLine2: currentCompany.address?.street2 || '',
        zipCode: currentCompany.address?.zipCode || '',
        languagePreference: currentCompany.settings?.languagePreference || languages[0].id,
        companyLogo: currentCompany.logo || null, // This will be the URL
        timezone: currentCompany.timezone || countries[0].timezone,

        contactPersonName: currentCompany.contactInfo?.contactPersonName || '',
        designation: currentCompany.contactInfo?.designation || '',
        email: currentCompany.contactInfo?.email || '',
        mobile: currentCompany.contactInfo?.mobile || '',
        phoneCountry: currentCompany.contactInfo?.phoneCountry || currentCompany.country || countries[0].id,
        alternateContactNumber: currentCompany.contactInfo?.alternatePhone || '',

        taxSystem: currentCompany.taxConfig?.type || countries[0].taxType,
        taxConfig: {
          enabled: currentCompany.taxConfig?.enabled ?? true,
          rates: currentCompany.taxConfig?.rates || [],
        },
        gstin: currentCompany.taxConfig?.gstDetails?.registrationNumber || '',
        pan: currentCompany.taxConfig?.gstDetails?.pan || '',
        tan: currentCompany.taxConfig?.gstDetails?.tan || '',
        gstRegistrationType: currentCompany.taxConfig?.gstDetails?.registrationType || gstRegistrationTypes[0].id,
        filingFrequency: currentCompany.taxConfig?.gstDetails?.filingFrequency || filingFrequencies[0].id,
        tdsApplicable: currentCompany.taxConfig?.gstDetails?.tdsApplicable ?? false,
        tcsApplicable: currentCompany.taxConfig?.gstDetails?.tcsApplicable ?? false,
        trnVatNumber: currentCompany.taxConfig?.vatDetails?.registrationNumber || '',
        vatRegistrationType: currentCompany.taxConfig?.vatDetails?.registrationType || vatRegistrationTypes[0].id,
        filingCycle: currentCompany.taxConfig?.vatDetails?.filingCycle || filingCycles[0].id,

        booksStartDate: currentCompany.fiscal_year_start || '', // Editable, defaults to fiscal year start
        fiscalYearStartDate: currentCompany.fiscal_year_start || '',
        fiscalYearEndDate: currentCompany.fiscal_year_end || '', // Auto-calculated, not directly editable
        defaultCurrency: currentCompany.currency || currencies[0].id,
        decimalPlaces: currentCompany.settings?.decimalPlaces ?? 2,
        multiCurrencySupport: currentCompany.settings?.multiCurrencySupport ?? false,
        autoRounding: currentCompany.settings?.autoRounding ?? false,

        dateFormat: currentCompany.settings?.dateFormat || dateFormats[0].id,
        enableBatchTracking: currentCompany.settings?.batchTracking ?? false,
        enableCostCenterAllocation: currentCompany.settings?.costCenterAllocation ?? false,
        enableMultiUserAccess: currentCompany.settings?.multiUserAccess ?? false,
        allowAiSuggestions: currentCompany.settings?.aiSuggestions ?? true,
        companyPassword: currentCompany.settings?.password || '',
        enableCompanyPassword: currentCompany.settings?.enablePassword ?? false,
        allowSplitByPeriod: currentCompany.settings?.splitByPeriod ?? false,
        enableBarcodeSupport: currentCompany.settings?.barcodeSupport ?? false,
        allowAutoVoucherCreationAI: currentCompany.settings?.autoVoucherCreationAI ?? true,

        companyType: currentCompany.settings?.companyType || companyTypes[0].id,
        employeeCount: currentCompany.settings?.employeeCount || employeeCounts[0].id,
        annualRevenue: currentCompany.settings?.annualRevenue || revenueRanges[0].id,
        inventoryTracking: currentCompany.settings?.inventoryTracking ?? true
      });
    }
  }, [currentCompany]);

  // Auto-calculate fiscal year end date and update tax rates based on country
  useEffect(() => {
    const selectedCountryData = countries.find(c => c.id === formData.country);
    if (selectedCountryData) {
      const startDate = new Date(formData.fiscalYearStartDate);
      const fiscalYearEndDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), 0);

      setFormData((prev: any) => ({
        ...prev,
        timezone: selectedCountryData.timezone,
        defaultCurrency: selectedCountryData.currency,
        taxSystem: selectedCountryData.taxType,
        fiscalYearEndDate: fiscalYearEndDate.toISOString().split('T')[0],
        phoneCountry: selectedCountryData.id, // Auto-update phone country code
        // Reset state if country changes and previous state is not valid for new country
        state: selectedCountryData.states.includes(prev.state) ? prev.state : '',
      }));

      // Update tax rates based on country
      const taxRates: { [key: string]: number[] } = {
        'IN': [0, 5, 12, 18, 28],
        'US': [0, 5, 8.5, 10],
        'AE': [0, 5],
        'SA': [0, 15],
        'QA': [0, 5],
        'KW': [0, 5],
        'BH': [0, 10],
        'OM': [0, 5],
        'GB': [0, 5, 20],
        'CA': [0, 5, 13, 15],
        'AU': [0, 10],
        'DE': [0, 7, 19],
        'JP': [0, 10],
        'SG': [0, 9],
      };

      setFormData((prev: any) => ({
        ...prev,
        taxConfig: {
          ...prev.taxConfig,
          rates: taxRates[selectedCountryData.id] || [0, 10, 20],
        },
      }));
    }
  }, [formData.country, formData.fiscalYearStartDate]);


  const validateForm = (): boolean => {
    let newErrors: Record<string, string> = {};
    let isValid = true;

    // Company Info Tab Validation
    if (activeTab === 'company_info') {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company Name is required';
      if (!formData.industry) newErrors.industry = 'Industry is required';
      if (!formData.businessType) newErrors.businessType = 'Business Type is required';
      if (!formData.country) newErrors.country = 'Country is required';
      if (!formData.state.trim()) newErrors.state = 'State/Province is required';
      if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address Line 1 is required';
    }

    // Contact Tab Validation
    if (activeTab === 'contact') {
      if (!formData.contactPersonName.trim()) newErrors.contactPersonName = 'Contact Person Name is required';
      if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
    }

    // Tax Tab Validation
    if (activeTab === 'tax' && formData.taxConfig.enabled) {
      if (formData.taxSystem === 'GST') {
        if (!formData.gstin.trim()) newErrors.gstin = 'GSTIN is required';
        if (!formData.pan.trim()) newErrors.pan = 'PAN is required';
        if (!formData.gstRegistrationType) newErrors.gstRegistrationType = 'GST Registration Type is required';
        if (!formData.filingFrequency) newErrors.filingFrequency = 'Filing Frequency is required';
      } else if (formData.taxSystem === 'VAT') {
        if (!formData.trnVatNumber.trim()) newErrors.trnVatNumber = 'TRN / VAT Number is required';
        if (!formData.vatRegistrationType) newErrors.vatRegistrationType = 'VAT Registration Type is required';
        if (!formData.filingCycle) newErrors.filingCycle = 'Filing Cycle is required';
      }
    }

    // Books Tab Validation
    if (activeTab === 'books') {
      if (!formData.booksStartDate) newErrors.booksStartDate = 'Books Start Date is required';
      if (!formData.fiscalYearStartDate) newErrors.fiscalYearStartDate = 'Financial Year Start Date is required';
      if (!formData.defaultCurrency) newErrors.defaultCurrency = 'Default Currency is required';
      if (formData.decimalPlaces === null) newErrors.decimalPlaces = 'Decimal Places is required';
    }

    // Preferences Tab Validation
    if (activeTab === 'preferences') {
      if (!formData.languagePreference) newErrors.languagePreference = 'Language Preference is required';
      if (!formData.dateFormat) newErrors.dateFormat = 'Date Format is required';
      if (formData.enableCompanyPassword && !formData.companyPassword.trim()) {
        newErrors.companyPassword = 'Company Password is required if enabled';
      }
    }

    setErrors(newErrors);
    isValid = Object.keys(newErrors).length === 0;
    return isValid;
  };

  const handleSave = async () => {
    if (!currentCompany) return;

    // Validate all tabs before final submission
    let allFormsValid = true;
    const currentErrors: Record<string, string> = {};

    const originalActiveTab = activeTab;
    for (const tab of tabs) {
      setActiveTab(tab.id);
      const isTabValid = validateForm();
      if (!isTabValid) {
        allFormsValid = false;
        Object.assign(currentErrors, errors); // Merge errors from state
      }
    }
    setActiveTab(originalActiveTab);

    if (!allFormsValid) {
      setErrors({ ...currentErrors, submit: 'Please correct the errors in all sections before submitting.' });
      return;
    }

    setLoading(true);
    try {
      // Logo upload logic (if a new file is selected, not just the URL)
      let logoUrl = formData.companyLogo; // Keep existing URL by default
      // This part would need a file input and state to handle new file uploads
      // For now, assuming logo is handled separately or not changed via settings form directly
      // if (newLogoFile) { ... upload new file ... }

      const companyData = {
        name: formData.companyName,
        country: formData.country,
        currency: formData.defaultCurrency,
        fiscal_year_start: formData.fiscalYearStartDate,
        fiscal_year_end: formData.fiscalYearEndDate,
        timezone: formData.timezone,
        logo: logoUrl,
        tax_config: {
          type: formData.taxSystem,
          enabled: formData.taxConfig.enabled,
          registrationNumber: formData.taxSystem === 'GST' ? formData.gstin : formData.trnVatNumber,
          rates: formData.taxConfig.rates,
          gstDetails: formData.taxSystem === 'GST' ? {
            pan: formData.pan,
            tan: formData.tan,
            registrationType: formData.gstRegistrationType,
            filingFrequency: formData.filingFrequency,
            tdsApplicable: formData.tdsApplicable,
            tcsApplicable: formData.tcsApplicable,
          } : null,
          vatDetails: formData.taxSystem === 'VAT' ? {
            registrationType: formData.vatRegistrationType,
            filingCycle: formData.filingCycle,
          } : null,
        },
        address: {
          street1: formData.addressLine1,
          street2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zipCode: formData.zipCode,
        },
        contact_info: {
          contactPersonName: formData.contactPersonName,
          designation: formData.designation,
          email: formData.email,
          mobile: formData.mobile,
          alternatePhone: formData.alternateContactNumber,
          phoneCountry: formData.phoneCountry,
        },
        settings: {
          displayName: formData.legalName || formData.companyName,
          legalName: formData.legalName,
          industry: formData.industry,
          businessType: formData.businessType,
          registrationNo: formData.registrationNo,
          languagePreference: formData.languagePreference,
          decimalPlaces: formData.decimalPlaces,
          multiCurrencySupport: formData.multiCurrencySupport,
          autoRounding: formData.autoRounding,
          dateFormat: formData.dateFormat,
          batchTracking: formData.enableBatchTracking,
          costCenterAllocation: formData.enableCostCenterAllocation,
          multiUserAccess: formData.enableMultiUserAccess,
          aiSuggestions: formData.allowAiSuggestions,
          enablePassword: formData.enableCompanyPassword,
          password: formData.enableCompanyPassword ? formData.companyPassword : null,
          splitByPeriod: formData.allowSplitByPeriod,
          barcodeSupport: formData.enableBarcodeSupport,
          autoVoucherCreationAI: formData.allowAutoVoucherCreationAI,
          companyType: formData.companyType,
          employeeCount: formData.employeeCount,
          annualRevenue: formData.annualRevenue,
          inventoryTracking: formData.inventoryTracking,
        },
      };

      const { error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', currentCompany.id);

      if (error) throw error;

      refreshCompanies(); // Refresh company context to load updated data
      setErrors({ success: 'Company settings updated successfully!' });
    } catch (error: any) {
      console.error('Error updating company:', error);
      setErrors({ submit: error.message || 'Failed to update company settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = countries.find(c => c.id === formData.country);
  const selectedPhoneCountry = countries.find(c => c.id === formData.phoneCountry);
  const availableStates = selectedCountry?.states || [];

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={theme.textMuted}>No company selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Company Settings</h1>
          <p className={theme.textSecondary}>Manage your company configuration and preferences</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card className="p-4 mb-6">
        <nav className="flex justify-between items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex flex-col items-center px-4 py-2 text-sm font-medium transition-colors duration-300
                  ${isActive
                    ? `text-[#6AC8A3] border-b-2 border-[#6AC8A3]`
                    : `text-gray-500 hover:text-gray-700`
                  }
                `}
              >
                <Icon size={20} className="mb-1" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </Card>

      {/* Form Content */}
      <Card className="p-6 space-y-8">
        {/* This div wraps all the content inside the Card to ensure it's a single child */}
        <div>
          {/* Company Info Tab */}
          {activeTab === 'company_info' && (
            <div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-6 flex items-center`}>
                <Briefcase size={24} className="mr-3 text-[#6AC8A3]" />
                General Company Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(val) => setFormData({ ...formData, companyName: val })}
                  placeholder="Enter your company name"
                  required
                  error={errors.companyName}
                  icon={<Building size={18} className="text-gray-400" />}
                />
                <FormField
                  label="Legal Name (Optional)"
                  value={formData.legalName}
                  onChange={(val) => setFormData({ ...formData, legalName: val })}
                  placeholder="Full legal name"
                  icon={<Building size={18} className="text-gray-400" />}
                />
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    `}
                  >
                    {industries.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  {errors.industry && <p className="mt-2 text-sm text-red-500">{errors.industry}</p>}
                </div>
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Business Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    `}
                  >
                    {companyTypes.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  {errors.businessType && <p className="mt-2 text-sm text-red-500">{errors.businessType}</p>}
                </div>
                <FormField
                  label="Registration No. (Optional)"
                  value={formData.registrationNo}
                  onChange={(val) => setFormData({ ...formData, registrationNo: val })}
                  icon={<FileText size={18} className="text-gray-400" />}
                />
              </div>

              <h3 className={`text-lg font-semibold ${theme.textPrimary} mt-6 mb-4 flex items-center`}>
                <MapPin size={20} className="mr-2 text-[#6AC8A3]" />
                Business Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    `}
                  >
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.country && <p className="mt-2 text-sm text-red-500">{errors.country}</p>}
                </div>
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    State/Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    `}
                    disabled={availableStates.length === 0}
                  >
                    <option value="">Select State/Province</option>
                    {availableStates.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className="mt-2 text-sm text-red-500">{errors.state}</p>}
                </div>
                <div className="md:col-span-2">
                  <FormField
                    label="Address Line 1"
                    value={formData.addressLine1}
                    onChange={(val) => setFormData({ ...formData, addressLine1: val })}
                    placeholder="Street address, P.O. Box"
                    required
                    error={errors.addressLine1}
                    icon={<MapPin size={18} className="text-gray-400" />}
                  />
                </div>
                <FormField
                  label="Address Line 2 (Optional)"
                  value={formData.addressLine2}
                  onChange={(val) => setFormData({ ...formData, addressLine2: val })}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  icon={<MapPin size={18} className="text-gray-400" />}
                />
                <FormField
                  label="City (Optional)"
                  value={formData.city}
                  onChange={(val) => setFormData({ ...formData, city: val })}
                  placeholder="City"
                  error={errors.city}
                />
                <FormField
                  label="PIN/ZIP Code (Optional)"
                  value={formData.zipCode}
                  onChange={(val) => setFormData({ ...formData, zipCode: val })}
                  placeholder="ZIP or Postal Code"
                  error={errors.zipCode}
                />
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-6 flex items-center`}>
                <User size={24} className="mr-3 text-[#6AC8A3]" />
                Contact Person Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Contact Person Name"
                  value={formData.contactPersonName}
                  onChange={(val) => setFormData({ ...formData, contactPersonName: val })}
                  required
                  error={errors.contactPersonName}
                />
                <FormField
                  label="Designation (Optional)"
                  value={formData.designation}
                  onChange={(val) => setFormData({ ...formData, designation: val })}
                  error={errors.designation}
                />
                <FormField
                  label="Email Address (Optional)"
                  type="email"
                  value={formData.email}
                  onChange={(val) => setFormData({ ...formData, email: val })}
                  placeholder="contact@example.com"
                  error={errors.email}
                  icon={<Mail size={18} className="text-gray-400" />}
                />
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Mobile Number (Optional)
                  </label>
                  <div className="flex items-stretch"> {/* Use items-stretch for alignment */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowPhoneCountryDropdown(!showPhoneCountryDropdown)}
                        className={`
                          flex items-center space-x-2 px-3 py-2 border ${theme.borderColor}
                          ${theme.borderRadius} border-r-0 rounded-r-none
                          ${theme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent h-full
                        `}
                      >
                        <span className="text-lg">{selectedPhoneCountry?.flag}</span>
                        <span className="text-sm">{selectedPhoneCountry?.dialCode}</span>
                        <ChevronDown size={14} />
                      </button>
                      {showPhoneCountryDropdown && (
                        <div className={`
                          absolute top-full left-0 mt-1 w-64 ${theme.isDark ? 'bg-gray-700' : 'bg-white'}
                          border ${theme.isDark ? 'border-gray-600' : 'border-gray-300'}
                          ${theme.borderRadius} shadow-lg z-50 max-h-60 overflow-y-auto
                        `}>
                          {countries.map((country) => (
                            <button
                              key={country.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, phoneCountry: country.id });
                                setShowPhoneCountryDropdown(false);
                              }}
                              className={`
                                w-full px-3 py-2 text-left hover:bg-gray-100
                                ${theme.isDark ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100'}
                                flex items-center space-x-3
                              `}
                            >
                              <span className="text-lg">{country.flag}</span>
                              <span className="text-sm">{country.dialCode}</span>
                              <span className="text-sm">{country.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative flex-1">
                      <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="Enter mobile number"
                        error={errors.mobile}
                        className={`
                          w-full pl-10 pr-3 py-2 border ${theme.inputBorder}
                          ${theme.borderRadius} rounded-l-none border-l-0
                          ${theme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        `}
                      />
                    </div>
                  </div>
                </div>
                <FormField
                  label="Alternate Contact Number (Optional)"
                  value={formData.alternateContactNumber}
                  onChange={(val) => setFormData({ ...formData, alternateContactNumber: val })}
                  icon={<Phone size={18} className="text-gray-400" />}
                />
              </div>
            </div>
          )}

          {/* Tax Tab */}
          {activeTab === 'tax' && (
            <div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-6 flex items-center`}>
                <ReceiptText size={24} className="mr-3 text-[#6AC8A3]" />
                Tax / Compliance Details
              </h2>
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="taxEnabled"
                  checked={formData.taxConfig.enabled}
                  onChange={(e) => setFormData({ ...formData, taxConfig: { ...formData.taxConfig, enabled: e.target.checked } })}
                  className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                />
                <label htmlFor="taxEnabled" className={`text-sm font-medium ${theme.textPrimary}`}>
                  Enable {formData.taxSystem} / Tax Management
                </label>
              </div>

              {formData.taxConfig.enabled && (
                <>
                  {formData.taxSystem === 'GST' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        label="GSTIN"
                        value={formData.gstin}
                        onChange={(val) => setFormData({ ...formData, gstin: val })}
                        placeholder="22AAAAA0000A1Z5"
                        required
                        error={errors.gstin}
                      />
                      <FormField
                        label="PAN"
                        value={formData.pan}
                        onChange={(val) => setFormData({ ...formData, pan: val })}
                        placeholder="AAAAA0000A"
                        required
                        error={errors.pan}
                      />
                      <FormField
                        label="TAN (Optional)"
                        value={formData.tan}
                        onChange={(val) => setFormData({ ...formData, tan: val })}
                        placeholder="TAN Number"
                      />
                      <div className="space-y-2">
                        <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                          GST Registration Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.gstRegistrationType}
                          onChange={(e) => setFormData({ ...formData, gstRegistrationType: e.target.value })}
                          className={`
                            w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                            ${theme.inputBg} ${theme.textPrimary}
                            focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                          `}
                        >
                          {gstRegistrationTypes.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                        {errors.gstRegistrationType && <p className="mt-2 text-sm text-red-500">{errors.gstRegistrationType}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                          Filing Frequency <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.filingFrequency}
                          onChange={(e) => setFormData({ ...formData, filingFrequency: e.target.value })}
                          className={`
                            w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                            ${theme.inputBg} ${theme.textPrimary}
                            focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                          `}
                        >
                          {filingFrequencies.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                        {errors.filingFrequency && <p className="mt-2 text-sm text-red-500">{errors.filingFrequency}</p>}
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="tdsApplicable"
                          checked={formData.tdsApplicable}
                          onChange={(e) => setFormData({ ...formData, tdsApplicable: e.target.checked })}
                          className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                        />
                        <label htmlFor="tdsApplicable" className={`text-sm font-medium ${theme.textPrimary}`}>
                          TDS Applicable
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="tcsApplicable"
                          checked={formData.tcsApplicable}
                          onChange={(e) => setFormData({ ...formData, tcsApplicable: e.target.checked })}
                          className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                        />
                        <label htmlFor="tcsApplicable" className={`text-sm font-medium ${theme.textPrimary}`}>
                          TCS Applicable
                        </label>
                      </div>
                    </div>
                  )}
                  {formData.taxSystem === 'VAT' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        label="TRN / VAT Number"
                        value={formData.trnVatNumber}
                        onChange={(val) => setFormData({ ...formData, trnVatNumber: val })}
                        required
                        error={errors.trnVatNumber}
                      />
                      <div className="space-y-2">
                        <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                          VAT Registration Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.vatRegistrationType}
                          onChange={(e) => setFormData({ ...formData, vatRegistrationType: e.target.value })}
                          className={`
                            w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                            ${theme.inputBg} ${theme.textPrimary}
                            focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                          `}
                        >
                          {vatRegistrationTypes.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                        {errors.vatRegistrationType && <p className="mt-2 text-sm text-red-500">{errors.vatRegistrationType}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                          Filing Cycle <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.filingCycle}
                          onChange={(e) => setFormData({ ...formData, filingCycle: e.target.value })}
                          className={`
                            w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                            ${theme.inputBg} ${theme.textPrimary}
                            focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                          `}
                        >
                          {filingCycles.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                        {errors.filingCycle && <p className="mt-2 text-sm text-red-500">{errors.filingCycle}</p>}
                      </div>
                    </div>
                  )}
                  {formData.taxSystem === 'Custom' && (
                    <div className="text-center py-8">
                      <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                      <p className={theme.textMuted}>Custom tax system selected. Please configure manually after setup.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Books Tab */}
          {activeTab === 'books' && (
            <div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-6 flex items-center`}>
                <BookMarked size={24} className="mr-3 text-[#6AC8A3]" />
                Books & Financial Period Setup
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Books Start Date"
                  type="date"
                  value={formData.booksStartDate}
                  onChange={(val) => setFormData({ ...formData, booksStartDate: val })} // Made editable
                  required
                  error={errors.booksStartDate}
                  icon={<Calendar size={18} />}
                />
                <FormField
                  label="Financial Year Start Date"
                  type="date"
                  value={formData.fiscalYearStartDate}
                  onChange={(val) => setFormData({ ...formData, fiscalYearStartDate: val })}
                  required
                  error={errors.fiscalYearStartDate}
                  icon={<Calendar size={18} />}
                />
                {/* Financial Year End Date removed as it's auto-calculated */}
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Default Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.defaultCurrency}
                    onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    `}
                  >
                    {currencies.map(item => (
                      <option key={item.id} value={item.id}>{item.symbol} {item.name}</option>
                    ))}
                  </select>
                  {errors.defaultCurrency && <p className="mt-2 text-sm text-red-500">{errors.defaultCurrency}</p>}
                </div>
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Decimal Places <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.decimalPlaces}
                    onChange={(e) => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value) })}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    `}
                  >
                    {decimalPlacesOptions.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  {errors.decimalPlaces && <p className="mt-2 text-sm text-red-500">{errors.decimalPlaces}</p>}
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="multiCurrencySupport"
                    checked={formData.multiCurrencySupport}
                    onChange={(e) => setFormData({ ...formData, multiCurrencySupport: e.target.checked })}
                    className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                  />
                  <label htmlFor="multiCurrencySupport" className={`text-sm font-medium ${theme.textPrimary}`}>
                    Enable Multi-Currency Support
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoRounding"
                    checked={formData.autoRounding}
                    onChange={(e) => setFormData({ ...formData, autoRounding: e.target.checked })}
                    className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                  />
                  <label htmlFor="autoRounding" className={`text-sm font-medium ${theme.textPrimary}`}>
                    Enable Auto Rounding
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-6 flex items-center`}>
                <SlidersHorizontal size={24} className="mr-3 text-[#6AC8A3]" />
                Company Preferences
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Default Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.languagePreference}
                    onChange={(e) => setFormData({ ...formData, languagePreference: e.target.value })}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    `}
                  >
                    {languages.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  {errors.languagePreference && <p className="mt-2 text-sm text-red-500">{errors.languagePreference}</p>}
                </div>
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Date Format <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.dateFormat}
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    `}
                  >
                    {dateFormats.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  {errors.dateFormat && <p className="mt-2 text-sm text-red-500">{errors.dateFormat}</p>}
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableBatchTracking"
                    checked={formData.enableBatchTracking}
                    onChange={(e) => setFormData({ ...formData, enableBatchTracking: e.target.checked })}
                    className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                  />
                  <label htmlFor="enableBatchTracking" className={`text-sm font-medium ${theme.textPrimary}`}>
                    Enable Batch Tracking
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableCostCenterAllocation"
                    checked={formData.enableCostCenterAllocation}
                    onChange={(e) => setFormData({ ...formData, enableCostCenterAllocation: e.target.checked })}
                    className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                  />
                  <label htmlFor="enableCostCenterAllocation" className={`text-sm font-medium ${theme.textPrimary}`}>
                    Enable Cost Center Allocation
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableMultiUserAccess"
                    checked={formData.enableMultiUserAccess}
                    onChange={(e) => setFormData({ ...formData, enableMultiUserAccess: e.target.checked })}
                    className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                  />
                  <label htmlFor="enableMultiUserAccess" className={`text-sm font-medium ${theme.textPrimary}`}>
                    Enable Multi-User Access
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allowAiSuggestions"
                    checked={formData.allowAiSuggestions}
                    onChange={(e) => setFormData({ ...formData, allowAiSuggestions: e.target.checked })}
                    className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                  />
                  <label htmlFor="allowAiSuggestions" className={`text-sm font-medium ${theme.textPrimary}`}>
                    Allow AI Suggestions
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableCompanyPassword"
                    checked={formData.enableCompanyPassword}
                    onChange={(e) => setFormData({ ...formData, enableCompanyPassword: e.target.checked })}
                    className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                  />
                  <label htmlFor="enableCompanyPassword" className={`text-sm font-medium ${theme.textPrimary}`}>
                    Company Password (Optional)
                  </label>
                </div>
                {formData.enableCompanyPassword && (
                  <div className="relative">
                    <FormField
                      label="Set Company Password"
                      type={showPassword ? "text" : "password"}
                      value={formData.companyPassword}
                      onChange={(val) => setFormData({ ...formData, companyPassword: val })}
                      placeholder="Enter a password for this company"
                      required
                      error={errors.companyPassword}
                      icon={<Lock size={18} />}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allowSplitByPeriod"
                    checked={formData.allowSplitByPeriod}
                    onChange={(e) => setFormData({ ...formData, allowSplitByPeriod: e.target.checked })}
                    className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                  />
                  <label htmlFor="allowSplitByPeriod" className={`text-sm font-medium ${theme.textPrimary}`}>
                    Allow Split by Period
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableBarcodeSupport"
                    checked={formData.enableBarcodeSupport}
                    onChange={(e) => setFormData({ ...formData, enableBarcodeSupport: e.target.checked })}
                    className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                  />
                  <label htmlFor="enableBarcodeSupport" className={`text-sm font-medium ${theme.textPrimary}`}>
                    Enable Barcode Support
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allowAutoVoucherCreationAI"
                    checked={formData.allowAutoVoucherCreationAI}
                    onChange={(e) => setFormData({ ...formData, allowAutoVoucherCreationAI: e.target.checked })}
                    className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                  />
                  <label htmlFor="allowAutoVoucherCreationAI" className={`text-sm font-medium ${theme.textPrimary}`}>
                    Allow Auto-Voucher Creation via AI
                  </label>
                </div>
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Company Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.companyType}
                    onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    `}
                  >
                    {companyTypes.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  {errors.companyType && <p className="mt-2 text-sm text-red-500">{errors.companyType}</p>}
                </div>
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Employee Count <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.employeeCount}
                    onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    `}
                  >
                    {employeeCounts.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  {errors.employeeCount && <p className="mt-2 text-sm text-red-500">{errors.employeeCount}</p>}
                </div>
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Annual Revenue <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.annualRevenue}
                    onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    `}
                  >
                    {revenueRanges.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  {errors.annualRevenue && <p className="mt-2 text-sm text-red-500">{errors.annualRevenue}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{errors.submit}</p>
            </div>
          )}
          {errors.success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">{errors.success}</p>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              disabled={loading}
              icon={<Save size={16} />}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default CompanySettings;
