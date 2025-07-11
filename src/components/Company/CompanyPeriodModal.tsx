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
  Plus
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../UI/Card';
import Button from '../UI/Button';

interface CompanyPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CompanyPeriodModal({ isOpen, onClose }: CompanyPeriodModalProps) {
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

  useEffect(() => {
    if (isOpen) {
      setView('companies');
      setSelectedCompany(null);
      setSearchTerm('');
    }
  }, [isOpen]);

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
    company.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company);
    setView('periods');
  };

  const handlePeriodSelect = (period: any) => {
    if (selectedCompany && selectedCompany.id !== currentCompany?.id) {
      switchCompany(selectedCompany.id);
    }
    switchPeriod(period.id);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
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

  // Create a default period if none exist
  const displayPeriods = periods.length > 0 ? periods : [{
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <Card className={`w-full max-w-4xl h-[600px] ${theme.cardBg} flex flex-col`}>
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
            <h2 className="text-xl font-semibold text-white">
              {view === 'companies' ? 'Select Company' : 'Select Period'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {view === 'companies' ? (
            <>
              {/* Left Panel - Company List */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`
                        w-full pl-10 pr-4 py-2 border ${theme.borderColor} rounded-lg
                        ${theme.inputBg} ${theme.textPrimary}
                        focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                      `}
                    />
                  </div>
                </div>

                {/* Company List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredCompanies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => handleCompanySelect(company)}
                      className={`
                        w-full p-4 text-left rounded-xl border transition-all duration-300
                        ${company.id === currentCompany?.id 
                          ? 'border-[#6AC8A3] bg-[#6AC8A3]/10' 
                          : `${theme.borderColor} hover:border-[#6AC8A3] hover:bg-[#6AC8A3]/5`
                        }
                        group
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center text-lg
                            ${company.id === currentCompany?.id 
                              ? 'bg-[#6AC8A3] text-white' 
                              : 'bg-gray-100 group-hover:bg-[#6AC8A3]/20'
                            }
                          `}>
                            {getCountryFlag(company.country)}
                          </div>
                          <div>
                            <h3 className={`font-medium ${theme.textPrimary} group-hover:text-[#5DBF99]`}>
                              {company.name}
                            </h3>
                            <p className={`text-sm ${theme.textMuted}`}>
                              {company.country}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {company.id === currentCompany?.id && (
                            <Check size={16} className="text-[#6AC8A3]" />
                          )}
                          <ChevronRight size={16} className="text-gray-400 group-hover:text-[#6AC8A3]" />
                        </div>
                      </div>
                    </button>
                  ))}

                  {filteredCompanies.length === 0 && (
                    <div className="text-center py-12">
                      <Building size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className={`${theme.textMuted}`}>No companies found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Current Company Details */}
              <div className="w-1/2 p-6">
                {currentCompany ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className={`
                        w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r ${theme.primaryGradient}
                        flex items-center justify-center text-3xl mb-4
                      `}>
                        {getCountryFlag(currentCompany.country)}
                      </div>
                      <h3 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                        {currentCompany.name}
                      </h3>
                      <p className={`${theme.textMuted}`}>Current Company</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Globe size={16} className="text-[#6AC8A3]" />
                        <div>
                          <p className={`text-sm ${theme.textMuted}`}>Country</p>
                          <p className={`font-medium ${theme.textPrimary}`}>{currentCompany.country}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <MapPin size={16} className="text-[#6AC8A3]" />
                        <div>
                          <p className={`text-sm ${theme.textMuted}`}>Currency</p>
                          <p className={`font-medium ${theme.textPrimary}`}>{currentCompany.currency}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Calendar size={16} className="text-[#6AC8A3]" />
                        <div>
                          <p className={`text-sm ${theme.textMuted}`}>Fiscal Year</p>
                          <p className={`font-medium ${theme.textPrimary}`}>
                            {formatDate(currentCompany.fiscalYearStart)} - {formatDate(currentCompany.fiscalYearEnd)}
                          </p>
                        </div>
                      </div>

                      {currentPeriod && (
                        <div className="p-4 bg-[#6AC8A3]/10 rounded-xl border border-[#6AC8A3]/20">
                          <p className={`text-sm ${theme.textMuted} mb-1`}>Current Period</p>
                          <p className={`font-medium ${theme.textPrimary}`}>{currentPeriod.name}</p>
                          <p className={`text-sm ${theme.textMuted}`}>
                            {formatDate(currentPeriod.startDate)} - {formatDate(currentPeriod.endDate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className={`${theme.textMuted}`}>Select a company to view details</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Period Selection View */
            <div className="w-full flex flex-col">
              {/* Selected Company Header */}
              {selectedCompany && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#5DBF99] to-[#6AC8A3] flex items-center justify-center text-lg">
                      {getCountryFlag(selectedCompany.country)}
                    </div>
                    <div>
                      <h3 className={`font-medium ${theme.textPrimary}`}>{selectedCompany.name}</h3>
                      <p className={`text-sm ${theme.textMuted}`}>{selectedCompany.country}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Periods List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3">
                  {displayPeriods.map((period) => (
                    <button
                      key={period.id}
                      onClick={() => handlePeriodSelect(period)}
                      className={`
                        w-full p-4 text-left rounded-xl border transition-all duration-300
                        ${period.id === currentPeriod?.id 
                          ? 'border-[#6AC8A3] bg-[#6AC8A3]/10' 
                          : `${theme.borderColor} hover:border-[#6AC8A3] hover:bg-[#6AC8A3]/5`
                        }
                        group
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center
                            ${period.id === currentPeriod?.id 
                              ? 'bg-[#6AC8A3] text-white' 
                              : 'bg-gray-100 text-gray-600 group-hover:bg-[#6AC8A3]/20'
                            }
                          `}>
                            <Calendar size={20} />
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className={`font-medium ${theme.textPrimary} group-hover:text-[#5DBF99]`}>
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
                            </div>
                            <p className={`text-sm ${theme.textMuted}`}>
                              {formatDate(period.startDate)} - {formatDate(period.endDate)}
                            </p>
                          </div>
                        </div>

                        {period.id === currentPeriod?.id && (
                          <Check size={20} className="text-[#6AC8A3]" />
                        )}
                      </div>
                    </button>
                  ))}

                  {periods.length === 0 && (
                    <div className="text-center py-12">
                      <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className={`${theme.textMuted} mb-4`}>No periods found for this company</p>
                      <Button icon={<Plus size={16} />}>
                        Create Period
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default CompanyPeriodModal;