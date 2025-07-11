import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Building, 
  Calendar, 
  MapPin, 
  Globe,
  Check,
  ChevronRight,
  ArrowLeft,
  Plus,
  Mail,
  Phone,
  CreditCard,
  Clock,
  Settings,
  Users,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../UI/Card';
import Button from '../UI/Button';

interface CompanyPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  sidebarOpen: boolean;
  sidebarWidth: string;
}

function CompanyPeriodModal({ isOpen, onClose, sidebarOpen, sidebarWidth }: CompanyPeriodModalProps) {
  const { 
    currentCompany, 
    currentPeriod, 
    companies, 
    periods, 
    switchCompany, 
    switchPeriod 
  } = useCompany();
  const { theme } = useTheme();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [view, setView] = useState<'companies' | 'periods'>('companies');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Calculate proper positioning
  const sidebarPxWidth = sidebarOpen ? 256 : 64; // 64px for w-16, 256px for w-64
  const topNavHeight = 64; // Height of the TopNavbar

  useEffect(() => {
    if (isOpen) {
      setView('companies');
      setSelectedCompany(currentCompany);
      setSearchTerm('');
      setPassword('');
      setPasswordError('');
    }
  }, [isOpen, currentCompany]);

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'IN': '🇮🇳',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'JP': '🇯🇵',
      'SG': '🇸🇬',
      'AE': '🇦🇪'
    };
    return flags[countryCode] || '🌍';
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.currency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanySelect = (company: any) => {
    // Check if company requires password and is different from current
    if (company.settings?.enablePassword && company.id !== currentCompany?.id) {
      setSelectedCompany(company);
      setShowPassword(true);
      return;
    }

    setSelectedCompany(company);
    setView('periods');
  };

  const handlePasswordSubmit = () => {
    if (!selectedCompany) return;

    // In production, this should be properly validated against hashed password
    if (password === selectedCompany.settings?.password) {
      setShowPassword(false);
      setPassword('');
      setPasswordError('');
      setView('periods');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handlePeriodSelect = (period: any) => {
    if (selectedCompany && selectedCompany.id !== currentCompany?.id) {
      switchCompany(selectedCompany.id);
    }
    switchPeriod(period.id);
    onClose();
  };

  const handleCompanySwitch = () => {
    if (selectedCompany && selectedCompany.id !== currentCompany?.id) {
      switchCompany(selectedCompany.id);
    }
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: selectedCompany?.currency || 'INR'
    }).format(amount);
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

  // Get periods for selected company
  const companyPeriods = periods.filter(period => 
    selectedCompany ? true : period.id === currentPeriod?.id
  );

  // Create a default period if none exist
  const displayPeriods = companyPeriods.length > 0 ? companyPeriods : [{
    id: 'default',
    name: 'Current Year',
    startDate: new Date().getFullYear() + '-04-01',
    endDate: (new Date().getFullYear() + 1) + '-03-31',
    isActive: true,
    isClosedPeriod: false,
    periodType: 'fiscal_year'
  }];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed z-50 bg-black bg-opacity-50"
      style={{
        top: `${topNavHeight}px`,
        left: `${sidebarPxWidth}px`,
        right: '0',
        bottom: '0'
      }}
    >
      <div className="w-full h-full p-6 flex items-center justify-center">
        <Card className={`w-full h-full max-w-7xl ${theme.cardBg} flex flex-col shadow-2xl`}>
          {/* Header */}
          <div className={`
            flex items-center justify-between p-6 border-b ${theme.borderColor}
            bg-gradient-to-r ${theme.primaryGradient}
          `}>
            <div className="flex items-center space-x-3">
              {view === 'periods' && (
                <button
                  onClick={() => setView('companies')}
                  className="text-white hover:text-gray-200 transition-colors mr-2"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <Building size={24} className="text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {view === 'companies' ? 'Select Company & Period' : `Select Period - ${selectedCompany?.name}`}
                </h2>
                <p className="text-white/80 text-sm">
                  {view === 'companies' 
                    ? 'Choose your company and manage periods' 
                    : 'Select the accounting period for your data'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          {/* Password Modal */}
          {showPassword && selectedCompany && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <Card className={`w-full max-w-md ${theme.cardBg} m-4`}>
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
                        setShowPassword(false);
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
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter company password"
                        className={`
                          w-full px-3 py-2 border ${theme.borderColor} rounded-lg
                          ${theme.inputBg} ${theme.textPrimary}
                          focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                        `}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {passwordError && (
                      <p className="text-red-600 text-sm">{passwordError}</p>
                    )}

                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPassword(false);
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

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {view === 'companies' ? (
              <>
                {/* Left Panel - Company List */}
                <div className="w-1/2 border-r border-gray-200 flex flex-col">
                  {/* Search */}
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="relative">
                      <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search companies by name, country, or currency..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`
                          w-full pl-10 pr-4 py-3 border ${theme.borderColor} rounded-xl
                          ${theme.inputBg} ${theme.textPrimary} text-lg
                          focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                          shadow-sm
                        `}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {filteredCompanies.length} of {companies.length} companies
                    </p>
                  </div>

                  {/* Company List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredCompanies.map(company => (
                      <button
                        key={company.id}
                        onClick={() => handleCompanySelect(company)}
                        className={`
                          w-full p-5 text-left rounded-2xl border-2 transition-all duration-300
                          ${company.id === currentCompany?.id 
                            ? 'border-[#6AC8A3] bg-[#6AC8A3]/10 shadow-lg' 
                            : `${theme.borderColor} hover:border-[#6AC8A3] hover:bg-[#6AC8A3]/5 hover:shadow-md`
                          }
                          group transform hover:scale-[1.02]
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`
                              w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg
                              ${company.id === currentCompany?.id 
                                ? 'bg-[#6AC8A3] text-white' 
                                : 'bg-gray-100 group-hover:bg-[#6AC8A3]/20'
                              }
                              transition-all duration-300
                            `}>
                              {getCountryFlag(company.country)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className={`text-lg font-bold ${theme.textPrimary} group-hover:text-[#5DBF99]`}>
                                  {company.name}
                                </h3>
                                {company.settings?.enablePassword && (
                                  <Shield size={16} className="text-orange-500" />
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Globe size={14} className="mr-1" />
                                  {company.country}
                                </span>
                                <span className="flex items-center">
                                  <CreditCard size={14} className="mr-1" />
                                  {company.currency}
                                </span>
                              </div>
                              {company.contactInfo?.email && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {company.contactInfo.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {company.id === currentCompany?.id && (
                              <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                <Check size={12} />
                                <span>Current</span>
                              </div>
                            )}
                            <ChevronRight size={20} className="text-gray-400 group-hover:text-[#6AC8A3]" />
                          </div>
                        </div>
                      </button>
                    ))}

                    {filteredCompanies.length === 0 && (
                      <div className="text-center py-16">
                        <Building size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                          No companies found
                        </h3>
                        <p className={`${theme.textMuted}`}>
                          {searchTerm ? 'Try adjusting your search terms' : 'No companies available'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Company Details */}
                <div className="w-1/2 p-6 bg-gray-50">
                  {selectedCompany ? (
                    <div className="space-y-6 h-full overflow-y-auto">
                      {/* Company Header */}
                      <div className="text-center pb-6 border-b border-gray-200">
                        <div className={`
                          w-24 h-24 mx-auto rounded-3xl bg-gradient-to-r ${theme.primaryGradient}
                          flex items-center justify-center text-4xl mb-4 shadow-xl
                        `}>
                          {getCountryFlag(selectedCompany.country)}
                        </div>
                        <h3 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>
                          {selectedCompany.name}
                        </h3>
                        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Globe size={16} className="mr-1" />
                            {selectedCompany.country}
                          </span>
                          <span className="flex items-center">
                            <CreditCard size={16} className="mr-1" />
                            {selectedCompany.currency}
                          </span>
                        </div>
                        {selectedCompany.id === currentCompany?.id && (
                          <div className="mt-3">
                            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              Currently Active
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Company Information */}
                      <div className="grid grid-cols-1 gap-6">
                        {/* Contact Information */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm">
                          <h4 className={`font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                            <Mail size={18} className="mr-2 text-[#6AC8A3]" />
                            Contact Information
                          </h4>
                          <div className="space-y-3">
                            {selectedCompany.contactInfo?.email && (
                              <div className="flex items-center space-x-3">
                                <Mail size={16} className="text-gray-400" />
                                <span className={`${theme.textPrimary}`}>{selectedCompany.contactInfo.email}</span>
                              </div>
                            )}
                            {selectedCompany.contactInfo?.phone && (
                              <div className="flex items-center space-x-3">
                                <Phone size={16} className="text-gray-400" />
                                <span className={`${theme.textPrimary}`}>{selectedCompany.contactInfo.phone}</span>
                              </div>
                            )}
                            {selectedCompany.address?.street && (
                              <div className="flex items-start space-x-3">
                                <MapPin size={16} className="text-gray-400 mt-1" />
                                <div className={`${theme.textPrimary}`}>
                                  <p>{selectedCompany.address.street}</p>
                                  <p>{selectedCompany.address.city}, {selectedCompany.address.state}</p>
                                  <p>{selectedCompany.address.country} {selectedCompany.address.zipCode}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Financial Settings */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm">
                          <h4 className={`font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                            <CreditCard size={18} className="mr-2 text-[#6AC8A3]" />
                            Financial Settings
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className={`text-sm ${theme.textMuted}`}>Currency</p>
                              <p className={`font-medium ${theme.textPrimary}`}>{selectedCompany.currency}</p>
                            </div>
                            <div>
                              <p className={`text-sm ${theme.textMuted}`}>Tax System</p>
                              <p className={`font-medium ${theme.textPrimary}`}>{selectedCompany.taxConfig?.type || 'GST'}</p>
                            </div>
                            <div>
                              <p className={`text-sm ${theme.textMuted}`}>Fiscal Year Start</p>
                              <p className={`font-medium ${theme.textPrimary}`}>{formatDate(selectedCompany.fiscalYearStart)}</p>
                            </div>
                            <div>
                              <p className={`text-sm ${theme.textMuted}`}>Fiscal Year End</p>
                              <p className={`font-medium ${theme.textPrimary}`}>{formatDate(selectedCompany.fiscalYearEnd)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Current Period */}
                        {currentPeriod && selectedCompany.id === currentCompany?.id && (
                          <div className="bg-[#6AC8A3]/10 p-5 rounded-2xl border border-[#6AC8A3]/20">
                            <h4 className={`font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                              <Calendar size={18} className="mr-2 text-[#6AC8A3]" />
                              Current Period
                            </h4>
                            <div>
                              <p className={`font-medium ${theme.textPrimary} text-lg`}>{currentPeriod.name}</p>
                              <p className={`text-sm ${theme.textMuted}`}>
                                {formatDate(currentPeriod.startDate)} - {formatDate(currentPeriod.endDate)}
                              </p>
                              <span className={`
                                inline-block mt-2 px-3 py-1 text-xs rounded-full
                                ${getPeriodTypeColor(currentPeriod.periodType)}
                              `}>
                                {getPeriodTypeLabel(currentPeriod.periodType)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-6 border-t border-gray-200 space-y-3">
                        <Button
                          onClick={() => setView('periods')}
                          className="w-full"
                          icon={<Calendar size={16} />}
                        >
                          Select Period for {selectedCompany.name}
                        </Button>
                        {selectedCompany.id !== currentCompany?.id && (
                          <Button
                            onClick={handleCompanySwitch}
                            variant="outline"
                            className="w-full"
                            icon={<Building size={16} />}
                          >
                            Switch to {selectedCompany.name}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Building size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className={`text-xl font-medium ${theme.textPrimary} mb-2`}>
                          Select a Company
                        </h3>
                        <p className={`${theme.textMuted}`}>
                          Choose a company from the list to view details and manage periods
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Period Selection View */
              <div className="w-full flex flex-col">
                {/* Selected Company Header */}
                {selectedCompany && (
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#5DBF99] to-[#6AC8A3] flex items-center justify-center text-xl">
                          {getCountryFlag(selectedCompany.country)}
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold ${theme.textPrimary}`}>{selectedCompany.name}</h3>
                          <p className={`text-sm ${theme.textMuted}`}>
                            {selectedCompany.country} • {selectedCompany.currency}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        icon={<Plus size={16} />}
                        onClick={() => {/* Navigate to period creation */}}
                      >
                        Create Period
                      </Button>
                    </div>
                  </div>
                )}

                {/* Periods List */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                      <h4 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
                        Available Periods
                      </h4>
                      <p className={`${theme.textMuted}`}>
                        Select an accounting period to view data for that timeframe
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {displayPeriods.map((period) => (
                        <button
                          key={period.id}
                          onClick={() => handlePeriodSelect(period)}
                          className={`
                            p-6 text-left rounded-2xl border-2 transition-all duration-300
                            ${period.id === currentPeriod?.id 
                              ? 'border-[#6AC8A3] bg-[#6AC8A3]/10 shadow-lg' 
                              : `${theme.borderColor} hover:border-[#6AC8A3] hover:bg-[#6AC8A3]/5 hover:shadow-md`
                            }
                            group transform hover:scale-[1.02]
                          `}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className={`
                              w-14 h-14 rounded-2xl flex items-center justify-center
                              ${period.id === currentPeriod?.id 
                                ? 'bg-[#6AC8A3] text-white' 
                                : 'bg-gray-100 text-gray-600 group-hover:bg-[#6AC8A3]/20'
                              }
                              transition-all duration-300
                            `}>
                              <Calendar size={24} />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {period.isActive && (
                                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                              )}
                              {period.id === currentPeriod?.id && (
                                <Check size={20} className="text-[#6AC8A3]" />
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className={`text-lg font-bold ${theme.textPrimary} group-hover:text-[#5DBF99]`}>
                                {period.name}
                              </h3>
                              <span className={`
                                px-3 py-1 text-xs rounded-full font-medium
                                ${getPeriodTypeColor(period.periodType)}
                              `}>
                                {getPeriodTypeLabel(period.periodType)}
                              </span>
                            </div>
                            <p className={`text-sm ${theme.textMuted} mb-3`}>
                              {formatDate(period.startDate)} - {formatDate(period.endDate)}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                {period.isActive && (
                                  <span className="flex items-center">
                                    <Clock size={12} className="mr-1" />
                                    Active
                                  </span>
                                )}
                                {period.isClosedPeriod && (
                                  <span className="flex items-center text-red-600">
                                    <Shield size={12} className="mr-1" />
                                    Closed
                                  </span>
                                )}
                              </div>
                              
                              {period.id === currentPeriod?.id && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {periods.length === 0 && (
                      <div className="text-center py-16">
                        <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className={`text-xl font-medium ${theme.textPrimary} mb-2`}>
                          No periods found
                        </h3>
                        <p className={`${theme.textMuted} mb-6`}>
                          Create your first accounting period to start managing financial data
                        </p>
                        <Button icon={<Plus size={16} />}>
                          Create First Period
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`p-4 border-t ${theme.borderColor} bg-gray-50`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <Building size={14} className="mr-1" />
                  {companies.length} Companies
                </span>
                <span className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  {periods.length} Periods
                </span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                {view === 'companies' && selectedCompany && (
                  <Button onClick={() => setView('periods')}>
                    Continue to Periods
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default CompanyPeriodModal;