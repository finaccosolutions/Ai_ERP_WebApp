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
  EyeOff
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import PeriodManager from '../../components/Company/PeriodManager';

function CompanySettings() {
  const { currentCompany, refreshCompanies } = useCompany();
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    currency: '',
    decimalPlaces: 2,
    taxConfig: {
      type: 'GST' as 'GST' | 'VAT' | 'Custom',
      enabled: true,
      registrationNumber: '',
      rates: [0, 5, 12, 18, 28]
    },
    enablePassword: false,
    password: '',
    language: 'en',
    timezone: ''
  });

  useEffect(() => {
    if (currentCompany) {
      setFormData({
        name: currentCompany.name,
        displayName: currentCompany.settings?.displayName || '',
        email: currentCompany.contactInfo?.email || '',
        phone: currentCompany.contactInfo?.phone || '',
        address: currentCompany.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        },
        currency: currentCompany.currency,
        decimalPlaces: currentCompany.settings?.decimalPlaces || 2,
        taxConfig: currentCompany.taxConfig || {
          type: 'GST',
          enabled: true,
          registrationNumber: '',
          rates: [0, 5, 12, 18, 28]
        },
        enablePassword: currentCompany.settings?.enablePassword || false,
        password: '',
        language: currentCompany.settings?.language || 'en',
        timezone: currentCompany.timezone
      });
    }
  }, [currentCompany]);

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof formData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (!currentCompany) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          currency: formData.currency,
          timezone: formData.timezone,
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
            password: formData.enablePassword ? formData.password : null
          }
        })
        .eq('id', currentCompany.id);

      if (error) throw error;

      refreshCompanies();
      setErrors({ success: 'Company settings updated successfully!' });
    } catch (error) {
      console.error('Error updating company:', error);
      setErrors({ submit: 'Failed to update company settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'periods', label: 'Periods', icon: Calendar },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'users', label: 'Users', icon: Users }
  ];

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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-[#6AC8A3] text-[#6AC8A3]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-6`}>
              General Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Company Name"
                value={formData.name}
                onChange={(value) => updateFormData('name', value)}
                required
                error={errors.name}
              />

              <FormField
                label="Display Name"
                value={formData.displayName}
                onChange={(value) => updateFormData('displayName', value)}
                placeholder="Short name for display"
              />

              <FormField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(value) => updateFormData('email', value)}
                required
                error={errors.email}
              />

              <FormField
                label="Phone Number"
                value={formData.phone}
                onChange={(value) => updateFormData('phone', value)}
              />

              <div className="md:col-span-2">
                <FormField
                  label="Street Address"
                  value={formData.address.street}
                  onChange={(value) => updateFormData('address.street', value)}
                />
              </div>

              <FormField
                label="City"
                value={formData.address.city}
                onChange={(value) => updateFormData('address.city', value)}
              />

              <FormField
                label="State/Province"
                value={formData.address.state}
                onChange={(value) => updateFormData('address.state', value)}
              />

              <FormField
                label="Country"
                value={formData.address.country}
                onChange={(value) => updateFormData('address.country', value)}
              />

              <FormField
                label="ZIP/Postal Code"
                value={formData.address.zipCode}
                onChange={(value) => updateFormData('address.zipCode', value)}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-6`}>
              Financial Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                  Currency
                </label>
                <div className={`
                  px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                `}>
                  {formData.currency}
                </div>
                <p className="text-xs text-gray-500">
                  Currency cannot be changed after company creation
                </p>
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

              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                  Tax System
                </label>
                <div className={`
                  px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                `}>
                  {formData.taxConfig.type}
                </div>
              </div>

              <FormField
                label="Tax Registration Number"
                value={formData.taxConfig.registrationNumber}
                onChange={(value) => updateFormData('taxConfig.registrationNumber', value)}
              />
            </div>
          </Card>

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

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading}
              icon={<Save size={16} />}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'periods' && (
        <PeriodManager />
      )}

      {activeTab === 'security' && (
        <Card className="p-6">
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-6`}>
            Security Settings
          </h2>

          <div className="space-y-6">
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
                      placeholder="Enter company password"
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

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              disabled={loading}
              icon={<Save size={16} />}
            >
              {loading ? 'Saving...' : 'Save Security Settings'}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${theme.textPrimary}`}>
              User Management
            </h2>
            <Button icon={<Plus size={16} />}>
              Invite User
            </Button>
          </div>

          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
              User Management Coming Soon
            </h3>
            <p className={`${theme.textMuted}`}>
              Multi-user support and role management will be available in the next update.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default CompanySettings;