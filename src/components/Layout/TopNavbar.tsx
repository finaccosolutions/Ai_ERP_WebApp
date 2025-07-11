import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Mic, 
  Zap,
  Sparkles,
  Hexagon,
  Calendar,
  Settings,
  LogOut,
  User,
  Sun,
  Moon,
  Menu,
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';
import CompanyNameDisplay from '../Company/CompanyNameDisplay';

interface TopNavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAI: boolean;
  setShowAI: (show: boolean) => void;
}

function TopNavbar({ sidebarOpen, setSidebarOpen, showAI, setShowAI }: TopNavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isVoiceSearch, setIsVoiceSearch] = useState(false);
  
  const { user, logout } = useAuth();
  const { currentCompany, currentPeriod } = useCompany();
  const { isAIEnabled, toggleAI, smartSearch, voiceCommand } = useAI();
  const { theme, toggleDarkMode } = useTheme();

  const handleVoiceSearch = async () => {
    setIsVoiceSearch(true);
    
    try {
      // Mock voice recognition - in production, use Web Speech API
      setTimeout(async () => {
        const mockQueries = [
          "Show me sales in June 2024",
          "What's my TDS liability this quarter",
          "Show unpaid invoices over 30 days",
          "Top 5 customers by revenue"
        ];
        
        const mockQuery = mockQueries[Math.floor(Math.random() * mockQueries.length)];
        setSearchQuery(mockQuery);
        
        const result = await voiceCommand(mockQuery);
        console.log('Voice search result:', result);
        
        setIsVoiceSearch(false);
      }, 2000);
    } catch (error) {
      setIsVoiceSearch(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      const result = await smartSearch(searchQuery);
      console.log('Smart search result:', result);
      // Handle search results - could open a results modal or navigate
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const notifications = [
    { 
      id: 1, 
      title: 'AI Suggestion Available', 
      message: 'New invoice pattern detected - would you like to create a template?', 
      time: '5 min ago', 
      unread: true,
      type: 'ai'
    },
    { 
      id: 2, 
      title: 'Payment Received', 
      message: '$5,000 payment processed automatically', 
      time: '1 hour ago', 
      unread: true,
      type: 'payment'
    },
    { 
      id: 3, 
      title: 'Compliance Alert', 
      message: 'GST return due in 3 days - AI can help prepare', 
      time: '2 hours ago', 
      unread: false,
      type: 'compliance'
    },
    { 
      id: 4, 
      title: 'AI Audit Complete', 
      message: 'Found 3 potential issues in recent transactions', 
      time: '4 hours ago', 
      unread: false,
      type: 'audit'
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ai': return <Sparkles size={16} className="text-[#6AC8A3]" />;
      case 'payment': return <span className="w-4 h-4 bg-green-500 rounded-full" />;
      case 'compliance': return <span className="w-4 h-4 bg-orange-500 rounded-full" />;
      case 'audit': return <span className="w-4 h-4 bg-red-500 rounded-full" />;
      default: return <span className="w-4 h-4 bg-blue-500 rounded-full" />;
    }
  };

  return (
    <nav className={`
      fixed top-0 left-0 right-0 z-40 h-16
      ${theme.topNavBg} border-b border-slate-700/30
      shadow-lg backdrop-blur-md
    `}>
      <div className="px-4 h-full flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`
              lg:hidden p-1.5 rounded-lg transition-all duration-300
              text-white hover:bg-white hover:bg-opacity-10 hover:text-[#5DBF99]
            `}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Brand Logo and Name */}
          <div className="flex items-center space-x-3">
            <div className={`
              relative w-10 h-10 bg-gradient-to-br ${theme.primaryGradient}
              rounded-xl flex items-center justify-center shadow-lg
              transform hover:scale-105 transition-all duration-300
            `}>
              <Hexagon size={20} className="text-white relative z-10" />
              <div className="absolute inset-1 border border-white/20 rounded-lg" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white tracking-tight">
                FlowSync
              </h1>
              <p className="text-xs text-white/70 -mt-1">
                Business Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Center Section - Improved AI Search */}
        <div className="flex-1 max-w-2xl mx-4 sm:mx-8">
          <form onSubmit={handleSearch} className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={isAIEnabled ? "AI Search: 'Show sales in June', 'TDS liability'" : "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-9 pr-14 py-2.5 border border-slate-600/30
                rounded-xl bg-slate-800/40 text-white placeholder:text-slate-400
                focus:ring-2 focus:ring-[#6AC8A3]/50 focus:border-[#6AC8A3]/50 focus:bg-slate-800/60
                transition-all duration-300 hover:bg-slate-800/50 backdrop-blur-sm
                ${isAIEnabled ? 'shadow-inner' : ''}
              `}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {isAIEnabled && (
                <Sparkles size={12} className="text-[#6AC8A3] animate-pulse" />
              )}
              <button
                type="button"
                onClick={handleVoiceSearch}
                disabled={!isAIEnabled}
                className={`
                  transition-colors duration-300
                  ${isVoiceSearch 
                    ? 'text-red-400 animate-pulse' 
                    : isAIEnabled 
                      ? 'text-slate-400 hover:text-[#6AC8A3]' 
                      : 'text-slate-300 cursor-not-allowed'
                  }
                `}
              >
                <Mic size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Company Name Display */}
          <CompanyNameDisplay />

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`
              p-2 rounded-xl transition-all duration-300 transform hover:scale-110
              ${theme.isDark 
                ? 'bg-yellow-500/90 text-yellow-900 hover:bg-yellow-400' 
                : 'bg-yellow-500/90 text-yellow-900 hover:bg-yellow-400'
              }
              shadow-md
            `}
          >
            {theme.isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* AI Toggle */}
          <button
            onClick={toggleAI}
            className={`
              p-2 rounded-xl transition-all duration-300 transform hover:scale-110
              relative overflow-hidden
              ${isAIEnabled 
                ? 'bg-gradient-to-r from-[#5DBF99] to-[#6AC8A3] text-white hover:from-[#4FB085] hover:to-[#5DBF99]' 
                : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
              }
              shadow-md
            `}
          >
            <Zap size={16} className="relative z-10" />
            {isAIEnabled && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                             transform -skew-x-12 animate-pulse" />
            )}
          </button>

          {/* AI Assistant */}
          <button
            onClick={() => setShowAI(!showAI)}
            disabled={!isAIEnabled}
            className={`
              p-2 rounded-xl transition-all duration-300 transform hover:scale-110
              relative overflow-hidden shadow-md
              ${isAIEnabled 
                ? `bg-gradient-to-r ${theme.primaryGradient} text-white hover:shadow-[#6AC8A3]/25` 
                : 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'
              }
            `}
          >
            <MessageSquare size={16} className="relative z-10" />
            {isAIEnabled && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                           transform -skew-x-12 -translate-x-full hover:translate-x-full 
                           transition-transform duration-1000 ease-out" />
            )}
          </button>

          {/* Enhanced Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`
                p-2 rounded-xl transition-all duration-300 relative
                text-white hover:bg-white hover:bg-opacity-10 hover:text-[#6AC8A3]
              `}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className={`
                absolute right-0 mt-2 w-80 ${theme.cardBg} border ${theme.borderColor}
                ${theme.borderRadius} ${theme.shadowLevel} z-50
              `}>
                <div className={`p-4 border-b ${theme.borderColor} bg-gradient-to-r ${theme.primaryGradient}`}>
                  <h3 className="font-medium text-white flex items-center space-x-2">
                    <Bell size={16} />
                    <span>Notifications</span>
                    {isAIEnabled && <Sparkles size={12} />}
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`
                        p-4 border-b ${theme.borderColor} transition-all duration-300
                        hover:bg-[#5DBF99] hover:bg-opacity-10
                        ${notification.unread ? 'bg-blue-50 border-l-4 border-l-[#5DBF99]' : ''}
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className={`font-medium text-sm ${theme.textPrimary}`}>
                              {notification.title}
                            </p>
                            <span className={`text-xs ${theme.textMuted}`}>
                              {notification.time}
                            </span>
                          </div>
                          <p className={`text-sm ${theme.textMuted} mt-1`}>
                            {notification.message}
                          </p>
                          {notification.type === 'ai' && (
                            <button className="text-xs text-[#5DBF99] hover:text-[#4FB085] mt-2">
                              View AI Suggestion →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`p-3 border-t ${theme.borderColor} text-center`}>
                  <button className="text-sm text-[#6AC8A3] hover:text-[#5DBF99]">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`
                flex items-center space-x-2 p-2 rounded-xl transition-all duration-300
                hover:bg-white hover:bg-opacity-10
              `}
            >
              <img
                src={user?.avatar || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150'}
                alt="User"
                className="w-8 h-8 rounded-full border-2 border-[#6AC8A3]"
              />
              <span className="text-sm font-medium hidden sm:block text-white">
                {user?.name}
              </span>
            </button>
            {showUserMenu && (
              <div className={`
                absolute right-0 mt-2 w-48 ${theme.cardBg} border ${theme.borderColor}
                ${theme.borderRadius} ${theme.shadowLevel} z-50
              `}>
                <div className="py-1">
                  <button className={`
                    w-full px-4 py-2 text-left text-sm flex items-center transition-all duration-300
                    ${theme.textPrimary} hover:bg-[#6AC8A3] hover:text-white
                  `}>
                    <User size={16} className="mr-2" />
                    Profile
                  </button>
                  <button className={`
                    w-full px-4 py-2 text-left text-sm flex items-center transition-all duration-300
                    ${theme.textPrimary} hover:bg-[#6AC8A3] hover:text-white
                  `}>
                    <Settings size={16} className="mr-2" />
                    Settings
                  </button>
                  {isAIEnabled && (
                    <button className={`
                      w-full px-4 py-2 text-left text-sm flex items-center transition-all duration-300
                      ${theme.textPrimary} hover:bg-[#6AC8A3] hover:text-white
                    `}>
                      <Zap size={16} className="mr-2" />
                      AI Preferences
                    </button>
                  )}
                  <hr className={`my-1 ${theme.borderColor}`} />
                  <button
                    onClick={logout}
                    className={`
                      w-full px-4 py-2 text-left text-sm flex items-center transition-all duration-300
                      text-red-600 hover:bg-red-50 hover:text-red-700
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