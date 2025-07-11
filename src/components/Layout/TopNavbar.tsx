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
  User,
  Sun,
  Moon,
  Menu,
  X
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
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { user, logout } = useAuth();
  const { currentCompany, currentPeriod, companies, periods, switchCompany, switchPeriod } = useCompany();
  const { isAIEnabled, toggleAI } = useAI();
  const { theme, toggleDarkMode } = useTheme();

  const handleVoiceSearch = () => {
    console.log('Voice search activated');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
  };

  const notifications = [
    { id: 1, title: 'New Order Received', message: 'Order #1234 from ABC Corp', time: '5 min ago', unread: true },
    { id: 2, title: 'Payment Received', message: '$5,000 payment processed', time: '1 hour ago', unread: true },
    { id: 3, title: 'Low Stock Alert', message: 'Product A is running low', time: '2 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <nav className={`
      fixed top-0 left-0 right-0 z-40 h-16 
      ${theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
      border-b ${theme.shadowLevel} backdrop-blur-sm
    `}>
      <div className="px-4 h-full flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`
              lg:hidden p-2 rounded-lg transition-colors
              ${theme.isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center space-x-3">
            <div className={`
              w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 
              ${theme.borderRadius} flex items-center justify-center shadow-lg
            `}>
              <Building size={16} className="text-white" />
            </div>
            <h1 className={`text-xl font-bold ${theme.isDark ? 'text-white' : 'text-gray-800'} hidden sm:block`}>
              ERP Pro
            </h1>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-2xl mx-4 sm:mx-8">
          <form onSubmit={handleSearch} className="relative">
            <Search size={20} className={`
              absolute left-3 top-1/2 transform -translate-y-1/2 
              ${theme.isDark ? 'text-gray-400' : 'text-gray-400'}
            `} />
            <input
              type="text"
              placeholder="Smart search across all modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-10 pr-12 py-2 border 
                ${theme.isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'} 
                ${theme.borderRadius} focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200
              `}
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`
                absolute right-3 top-1/2 transform -translate-y-1/2 
                ${theme.isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
                transition-colors duration-200
              `}
            >
              <Mic size={20} />
            </button>
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Company Selector */}
          {currentCompany && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                className={`
                  flex items-center space-x-2 px-3 py-2 text-sm 
                  ${theme.isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} 
                  ${theme.borderRadius} transition-colors duration-200
                `}
              >
                <Building size={16} />
                <span className="hidden lg:inline">{currentCompany.name}</span>
              </button>
              {showCompanyMenu && (
                <div className={`
                  absolute right-0 mt-2 w-56 
                  ${theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                  border ${theme.borderRadius} ${theme.shadowLevel} z-50
                `}>
                  <div className="py-1">
                    {companies.map(company => (
                      <button
                        key={company.id}
                        onClick={() => {
                          switchCompany(company.id);
                          setShowCompanyMenu(false);
                        }}
                        className={`
                          w-full px-4 py-2 text-left text-sm transition-colors
                          ${theme.isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}
                        `}
                      >
                        {company.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Period Selector */}
          {currentPeriod && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                className={`
                  flex items-center space-x-2 px-3 py-2 text-sm 
                  ${theme.isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} 
                  ${theme.borderRadius} transition-colors duration-200
                `}
              >
                <Calendar size={16} />
                <span className="hidden lg:inline">{currentPeriod.name}</span>
              </button>
              {showPeriodMenu && (
                <div className={`
                  absolute right-0 mt-2 w-48 
                  ${theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                  border ${theme.borderRadius} ${theme.shadowLevel} z-50
                `}>
                  <div className="py-1">
                    {periods.map(period => (
                      <button
                        key={period.id}
                        onClick={() => {
                          switchPeriod(period.id);
                          setShowPeriodMenu(false);
                        }}
                        className={`
                          w-full px-4 py-2 text-left text-sm transition-colors
                          ${theme.isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}
                        `}
                      >
                        {period.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`
              p-2 ${theme.borderRadius} transition-all duration-200 transform hover:scale-110
              ${theme.isDark 
                ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400' 
                : 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
              }
            `}
          >
            {theme.isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* AI Toggle */}
          <button
            onClick={toggleAI}
            className={`
              p-2 ${theme.borderRadius} transition-all duration-200 transform hover:scale-110
              ${isAIEnabled 
                ? 'bg-green-500 text-white hover:bg-green-400' 
                : `${theme.isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`
              }
            `}
          >
            <Bot size={20} />
          </button>

          {/* AI Assistant */}
          <button
            onClick={() => setShowAI(!showAI)}
            className={`
              p-2 ${theme.borderRadius} bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 
              text-white hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-110
              shadow-lg
            `}
          >
            <Bot size={20} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`
                p-2 ${theme.borderRadius} transition-colors duration-200 relative
                ${theme.isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}
              `}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className={`
                absolute right-0 mt-2 w-80 
                ${theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                border ${theme.borderRadius} ${theme.shadowLevel} z-50
              `}>
                <div className={`p-4 border-b ${theme.isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`font-semibold ${theme.isDark ? 'text-white' : 'text-gray-900'}`}>
                    Notifications
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`
                        p-4 border-b ${theme.isDark ? 'border-gray-700' : 'border-gray-200'} transition-colors
                        ${theme.isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}
                        ${notification.unread ? (theme.isDark ? 'bg-blue-900' : 'bg-blue-50') : ''}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${theme.isDark ? 'text-white' : 'text-gray-900'}`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                        </div>
                        <span className={`text-xs ${theme.isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {notification.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`
                flex items-center space-x-2 p-2 rounded-lg transition-colors
                ${theme.isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
              `}
            >
              <img
                src={user?.avatar || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150'}
                alt="User"
                className="w-8 h-8 rounded-full border-2 border-gray-300"
              />
              <span className={`text-sm font-medium hidden sm:block ${theme.isDark ? 'text-white' : 'text-gray-700'}`}>
                {user?.name}
              </span>
            </button>
            {showUserMenu && (
              <div className={`
                absolute right-0 mt-2 w-48 
                ${theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                border ${theme.borderRadius} ${theme.shadowLevel} z-50
              `}>
                <div className="py-1">
                  <button className={`
                    w-full px-4 py-2 text-left text-sm flex items-center transition-colors
                    ${theme.isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}
                  `}>
                    <User size={16} className="mr-2" />
                    Profile
                  </button>
                  <button className={`
                    w-full px-4 py-2 text-left text-sm flex items-center transition-colors
                    ${theme.isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}
                  `}>
                    <Settings size={16} className="mr-2" />
                    Settings
                  </button>
                  <hr className={`my-1 ${theme.isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                  <button
                    onClick={logout}
                    className={`
                      w-full px-4 py-2 text-left text-sm flex items-center transition-colors
                      ${theme.isDark ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}
                    `}
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