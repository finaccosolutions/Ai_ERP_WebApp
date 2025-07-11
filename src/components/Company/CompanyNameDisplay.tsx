import React, { useState } from 'react';
import { Building, ChevronDown } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';
import CompanyPeriodModal from './CompanyPeriodModal';

interface CompanyNameDisplayProps {
  // Add any props needed for the display component itself
  sidebarOpen: boolean;
  sidebarWidth: string;
}

function CompanyNameDisplay({ sidebarOpen, sidebarWidth }: CompanyNameDisplayProps) {
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
          bg-slate-800 text-white border border-slate-600 shadow-md
          hover:bg-slate-700 hover:shadow-lg min-w-[200px] h-[42px]
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
            <p className={`text-sm font-medium text-white truncate`}>
              {currentCompany?.name || 'Select Company'}
            </p>
          </div>
        </div>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      <CompanyPeriodModal 
        isOpen={showModal}
        sidebarOpen={sidebarOpen}
        sidebarWidth={sidebarWidth}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

export default CompanyNameDisplay;
