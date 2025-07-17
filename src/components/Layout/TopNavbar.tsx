// src/components/Layout/TopNavbar.tsx
import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Mic, 
  Settings,
  LogOut,
  User,
  Sun,
  Moon,
  Menu,
  X,
  Bot, // Changed from MessageSquare for AI Assistant icon
  Hexagon // <--- ADDED THIS IMPORT
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';
import CompanyNameDisplay from '../Company/CompanyNameDisplay';
import { Link } from 'react-router-dom'; // Import Link

interface TopNavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarWidth: string; // New prop for sidebar width
  showAI: boolean;
  setShowAI: (show: boolean) => void;
  setShowLogoutConfirm: (show: boolean) => void; // New prop
}

function TopNavbar({ sidebarOpen, setSidebarOpen, sidebarWidth, showAI, setShowAI, setShowLogoutConfirm }: TopNavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isVoiceSearch, setIsVoiceSearch] = useState(false);
  
  const { user, logout } = useAuth();
  const { currentCompany, currentPeriod } = useCompany();
  const { isAIEnabled, smartSearch, voiceCommand } = useAI();
  const { theme, toggleDarkMode } = useTheme();

  const handleVoiceSearch = async () => {
    setIsVoiceSearch(true);
    
    try {
      // Mock voice recognition - in production, use Web Speech API
      setTimeout(async () => {
        const mockCommands = [
          "Show me sales in June 2024",
          "What's my TDS liability this quarter",
          "Show unpaid invoices over 30 days",
          "Top 5 customers by revenue"
        ];
        
        const mockQuery = mockCommands[Math.floor(Math.random() * mockCommands.length)];
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

  // Removed dummy notifications array and unreadCount calculation
  const notifications: any[] = []; // Placeholder for actual notifications
  const unreadCount = 0; // Will be calculated from actual notifications

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ai': return <Bot size={16} className="text-[#6AC8A3]" />; // Changed from Sparkles
      case 'payment': return <span className="w-4 h-4 bg-green-500 rounded-full" />;
      case 'compliance': return <span className="w-4 h-4 bg-orange-500 rounded-full" />;
      case 'audit': return <span className="w-4 h-4 bg-red-500 rounded-full" />;
      default: return <span className="w-4 h-4 bg-blue-500 rounded-full" />;
    }
  };

  const handleLogoutClick = () => {
    setShowUserMenu(false); // Hide user menu
    setShowLogoutConfirm(true); // Show confirmation modal
  };

  // Function to get user initials for avatar placeholder
  const getUserInitials = (fullName?: string | null) => {
    if (!fullName) return 'UN'; // Unknown User
    const parts = fullName.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
            <div className="group relative"> {/* Added group for tooltip */}
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
              <div className={`
                absolute left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-700 text-white text-xs
                rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-300 whitespace-nowrap z-50
              `}>
                {sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-1
                              border-4 border-transparent border-b-gray-700" />
              </div>
            </div>
          </button>

          {/* Brand Logo and Name */}
          <div className="flex items-center space-x-3">
            <div className={`
              relative w-10 h-10 bg-gradient-to-br ${theme.primaryGradient}
              rounded-xl flex items-center justify-center shadow-lg
              transform hover:scale-105 transition-all duration-300
            `}>
              <Hexagon size={20} className="text-white relative z-10" />
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
                <span className="text-[#6AC8A3] animate-pulse text-xs">AI</span>
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
          <CompanyNameDisplay sidebarOpen={sidebarOpen} sidebarWidth={sidebarWidth} />

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`
              p-2 rounded-xl transition-all duration-300 transform hover:scale-110 group relative
              ${theme.isDark 
                ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' // Dark mode: gray background, yellow icon
                : 'bg-yellow-500/90 text-yellow-900 hover:bg-yellow-400' // Light mode: yellow background, dark yellow icon
              }
              shadow-md
            `}
          >
            {theme.isDark ? <Sun size={16} /> : <Moon size={16} />}
            <div className={`
              absolute left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-700 text-white text-xs
              rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible
              transition-all duration-300 whitespace-nowrap z-50
            `}>
              Toggle Theme
              <div className="absolute left-1/2 transform -translate-x-1/2 -top-1
                            border-4 border-transparent border-b-gray-700" />
            </div>
          </button>

          {/* AI Assistant Icon (Bot) */}
          <button
            onClick={() => setShowAI(!showAI)}
            disabled={!isAIEnabled}
            className={`
              p-2 rounded-xl transition-all duration-300 transform hover:scale-110 relative group
              relative overflow-hidden shadow-md
              ${isAIEnabled 
                ? `bg-gradient-to-r ${theme.primaryGradient} text-white hover:shadow-[#6AC8A3]/25` 
                : 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'
              }
            `}
          >
            <Bot size={20} className="relative z-10" /> {/* Increased size to 20 */}
            {isAIEnabled && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                           transform -skew-x-12 -translate-x-full hover:translate-x-full 
                           transition-transform duration-1000 ease-out" />
            )}
            {/* Tooltip for AI Assistant icon */}
            <div className={`
              absolute left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-700 text-white text-xs
              rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible
              transition-all duration-300 whitespace-nowrap z-50
            `}>
              AI Assistant
              <div className="absolute left-1/2 transform -translate-x-1/2 -top-1
                            border-4 border-transparent border-b-gray-700" />
            </div>
          </button>

          {/* Enhanced Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`
                p-2 rounded-xl transition-all duration-300 relative group
                text-white hover:bg-white hover:bg-opacity-10 hover:text-[#6AC8A3]
              `}
            >
              <Bell size={20} /> {/* Increased size to 20 */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
              <div className={`
                absolute left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-700 text-white text-xs
                rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-300 whitespace-nowrap z-50
              `}>
                Notifications
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-1
                              border-4 border-transparent border-b-gray-700" />
              </div>
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
                    {isAIEnabled && <Bot size={12} />} {/* Changed from Sparkles */}
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No new notifications.</div>
                  ) : (
                    notifications.map(notification => (
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
                    ))
                  )}
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
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full border-2 border-[#6AC8A3]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-[#6AC8A3] bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                  {getUserInitials(user?.name)}
                </div>
              )}
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
                  {/* Consolidated link */}
                  <Link to="/user/profile" onClick={() => setShowUserMenu(false)} className={`
                    w-full px-4 py-2 text-left text-sm flex items-center transition-all duration-300
                    ${theme.textPrimary} hover:bg-[#6AC8A3]/10 hover:text-[#6AC8A3]
                  `}>
                    <User size={16} className="mr-2" />
                    My Account
                  </Link>
                  <hr className={`my-1 ${theme.borderColor}`} />
                  <button
                    onClick={handleLogoutClick} // Use the new handler
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