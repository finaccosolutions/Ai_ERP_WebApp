import React, { useState, useEffect } from 'react';
import {
  Building,
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Save,
  ChevronRight,
  ChevronLeft,
  Settings,
  Users,
  Shield,
  Clock,
  FolderOpen,
  Eye as ViewIcon,
  ArrowLeft,
  LayoutDashboard
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CompanySetup from './CompanySetup'; // Import CompanySetup

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
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  contact_info: {
    email: string;
    phone: string;
  };
  settings: {
    displayName: string;
    decimalPlaces: number;
    language: string;
    enablePassword: boolean;
    password?: string;
  };
}

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosedPeriod: boolean;
  periodType: 'fiscal_year' | 'quarter' | 'month';
}

function CompanyManagement() {
  const {
    currentCompany,
    currentPeriod,
    companies,
    periods,
    switchCompany,
    switchPeriod,
    refreshCompanies,
    refreshPeriods,
  } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [displayMode, setDisplayMode] = useState<'none' | 'overview' | 'view' | 'edit' | 'periods'>('none');
  // Removed activeSettingsTab as CompanySetup will manage its own tabs
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // For general errors/messages
  const [successMessage, setSuccessMessage] = useState('');

  // Removed companyFormData as CompanySetup will manage its own form data
  const [periodFormData, setPeriodFormData] = useState({
    id: '',
    name: '',
    startDate: '',
    endDate: '',
    periodType: 'fiscal_year' as 'fiscal_year' | 'quarter' | 'month'
  });

  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [showCreatePeriodForm, setShowCreatePeriodForm] = useState(false);

  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      // Do not pre-select any company on initial load
      // setSelectedCompany(currentCompany || companies[0]);
    }
  }, [companies, selectedCompany, currentCompany]);

  // Removed useEffect that populated companyFormData, as CompanySetup will do this internally

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setDisplayMode('overview'); // Show overview by default
    // Removed setActiveSettingsTab as CompanySetup will manage its own tabs
    setSuccessMessage('');
    setFormErrors({});
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.currency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'IN': '🇮🇳', 'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺',
      'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵', 'SG': '🇸🇬', 'AE': '🇦🇪'
    };
    return flags[countryCode] || '🌍';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const getPeriodTypeColor = (type: string) => {
    switch (type) {
      case 'fiscal_year': return 'bg-blue-100 text-blue-800';
      case 'quarter': return 'bg-green-100 text-green-800';
      case 'month': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPeriodTypeLabel = (type: string) => {
    switch (type) {
      case 'fiscal_year': return 'Fiscal Year';
      case 'quarter': return 'Quarter';
      case 'month': return 'Month';
      default: return type;
    }
  };

  // --- Company Management Functions ---
  // Removed updateCompanyFormData as CompanySetup will manage its own form data

  // Removed validateCompanyForm as CompanySetup will manage its own form validation

  // Removed handleSaveCompany as CompanySetup will handle its own save logic and call callbacks
  const handleCompanySettingsSaveSuccess = (message: string) => {
    setSuccessMessage(message);
    setFormErrors({}); // Clear any previous form errors
    refreshCompanies(); // Ensure company list is updated
    setDisplayMode('overview'); // Go back to overview after saving
  };

  const handleCompanySettingsSaveError = (message: string) => {
    setFormErrors({ submit: message });
    setSuccessMessage('');
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company and all its associated data? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setFormErrors({});
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      await refreshCompanies();
      setSelectedCompany(null); // Clear selected company after deletion
      setDisplayMode('none'); // Go back to none
      setSuccessMessage('Company deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting company:', error);
      setFormErrors({ submit: error.message || 'Failed to delete company.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCompany = async (company: Company, periodId?: string) => {
    if (company.settings?.enablePassword && company.id !== currentCompany?.id) {
      setSelectedCompany(company); // Set for password modal context
      setShowPasswordModal(true);
      return;
    }
    switchCompany(company.id);
    if (periodId) {
      switchPeriod(periodId);
    }
    navigate('/'); // Navigate to dashboard
  };

  const handlePasswordSubmit = () => {
    if (!selectedCompany) return;

    // In production, this should be properly validated against hashed password
    if (password === selectedCompany.settings?.password) {
      switchCompany(selectedCompany.id);
      setShowPasswordModal(false);
      setPassword('');
      setPasswordError('');
      navigate('/'); // Navigate to dashboard after successful password entry
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  // --- Period Management Functions ---
  const resetPeriodForm = () => {
    setPeriodFormData({
      id: '',
      name: '',
      startDate: '',
      endDate: '',
      periodType: 'fiscal_year'
    });
    setFormErrors({});
  };

  const validatePeriodForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!periodFormData.name.trim()) newErrors.name = 'Period name is required';
    if (!periodFormData.startDate) newErrors.startDate = 'Start date is required';
    if (!periodFormData.endDate) newErrors.endDate = 'End date is required';

    if (periodFormData.startDate && periodFormData.endDate) {
      const start = new Date(periodFormData.startDate);
      const end = new Date(periodFormData.endDate);

      if (start >= end) {
        newErrors.endDate = 'End date must be after start date';
      }

      // Check for overlapping periods
      const overlapping = periods.find(period => {
        if (editingPeriod && period.id === editingPeriod.id) return false; // Exclude current editing period
        if (period.company_id !== selectedCompany?.id) return false; // Only check periods for the current company

        const periodStart = new Date(period.startDate);
        const periodEnd = new Date(period.endDate);

        return (start <= periodEnd && end >= periodStart);
      });

      if (overlapping) {
        newErrors.startDate = `Period overlaps with "${overlapping.name}"`;
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreatePeriod = async () => {
    if (!selectedCompany || !validatePeriodForm()) return;

    setLoading(true);
    setSuccessMessage('');
    setFormErrors({});
    try {
      const { error } = await supabase
        .from('periods')
        .insert({
          company_id: selectedCompany.id,
          name: periodFormData.name,
          start_date: periodFormData.startDate,
          end_date: periodFormData.endDate,
          period_type: periodFormData.periodType,
          is_active: false,
          is_closed: false
        });

      if (error) throw error;

      setShowCreatePeriodForm(false);
      resetPeriodForm();
      await refreshPeriods();
      setSuccessMessage('Period created successfully!');
    } catch (error: any) {
      console.error('Error creating period:', error);
      setFormErrors({ submit: error.message || 'Failed to create period.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPeriod = async () => {
    if (!editingPeriod || !validatePeriodForm()) return;

    setLoading(true);
    setSuccessMessage('');
    setFormErrors({});
    try {
      const { error } = await supabase
        .from('periods')
        .update({
          name: periodFormData.name,
          start_date: periodFormData.startDate,
          end_date: periodFormData.endDate,
          period_type: periodFormData.periodType
        })
        .eq('id', editingPeriod.id);

      if (error) throw error;

      setEditingPeriod(null);
      resetPeriodForm();
      await refreshPeriods();
      setSuccessMessage('Period updated successfully!');
    } catch (error: any) {
      console.error('Error updating period:', error);
      setFormErrors({ submit: error.message || 'Failed to update period.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!confirm('Are you sure you want to delete this period? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setFormErrors({});
    try {
      const { error } = await supabase
        .from('periods')
        .delete()
        .eq('id', periodId);

      if (error) throw error;

      await refreshPeriods();
      setSuccessMessage('Period deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting period:', error);
      setFormErrors({ submit: error.message || 'Failed to delete period.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetActivePeriod = async (periodId: string) => {
    if (!selectedCompany) return;

    setLoading(true);
    setSuccessMessage('');
    setFormErrors({});
    try {
      // First, deactivate all periods for the current company
      await supabase
        .from('periods')
        .update({ is_active: false })
        .eq('company_id', selectedCompany.id);

      // Then activate the selected period
      const { error } = await supabase
        .from('periods')
        .update({ is_active: true })
        .eq('id', periodId);

      if (error) throw error;

      switchPeriod(periodId); // Update context
      await refreshPeriods(); // Refresh local state
      setSuccessMessage('Active period updated successfully!');
    } catch (error: any) {
      console.error('Error setting active period:', error);
      setFormErrors({ submit: error.message || 'Failed to set active period.' });
    } finally {
      setLoading(false);
    }
  };

  const startEditPeriod = (period: Period) => {
    setEditingPeriod(period);
    setPeriodFormData({
      id: period.id,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      periodType: period.periodType || 'fiscal_year'
    });
    setShowCreatePeriodForm(false);
    setFormErrors({});
  };

  const cancelEditPeriod = () => {
    setEditingPeriod(null);
    resetPeriodForm();
  };

  const companyPeriods = periods.filter(p => p.company_id === selectedCompany?.id);

  if (loading && companies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6AC8A3]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Company List */}
      <div className={`
        w-80 border-r ${theme.borderColor} flex flex-col
        ${theme.isDark ? 'bg-gray-800' : 'bg-gray-50'}
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
              `}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {filteredCompanies.length} of {companies.length} companies
          </p>
          <Button
            onClick={() => navigate('/company/setup')}
            icon={<Plus size={16} />}
            className="w-full mt-4"
          >
            Create New Company
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredCompanies.map(company => (
            <button
              key={company.id}
              onClick={() => handleCompanySelect(company)}
              className={`
                w-full p-3 text-left rounded-lg transition-all duration-200
                flex items-center space-x-3
                ${selectedCompany?.id === company.id
                  ? 'bg-gradient-to-r from-[#5DBF99] to-[#6AC8A3] text-white shadow-md'
                  : `${theme.cardBg} ${theme.textPrimary} hover:bg-gray-100 hover:shadow-sm`
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded-md flex items-center justify-center text-lg
                ${selectedCompany?.id === company.id
                  ? 'bg-white/20'
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {getCountryFlag(company.country)}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">{company.name}</h3>
                <p className="text-xs opacity-80">
                  {company.country} • {company.currency}
                </p>
              </div>
              {company.id === currentCompany?.id && (
                <Check size={16} className={selectedCompany?.id === company.id ? 'text-white' : 'text-[#6AC8A3]'} />
              )}
            </button>
          ))}
          {filteredCompanies.length === 0 && (
            <div className="text-center py-8">
              <Building size={32} className="mx-auto text-gray-400 mb-2" />
              <p className={`text-sm ${theme.textMuted}`}>No companies found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Company Details & Management */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {displayMode === 'none' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Building size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className={`text-xl font-medium ${theme.textPrimary} mb-2`}>
                Select a Company
              </h3>
              <p className={`${theme.textMuted}`}>
                Choose a company from the list on the left to manage its details and periods.
              </p>
            </div>
          </div>
        )}

        {selectedCompany && displayMode !== 'none' && (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
                  {selectedCompany.name}
                </h1>
                <p className={theme.textSecondary}>Manage company details, periods, and settings</p>
              </div>
              <div className="flex space-x-2">
                {displayMode !== 'overview' && displayMode !== 'periods' && (
                  <Button
                    variant="outline"
                    onClick={() => setDisplayMode('overview')}
                    icon={<ArrowLeft size={16} />}
                  >
                    Back to Overview
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  icon={<LayoutDashboard size={16} />}
                >
                  Back to Dashboard
                </Button>
                <button
                  onClick={() => setDisplayMode('none')} // Close window option
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">{successMessage}</p>
              </div>
            )}
            {formErrors.submit && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{formErrors.submit}</p>
              </div>
            )}

            {/* Overview Mode */}
            {displayMode === 'overview' && (
              <Card className="p-6">
                <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-6`}>
                  Company Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className={`text-sm ${theme.textMuted}`}>Company Name</p>
                    <p className={`font-medium ${theme.textPrimary}`}>{selectedCompany.name}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme.textMuted}`}>Display Name</p>
                    <p className={`font-medium ${theme.textPrimary}`}>{selectedCompany.settings?.displayName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme.textMuted}`}>Email</p>
                    <p className={`font-medium ${theme.textPrimary}`}>{selectedCompany.contactInfo?.email}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme.textMuted}`}>Phone</p>
                    <p className={`font-medium ${theme.textPrimary}`}>{selectedCompany.contactInfo?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme.textMuted}`}>Country</p>
                    <p className={`font-medium ${theme.textPrimary}`}>{selectedCompany.country}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme.textMuted}`}>Currency</p>
                    <p className={`font-medium ${theme.textPrimary}`}>{selectedCompany.currency}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme.textMuted}`}>Fiscal Year</p>
                    <p className={`font-medium ${theme.textPrimary}`}>
                      {formatDate(selectedCompany.fiscalYearStart)} - {formatDate(selectedCompany.fiscalYearEnd)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme.textMuted}`}>Timezone</p>
                    <p className={`font-medium ${theme.textPrimary}`}>{selectedCompany.timezone}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleOpenCompany(selectedCompany)}
                    icon={<FolderOpen size={16} />}
                  >
                    Open Company
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDisplayMode('view')}
                    icon={<ViewIcon size={16} />}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDisplayMode('edit')}
                    icon={<Edit size={16} />}
                  >
                    Edit Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDisplayMode('periods')}
                    icon={<Calendar size={16} />}
                  >
                    Manage Periods
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteCompany(selectedCompany.id)}
                    disabled={loading || selectedCompany.id === currentCompany?.id}
                    icon={<Trash2 size={16} />}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete Company
                  </Button>
                </div>
              </Card>
            )}

            {/* View/Edit Mode - Now rendering CompanySetup */}
            {(displayMode === 'view' || displayMode === 'edit') && selectedCompany && (
              <CompanySetup
                companyToEdit={selectedCompany}
                readOnly={displayMode === 'view'}
                onSaveSuccess={handleCompanySettingsSaveSuccess}
                onSaveError={handleCompanySettingsSaveError}
                onCancel={() => setDisplayMode('overview')} // Go back to overview on cancel
              />
            )}

            {/* Periods Mode */}
            {displayMode === 'periods' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-semibold ${theme.textPrimary} flex items-center`}>
                    <Calendar size={24} className="mr-3 text-[#6AC8A3]" />
                    Accounting Periods
                  </h2>
                  <Button
                    onClick={() => {
                      setShowCreatePeriodForm(true);
                      setEditingPeriod(null);
                      resetPeriodForm();
                    }}
                    icon={<Plus size={16} />}
                    disabled={loading}
                  >
                    Create Period
                  </Button>
                </div>

                {/* Create/Edit Period Form */}
                {(showCreatePeriodForm || editingPeriod) && (
                  <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-4">
                      {editingPeriod ? 'Edit Period' : 'Create New Period'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Period Name"
                        value={periodFormData.name}
                        onChange={(value) => setPeriodFormData(prev => ({ ...prev, name: value }))}
                        placeholder="e.g., FY 2024-25, Q1 2024"
                        required
                        error={formErrors.name}
                      />
                      <div className="space-y-2">
                        <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                          Period Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={periodFormData.periodType}
                          onChange={(e) => setPeriodFormData(prev => ({ ...prev, periodType: e.target.value as any }))}
                          className={`
                            w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                            ${theme.inputBg} ${theme.textPrimary}
                            focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                          `}
                        >
                          <option value="fiscal_year">Fiscal Year</option>
                          <option value="quarter">Quarter</option>
                          <option value="month">Month</option>
                        </select>
                      </div>
                      <FormField
                        label="Start Date"
                        type="date"
                        value={periodFormData.startDate}
                        onChange={(value) => setPeriodFormData(prev => ({ ...prev, startDate: value }))}
                        required
                        error={formErrors.startDate}
                      />
                      <FormField
                        label="End Date"
                        type="date"
                        value={periodFormData.endDate}
                        onChange={(value) => setPeriodFormData(prev => ({ ...prev, endDate: value }))}
                        required
                        error={formErrors.endDate}
                      />
                    </div>
                    {formErrors.submit && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">{formErrors.submit}</p>
                      </div>
                    )}
                    <div className="flex justify-end space-x-3 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreatePeriodForm(false);
                          cancelEditPeriod();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={editingPeriod ? handleEditPeriod : handleCreatePeriod}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : editingPeriod ? 'Update Period' : 'Create Period'}
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Periods List */}
                <div className="space-y-3">
                  {companyPeriods.map((period) => (
                    <div
                      key={period.id}
                      className={`
                        p-4 border rounded-xl transition-all duration-300
                        ${period.isActive
                          ? 'border-[#6AC8A3] bg-[#6AC8A3]/5'
                          : `${theme.borderColor} hover:border-[#6AC8A3]/50`
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center
                            ${period.isActive
                              ? 'bg-[#6AC8A3] text-white'
                              : 'bg-gray-100 text-gray-600'
                            }
                          `}>
                            <Calendar size={20} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-3">
                              <h3 className={`font-medium ${theme.textPrimary}`}>
                                {period.name}
                              </h3>
                              <span className={`
                                px-2 py-1 text-xs rounded-full
                                ${getPeriodTypeColor(period.periodType)}
                              `}>
                                {getPeriodTypeLabel(period.periodType)}
                              </span>
                              {period.isActive && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center">
                                  <Check size={12} className="mr-1" />
                                  Active
                                </span>
                              )}
                              {period.isClosedPeriod && (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full flex items-center">
                                  <X size={12} className="mr-1" />
                                  Closed
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${theme.textMuted}`}>
                              {formatDate(period.startDate)} - {formatDate(period.endDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!period.isActive && !period.isClosedPeriod && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetActivePeriod(period.id)}
                              disabled={loading}
                            >
                              Set Active
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCompany(selectedCompany, period.id)}
                            icon={<FolderOpen size={14} />}
                          >
                            Open
                          </Button>
                          {!period.isClosedPeriod && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditPeriod(period)}
                              disabled={loading}
                              icon={<Edit size={14} />}
                            />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePeriod(period.id)}
                            disabled={loading || period.isActive}
                            icon={<Trash2 size={14} />}
                            className="text-red-600 hover:text-red-800"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {companyPeriods.length === 0 && (
                    <div className="text-center py-12">
                      <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                        No Periods Found
                      </h3>
                      <p className={`${theme.textMuted} mb-4`}>
                        Create your first period to start managing your financial data.
                      </p>
                      <Button
                        onClick={() => setShowCreatePeriodForm(true)}
                        icon={<Plus size={16} />}
                      >
                        Create First Period
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">Period Management Tips</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Only one period can be active at a time</li>
                        <li>• Periods cannot overlap in dates</li>
                        <li>• Closed periods cannot be edited or deleted</li>
                        <li>• All financial data is scoped to the active period</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <Card className={`w-full max-w-md ${theme.cardBg}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-10 h-10 rounded-lg bg-gradient-to-r ${theme.primaryGradient}
                    flex items-center justify-center text-white
                  `}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme.textPrimary}`}>
                      Company Password Required
                    </h3>
                    <p className={`text-sm ${theme.textMuted}`}>
                      {selectedCompany.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                    setPasswordError('');
                  }}
                  className={`${theme.textMuted} hover:${theme.textPrimary}`}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <FormField
                    label="Enter Company Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={setPassword}
                    placeholder="Enter password to access this company"
                    error={passwordError}
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
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPassword('');
                      setPasswordError('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePasswordSubmit}
                    disabled={!password.trim()}
                    className="flex-1"
                  >
                    Access Company
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
export default CompanyManagement;
