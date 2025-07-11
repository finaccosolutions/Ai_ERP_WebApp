import React, { useState } from 'react';
import { Building, ChevronDown } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';
import CompanyPeriodModal from './CompanyPeriodModal';

function CompanyNameDisplay() {
  const { currentCompany } = useCompany();
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);

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

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`
          flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-300
          ${theme.isDark 
            ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600' 
            : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
          }
          hover:border-[#6AC8A3] hover:shadow-md min-w-[200px] h-[42px]
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
          </div>
        </div>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      <CompanyPeriodModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

export default CompanyNameDisplay;