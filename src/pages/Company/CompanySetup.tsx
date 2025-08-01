// src/pages/Company/CompanySetup.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  Globe,
  Calendar,
  Shield,
  Upload,
  Save,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Settings,
  Lock,
  Eye,
  EyeOff,
  Flag,
  Coins,
  ChevronDown,
  Palette,
  Database,
  Users,
  Factory,
  Briefcase, // Used for Company Info tab
  DollarSign,
  Percent,
  MessageSquare,
  AlertTriangle,
  Clock,
  X,
  Bot, // Changed from MessageSquare for AI Assistant icon
  ToggleRight,
  Barcode,
  Lightbulb,
  FileText,
  BookOpen,
  User, // Used for Contact tab
  ReceiptText, // Used for Tax tab
  BookMarked, // Used for Books tab
  SlidersHorizontal, // Used for Preferences tab
  ArrowLeft, // Used for navigation
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import AIAssistant from '../../components/AI/AIAssistant';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext'; // Import useNotification
import { populateDefaultChartOfAccounts } from '../../lib/coaSetup'; // NEW: Import COA population utility

// --- IMPORT STATIC DATA FROM geoData.ts ---
import {
  COUNTRIES,
  CURRENCIES,
  LANGUAGES,
  LEGAL_STRUCTURES, // Changed from COMPANY_TYPES
  BUSINESS_TYPES, // NEW: Added BUSINESS_TYPES
  INDUSTRIES,
  EMPLOYEE_COUNTS, // NEW: Added EMPLOYEE_COUNTS
  REVENUE_RANGES, // NEW: Added REVENUE_RANGES
  GST_REGISTRATION_TYPES,
  FILING_FREQUENCIES,
  VAT_REGISTRATION_TYPES,
  FILING_CYCLES,
  DECIMAL_PLACES_OPTIONS,
  DATE_FORMATS,
  getCountryByCode,
  getPhoneCountryCodes
} from '../../constants/geoData';


// Define the Company type based on your schema
interface Company {
  id: string;
  name: string;
  country: string;
  currency: string;
  fiscal_year_start: string; // Changed from fiscalYearStart
  fiscal_year_end: string;   // Changed from fiscalYearEnd
  timezone: string;
  logo?: string;
  tax_config: {             // Changed from taxConfig
    type: 'GST' | 'VAT' | 'Custom' | 'Sales Tax' | 'Consumption Tax' | 'GST/PST/HST';
    rates: number[];
    enabled: boolean;
    registrationNumber?: string; // Make this optional as it might be nested or not always present
    gstDetails?: {
      pan?: string;
      tan?: string;
      registrationNumber?: string; // Keep this for nested access
      filingFrequency?: string;
      tdsApplicable?: boolean;
      tcsApplicable?: boolean;
    };
    vatDetails?: {
      registrationNumber?: string; // Keep this for nested access
      vatRegistrationType?: string;
      filingCycle?: string;
    };
  };
  address: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  contact_info: {           // Changed from contactInfo
    contactPersonName?: string;
    designation?: string;
    email?: string;
    mobile?: string;
    alternatePhone?: string;
    phoneCountry?: string;
  };
  settings: {              // Changed from settings
    displayName?: string;
    legalName?: string;
    industry?: string;
    businessType?: string; // NEW: Added businessType
    legalStructure?: string; // NEW: Added legalStructure
    registrationNo?: string;
    languagePreference?: string;
    decimalPlaces?: number;
    multiCurrencySupport?: boolean;
    autoRounding?: boolean;
    dateFormat?: string;
    batchTracking?: boolean;
    costCenterAllocation?: boolean;
    multiUserAccess?: boolean;
    aiSuggestions?: boolean;
    enablePassword?: boolean;
    password?: string;
    splitByPeriod?: boolean;
    barcodeSupport?: boolean;
    autoVoucherCreationAI?: boolean;
    companyType?: string; // Renamed to legalStructure
    employeeCount?: string;
    annualRevenue?: string;
    inventoryTracking?: boolean;
    companyUsername?: string;
    bankDetails?: { // NEW: Added bankDetails
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
      swiftCode?: string;
      accountHolderName?: string; // NEW
      currency?: string; // NEW
    };
  };
}

interface CompanySetupProps {
  companyToEdit?: Company; // Optional prop for editing existing company
  readOnly?: boolean; // Optional prop to make form read-only
  onSaveSuccess?: (message: string) => void; // Callback for successful save
  onSaveError?: (message: string) => void; // Callback for save error
  onCancel?: () => void; // Callback to cancel and go back (for edit mode)
}

const getInitialFormData = (company?: Company) => {
  const currentYear = new Date().getFullYear();
  const defaultCountry = getCountryByCode(company?.country || 'IN'); // Removed '!' for defensive check

  // Provide a robust fallback if defaultCountry is undefined
  const effectiveCountry = defaultCountry || COUNTRIES.find(c => c.code === 'US') || {
    code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', defaultCurrency: 'USD',
    defaultFiscalYearStart: '01-01', defaultFiscalYearEnd: '12-31', defaultDecimalPlaces: 2,
    taxConfig: { type: 'Sales Tax', rates: [0] }, // Minimal taxConfig
    timezone: 'America/New_York', states: [], businessTypes: [], customerTypes: [], complianceModules: {}
  };

  // Provide a robust fallback for taxConfig if it's missing from the country object
  const effectiveTaxConfig = effectiveCountry.taxConfig || { type: 'Custom', rates: [0] };

  const fiscalYearStartMonth = effectiveCountry.defaultFiscalYearStart ? parseInt(effectiveCountry.defaultFiscalYearStart.split('-')[0]) - 1 : 3; // Month is 0-indexed
  let fiscalYearStartDate = new Date(Date.UTC(currentYear, fiscalYearStartMonth, 1));
  if (new Date().getUTCMonth() < fiscalYearStartMonth) {
    fiscalYearStartDate = new Date(Date.UTC(currentYear - 1, fiscalYearStartMonth, 1));
  }
  const fiscalYearEndDate = new Date(Date.UTC(fiscalYearStartDate.getUTCFullYear() + 1, fiscalYearStartDate.getUTCMonth(), 0));

  const safeCompany = {
    ...company,
    address: company?.address || {},
    contact_info: company?.contact_info || {},
    tax_config: {
      ...(company?.tax_config || {}),
      gstDetails: (company?.tax_config?.gstDetails || {}),
      vatDetails: (company?.tax_config?.vatDetails || {}),
    },
    settings: company?.settings || {}, // Ensure settings object exists
  } as Company;

  const defaultTaxConfig = {
    enabled: true,
    rates: effectiveTaxConfig.rates || [0, 10, 20], // Use effectiveTaxConfig
    type: effectiveTaxConfig.type, // Use effectiveTaxConfig
    registrationNumber: '',
    gstDetails: { pan: '', tan: '', registrationType: GST_REGISTRATION_TYPES[0].id, filingFrequency: FILING_FREQUENCIES[0].id, tdsApplicable: false, tcsApplicable: false, registrationNumber: '' },
    vatDetails: { registrationNumber: '', vatRegistrationType: VAT_REGISTRATION_TYPES[0].id, filingCycle: FILING_CYCLES[0].id }
  };

  // Define default settings values explicitly, matching your database schema defaults
  // This ensures that even if UI fields are removed, these values are consistently sent.
  const defaultSettingsValues = {
    displayName: '',
    legalName: '',
    industry: INDUSTRIES[0].id,
    businessType: BUSINESS_TYPES[0].id, // NEW: Default Business Type
    legalStructure: LEGAL_STRUCTURES[0].id, // NEW: Default Legal Structure
    registrationNo: '',
    languagePreference: LANGUAGES[0].id,
    decimalPlaces: effectiveCountry.defaultDecimalPlaces, // Use effectiveCountry
    multiCurrencySupport: false,
    autoRounding: false,
    dateFormat: DATE_FORMATS[0].id,
    batchTracking: false,
    costCenterAllocation: false,
    multiUserAccess: false,
    aiSuggestions: true, // Default to true as per your code
    enablePassword: false,
    password: '',
    splitByPeriod: false,
    barcodeSupport: false,
    autoVoucherCreationAI: false,
    employeeCount: EMPLOYEE_COUNTS[0].id,
    annualRevenue: REVENUE_RANGES[0].id,
    inventoryTracking: true,
    companyUsername: '', // Assuming this is a setting
    bankDetails: { // NEW: Default bankDetails
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      swiftCode: '',
      accountHolderName: '', // NEW
      currency: CURRENCIES[0].id, // NEW
    },
  };


  return {
    companyName: safeCompany.name || '',
    legalName: safeCompany.settings.legalName || '',
    industry: safeCompany.settings.industry || defaultSettingsValues.industry,
    businessType: safeCompany.settings.businessType || defaultSettingsValues.businessType, // NEW
    legalStructure: safeCompany.settings.legalStructure || defaultSettingsValues.legalStructure, // NEW
    registrationNo: safeCompany.settings.registrationNo || defaultSettingsValues.registrationNo, // Made required
    country: safeCompany.country || effectiveCountry.code, // Use effectiveCountry
    state: safeCompany.address.state || '',
    city: safeCompany.address.city || '',
    addressLine1: safeCompany.address.street1 || '',
    addressLine2: safeCompany.address.street2 || '',
    zipCode: safeCompany.address.zipCode || '',
    languagePreference: safeCompany.settings.languagePreference || defaultSettingsValues.languagePreference,
    companyLogo: safeCompany.logo || null, // URL string if loaded, File object if new upload
    timezone: safeCompany.timezone || effectiveCountry.timezone, // Use effectiveCountry

    contactPersonName: safeCompany.contact_info.contactPersonName || '',
    designation: safeCompany.contact_info.designation || '',
    email: safeCompany.contact_info.email || '',
    mobile: safeCompany.contact_info.mobile || '',
    phoneCountry: safeCompany.contact_info.phoneCountry || effectiveCountry.code, // Auto-update phone country code
    alternateContactNumber: safeCompany.contact_info.alternatePhone || '',

    taxSystem: safeCompany.tax_config.type || effectiveTaxConfig.type, // Use effectiveTaxConfig
    taxConfig: {
      enabled: safeCompany.tax_config.enabled ?? defaultTaxConfig.enabled,
      rates: safeCompany.tax_config.rates || defaultTaxConfig.rates,
      registrationNumber: safeCompany.tax_config.registrationNumber || defaultTaxConfig.registrationNumber,
      gstDetails: safeCompany.tax_config.gstDetails || defaultTaxConfig.gstDetails,
      vatDetails: safeCompany.tax_config.vatDetails || defaultTaxConfig.vatDetails,
    },
    gstin: safeCompany.tax_config.type === 'GST' ? (safeCompany.tax_config.registrationNumber || safeCompany.tax_config.gstDetails?.registrationNumber || '') : '',
    pan: safeCompany.tax_config.gstDetails?.pan || '',
    tan: safeCompany.tax_config.gstDetails?.tan || '',
    gstRegistrationType: safeCompany.tax_config.gstDetails?.registrationType || GST_REGISTRATION_TYPES[0].id,
    filingFrequency: safeCompany.tax_config.gstDetails?.filingFrequency || FILING_FREQUENCIES[0].id,
    tdsApplicable: safeCompany.tax_config.gstDetails?.tdsApplicable ?? false,
    tcsApplicable: safeCompany.tax_config.gstDetails?.tcsApplicable ?? false,
    trnVatNumber: safeCompany.tax_config.type === 'VAT' ? (safeCompany.tax_config.registrationNumber || safeCompany.tax_config.vatDetails?.registrationNumber || '') : '',
    vatRegistrationType: safeCompany.tax_config.vatDetails?.vatRegistrationType || VAT_REGISTRATION_TYPES[0].id,
    filingCycle: safeCompany.tax_config.vatDetails?.filingCycle || FILING_CYCLES[0].id,

    // Moved to top-level
    booksStartDate: safeCompany.fiscal_year_start || fiscalYearStartDate.toISOString().split('T')[0],
    fiscalYearStartDate: safeCompany.fiscal_year_start || fiscalYearStartDate.toISOString().split('T')[0],
    fiscalYearEndDate: safeCompany.fiscal_year_end || fiscalYearEndDate.toISOString().split('T')[0],
    defaultCurrency: safeCompany.currency || effectiveCountry.defaultCurrency, // Use effectiveCountry
    decimalPlaces: safeCompany.settings.decimalPlaces ?? effectiveCountry.defaultDecimalPlaces, // Use effectiveCountry

    dateFormat: safeCompany.settings.dateFormat || defaultSettingsValues.dateFormat,
    enableBatchTracking: safeCompany.settings.batchTracking ?? defaultSettingsValues.batchTracking,
    costCenterAllocation: safeCompany.settings.costCenterAllocation ?? defaultSettingsValues.costCenterAllocation,
    multiUserAccess: safeCompany.settings.multiUserAccess ?? defaultSettingsValues.multiUserAccess,
    allowAiSuggestions: safeCompany.settings.aiSuggestions ?? defaultSettingsValues.allowAiSuggestions,
    companyPassword: safeCompany.settings.password || '',
    enableCompanyPassword: safeCompany.settings.enablePassword ?? defaultSettingsValues.enableCompanyPassword,
    allowSplitByPeriod: safeCompany.settings.splitByPeriod ?? defaultSettingsValues.allowSplitByPeriod,
    enableBarcodeSupport: safeCompany.settings.barcodeSupport ?? defaultSettingsValues.enableBarcodeSupport,
    allowAutoVoucherCreationAI: safeCompany.settings.autoVoucherCreationAI ?? defaultSettingsValues.allowAutoVoucherCreationAI,

    // Removed employeeCount and annualRevenue from settings, but kept in formData for now
    // employeeCount: safeCompany.settings.employeeCount || defaultSettingsValues.employeeCount,
    // annualRevenue: safeCompany.settings.annualRevenue || defaultSettingsValues.annualRevenue,
    inventoryTracking: safeCompany.settings.inventoryTracking ?? defaultSettingsValues.inventoryTracking,
    bankDetails: safeCompany.settings.bankDetails || defaultSettingsValues.bankDetails, // NEW
  };
};


function CompanySetup({ companyToEdit, readOnly, onSaveSuccess, onSaveError, onCancel }: CompanySetupProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { suggestWithAI } = useAI();
  const { refreshCompanies, switchCompany } = useCompany();
  const { showNotification } = useNotification();
 
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPhoneCountryDropdown, setShowPhoneCountryDropdown] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const [activeTab, setActiveTab] = useState('basic_info'); // Initial active tab // Changed from company_info

  const tabs = [
    { id: 'basic_info', label: 'Basic Info', icon: Briefcase }, // Changed from company_info
    { id: 'contact_address', label: 'Contact & Address', icon: User }, // Changed from contact
    { id: 'bank_details', label: 'Bank Details', icon: CreditCard }, // NEW Tab
    { id: 'tax', label: 'Taxation & Compliance', icon: ReceiptText },
    // { id: 'books', label: 'Books', icon: BookMarked }, // REMOVED BOOKS TAB
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  ];


  const [formData, setFormData] = useState<any>(getInitialFormData());

  // NEW: Fetch default role ID on component mount
  const [defaultRoleId, setDefaultRoleId] = useState<string | null>(null); // NEW: State for default role ID
  useEffect(() => {
    const fetchDefaultRole = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('name', 'Admin') // Assuming 'Admin' is the default role for company creators
        .single();

      if (error) {
        console.error('Error fetching default role:', error);
        showNotification('Could not find default Admin role. Please ensure it exists in user_roles table.', 'error');
      } else if (data) {
        setDefaultRoleId(data.id);
      }
    };
    fetchDefaultRole();
  }, []);


  // Initialize form data from companyToEdit prop or reset for new company
  useEffect(() => {
    console.log("CompanySetup: companyToEdit prop received:", companyToEdit); // ADDED THIS LOG
    if (companyToEdit) {
      const initialData = getInitialFormData(companyToEdit); // Directly use companyToEdit
      setFormData(initialData);
      setLogoFile(null);
      setErrors({});
      setActiveTab('basic_info'); // Changed from company_info

      // ADD THESE CONSOLE LOGS TO VERIFY formData AFTER SETTING
      console.log("CompanySetup useEffect: formData after setting:");
      console.log("  Contact Person Name:", initialData.contactPersonName);
      console.log("  Email:", initialData.email);
      console.log("  Mobile:", initialData.mobile);
      console.log("  GSTIN:", initialData.gstin);
      console.log("  PAN:", initialData.pan);
      console.log("  TRN/VAT Number:", initialData.trnVatNumber);
      console.log("  Books Start Date:", initialData.booksStartDate);
      console.log("  Date Format:", initialData.dateFormat);
      console.log("  Enable Company Password:", initialData.enableCompanyPassword);
      // console.log("  Company Username:", initialData.companyUsername); // Removed
      console.log("  Bank Details:", initialData.bankDetails);


    } else {
      setFormData(getInitialFormData());
      setLogoFile(null);
      setErrors({});
      setActiveTab('basic_info'); // Changed from company_info
    }
  }, [companyToEdit]); // Re-run when companyToEdit changes


  // Auto-calculate fiscal year end date and update tax rates based on country
  useEffect(() => {
    // Only auto-calculate if fiscalYearStartDate is not already set from database
    // This prevents overwriting existing data when editing a company
    // if (!companyToEdit || !formData.fiscalYearStartDate || !formData.fiscalYearEndDate) { // Added companyToEdit check
      const selectedCountryData = getCountryByCode(formData.country);
      if (selectedCountryData) {
        const currentYear = new Date().getFullYear();
        const fiscalYearStartMonth = selectedCountryData.defaultFiscalYearStart ? parseInt(selectedCountryData.defaultFiscalYearStart.split('-')[0]) - 1 : 3; // Month is 0-indexed

        let fiscalYearStartDateObj = new Date(Date.UTC(currentYear, fiscalYearStartMonth, 1)); // Use Date.UTC
        // If current month is before fiscal year start month, use previous year
        if (new Date().getUTCMonth() < fiscalYearStartMonth) { // Use getUTCMonth
          fiscalYearStartDateObj = new Date(Date.UTC(currentYear - 1, fiscalYearStartMonth, 1)); // Use Date.UTC
        }

        // FIX: Use fiscalYearStartDateObj for getUTCMonth()
        const fiscalYearEndDateObj = new Date(Date.UTC(fiscalYearStartDateObj.getUTCFullYear() + 1, fiscalYearStartDateObj.getUTCMonth(), 0)); // Use Date.UTC and getUTCMonth

        // Log the calculated dates for debugging
        console.log('Calculated Fiscal Year Start Date:', fiscalYearStartDateObj.toISOString().split('T')[0]);
        console.log('Calculated Fiscal Year End Date:', fiscalYearEndDateObj.toISOString().split('T')[0]);
        console.log('Calculated Books Start Date:', fiscalYearStartDateObj.toISOString().split('T')[0]);


        setFormData((prev: any) => ({
          ...prev,
          timezone: selectedCountryData.timezone,
          defaultCurrency: selectedCountryData.defaultCurrency,
          taxSystem: selectedCountryData.taxConfig.type,
          fiscalYearStartDate: fiscalYearStartDateObj.toISOString().split('T')[0], // This is the start date
          fiscalYearEndDate: fiscalYearEndDateObj.toISOString().split('T')[0], // This is the end date
          booksStartDate: fiscalYearStartDateObj.toISOString().split('T')[0], // This is the books start date
          phoneCountry: selectedCountryData.code, // Auto-update phone country code
          // Reset state if country changes and previous state is not valid for new country
          state: selectedCountryData.states.find(s => s.name === prev.state) ? prev.state : '',
        }));

        // Update tax rates based on country
        setFormData((prev: any) => ({
          ...prev,
          taxConfig: {
            ...prev.taxConfig,
            rates: selectedCountryData.taxConfig.rates || [0, 10, 20], // Default if not found
          },
        }));
      }
    // } // End of if (!companyToEdit...)
  }, [formData.country, formData.fiscalYearStartDate]); // Re-run when country changes or fiscal dates are empty

  // Update booksStartDate if fiscalYearStartDate is manually changed
  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      booksStartDate: prev.fiscalYearStartDate,
    }));
  }, [formData.fiscalYearStartDate]);


  const validateForm = (data: any, currentTabId: string): Record<string, string> => {
    let newErrors: Record<string, string> = {};

    // Basic Info Tab Validation
    if (currentTabId === 'basic_info') { // Changed from company_info
      if (!data.companyName.trim()) newErrors.companyName = 'Company Name is required';
      if (!data.industry) newErrors.industry = 'Industry is required';
      if (!data.businessType) newErrors.businessType = 'Business Type is required'; // NEW
      if (!data.legalStructure) newErrors.legalStructure = 'Legal Structure is required'; // NEW
      if (!data.registrationNo.trim()) newErrors.registrationNo = 'Registration No. is required'; // NEW: Made required

      // Moved from Books tab
      if (!data.booksStartDate) newErrors.booksStartDate = 'Books Start Date is required';
      if (!data.fiscalYearStartDate) newErrors.fiscalYearStartDate = 'Financial Year Start Date is required';
      if (!data.defaultCurrency) newErrors.defaultCurrency = 'Default Currency is required';
      if (data.decimalPlaces === null) newErrors.decimalPlaces = 'Decimal Places is required';
    }

    // Contact & Address Tab Validation
    if (currentTabId === 'contact_address') { // Changed from contact
      // Contact Person Name is no longer compulsory
      if (data.email.trim() && !/\S+@\S+\.\S+/.test(data.email)) {
        newErrors.email = 'Invalid email address';
      }
      if (!data.country) newErrors.country = 'Country is required'; // Moved from company_info
      const selectedCountryData = getCountryByCode(data.country);
      if (selectedCountryData && selectedCountryData.states.length > 0 && !data.state.trim()) {
        newErrors.state = 'State/Province is required'; // Moved from company_info
      }
      if (!data.addressLine1.trim()) newErrors.addressLine1 = 'Address Line 1 is required'; // Moved from company_info
    }

    // Bank Details Tab Validation (NEW)
    if (currentTabId === 'bank_details') {
      if (data.bankDetails.bankName || data.bankDetails.accountNumber || data.bankDetails.ifscCode || data.bankDetails.swiftCode || data.bankDetails.accountHolderName || data.bankDetails.currency) {
        if (!data.bankDetails.bankName.trim()) newErrors.bankName = 'Bank Name is required if bank details are provided';
        if (!data.bankDetails.accountNumber.trim()) newErrors.accountNumber = 'Account Number is required if bank details are provided';
        if (!data.bankDetails.ifscCode.trim()) newErrors.ifscCode = 'IFSC Code is required if bank details are provided';
        if (!data.bankDetails.accountHolderName.trim()) newErrors.accountHolderName = 'Account Holder Name is required if bank details are provided'; // NEW
        if (!data.bankDetails.currency.trim()) newErrors.currency = 'Currency is required if bank details are provided'; // NEW
      }
    }

    // Tax Tab Validation
    if (currentTabId === 'tax' && data.taxConfig.enabled) {
      if (data.taxSystem === 'GST') {
        if (!data.gstin.trim()) newErrors.gstin = 'GSTIN is required';
        // PAN is now optional
        if (!data.gstRegistrationType) newErrors.gstRegistrationType = 'GST Registration Type is required';
        if (!data.filingFrequency) newErrors.filingFrequency = 'Filing Frequency is required';
      } else if (data.taxSystem === 'VAT') {
        if (!data.trnVatNumber.trim()) newErrors.trnVatNumber = 'TRN / VAT Number is required';
        if (!data.vatRegistrationType) newErrors.vatRegistrationType = 'VAT Registration Type is required';
        if (!data.filingCycle) newErrors.filingCycle = 'Filing Cycle is required';
      }
    }

    // Books Tab Validation (REMOVED)
    // if (currentTabId === 'books') {
    //   if (!data.booksStartDate) newErrors.booksStartDate = 'Books Start Date is required';
    //   if (!data.fiscalYearStartDate) newErrors.fiscalYearStartDate = 'Financial Year Start Date is required';
    //   if (!data.defaultCurrency) newErrors.defaultCurrency = 'Default Currency is required';
    //   if (data.decimalPlaces === null) newErrors.decimalPlaces = 'Decimal Places is required';
    // }

    // Preferences Tab Validation
    if (currentTabId === 'preferences') {
      if (!data.languagePreference) newErrors.languagePreference = 'Language Preference is required';
      if (!data.dateFormat) newErrors.dateFormat = 'Date Format is required';
      if (data.enableCompanyPassword) { // Only validate password and username if security is enabled
        if (!data.companyPassword.trim()) newErrors.companyPassword = 'Company Password is required if security is enabled';
      }
      // Removed employeeCount and annualRevenue validation as they are no longer in settings
      // if (!data.employeeCount) newErrors.employeeCount = 'Employee Count is required'; // NEW
      // if (!data.annualRevenue) newErrors.annualRevenue = 'Annual Revenue is required'; // NEW
    }

    return newErrors;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev: any) => ({ ...prev, companyLogo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

const handleSubmit = async () => {
    let allValidationErrors: Record<string, string> = {};

    for (const tab of tabs) {
      const tabErrors = validateForm(formData, tab.id);
      allValidationErrors = { ...allValidationErrors, ...tabErrors };
    }

    if (Object.keys(allValidationErrors).length > 0) {
      setErrors({ ...allValidationErrors, submit: 'Please correct the errors in all sections before submitting.' });
      showNotification('Please correct the errors in all sections before proceeding.', 'error');
      onSaveError?.('Please correct the errors in all sections before submitting.');
      return;
    }

    setLoading(true);
    try {
      console.log("handleSubmit: Starting submission process.");

      if (!isAuthenticated || !user) {
        console.error("handleSubmit: User not authenticated or user object is null.");
        throw new Error('Application authentication failed. Please log in again.');
      }

      console.log("handleSubmit: User authenticated. User ID:", user.id);

      // --- START MODIFICATION FOR UNIQUE COMPANY NAME ---
      if (!companyToEdit) { // Only check for new company creation
        const { data: existingCompanies, error: checkError } = await supabase
          .from('companies')
          .select('id')
          .eq('name', formData.companyName)
          .eq('created_by', user.id);

        if (checkError) {
          console.error('handleSubmit: Error checking for existing company name:', checkError);
          throw new Error('Failed to check for existing company name: ' + checkError.message);
        }

        if (existingCompanies && existingCompanies.length > 0) {
          const errorMessage = 'You already have a company with this name. Please choose a different name.';
          setErrors({ ...allValidationErrors, companyName: errorMessage, submit: errorMessage });
          showNotification(errorMessage, 'error');
          onSaveError?.(errorMessage);
          setLoading(false);
          return; // Prevent further execution
        }
      }
      // --- END MODIFICATION FOR UNIQUE COMPANY NAME ---

      let logoUrl = formData.companyLogo;
      if (logoFile) {
        console.log("handleSubmit: Attempting to upload logo.");
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company_logos')
          .upload(`${formData.companyName.replace(/\s/g, '_').toLowerCase()}_${Date.now()}`, logoFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('handleSubmit: Error uploading logo:', uploadError);
          throw new Error('Failed to upload company logo: ' + uploadError.message);
        }
        logoUrl = `${supabase.storage.from('company_logos').getPublicUrl(uploadData.path).data.publicUrl}`;
        console.log("handleSubmit: Logo uploaded successfully. URL:", logoUrl);
      }

      const selectedCountryDataForSubmission = getCountryByCode(formData.country);
      // Ensure timezone is always a string, fallback to 'UTC' if not found
      const companyTimezone = selectedCountryDataForSubmission?.timezone || 'UTC'; 
      
      const selectedPhoneCountryDataForSubmission = getPhoneCountryCodes().find(c => c.code === formData.phoneCountry); // Use .code to match
      const phoneDialCode = selectedPhoneCountryDataForSubmission ? selectedPhoneCountryDataForSubmission.dialCode : '';

      const companyData = {
        name: formData.companyName,
        country: formData.country,
        currency: formData.defaultCurrency, // Moved to top-level
        fiscal_year_start: formData.fiscalYearStartDate, // Moved to top-level
        fiscal_year_end: formData.fiscalYearEndDate, // Moved to top-level
        timezone: companyTimezone, // Use the ensured timezone
        logo: logoUrl,
        tax_config: {
          type: formData.taxSystem,
          enabled: formData.taxConfig.enabled,
          registrationNumber: formData.taxSystem === 'GST' ? formData.gstin : formData.trnVatNumber,
          rates: formData.taxConfig.rates,
          gstDetails: formData.taxSystem === 'GST' ? {
            pan: formData.pan,
            tan: formData.tan,
            registrationNumber: formData.gstin,
            registrationType: formData.gstRegistrationType,
            filingFrequency: formData.filingFrequency,
            tdsApplicable: formData.tdsApplicable,
            tcsApplicable: formData.tcsApplicable,
          } : null,
          vatDetails: formData.taxSystem === 'VAT' ? {
            registrationNumber: formData.trnVatNumber,
            vatRegistrationType: formData.vatRegistrationType,
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
          mobile: formData.mobile ? `${phoneDialCode}${formData.mobile}` : null,
          alternatePhone: formData.alternateContactNumber ? `${phoneDialCode}${formData.alternateContactNumber}` : null,
          phoneCountry: formData.phoneCountry,
        },
        settings: {
          displayName: formData.legalName || formData.companyName,
          legalName: formData.legalName,
          industry: formData.industry,
          businessType: formData.businessType, // NEW
          legalStructure: formData.legalStructure, // NEW
          registrationNo: formData.registrationNo,
          languagePreference: formData.languagePreference,
          decimalPlaces: formData.decimalPlaces, // Moved to top-level
          multiCurrencySupport: formData.multiCurrencySupport,
          autoRounding: formData.autoRounding,
          dateFormat: formData.dateFormat,
          batchTracking: formData.enableBatchTracking,
          costCenterAllocation: formData.costCenterAllocation,
          multiUserAccess: formData.enableMultiUserAccess,
          aiSuggestions: formData.allowAiSuggestions,
          enablePassword: formData.enableCompanyPassword,
          password: formData.enableCompanyPassword ? formData.companyPassword : null,
          splitByPeriod: formData.allowSplitByPeriod,
          barcodeSupport: formData.enableBarcodeSupport,
          autoVoucherCreationAI: formData.allowAutoVoucherCreationAI,
          // Removed employeeCount and annualRevenue from settings
          // employeeCount: formData.employeeCount,
          // annualRevenue: formData.annualRevenue,
          inventoryTracking: formData.inventoryTracking,
          bankDetails: formData.bankDetails, // NEW
        },
        created_by: user.id,
      };

      let companyId: string | null = null;
      console.log("Company data being sent for insert/update:", companyData);

      if (companyToEdit) {
        console.log("handleSubmit: Attempting to update existing company.");

        const updatePromise = supabase
          .from('companies')
          .update(companyData)
          .eq('id', companyToEdit.id)
          .select('id');

        const timeoutPromise = new Promise<any>((resolve, reject) => {
          const id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error('Update operation timed out after 10 seconds.'));
          }, 10000);
        });

        const { data, error } = await Promise.race([updatePromise, timeoutPromise]);

        if (error) {
          console.error('handleSubmit: Supabase Error during update:', error);
          throw new Error('Failed to update company record: ' + error.message);
        }

        if (!data || data.length === 0) {
          console.error('handleSubmit: Update operation completed without error, but no rows were affected. Data:', data);
          throw new Error('Failed to update company record: No matching record found or update was silently denied (e.g., by RLS).');
        }

        companyId = data[0].id;
        console.log("handleSubmit: Company updated successfully. ID:", companyId);

      } else {
        console.log("handleSubmit: Attempting to insert new company.");
        const { data, error } = await supabase
          .from('companies')
          .insert([companyData])
          .select('id');

        if (error) {
          console.error('handleSubmit: Error inserting new company:', error);
          throw new Error('Failed to create company record: ' + error.message);
        }
        companyId = data ? data[0]?.id : null;
        console.log("handleSubmit: New company inserted successfully. ID:", companyId);

        if (companyId) {
          console.log("handleSubmit: Attempting to link user to new company in users_companies.");
          if (!defaultRoleId) {
            throw new Error("Default role ID not found. Cannot link user to company.");
          }
          const { error: userCompanyLinkError } = await supabase
            .from('users_companies')
            .insert({
              user_id: user.id,
              company_id: companyId,
              role_id: defaultRoleId,
              is_active: true,
            });

          if (userCompanyLinkError) {
            console.error('handleSubmit: Error linking user to company:', userCompanyLinkError);
            throw new Error(`Failed to link user to company: ${userCompanyLinkError.message}`);
          }
          console.log("handleSubmit: User successfully linked to new company.");

          console.log("handleSubmit: Populating default Chart of Accounts.");
          await populateDefaultChartOfAccounts(supabase, companyId, formData.country);
          console.log("handleSubmit: Default Chart of Accounts populated.");
        } else {
          console.error("handleSubmit: No company ID returned after insert, cannot link user.");
          throw new Error("Failed to retrieve new company ID.");
        }
      }

      if (!companyToEdit && companyId) {
        console.log("handleSubmit: Attempting to create default period.");
        const { error: periodError } = await supabase
          .from('periods')
          .insert({
            company_id: companyId,
            name: `FY ${new Date(formData.fiscalYearStartDate).getFullYear()}-${new Date(formData.fiscalYearEndDate).getFullYear()}`,
            start_date: formData.fiscalYearStartDate,
            end_date: formData.fiscalYearEndDate,
            is_active: true,
            period_type: 'fiscal_year'
          });

        if (periodError) {
          console.error('handleSubmit: Error creating default period:', periodError);
        }
        console.log("handleSubmit: Default period creation attempted.");
      }

      await refreshCompanies();
      console.log("handleSubmit: Companies refreshed in context.");

      if (!companyToEdit && companyId) {
        switchCompany(companyId);
        console.log("handleSubmit: Switched to new company:", companyId);
        showNotification('Company created successfully!', 'success');
        onSaveSuccess?.('Company created successfully!');
        setFormData(getInitialFormData());
        setLogoFile(null);
        setErrors({});
        setActiveTab('basic_info');
        navigate('/');
      } else if (companyToEdit) {
        console.log("handleSubmit: Company settings updated.");
        showNotification('Company settings updated successfully!', 'success');
        onSaveSuccess?.('Company settings updated successfully!');
      }
      console.log("handleSubmit: Submission process completed successfully.");

    } catch (err: any) {
      console.error('handleSubmit: Caught error during submission:', err);
      setErrors({ submit: err.message || 'An unexpected error occurred.' });
      showNotification(err.message || 'An unexpected error occurred.', 'error');
      onSaveError?.(err.message || 'An unexpected error occurred during save.');
    } finally {
      console.log("handleSubmit: Finally block reached. Setting loading to false.");
      setLoading(false);
    }
  };



  const selectedCountry = getCountryByCode(formData.country);
  const selectedPhoneCountry = getPhoneCountryCodes().find(c => c.code === formData.phoneCountry); // Use .code to match
  const availableStates = selectedCountry?.states.map(s => s.name) || [];

  const handleNextTab = () => {
    const currentTabErrors = validateForm(formData, activeTab);
    if (Object.keys(currentTabErrors).length > 0) {
      setErrors({ ...errors, ...currentTabErrors, submit: 'Please correct the errors in this section before proceeding.' });
      showNotification('Please correct the errors in this section before proceeding.', 'error');
      return;
    }

    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
      setErrors({}); // Clear errors when moving to next tab
    }
  };

  const handlePreviousTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
      setErrors({}); // Clear errors when moving to previous tab
    }
  };

  return (
    <div className={`min-h-screen ${companyToEdit ? '' : theme.panelBg} py-4`}>
      <div className="w-full px-4 sm:px-8"> {/* Changed max-w-5xl mx-auto to w-full */}
        {/* Header */}
        {!companyToEdit && ( // Only show this header for new company creation
          <div className="text-center mb-6">
            <div className={`
              inline-flex items-center justify-center w-16 h-16
              bg-gradient-to-r ${theme.primaryGradient} rounded-2xl shadow-xl mb-4
            `}>
              <Building size={32} className="text-white" />
            </div>
            <h1 className={`text-4xl font-bold ${theme.textPrimary} mb-2`}>
              Create Your Company
            </h1>
            <p className={`text-lg ${theme.textSecondary}`}>
              Set up your business profile and financial settings
            </p>
          </div>
        )}
        {companyToEdit && ( // Show this header for view/edit mode
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
                {readOnly ? 'View Company Details' : 'Edit Company Details'}
              </h1>
              <p className={theme.textSecondary}>
                {readOnly ? 'Review company configuration and preferences' : 'Update your company configuration and preferences'}
              </p>
            </div>
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                icon={<ArrowLeft size={16} />}
              >
                Back
              </Button>
            )}
          </div>
        )}


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
                  disabled={loading}
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
            {/* Basic Info Tab */}
            {activeTab === 'basic_info' && ( // Changed from company_info
              <div key="basic_info_tab_content"> {/* ADDED KEY */}
                <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-6 flex items-center`}>
                  <Briefcase size={24} className="mr-3 text-emerald-600" /> {/* Changed color */}
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
                    readOnly={readOnly}
                  />
                  <FormField
                    label="Legal Name"
                    value={formData.legalName}
                    onChange={(val) => setFormData({ ...formData, legalName: val })}
                    placeholder="Full legal name"
                    icon={<Building size={18} className="text-gray-400" />}
                    readOnly={readOnly}
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
                        ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
                        focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                        ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                      `}
                      disabled={readOnly}
                    >
                      {INDUSTRIES.map(item => (
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
                        ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
                        focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                        ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                      `}
                      disabled={readOnly}
                    >
                      {BUSINESS_TYPES.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    {errors.businessType && <p className="mt-2 text-sm text-red-500">{errors.businessType}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                      Legal Structure <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.legalStructure}
                      onChange={(e) => setFormData({ ...formData, legalStructure: e.target.value })}
                      className={`
                        w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                        ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
                        focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                        ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                      `}
                      disabled={readOnly}
                    >
                      {LEGAL_STRUCTURES.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    {errors.legalStructure && <p className="mt-2 text-sm text-red-500">{errors.legalStructure}</p>}
                  </div>
                  <FormField
                    label="Registration No."
                    value={formData.registrationNo}
                    onChange={(val) => setFormData({ ...formData, registrationNo: val })}
                    icon={<FileText size={18} className="text-gray-400" />}
                    required
                    error={errors.registrationNo}
                    readOnly={readOnly}
                  />
                  {/* Moved from Books tab */}
                  <FormField
                    label="Books Start Date"
                    type="date"
                    value={formData.booksStartDate}
                    onChange={(val) => setFormData({ ...formData, booksStartDate: val })} // Made editable
                    required
                    error={errors.booksStartDate}
                    icon={<Calendar size={18} />}
                    readOnly={readOnly}
                  />
                  <FormField
                    label="Financial Year Start Date"
                    type="date"
                    value={formData.fiscalYearStartDate}
                    onChange={(val) => setFormData({ ...formData, fiscalYearStartDate: val })}
                    required
                    error={errors.fiscalYearStartDate}
                    icon={<Calendar size={18} />}
                    readOnly={readOnly}
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
                        ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                      `}
                      disabled={readOnly}
                    >
                      {CURRENCIES.map(item => (
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
                        ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                      `}
                      disabled={readOnly}
                    >
                      {DECIMAL_PLACES_OPTIONS.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    {errors.decimalPlaces && <p className="mt-2 text-sm text-red-500">{errors.decimalPlaces}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Contact & Address Tab */}
            {activeTab === 'contact_address' && ( // Changed from contact
              <>
                <Card className="p-6 mb-6"> {/* New Card for Contact Details */}
                  <h3 className={`text-xl font-bold text-blue-600 mb-4 flex items-center`}> {/* Changed color and size */}
                    <User size={24} className="mr-3 text-blue-600" /> {/* Changed color and size */}
                    Contact Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Contact Person Name"
                      value={formData.contactPersonName}
                      onChange={(val) => setFormData({ ...formData, contactPersonName: val })}
                      error={errors.contactPersonName}
                      readOnly={readOnly}
                    />
                    <FormField
                      label="Designation (Optional)"
                      value={formData.designation}
                      onChange={(val) => setFormData({ ...formData, designation: val })}
                      error={errors.designation}
                      readOnly={readOnly}
                    />
                    <FormField
                      label="Email Address (Optional)"
                      type="email"
                      value={formData.email}
                      onChange={(val) => setFormData({ ...formData, email: val })}
                      placeholder="contact@example.com"
                      error={errors.email}
                      icon={<Mail size={18} className="text-gray-400" />}
                      readOnly={readOnly}
                    />
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                        Mobile Number (Optional)
                      </label>
                      <div className="flex items-stretch"> {/* Use items-stretch for alignment */}
                        <div className="relative w-24"> {/* Fixed width for country code */}
                          <button
                            type="button"
                            onClick={() => setShowPhoneCountryDropdown(!showPhoneCountryDropdown)}
                            className={`
                              flex items-center justify-center space-x-1 px-2 py-2.5 border ${theme.borderColor}
                              ${theme.borderRadius} rounded-r-none border-r-0 h-full
                              ${theme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent
                              ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                            `}
                            disabled={readOnly}
                          >
                            <span className="text-lg">{selectedPhoneCountry?.flag}</span>
                            <span className="text-sm">{selectedPhoneCountry?.dialCode}</span>
                            <ChevronDown size={14} />
                          </button>
                          {showPhoneCountryDropdown && !readOnly && (
                            <div className={`
                              absolute top-full left-0 mt-1 w-64 ${theme.isDark ? 'bg-gray-700' : 'bg-white'}
                              border ${theme.isDark ? 'border-gray-600' : 'border-gray-300'}
                              ${theme.borderRadius} shadow-lg z-50 max-h-60 overflow-y-auto
                            `}>
                              {getPhoneCountryCodes().map((country) => (
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
                              w-full pl-10 pr-3 py-2.5 border ${theme.inputBorder}
                              ${theme.borderRadius} rounded-l-none
                              ${theme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            `}
                            readOnly={readOnly}
                          />
                        </div>
                      </div>
                    </div>
                    <FormField
                      label="Alternate Contact Number (Optional)"
                      value={formData.alternateContactNumber}
                      onChange={(val) => setFormData({ ...formData, alternateContactNumber: val })}
                      icon={<Phone size={18} className="text-gray-400" />}
                      readOnly={readOnly}
                    />
                  </div>
                </Card>

                <Card className="p-6"> {/* New Card for Business Address */}
                  <h3 className={`text-xl font-bold text-purple-600 mt-6 mb-4 flex items-center`}> {/* Changed color and size */}
                    <MapPin size={24} className="mr-3 text-purple-600" /> {/* Changed color and size */}
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
                          ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
                          focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                          ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                        `}
                        disabled={readOnly}
                      >
                        {COUNTRIES.map(country => (
                          <option key={country.code} value={country.code}>
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
                          ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                        `}
                        disabled={readOnly || availableStates.length === 0}
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
                        placeholder="Street address, P.O. box"
                        required
                        error={errors.addressLine1}
                        icon={<MapPin size={18} className="text-gray-400" />}
                        readOnly={readOnly}
                      />
                    </div>
                    <FormField
                      label="Address Line 2 (Optional)"
                      value={formData.addressLine2}
                      onChange={(val) => setFormData({ ...formData, addressLine2: val })}
                      placeholder="Apartment, suite, unit, building, floor, etc."
                      icon={<MapPin size={18} className="text-gray-400" />}
                      readOnly={readOnly}
                    />
                    <FormField
                      label="City (Optional)"
                      value={formData.city}
                      onChange={(val) => setFormData({ ...formData, city: val })}
                      placeholder="City"
                      error={errors.city}
                      readOnly={readOnly}
                    />
                    <FormField
                      label="PIN/ZIP Code (Optional)"
                      value={formData.zipCode}
                      onChange={(val) => setFormData({ ...formData, zipCode: val })}
                      placeholder="ZIP or Postal Code"
                      error={errors.zipCode}
                      readOnly={readOnly}
                    />
                  </div>
                </Card>
              </>
            )}

            {/* Bank Details Tab (NEW) */}
            {activeTab === 'bank_details' && (
              <div>
                <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-6 flex items-center`}>
                  <CreditCard size={24} className="mr-3 text-orange-600" /> {/* Changed color */}
                  Bank Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Bank Name"
                    value={formData.bankDetails.bankName}
                    onChange={(val) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: val } })}
                    placeholder="e.g., State Bank of India"
                    error={errors.bankName}
                    readOnly={readOnly}
                  />
                  <FormField
                    label="Account Holder Name" // NEW
                    value={formData.bankDetails.accountHolderName}
                    onChange={(val) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountHolderName: val } })}
                    placeholder="e.g., Your Company Name"
                    error={errors.accountHolderName}
                    readOnly={readOnly}
                  />
                  <FormField
                    label="Account Number"
                    value={formData.bankDetails.accountNumber}
                    onChange={(val) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountNumber: val } })}
                    placeholder="e.g., 1234567890"
                    error={errors.accountNumber}
                    readOnly={readOnly}
                  />
                  <FormField
                    label="IFSC Code"
                    value={formData.bankDetails.ifscCode}
                    onChange={(val) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, ifscCode: val } })}
                    placeholder="e.g., SBIN0000001"
                    error={errors.ifscCode}
                    readOnly={readOnly}
                  />
                  <FormField
                    label="SWIFT Code (Optional)"
                    value={formData.bankDetails.swiftCode}
                    onChange={(val) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, swiftCode: val } })}
                    placeholder="e.g., SBININBBXXX"
                    readOnly={readOnly}
                  />
                  <div className="space-y-2"> {/* NEW: Currency field */}
                    <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.bankDetails.currency}
                      onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, currency: e.target.value } })}
                      className={`
                        w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                        ${theme.inputBg} ${theme.textPrimary}
                        focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                        ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                      `}
                      disabled={readOnly}
                    >
                      {CURRENCIES.map(item => (
                        <option key={item.id} value={item.id}>{item.symbol} {item.name}</option>
                      ))}
                    </select>
                    {errors.currency && <p className="mt-2 text-sm text-red-500">{errors.currency}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Tax Tab */}
            {activeTab === 'tax' && (
              <div>
                <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-6 flex items-center`}>
                  <ReceiptText size={24} className="mr-3 text-purple-600" /> {/* Changed color */}
                  Tax / Compliance Details
                </h2>
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="taxEnabled"
                    checked={formData.taxConfig.enabled}
                    onChange={(e) => setFormData({ ...formData, taxConfig: { ...formData.taxConfig, enabled: e.target.checked } })}
                    className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                    disabled={readOnly}
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
                          readOnly={readOnly}
                        />
                        <FormField
                          label="PAN"
                          value={formData.pan}
                          onChange={(val) => setFormData({ ...formData, pan: val })}
                          placeholder="AAAAA0000A"
                          // PAN is now optional
                          error={errors.pan}
                          readOnly={readOnly}
                        />
                        <FormField
                          label="TAN (Optional)"
                          value={formData.tan}
                          onChange={(val) => setFormData({ ...formData, tan: val })}
                          placeholder="TAN Number"
                          readOnly={readOnly}
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
                              ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
                              focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                              ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                            `}
                            disabled={readOnly}
                          >
                            {GST_REGISTRATION_TYPES.map(item => (
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
                              ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
                              focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                              ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                            `}
                            disabled={readOnly}
                          >
                            {FILING_FREQUENCIES.map(item => (
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
                            disabled={readOnly}
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
                            disabled={readOnly}
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
                          placeholder="TRN / VAT Number"
                          required
                          error={errors.trnVatNumber}
                          readOnly={readOnly}
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
                              ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
                              focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                              ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                            `}
                            disabled={readOnly}
                          >
                            {VAT_REGISTRATION_TYPES.map(item => (
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
                              ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
                              focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                              ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                            `}
                            disabled={readOnly}
                          >
                            {FILING_CYCLES.map(item => (
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

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div>
                <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-6 flex items-center`}>
                  <SlidersHorizontal size={24} className="mr-3 text-blue-600" /> {/* Changed color */}
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
                      disabled={readOnly}
                    >
                      {LANGUAGES.map(item => (
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
                      {DATE_FORMATS.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    {errors.dateFormat && <p className="mt-2 text-sm text-red-500">{errors.dateFormat}</p>}
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="multiCurrencySupport"
                      checked={formData.multiCurrencySupport}
                      onChange={(e) => setFormData({ ...formData, multiCurrencySupport: e.target.checked })}
                      className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                      disabled={readOnly}
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
                      disabled={readOnly}
                    />
                    <label htmlFor="autoRounding" className={`text-sm font-medium ${theme.textPrimary}`}>
                      Enable Auto Rounding
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="enableBatchTracking"
                      checked={formData.enableBatchTracking}
                      onChange={(e) => setFormData({ ...formData, enableBatchTracking: e.target.checked })}
                      className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                      disabled={readOnly}
                    />
                    <label htmlFor="enableBatchTracking" className={`text-sm font-medium ${theme.textPrimary}`}>
                      Enable Batch Tracking
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="enableCostCenterAllocation"
                      checked={formData.costCenterAllocation}
                      onChange={(e) => setFormData({ ...formData, costCenterAllocation: e.target.checked })}
                      className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
                    />
                    <label htmlFor="allowAiSuggestions" className={`text-sm font-medium ${theme.textPrimary}`}>
                      Allow AI Suggestions
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="allowSplitByPeriod"
                      checked={formData.allowSplitByPeriod}
                      onChange={(e) => setFormData({ ...formData, allowSplitByPeriod: e.target.checked })}
                      className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
                    />
                    <label htmlFor="allowAutoVoucherCreationAI" className={`text-sm font-medium ${theme.textPrimary}`}>
                      Allow Auto-Voucher Creation via AI
                    </label>
                  </div>
                  {/* Removed Employee Count and Annual Revenue fields */}
                  {/* <div className="space-y-2">
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
                      disabled={readOnly}
                    >
                      {EMPLOYEE_COUNTS.map(item => (
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
                      {REVENUE_RANGES.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    {errors.annualRevenue && <p className="mt-2 text-sm text-red-500">{errors.annualRevenue}</p>}
                  </div> */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="inventoryTracking"
                      checked={formData.inventoryTracking}
                      onChange={(e) => setFormData({ ...formData, inventoryTracking: e.target.checked })}
                      className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                      disabled={readOnly}
                    />
                    <label htmlFor="inventoryTracking" className={`text-sm font-medium ${theme.textPrimary}`}>
                      Enable Inventory Tracking
                    </label>
                  </div>
                  {/* Company Password (Optional) moved to last */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="enableCompanyPassword"
                      checked={formData.enableCompanyPassword}
                      onChange={(e) => setFormData({ ...formData, enableCompanyPassword: e.target.checked })}
                      className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                      disabled={readOnly}
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
                        readOnly={readOnly}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={readOnly}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
   
            {/* Error Display */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              {activeTab !== tabs[0].id && (
                <Button
                  variant="outline"
                  onClick={handlePreviousTab}
                  icon={<ArrowLeft size={16} />}
                  disabled={loading}
                >
                  Previous
                </Button>
              )}
              {activeTab !== tabs[tabs.length - 1].id ? (
                <Button
                  onClick={handleNextTab}
                  icon={<ArrowRight size={16} />}
                  className="ml-auto"
                  disabled={loading}
                >
                  Next
                </Button>
              ) : (
                // Only show Save button if not in readOnly mode
                !readOnly && (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    icon={<Save size={16} />}
                    className="ml-auto"
                  >
                    {loading ? 'Saving...' : (companyToEdit ? 'Save Changes' : 'Create Company')}
                  </Button>
                )
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* AI Assistance Block (Floating Button) */}
      <div className="fixed right-4 bottom-4 z-50">
        <button
          onClick={() => setShowAIAssistant(!showAIAssistant)}
          className={`
            p-3 rounded-full shadow-lg transition-all duration-300
            ${showAIAssistant ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-[#5DBF99] to-[#7AD4B0] hover:from-[#4FB085] hover:to-[#6AC8A3]'}
            text-white flex items-center justify-center
          `}
          title="Toggle AI Assistant"
        >
          {showAIAssistant ? <X size={24} /> : <Bot size={24} />}
        </button>
      </div>

      {showAIAssistant && (
        <AIAssistant
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          context="company_setup"
          data={formData}
        />
      )}
    </div>
  );
}

export default CompanySetup;

