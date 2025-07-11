import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Mic, 
  Bot, 
  Building, 
  Calendar,
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';

interface TopNavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAI: boolean;
  setShowAI: (show: boolean) => void;
}

function TopNavbar({ sidebarOpen, setSidebarOpen, showAI, setShowAI }: TopNavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  
  const { user, logout } = useAuth();
  const { currentCompany, currentPeriod, companies, periods, switchCompany, switchPeriod } = useCompany();
  const { isAIEnabled, toggleAI } = useAI();
  const { theme } = useTheme();

  const handleVoiceSearch = () => {
    // Voice search implementation
    console.log('Voice search activated');
  };

  return (
    <nav className={`
      fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-gray-200 
      ${theme.shadowLevel}
    `}>
      <div className="px-4 h-full flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className={`
              w-8 h-8 bg-gradient-to-r ${theme.primaryGradient} 
              ${theme.borderRadius} flex items-center justify-center
            `}>
              <Building size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">ERP Pro</h1>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Smart search across all modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-10 pr-12 py-2 border border-gray-300 
                ${theme.borderRadius} focus:ring-2 focus:ring-blue-500 focus:border-transparent
              `}
            />
            <button
              onClick={handleVoiceSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Mic size={20} />
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Company Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCompanyMenu(!showCompanyMenu)}
              className={`
                flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 
                ${theme.borderRadius} hover:bg-gray-200 transition-colors
              `}
            >
              <Building size={16} />
              <span>{currentCompany?.name}</span>
            </button>
            {showCompanyMenu && (
              <div className={`
                absolute right-0 mt-2 w-56 bg-white ${theme.borderRadius} ${theme.shadowLevel} z-50
              `}>
                <div className="py-1">
                  {companies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => {
                        switchCompany(company.id);
                        setShowCompanyMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      {company.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Period Selector */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className={`
                flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 
                ${theme.borderRadius} hover:bg-gray-200 transition-colors
              `}
            >
              <Calendar size={16} />
              <span>{currentPeriod?.name}</span>
            </button>
            {showPeriodMenu && (
              <div className={`
                absolute right-0 mt-2 w-48 bg-white ${theme.borderRadius} ${theme.shadowLevel} z-50
              `}>
                <div className="py-1">
                  {periods.map(period => (
                    <button
                      key={period.id}
                      onClick={() => {
                        switchPeriod(period.id);
                        setShowPeriodMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      {period.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Toggle */}
          <button
            onClick={toggleAI}
            className={`
              p-2 ${theme.borderRadius} transition-colors
              ${isAIEnabled 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'
              }
            `}
          >
            <Bot size={20} />
          </button>

          {/* AI Assistant */}
          <button
            onClick={() => setShowAI(!showAI)}
            className={`
              p-2 ${theme.borderRadius} bg-gradient-to-r ${theme.primaryGradient} 
              text-white hover:opacity-90 transition-opacity
            `}
          >
            <Bot size={20} />
          </button>

          {/* Notifications */}
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <Bell size={20} />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
            >
              <img
                src={user?.avatar || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150'}
                alt="User"
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium">{user?.name}</span>
            </button>
            {showUserMenu && (
              <div className={`
                absolute right-0 mt-2 w-48 bg-white ${theme.borderRadius} ${theme.shadowLevel} z-50
              `}>
                <div className="py-1">
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center">
                    <User size={16} className="mr-2" />
                    Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center">
                    <Settings size={16} className="mr-2" />
                    Settings
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center text-red-600"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default TopNavbar;