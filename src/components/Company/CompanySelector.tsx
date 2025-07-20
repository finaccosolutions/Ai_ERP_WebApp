import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Calendar, 
  ChevronDown, 
  Plus, 
  Settings, 
  Lock, 
  Globe,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import Card from '../UI/Card';

interface CompanySelectorProps {
  onCompanySelect?: (companyId: string) => void;
  onPeriodSelect?: (periodId: string) => void;
  showCreateButton?: boolean;
}

function CompanySelector({ onCompanySelect, onPeriodSelect, showCreateButton = true }: CompanySelectorProps) {
  const { 
    currentCompany, 
    currentPeriod, 
    companies, 
    periods, 
    switchCompany, 
    switchPeriod 
  } = useCompany();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCompanyForPassword, setSelectedCompanyForPassword] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleCompanySelect = (company: any) => {
    // Check if company requires password
    if (company.settings?.enablePassword && company.id !== currentCompany?.id) {
      setSelectedCompanyForPassword(company);
      setShowPasswordModal(true);
      setShowCompanyDropdown(false);
      return;
    }

    switchCompany(company.id);
    setShowCompanyDropdown(false);
    if (onCompanySelect) {
      onCompanySelect(company.id);
    }
  };

  const handlePasswordSubmit = () => {
    if (!selectedCompanyForPassword) return;

    // In production, this should be properly validated against hashed password
    if (password === selectedCompanyForPassword.settings?.password) {
      switchCompany(selectedCompanyForPassword.id);
      setShowPasswordModal(false);
      setPassword('');
      setPasswordError('');
      setSelectedCompanyForPassword(null);
      if (onCompanySelect) {
        onCompanySelect(selectedCompanyForPassword.id);
      }
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handlePeriodSelect = (period: any) => {
    switchPeriod(period.id);
    setShowPeriodDropdown(false);
    if (onPeriodSelect) {
      onPeriodSelect(period.id);
    }
  };

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

  const formatPeriodDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className="flex items-center space-x-3">
        {/* Company Selector */}
        <div className="relative">
          <button
            onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300
              ${theme.isDark 
                ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600' 
                : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
              }
              hover:border-[${theme.hoverAccent}] hover:shadow-md min-w-[200px]
            `}
          >
            <div className="flex items-center space-x-2 flex-1">
              <div className={`
                w-8 h-8 rounded-lg bg-gradient-to-r ${theme.primaryGradient}
                flex items-center justify-center text-white text-sm font-bold
              `}>
                {currentCompany ? getCountryFlag(currentCompany.country) : <Building size={16} />}
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${theme.textPrimary} truncate`}>
                  {currentCompany?.name || 'Select Company'}
                </p>
                {currentCompany && (
                  <p className="text-xs text-gray-500">
                    {currentCompany.country} • {currentCompany.currency}
                  </p>
                )}
              </div>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${
              showCompanyDropdown ? 'rotate-180' : ''
            }`} />
          </button>

          {showCompanyDropdown && (
            <div className={`
              absolute top-full left-0 mt-2 w-80 ${theme.cardBg} border ${theme.borderColor}
              rounded-xl ${theme.shadowLevel} z-50 max-h-96 overflow-y-auto
            `}>
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className={`font-medium ${theme.textPrimary}`}>Select Company</h3>
                  {showCreateButton && (
                    <Button size="sm" variant="outline" icon={<Plus size={14} />}>
                      New
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="py-2">
                {companies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => handleCompanySelect(company)}
                    className={`
                      w-full px-4 py-3 text-left transition-all duration-300 flex items-center space-x-3
                      hover:bg-[${theme.hoverAccent}] hover:text-white group
                      ${company.id === currentCompany?.id 
                        ? 'bg-[${theme.hoverAccent}] text-white' 
                        : `${theme.textPrimary} hover:bg-[${theme.hoverAccent}]/10`
                      }
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center text-lg
                      ${company.id === currentCompany?.id 
                        ? 'bg-white/20' 
                        : 'bg-gray-100 group-hover:bg-white/20'
                      }
                    `}>
                      {getCountryFlag(company.country)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{company.name}</p>
                        {company.settings?.enablePassword && (
                          <Lock size={12} className="opacity-60" />
                        )}
                        {company.id === currentCompany?.id && (
                          <Check size={14} />
                        )}
                      </div>
                      <p className={`text-xs opacity-75`}>
                        {company.country} • {company.currency}
                      </p>
                    </div>
                  </button>
                ))}
                
                {companies.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Building size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className={`text-sm ${theme.textMuted}`}>No companies found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Period Selector */}
        {currentCompany && (
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300
                ${theme.isDark 
                  ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600' 
                  : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
                }
                hover:border-[${theme.hoverAccent}] hover:shadow-md min-w-[180px]
              `}
            >
              <Calendar size={16} className="text-[${theme.hoverAccent}]" />
              <div className="text-left flex-1">
                <p className={`text-sm font-medium ${theme.textPrimary}`}>
                  {currentPeriod?.name || 'Select Period'}
                </p>
                {currentPeriod && (
                  <p className="text-xs text-gray-500">
                    {formatPeriodDate(currentPeriod.startDate)} - {formatPeriodDate(currentPeriod.endDate)}
                  </p>
                )}
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${
                showPeriodDropdown ? 'rotate-180' : ''
              }`} />
            </button>

            {showPeriodDropdown && (
              <div className={`
                absolute top-full left-0 mt-2 w-72 ${theme.cardBg} border ${theme.borderColor}
                rounded-xl ${theme.shadowLevel} z-50 max-h-80 overflow-y-auto
              `}>
                <div className="p-3 border-b border-gray-200">
                  <h3 className={`font-medium ${theme.textPrimary}`}>Select Period</h3>
                </div>
                
                <div className="py-2">
                  {periods.map(period => (
                    <button
                      key={period.id}
                      onClick={() => handlePeriodSelect(period)}
                      className={`
                        w-full px-4 py-3 text-left transition-all duration-300
                        hover:bg-[${theme.hoverAccent}] hover:text-white
                        ${period.id === currentPeriod?.id 
                          ? 'bg-[${theme.hoverAccent}] text-white' 
                          : `${theme.textPrimary} hover:bg-[${theme.hoverAccent}]/10`
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{period.name}</p>
                          <p className="text-xs opacity-75">
                            {formatPeriodDate(period.startDate)} - {formatPeriodDate(period.endDate)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {period.isActive && (
                            <span className="w-2 h-2 bg-green-400 rounded-full" />
                          )}
                          {period.id === currentPeriod?.id && (
                            <Check size={14} />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {periods.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <Calendar size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className={`text-sm ${theme.textMuted}`}>No periods found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && selectedCompanyForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <Card className={`w-full max-w-md ${theme.cardBg}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-10 h-10 rounded-lg bg-gradient-to-r ${theme.primaryGradient}
                    flex items-center justify-center text-white
                  `}>
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme.textPrimary}`}>
                      Company Password Required
                    </h3>
                    <p className={`text-sm ${theme.textMuted}`}>
                      {selectedCompanyForPassword.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                    setPasswordError('');
                    setSelectedCompanyForPassword(null);
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
                      setSelectedCompanyForPassword(null);
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
    </>
  );
}

export default CompanySelector;