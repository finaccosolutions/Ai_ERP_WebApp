import React, { useState } from 'react';
import { Building, ChevronDown } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface CompanyNameDisplayProps {
  // Add any props needed for the display component itself
  sidebarOpen: boolean;
  sidebarWidth: string;
}

function CompanyNameDisplay({ sidebarOpen, sidebarWidth }: CompanyNameDisplayProps) {
  const { currentCompany, currentPeriod } = useCompany();
  const { theme } = useTheme();
  const navigate = useNavigate();

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
        onClick={() => navigate('/company/manage')}
        className={`
          flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-300
          bg-slate-800 text-white border border-slate-600 shadow-md
          hover:bg-slate-700 hover:shadow-lg min-w-[240px] h-[44px]
        `}
      >
        <div className="flex items-center space-x-3 flex-1">
          <div className={`
            w-8 h-8 rounded-lg bg-gradient-to-r ${theme.primaryGradient}
            flex items-center justify-center text-white text-sm font-bold
          `}>
            {currentCompany ? getCountryFlag(currentCompany.country) : <Building size={16} />}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className={`text-sm font-medium text-white truncate leading-tight`}>
              {currentCompany?.name || 'Select Company'}
            </p>
            {currentPeriod && (
              <p className="text-xs text-gray-300 truncate leading-tight">
                {currentPeriod.name}
              </p>
            )}
          </div>
        </div>
        <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
      </button>
    </>
  );
}

export default CompanyNameDisplay;
