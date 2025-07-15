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
  Bot,
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

// Define the Company type based on your schema
interface Company {
  id: string;
  name: string;
  country: string;
  currency: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  timezone: string;
  logo?: string;
  tax_config: {
    type: 'GST' | 'VAT' | 'Custom';
    rates: number[];
    enabled: boolean;
    registrationNumber: string;
    gstDetails?: {
      pan?: string;
      tan?: string;
      registrationType?: string;
      filingFrequency?: string;
      tdsApplicable?: boolean;
      tcsApplicable?: boolean;
    };
    vatDetails?: {
      registrationNumber?: string;
      registrationType?: string;
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
  contact_info: {
    contactPersonName?: string;
    designation?: string;
    email?: string;
    mobile?: string;
    alternatePhone?: string;
    phoneCountry?: string;
  };
  settings: {
    displayName?: string;
    legalName?: string;
    industry?: string;
    businessType?: string;
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
    companyType?: string;
    employeeCount?: string;
    annualRevenue?: string;
    inventoryTracking?: boolean;
    companyUsername?: string; // Added companyUsername
  };
}

interface CompanySetupProps {
  companyToEdit?: Company; // Optional prop for editing existing company
  readOnly?: boolean; // Optional prop to make form read-only
  onSaveSuccess?: (message: string) => void; // Callback for successful save
  onSaveError?: (message: string) => void; // Callback for save error
  onCancel?: () => void; // Callback to cancel and go back (for edit mode)
}


function CompanySetup({ companyToEdit, readOnly, onSaveSuccess, onSaveError, onCancel }: CompanySetupProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { suggestWithAI } = useAI();
  const { refreshCompanies, switchCompany } = useCompany(); // <--- ADD switchCompany HERE
  const { showNotification } = useNotification();


  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPhoneCountryDropdown, setShowPhoneCountryDropdown] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const [activeTab, setActiveTab] = useState('company_info'); // Initial active tab

  const tabs = [
    { id: 'company_info', label: 'Company Info', icon: Briefcase },
    { id: 'contact', label: 'Contact', icon: User },
    { id: 'tax', label: 'Tax', icon: ReceiptText },
    { id: 'books', label: 'Books', icon: BookMarked },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  ];


  const [formData, setFormData] = useState<any>(() => {
    const currentYear = new Date().getFullYear();
    const defaultCountry = countries.find(c => c.id === 'IN')!; // Default to India

    // Calculate fiscal year start date based on country's fiscal year start month
    const fiscalYearStartMonth = defaultCountry.fiscalYearStartMonth;
    // Use Date.UTC to prevent timezone issues
    let fiscalYearStartDate = new Date(Date.UTC(currentYear, fiscalYearStartMonth, 1));
    // If current month is before fiscal year start month, use previous year
    if (new Date().getUTCMonth() < fiscalYearStartMonth) { // Use getUTCMonth for consistency
      fiscalYearStartDate = new Date(Date.UTC(currentYear - 1, fiscalYearStartMonth, 1));
    }

    // Calculate fiscal year end date (last day of the month before fiscalYearStartMonth in the next year)
    const fiscalYearEndDate = new Date(Date.UTC(fiscalYearStartDate.getUTCFullYear() + 1, fiscalYearStartDate.getUTCMonth(), 0));

    // Determine initial tax rates based on default country
    const initialTaxRates: { [key: string]: number[] } = {
      'IN': [0, 5, 12, 18, 28],
      'US': [0, 5, 8.5, 10],
      'AE': [0, 5],
      'SA': [0, 15], // Saudi Arabia VAT
      'QA': [0, 5], // Qatar VAT
      'KW': [0, 5], // Kuwait VAT
      'BH': [0, 10], // Bahrain VAT
      'OM': [0, 5], // Oman VAT
      'GB': [0, 5, 20],
      'CA': [0, 5, 13, 15],
      'AU': [0, 10],
      'DE': [0, 7, 19],
      'JP': [0, 10],
      'SG': [0, 9],
    };

    return {
      companyName: '',
      legalName: '',
      industry: industries[0].id,
      businessType: companyTypes[0].id,
      registrationNo: '',
      country: defaultCountry.id,
      state: '',
      city: '',
      addressLine1: '',
      addressLine2: '',
      zipCode: '',
      languagePreference: languages[0].id,
      companyLogo: null, // File object for upload
      timezone: defaultCountry.timezone,

      contactPersonName: '',
      designation: '',
      email: '',
      mobile: '',
      phoneCountry: defaultCountry.id, // Default to selected company country
      alternateContactNumber: '',

      taxSystem: defaultCountry.taxType,
      taxConfig: {
        enabled: true,
        rates: initialTaxRates[defaultCountry.id] || [0, 10, 20],
      },
      gstin: '',
      pan: '',
      tan: '',
      gstRegistrationType: gstRegistrationTypes[0].id,
      filingFrequency: filingFrequencies[0].id,
      tdsApplicable: false,
      tcsApplicable: false,
      trnVatNumber: '',
      vatRegistrationType: vatRegistrationTypes[0].id,
      filingCycle: filingCycles[0].id,

      booksStartDate: fiscalYearStartDate.toISOString().split('T')[0], // Same as fiscal year start
      fiscalYearStartDate: fiscalYearStartDate.toISOString().split('T')[0],
      fiscalYearEndDate: fiscalYearEndDate.toISOString().split('T')[0],
      defaultCurrency: defaultCountry.currency,
      decimalPlaces: 2,
      multiCurrencySupport: false,
      autoRounding: false,

      defaultLanguage: languages[0].id,
      dateFormat: dateFormats[0].id,
      enableBatchTracking: false,
      enableCostCenterAllocation: false,
      enableMultiUserAccess: false,
      companyPassword: '',
      enableCompanyPassword: false,
      enableBarcodeSupport: false,
      companyUsername: '', // Added companyUsername

      // Fields from old Business Configuration, now in Preferences
      companyType: companyTypes[0].id,
      inventoryTracking: true
    };
  });

  // Initialize form data from companyToEdit prop
  useEffect(() => {
    if (companyToEdit) {
      const selectedCountryData = countries.find(c => c.id === companyToEdit.country);

      // Safely parse fiscal_year_start
      let initialFiscalYearStartDate = companyToEdit.fiscal_year_start;
      let fiscalYearStartDateObj = new Date(initialFiscalYearStartDate);

      // Fallback if initialFiscalYearStartDate is invalid
      if (isNaN(fiscalYearStartDateObj.getTime())) {
        // Provide a sensible default, e.g., current year's fiscal start for the country
        const currentYear = new Date().getFullYear();
        const defaultCountry = countries.find(c => c.id === companyToEdit.country) || countries[0]; // Fallback to India if country not found
        const fiscalYearStartMonth = defaultCountry.fiscalYearStartMonth;
        fiscalYearStartDateObj = new Date(Date.UTC(currentYear, fiscalYearStartMonth, 1)); // Use Date.UTC
        if (new Date().getUTCMonth() < fiscalYearStartMonth) { // Use getUTCMonth
          fiscalYearStartDateObj = new Date(Date.UTC(currentYear - 1, fiscalYearStartMonth, 1)); // Use Date.UTC
        }
        initialFiscalYearStartDate = fiscalYearStartDateObj.toISOString().split('T')[0];
      }

      // Calculate fiscal year end date based on the *valid* fiscalYearStartDateObj
      const fiscalYearEndDateObj = new Date(Date.UTC(fiscalYearStartDateObj.getUTCFullYear() + 1, fiscalYearStartDateObj.getUTCMonth(), 0)); // Use Date.UTC and getUTCMonth
      
      setFormData({
        companyName: companyToEdit.name || '',
        legalName: companyToEdit.settings?.legalName || '',
        industry: companyToEdit.settings?.industry || industries[0].id,
        businessType: companyToEdit.settings?.businessType || companyTypes[0].id,
        registrationNo: companyToEdit.settings?.registrationNo || '',
        country: companyToEdit.country || countries[0].id,
        state: companyToEdit.address?.state || '',
        city: companyToEdit.address?.city || '',
        addressLine1: companyToEdit.address?.street1 || '',
        addressLine2: companyToEdit.address?.street2 || '',
        zipCode: companyToEdit.address?.zipCode || '',
        languagePreference: companyToEdit.settings?.languagePreference || languages[0].id,
        companyLogo: companyToEdit.logo || null,
        timezone: companyToEdit.timezone || (selectedCountryData ? selectedCountryData.timezone : countries[0].timezone),

        contactPersonName: companyToEdit.contact_info?.contactPersonName || '',
        designation: companyToEdit.contact_info?.designation || '',
        email: companyToEdit.contact_info?.email || '',
        mobile: companyToEdit.contact_info?.mobile || '',
        phoneCountry: companyToEdit.contact_info?.phoneCountry || companyToEdit.country || countries[0].id,
        alternateContactNumber: '',

        taxSystem: companyToEdit.tax_config?.type || (selectedCountryData ? selectedCountryData.taxType : countries[0].taxType),
        taxConfig: {
          enabled: companyToEdit.tax_config?.enabled ?? true,
          rates: companyToEdit.tax_config?.rates || [],
        },
        gstin: companyToEdit.tax_config?.gstDetails?.registrationNumber || '',
        pan: companyToEdit.tax_config?.gstDetails?.pan || '',
        tan: companyToEdit.tax_config?.gstDetails?.tan || '',
        gstRegistrationType: companyToEdit.tax_config?.gstDetails?.registrationType || gstRegistrationTypes[0].id,
        filingFrequency: companyToEdit.tax_config?.gstDetails?.filingFrequency || filingFrequencies[0].id,
        tdsApplicable: companyToEdit.tax_config?.gstDetails?.tdsApplicable ?? false,
        tcsApplicable: companyToEdit.tax_config?.gstDetails?.tcsApplicable ?? false,
        trnVatNumber: companyToEdit.tax_config?.vatDetails?.registrationNumber || '',
        vatRegistrationType: companyToEdit.tax_config?.vatDetails?.registrationType || vatRegistrationTypes[0].id,
        filingCycle: companyToEdit.tax_config?.vatDetails?.filingCycle || filingCycles[0].id,

        booksStartDate: initialFiscalYearStartDate, // Use the validated/defaulted date
        fiscalYearStartDate: initialFiscalYearStartDate, // Use the validated/defaulted date
        fiscalYearEndDate: fiscalYearEndDateObj.toISOString().split('T')[0], // Use the calculated valid date
        defaultCurrency: companyToEdit.currency || currencies[0].id,
        decimalPlaces: companyToEdit.settings?.decimalPlaces ?? 2,
        multiCurrencySupport: companyToEdit.settings?.multiCurrencySupport ?? false,
        autoRounding: companyToEdit.settings?.autoRounding ?? false,

        dateFormat: companyToEdit.settings?.dateFormat || dateFormats[0].id,
        enableBatchTracking: companyToEdit.settings?.batchTracking ?? false,
        enableCostCenterAllocation: companyToEdit.settings?.costCenterAllocation ?? false,
        enableMultiUserAccess: companyToEdit.settings?.multiUserAccess ?? false,
        companyPassword: companyToEdit.settings?.password || '',
        enableCompanyPassword: companyToEdit.settings?.enablePassword ?? false,
        enableBarcodeSupport: companyToEdit.settings?.barcodeSupport ?? false,
        companyUsername: companyToEdit.settings?.companyUsername || '', // Added companyUsername

        companyType: companyToEdit.settings?.companyType || companyTypes[0].id,
        inventoryTracking: true
      });
      setLogoFile(null); // Clear logo file for existing company, only set if new upload
      setErrors({}); // Clear errors when loading new company
      setActiveTab('company_info'); // Reset to first tab
    } else {
      // Reset to default for new company creation
      const currentYear = new Date().getFullYear();
      const defaultCountry = countries.find(c => c.id === 'IN')!;
      const fiscalYearStartMonth = defaultCountry.fiscalYearStartMonth;
      let fiscalYearStartDate = new Date(Date.UTC(currentYear, fiscalYearStartMonth, 1)); // Use Date.UTC
      if (new Date().getUTCMonth() < fiscalYearStartMonth) { // Use getUTCMonth
        fiscalYearStartDate = new Date(Date.UTC(currentYear - 1, fiscalYearStartMonth, 1)); // Use Date.UTC
      }
      const fiscalYearEndDate = new Date(Date.UTC(fiscalYearStartDate.getUTCFullYear() + 1, fiscalYearStartDate.getUTCMonth(), 0)); // Use Date.UTC and getUTCMonth

      setFormData({
        companyName: '', legalName: '', industry: industries[0].id, businessType: companyTypes[0].id,
        registrationNo: '', country: defaultCountry.id, state: '', city: '', addressLine1: '', addressLine2: '', zipCode: '',
        languagePreference: languages[0].id, companyLogo: null, timezone: defaultCountry.timezone,
        contactPersonName: '', designation: '', email: '', mobile: '', phoneCountry: defaultCountry.id, alternateContactNumber: '',
        taxSystem: defaultCountry.taxType, taxConfig: { enabled: true, rates: [] }, // Rates will be set by country effect
        gstin: '', pan: '', tan: '', gstRegistrationType: gstRegistrationTypes[0].id, filingFrequency: filingFrequencies[0].id,
        tdsApplicable: false, tcsApplicable: false, trnVatNumber: '', vatRegistrationType: vatRegistrationTypes[0].id, filingCycle: filingCycles[0].id,
        booksStartDate: fiscalYearStartDate.toISOString().split('T')[0], fiscalYearStartDate: fiscalYearStartDate.toISOString().split('T')[0],
        fiscalYearEndDate: fiscalYearEndDate.toISOString().split('T')[0], defaultCurrency: defaultCountry.currency, decimalPlaces: 2,
        multiCurrencySupport: false, autoRounding: false, dateFormat: dateFormats[0].id, enableBatchTracking: false,
        enableCostCenterAllocation: false, enableMultiUserAccess: false, companyPassword: '',
        enableCompanyPassword: false, enableBarcodeSupport: false, companyUsername: '',
        companyType: companyTypes[0].id, inventoryTracking: true
      });
      setLogoFile(null); // Clear logo file for new company
      setErrors({}); // Clear errors for new company
      setActiveTab('company_info'); // Reset to first tab
    }
  }, [companyToEdit]); // Re-run when companyToEdit changes


  // Auto-calculate fiscal year end date and update tax rates based on country
  useEffect(() => {
    const selectedCountryData = countries.find(c => c.id === formData.country);
    if (selectedCountryData) {
      const currentYear = new Date().getFullYear();
      const fiscalYearStartMonth = selectedCountryData.fiscalYearStartMonth;

      let fiscalYearStartDateObj = new Date(Date.UTC(currentYear, fiscalYearStartMonth, 1)); // Use Date.UTC
      // If current month is before fiscal year start month, use previous year
      if (new Date().getUTCMonth() < fiscalYearStartMonth) { // Use getUTCMonth
        fiscalYearStartDateObj = new Date(Date.UTC(currentYear - 1, fiscalYearStartMonth, 1)); // Use Date.UTC
      }

      const fiscalYearEndDateObj = new Date(Date.UTC(fiscalYearStartDateObj.getUTCFullYear() + 1, fiscalYearStartDateObj.getUTCMonth(), 0)); // Use Date.UTC and getUTCMonth

      // Log the calculated dates for debugging
      console.log('Calculated Fiscal Year Start Date:', fiscalYearStartDateObj.toISOString().split('T')[0]);
      console.log('Calculated Fiscal Year End Date:', fiscalYearEndDateObj.toISOString().split('T')[0]);
      console.log('Calculated Books Start Date:', fiscalYearStartDateObj.toISOString().split('T')[0]);


      setFormData((prev: any) => ({
        ...prev,
        timezone: selectedCountryData.timezone,
        defaultCurrency: selectedCountryData.currency,
        taxSystem: selectedCountryData.taxType,
        fiscalYearStartDate: fiscalYearStartDateObj.toISOString().split('T')[0], // This is the start date
        fiscalYearEndDate: fiscalYearEndDateObj.toISOString().split('T')[0], // This is the end date
        booksStartDate: fiscalYearStartDateObj.toISOString().split('T')[0], // This is the books start date
        phoneCountry: selectedCountryData.id, // Auto-update phone country code
        // Reset state if country changes and previous state is not valid for new country
        state: selectedCountryData.states.includes(prev.state) ? prev.state : '',
      }));

      // Update tax rates based on country
      const taxRates: { [key: string]: number[] } = {
        'IN': [0, 5, 12, 18, 28], // GST rates
        'AU': [0, 10], // GST rates
        'GB': [0, 5, 20], // VAT rates
        'DE': [0, 7, 19], // VAT rates
        'US': [0, 5, 8.5, 10], // Sales tax varies by state
        'CA': [0, 5, 13, 15], // GST/HST rates
        'AE': [0, 5], // UAE VAT
        'SA': [0, 15], // Saudi Arabia VAT
        'QA': [0, 5], // Qatar VAT
        'KW': [0, 5], // Kuwait VAT
        'BH': [0, 10], // Bahrain VAT
        'OM': [0, 5], // Oman VAT
        'JP': [0, 10], // Japan Consumption Tax
        'SG': [0, 9], // Singapore GST
      };

      setFormData((prev: any) => ({
        ...prev,
        taxConfig: {
          ...prev.taxConfig,
          rates: taxRates[selectedCountryData.id] || [0, 10, 20], // Default if not found
        },
      }));
    }
  }, [formData.country]); // Re-run when country changes

  // Update booksStartDate if fiscalYearStartDate is manually changed
  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      booksStartDate: prev.fiscalYearStartDate,
    }));
  }, [formData.fiscalYearStartDate]);


  const validateForm = (data: any, currentTabId: string): Record<string, string> => {
    let newErrors: Record<string, string> = {};

    // Company Info Tab Validation
    if (currentTabId === 'company_info') {
      if (!data.companyName.trim()) newErrors.companyName = 'Company Name is required';
      if (!data.industry) newErrors.industry = 'Industry is required';
      if (!data.businessType) newErrors.businessType = 'Business Type is required';
      if (!data.country) newErrors.country = 'Country is required';
      if (!data.state.trim()) newErrors.state = 'State/Province is required';
      if (!data.addressLine1.trim()) newErrors.addressLine1 = 'Address Line 1 is required';
    }

    // Contact Tab Validation
    if (currentTabId === 'contact') {
      if (!data.contactPersonName.trim()) newErrors.contactPersonName = 'Contact Person Name is required';
      if (data.email.trim() && !/\S+@\S+\.\S+/.test(data.email)) {
        newErrors.email = 'Invalid email address';
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

    // Books Tab Validation
    if (currentTabId === 'books') {
      if (!data.booksStartDate) newErrors.booksStartDate = 'Books Start Date is required';
      if (!data.fiscalYearStartDate) newErrors.fiscalYearStartDate = 'Financial Year Start Date is required';
      if (!data.defaultCurrency) newErrors.defaultCurrency = 'Default Currency is required';
      if (data.decimalPlaces === null) newErrors.decimalPlaces = 'Decimal Places is required';
    }

    // Preferences Tab Validation
    if (currentTabId === 'preferences') {
      if (!data.languagePreference) newErrors.languagePreference = 'Language Preference is required';
      if (!data.dateFormat) newErrors.dateFormat = 'Date Format is required';
      if (data.enableCompanyPassword) { // Only validate password and username if security is enabled
        if (!data.companyUsername.trim()) newErrors.companyUsername = 'Company Username is required if security is enabled';
        if (!data.companyPassword.trim()) newErrors.companyPassword = 'Company Password is required if security is enabled';
      }
      if (!data.companyType) newErrors.companyType = 'Company Type is required';
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
      // Check application's authentication state first
      console.log("handleSubmit: isAuthenticated from useAuth =", isAuthenticated); // This line should now work
      console.log("handleSubmit: User from useAuth =", user); // This line should now work

      if (!isAuthenticated || !user) { // This condition should now work
        throw new Error('Application authentication failed. Please log in again.');
      }

      // Explicitly get the current user from Supabase Auth (redundant if useAuth is reliable, but good for debugging)
      const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authenticatedUser) {
        throw new Error('Supabase authentication failed. Please log in again.');
      }

      console.log("Supabase authenticated user ID:", authenticatedUser.id);


    let logoUrl = formData.companyLogo;
    if (logoFile) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company_logos')
        .upload(`${formData.companyName.replace(/\s/g, '_').toLowerCase()}_${Date.now()}`, logoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        throw new Error('Failed to upload company logo.');
      }
      logoUrl = `${supabase.storage.from('company_logos').getPublicUrl(uploadData.path).data.publicUrl}`;
    }

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
          registrationNumber: formData.trnVatNumber,
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
        enablePassword: formData.enableCompanyPassword,
        password: formData.enableCompanyPassword ? formData.companyPassword : null,
        barcodeSupport: formData.enableBarcodeSupport,
        companyUsername: formData.companyUsername,
        companyType: formData.companyType,
        inventoryTracking: formData.inventoryTracking,
      },
      created_by: authenticatedUser.id, // This is correctly placed
    };

    let result;
    if (companyToEdit) {
      const { data, error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', companyToEdit.id)
        .select()
        .single();
      result = { data, error };
    } else {
      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();
      result = { data, error };
    }

    if (result.error) {
      console.error('Error saving company:', result.error);
      throw new Error('Failed to save company record: ' + result.error.message);
    }

    // Create default period for the new company (only for creation)
    if (!companyToEdit && result.data?.id) {
      const { error: periodError } = await supabase
        .from('periods')
        .insert({
          company_id: result.data.id,
          name: `FY ${new Date(formData.fiscalYearStartDate).getFullYear()}-${new Date(formData.fiscalYearEndDate).getFullYear()}`,
          start_date: formData.fiscalYearStartDate,
          end_date: formData.fiscalYearEndDate,
          is_active: true,
          period_type: 'fiscal_year'
        });

      if (periodError) {
        console.error('Error creating default period:', periodError);
      }

      // --- MODIFIED BLOCK FOR NEW COMPANY CREATION ---
      // Link the user to the newly created company in 'users_companies'
      // Omitting role_id as it's nullable and not explicitly managed by user
      const { error: userCompanyLinkError } = await supabase
        .from('users_companies')
        .insert({
          user_id: authenticatedUser.id,
          company_id: result.data.id,
          is_active: true,
        });

      if (userCompanyLinkError) {
        console.error('Error linking user to company:', userCompanyLinkError);
        throw new Error(`Failed to link user to company: ${userCompanyLinkError.message}`);
      }
      // --- END OF MODIFIED BLOCK ---

      switchCompany(result.data.id); // Explicitly set the newly created company as current
      showNotification('Company created successfully!', 'success');
      onSaveSuccess?.('Company created successfully!');
      navigate('/'); // Navigate to dashboard after setting current company
    } else if (companyToEdit) { // For existing company updates
      showNotification('Company settings updated successfully!', 'success');
      onSaveSuccess?.('Company settings updated successfully!');
      // No navigation needed here, user stays on settings page
    }
  } catch (err: any) {
      setErrors({ submit: err.message || 'An unexpected error occurred.' });
      showNotification(err.message || 'An unexpected error occurred.', 'error');
      onSaveError?.(err.message || 'An unexpected error occurred during save.');
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };



  const selectedCountry = countries.find(c => c.id === formData.country);
  const selectedPhoneCountry = countries.find(c => c.id === formData.phoneCountry);
  const availableStates = selectedCountry?.states || [];

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
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                      ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                    `}
                    disabled={readOnly}
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
                      ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                    `}
                    disabled={readOnly}
                  >
                    {companyTypes.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  {errors.businessType && <p className="mt-2 text-sm text-red-500">{errors.businessType}</p>}
                </div>
                <FormField
                  label="Registration No."
                  value={formData.registrationNo}
                  onChange={(val) => setFormData({ ...formData, registrationNo: val })}
                  icon={<FileText size={18} className="text-gray-400" />}
                  readOnly={readOnly}
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
                      ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                    `}
                    disabled={readOnly}
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
                    placeholder="Street address, P.O. Box"
                    required
                    error={errors.addressLine1}
                    icon={<MapPin size={18} className="text-gray-400" />}
                    readOnly={readOnly}
                  />
                </div>
                <FormField
                  label="Address Line 2"
                  value={formData.addressLine2}
                  onChange={(val) => setFormData({ ...formData, addressLine2: val })}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  icon={<MapPin size={18} className="text-gray-400" />}
                  readOnly={readOnly}
                />
                <FormField
                  label="City"
                  value={formData.city}
                  onChange={(val) => setFormData({ ...formData, city: val })}
                  placeholder="City"
                  error={errors.city}
                  readOnly={readOnly}
                />
                <FormField
                  label="PIN/ZIP Code"
                  value={formData.zipCode}
                  onChange={(val) => setFormData({ ...formData, zipCode: val })}
                  placeholder="ZIP or Postal Code"
                  error={errors.zipCode}
                  readOnly={readOnly}
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
                  readOnly={readOnly}
                />
                <FormField
                  label="Designation"
                  value={formData.designation}
                  onChange={(val) => setFormData({ ...formData, designation: val })}
                  error={errors.designation}
                  readOnly={readOnly}
                />
                <FormField
                  label="Email Address"
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
                    Mobile Number
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
                        readOnly={readOnly}
                        className={`
                          w-full pl-10 pr-3 py-2 border ${theme.inputBorder}
                          ${theme.borderRadius} rounded-l-none border-l-0 h-full
                          ${theme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                        `}
                      />
                    </div>
                  </div>
                  {errors.mobile && <p className="mt-2 text-sm text-red-500">{errors.mobile}</p>}
                </div>
                <FormField
                  label="Alternate Contact Number"
                  value={formData.alternateContactNumber}
                  onChange={(val) => setFormData({ ...formData, alternateContactNumber: val })}
                  icon={<Phone size={18} className="text-gray-400" />}
                  readOnly={readOnly}
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
                        readOnly={readOnly}
                      />
                      <FormField
                        label="TAN"
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
                            ${theme.inputBg} ${theme.textPrimary}
                            focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                            ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                          `}
                          disabled={readOnly}
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
                            ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                          `}
                          disabled={readOnly}
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
                            ${theme.inputBg} ${theme.textPrimary}
                            focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                            ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                          `}
                          disabled={readOnly}
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
                            ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                          `}
                          disabled={readOnly}
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
                      ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                    `}
                    disabled={readOnly}
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
                      ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                    `}
                    disabled={readOnly}
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
                      ${readOnly ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}
                    `}
                    disabled={readOnly}
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
                    checked={formData.enableCostCenterAllocation}
                    onChange={(e) => setFormData({ ...formData, enableCostCenterAllocation: e.target.checked })}
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
                    Enable Security
                  </label>
                </div>
                {formData.enableCompanyPassword && (
                  <>
                    <FormField
                      label="Company Username"
                      value={formData.companyUsername}
                      onChange={(val) => setFormData({ ...formData, companyUsername: val })}
                      placeholder="Enter a username for this company"
                      required
                      error={errors.companyUsername}
                      icon={<User size={18} className="text-gray-400" />}
                      readOnly={readOnly}
                    />
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
                        className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={readOnly}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </>
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