import React, { useState, useEffect } from 'react';
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
  Coins
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase';

interface CompanyFormData {
  name: string;
  displayName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  currency: string;
  decimalPlaces: number;
  taxConfig: {
    type: 'GST' | 'VAT' | 'Custom';
    enabled: boolean;
    registrationNumber: string;
    rates: number[];
  };
  panNumber: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  bookStartDate: string;
  logo: string | null;
  enablePassword: boolean;
  password: string;
  language: string;
  timezone: string;
}

const countries = [
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', taxType: 'GST', timezone: 'Asia/Kolkata' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', taxType: 'Custom', timezone: 'America/New_York' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', taxType: 'VAT', timezone: 'Europe/London' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', taxType: 'Custom', timezone: 'America/Toronto' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', taxType: 'GST', timezone: 'Australia/Sydney' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', taxType: 'VAT', timezone: 'Europe/Berlin' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', taxType: 'VAT', timezone: 'Europe/Paris' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', taxType: 'Custom', timezone: 'Asia/Tokyo' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', taxType: 'GST', timezone: 'Asia/Singapore' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED', taxType: 'VAT', timezone: 'Asia/Dubai' },
];

const currencies = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
];

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
];

function CompanySetup() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { suggestWithAI } = useAI();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    displayName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'IN',
      zipCode: ''
    },
    currency: 'INR',
    decimalPlaces: 2,
    taxConfig: {
      type: 'GST',
      enabled: true,
      registrationNumber: '',
      rates: [0, 5, 12, 18, 28]
    },
    panNumber: '',
    fiscalYearStart: '2024-04-01',
    fiscalYearEnd: '2025-03-31',
    bookStartDate: '2024-04-01',
    logo: null,
    enablePassword: false,
    password: '',
    language: 'en',
    timezone: 'Asia/Kolkata'
  });

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CompanyFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCountryChange = async (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      updateFormData('address.country', countryCode);
      updateFormData('currency', country.currency);
      updateFormData('timezone', country.timezone);
      updateFormData('taxConfig.type', country.taxType);
      
      // Auto-suggest fiscal year based on country
      if (countryCode === 'IN') {
        updateFormData('fiscalYearStart', '2024-04-01');
        updateFormData('fiscalYearEnd', '2025-03-31');
      } else if (countryCode === 'US') {
        updateFormData('fiscalYearStart', '2024-01-01');
        updateFormData('fiscalYearEnd', '2024-12-31');
      } else {
        updateFormData('fiscalYearStart', '2024-01-01');
        updateFormData('fiscalYearEnd', '2024-12-31');
      }

      // AI suggestion for tax rates
      try {
        const suggestion = await suggestWithAI({
          type: 'tax_rates',
          country: countryCode,
          taxType: country.taxType
        });
        
        if (suggestion?.taxRates) {
          updateFormData('taxConfig.rates', suggestion.taxRates);
        }
      } catch (error) {
        console.error('AI suggestion error:', error);
      }
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        updateFormData('logo', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Company name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.address.street.trim()) newErrors['address.street'] = 'Address is required';
      if (!formData.address.city.trim()) newErrors['address.city'] = 'City is required';
    }

    if (step === 2) {
      if (!formData.currency) newErrors.currency = 'Currency is required';
      if (formData.taxConfig.enabled && !formData.taxConfig.registrationNumber.trim()) {
        newErrors['taxConfig.registrationNumber'] = 'Tax registration number is required';
      }
    }

    if (step === 3) {
      if (!formData.fiscalYearStart) newErrors.fiscalYearStart = 'Fiscal year start is required';
      if (!formData.fiscalYearEnd) newErrors.fiscalYearEnd = 'Fiscal year end is required';
      if (formData.enablePassword && !formData.password.trim()) {
        newErrors.password = 'Password is required when enabled';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      // Create company in database
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.name,
          country: formData.address.country,
          currency: formData.currency,
          fiscal_year_start: formData.fiscalYearStart,
          fiscal_year_end: formData.fiscalYearEnd,
          timezone: formData.timezone,
          logo: formData.logo,
          tax_config: formData.taxConfig,
          address: formData.address,
          contact_info: {
            email: formData.email,
            phone: formData.phone
          },
          settings: {
            displayName: formData.displayName,
            decimalPlaces: formData.decimalPlaces,
            language: formData.language,
            enablePassword: formData.enablePassword,
            password: formData.enablePassword ? formData.password : null // In production, hash this
          }
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create user-company relationship
      const { error: userCompanyError } = await supabase
        .from('users_companies')
        .insert({
          user_id: user?.id,
          company_id: company.id,
          is_active: true
        });

      if (userCompanyError) throw userCompanyError;

      // Create default period
      const { error: periodError } = await supabase
        .from('periods')
        .insert({
          company_id: company.id,
          name: `FY ${new Date(formData.fiscalYearStart).getFullYear()}-${new Date(formData.fiscalYearEnd).getFullYear()}`,
          start_date: formData.fiscalYearStart,
          end_date: formData.fiscalYearEnd,
          is_active: true,
          period_type: 'fiscal_year'
        });

      if (periodError) throw periodError;

      // Navigate to dashboard
      navigate('/');
      
    } catch (error) {
      console.error('Error creating company:', error);
      setErrors({ submit: 'Failed to create company. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Details', icon: Building },
    { number: 2, title: 'Compliance & Settings', icon: Settings },
    { number: 3, title: 'Financial Year', icon: Calendar }
  ];

  const selectedCountry = countries.find(c => c.code === formData.address.country);
  const selectedCurrency = currencies.find(c => c.code === formData.currency);

  return (
    <div className={`min-h-screen ${theme.panelBg} py-8`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
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

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-lg` 
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : `${theme.inputBg} ${theme.textMuted} border-2 ${theme.borderColor}`
                    }
                  `}>
                    <Icon size={20} />
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-medium ${isActive ? theme.textPrimary : theme.textMuted}`}>
                      Step {step.number}
                    </p>
                    <p className={`text-xs ${theme.textMuted}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-8 h-0.5 mx-4 transition-colors duration-300
                      ${isCompleted ? 'bg-green-500' : theme.borderColor}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="p-8">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${theme.textPrimary} flex items-center`}>
                  <Building size={24} className="mr-3 text-[#6AC8A3]" />
                  Basic Company Details
                </h2>
                <AIButton variant="suggest" onSuggest={() => console.log('AI Company Suggestions')} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Company Name"
                  value={formData.name}
                  onChange={(value) => updateFormData('name', value)}
                  placeholder="Enter your company name"
                  required
                  error={errors.name}
                  icon={<Building size={18} className="text-gray-400" />}
                  aiHelper={true}
                  context="company_name"
                />

                <FormField
                  label="Display Name"
                  value={formData.displayName}
                  onChange={(value) => updateFormData('displayName', value)}
                  placeholder="Short name for display"
                  icon={<Building size={18} className="text-gray-400" />}
                />

                <FormField
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(value) => updateFormData('email', value)}
                  placeholder="company@example.com"
                  required
                  error={errors.email}
                  icon={<Mail size={18} className="text-gray-400" />}
                />

                <FormField
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(value) => updateFormData('phone', value)}
                  placeholder="+1 234 567 8900"
                  icon={<Phone size={18} className="text-gray-400" />}
                />
              </div>

              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                  <MapPin size={20} className="mr-2 text-[#6AC8A3]" />
                  Business Address
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      label="Street Address"
                      value={formData.address.street}
                      onChange={(value) => updateFormData('address.street', value)}
                      placeholder="Enter your business address"
                      required
                      error={errors['address.street']}
                      icon={<MapPin size={18} className="text-gray-400" />}
                    />
                  </div>

                  <FormField
                    label="City"
                    value={formData.address.city}
                    onChange={(value) => updateFormData('address.city', value)}
                    placeholder="City"
                    required
                    error={errors['address.city']}
                  />

                  <FormField
                    label="State/Province"
                    value={formData.address.state}
                    onChange={(value) => updateFormData('address.state', value)}
                    placeholder="State or Province"
                  />

                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.address.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className={`
                        w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                        ${theme.inputBg} ${theme.textPrimary}
                        focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                      `}
                    >
                      {countries.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <FormField
                    label="ZIP/Postal Code"
                    value={formData.address.zipCode}
                    onChange={(value) => updateFormData('address.zipCode', value)}
                    placeholder="ZIP or Postal Code"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                  <Globe size={20} className="mr-2 text-[#6AC8A3]" />
                  Localization
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => updateFormData('language', e.target.value)}
                      className={`
                        w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                        ${theme.inputBg} ${theme.textPrimary}
                        focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                      `}
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                      Timezone
                    </label>
                    <div className={`
                      px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                    `}>
                      {formData.timezone}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Compliance & Settings */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${theme.textPrimary} flex items-center`}>
                  <Settings size={24} className="mr-3 text-[#6AC8A3]" />
                  Compliance & Settings
                </h2>
                <AIButton variant="suggest" onSuggest={() => console.log('AI Compliance Suggestions')} />
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                    <Coins size={20} className="mr-2 text-[#6AC8A3]" />
                    Currency & Formatting
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                        Base Currency <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => updateFormData('currency', e.target.value)}
                        className={`
                          w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                          ${theme.inputBg} ${theme.textPrimary}
                          focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                        `}
                      >
                        {currencies.map(currency => (
                          <option key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.name} ({currency.code})
                          </option>
                        ))}
                      </select>
                      {selectedCurrency && (
                        <p className="text-xs text-gray-500">
                          Symbol: {selectedCurrency.symbol}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                        Decimal Places
                      </label>
                      <select
                        value={formData.decimalPlaces}
                        onChange={(e) => updateFormData('decimalPlaces', parseInt(e.target.value))}
                        className={`
                          w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                          ${theme.inputBg} ${theme.textPrimary}
                          focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                        `}
                      >
                        <option value={0}>0 (1,234)</option>
                        <option value={1}>1 (1,234.5)</option>
                        <option value={2}>2 (1,234.56)</option>
                        <option value={3}>3 (1,234.567)</option>
                        <option value={4}>4 (1,234.5678)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                    <Shield size={20} className="mr-2 text-[#6AC8A3]" />
                    Tax Configuration
                  </h3>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="taxEnabled"
                      checked={formData.taxConfig.enabled}
                      onChange={(e) => updateFormData('taxConfig.enabled', e.target.checked)}
                      className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                    />
                    <label htmlFor="taxEnabled" className={`text-sm font-medium ${theme.textPrimary}`}>
                      Enable {formData.taxConfig.type} / Tax Management
                    </label>
                  </div>

                  {formData.taxConfig.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                      <div className="space-y-2">
                        <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                          Tax Type
                        </label>
                        <div className={`
                          px-3 py-2 border ${theme.inputBorder} rounded-lg
                          ${theme.inputBg} ${theme.textPrimary}
                        `}>
                          {formData.taxConfig.type} ({selectedCountry?.name})
                        </div>
                      </div>

                      <FormField
                        label={`${formData.taxConfig.type} Registration Number`}
                        value={formData.taxConfig.registrationNumber}
                        onChange={(value) => updateFormData('taxConfig.registrationNumber', value)}
                        placeholder={formData.taxConfig.type === 'GST' ? '22AAAAA0000A1Z5' : 'Tax Registration Number'}
                        required={formData.taxConfig.enabled}
                        error={errors['taxConfig.registrationNumber']}
                        icon={<CreditCard size={18} className="text-gray-400" />}
                        aiHelper={true}
                        context="tax_registration"
                      />

                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                          Tax Rates (%)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {formData.taxConfig.rates.map((rate, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-[#6AC8A3] text-white rounded-full text-sm"
                            >
                              {rate}%
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Auto-configured based on {selectedCountry?.name} tax system
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                    <CreditCard size={20} className="mr-2 text-[#6AC8A3]" />
                    Additional Registration Numbers
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label={formData.address.country === 'IN' ? 'PAN Number' : 'Tax ID Number'}
                      value={formData.panNumber}
                      onChange={(value) => updateFormData('panNumber', value)}
                      placeholder={formData.address.country === 'IN' ? 'AAAAA0000A' : 'Tax ID Number'}
                      icon={<CreditCard size={18} className="text-gray-400" />}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                    <Upload size={20} className="mr-2 text-[#6AC8A3]" />
                    Company Logo
                  </h3>

                  <div className="flex items-center space-x-4">
                    {formData.logo && (
                      <img
                        src={formData.logo}
                        alt="Company Logo"
                        className="w-16 h-16 object-contain border border-gray-300 rounded-lg"
                      />
                    )}
                    <div>
                      <input
                        type="file"
                        id="logo"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="logo"
                        className={`
                          inline-flex items-center px-4 py-2 border ${theme.borderColor} rounded-lg
                          ${theme.inputBg} ${theme.textPrimary} cursor-pointer
                          hover:bg-[#6AC8A3] hover:text-white transition-colors
                        `}
                      >
                        <Upload size={16} className="mr-2" />
                        Upload Logo
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG up to 2MB. Recommended: 200x200px
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Financial Year */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${theme.textPrimary} flex items-center`}>
                  <Calendar size={24} className="mr-3 text-[#6AC8A3]" />
                  Financial Year & Security
                </h2>
                <AIButton variant="suggest" onSuggest={() => console.log('AI Financial Year Suggestions')} />
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                    <Calendar size={20} className="mr-2 text-[#6AC8A3]" />
                    Financial Year Configuration
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      label="Book Start Date"
                      type="date"
                      value={formData.bookStartDate}
                      onChange={(value) => updateFormData('bookStartDate', value)}
                      required
                      icon={<Calendar size={18} className="text-gray-400" />}
                    />

                    <FormField
                      label="Financial Year Start"
                      type="date"
                      value={formData.fiscalYearStart}
                      onChange={(value) => updateFormData('fiscalYearStart', value)}
                      required
                      error={errors.fiscalYearStart}
                      icon={<Calendar size={18} className="text-gray-400" />}
                    />

                    <FormField
                      label="Financial Year End"
                      type="date"
                      value={formData.fiscalYearEnd}
                      onChange={(value) => updateFormData('fiscalYearEnd', value)}
                      required
                      error={errors.fiscalYearEnd}
                      icon={<Calendar size={18} className="text-gray-400" />}
                    />
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Financial Year Information</h4>
                    <p className="text-sm text-blue-700">
                      Based on your country ({selectedCountry?.name}), we've auto-configured your financial year.
                      You can modify these dates if your business follows a different fiscal calendar.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                    <Lock size={20} className="mr-2 text-[#6AC8A3]" />
                    Company Security (Optional)
                  </h3>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="enablePassword"
                      checked={formData.enablePassword}
                      onChange={(e) => updateFormData('enablePassword', e.target.checked)}
                      className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                    />
                    <label htmlFor="enablePassword" className={`text-sm font-medium ${theme.textPrimary}`}>
                      Enable password protection for this company
                    </label>
                  </div>

                  {formData.enablePassword && (
                    <div className="pl-7 space-y-4">
                      <div className="max-w-md">
                        <div className="relative">
                          <FormField
                            label="Company Password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(value) => updateFormData('password', value)}
                            placeholder="Enter a secure password"
                            required={formData.enablePassword}
                            error={errors.password}
                            icon={<Lock size={18} className="text-gray-400" />}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">Security Notice</h4>
                        <p className="text-sm text-yellow-700">
                          When enabled, users will need to enter this password each time they access this company's data.
                          Make sure to share this password securely with authorized team members.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
                    Summary
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Company Name</p>
                      <p className="text-gray-900">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Country</p>
                      <p className="text-gray-900">{selectedCountry?.flag} {selectedCountry?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Currency</p>
                      <p className="text-gray-900">{selectedCurrency?.symbol} {selectedCurrency?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tax System</p>
                      <p className="text-gray-900">{formData.taxConfig.type} {formData.taxConfig.enabled ? '(Enabled)' : '(Disabled)'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Financial Year</p>
                      <p className="text-gray-900">
                        {new Date(formData.fiscalYearStart).toLocaleDateString()} - {new Date(formData.fiscalYearEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Security</p>
                      <p className="text-gray-900">{formData.enablePassword ? 'Password Protected' : 'Open Access'}</p>
                    </div>
                  </div>
                </div>
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
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            <div className="flex space-x-3">
              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  icon={<ArrowRight size={16} />}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  icon={<Save size={16} />}
                >
                  {loading ? 'Creating Company...' : 'Create Company'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default CompanySetup;