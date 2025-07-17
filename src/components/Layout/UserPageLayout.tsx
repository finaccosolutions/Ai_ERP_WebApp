// src/components/Layout/UserPageLayout.tsx
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { User, Settings, Bot, Lock, Info, Palette, Globe, Calendar, Bell, LayoutDashboard, Zap, Brain, ChevronDown } from 'lucide-react';
import Card from '../UI/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// Import the actual page components
import ProfilePage from '../../pages/User/ProfilePage';
import UserSettingsPage from '../../pages/User/SettingsPage';
import AIPreferencesPage from '../../pages/User/AIPreferencesPage';

function UserPageLayout() {
  const { theme } = useTheme();
  const location = useLocation();
  const { hasPermission } = useAuth();

  // Define main navigation items and their sub-sections
  const navItems = [
    {
      name: 'Profile',
      icon: User,
      path: '/user/profile',
      sections: [
        { id: 'profile-personal', name: 'Personal Information', icon: Info },
        { id: 'profile-password', name: 'Change Password', icon: Lock },
      ],
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/user/settings',
      sections: [
        { id: 'settings-appearance', name: 'Appearance', icon: Palette },
        { id: 'settings-localization', name: 'Localization', icon: Globe },
        { id: 'settings-notifications', name: 'Notifications', icon: Bell },
        { id: 'settings-dashboard', name: 'Dashboard & Views', icon: LayoutDashboard },
        { id: 'settings-security', name: 'Security', icon: Lock },
      ],
    },
    {
      name: 'AI Preferences',
      icon: Bot,
      path: '/user/ai-preferences',
      sections: [
        { id: 'ai-general', name: 'General AI Features', icon: Zap },
        { id: 'ai-suggestions', name: 'Suggestion & Response', icon: Brain },
        { id: 'ai-advanced', name: 'Advanced AI Features', icon: Settings },
        { id: 'ai-model', name: 'AI Model & Integration', icon: Bot },
      ],
    },
  ];

  // Determine the initial active main tab and sub-section
  const initialMainItem = navItems.find(item => location.pathname.startsWith(item.path)) || navItems[0];
  const initialSectionId = initialMainItem.sections.find(section => 
    location.pathname.endsWith(section.id.split('-')[1]) // e.g., 'profile' from 'profile-personal'
  )?.id || initialMainItem.sections[0]?.id;

  const [activeMainTab, setActiveMainTab] = useState(initialMainItem.path);
  const [activeSectionId, setActiveSectionId] = useState(initialSectionId);

  // Effect to update active section when URL changes (e.g., direct navigation)
  useEffect(() => {
    const newMainItem = navItems.find(item => location.pathname.startsWith(item.path)) || navItems[0];
    setActiveMainTab(newMainItem.path);

    const newActiveSectionId = newMainItem.sections.find(section => 
      location.pathname.endsWith(section.id.split('-')[1])
    )?.id || newMainItem.sections[0]?.id;
    
    setActiveSectionId(newActiveSectionId);
  }, [location.pathname]);

  // Function to render the content based on activeSectionId
  const renderContent = () => {
    switch (activeMainTab) {
      case '/user/profile':
        return <ProfilePage activeSection={activeSectionId} />;
      case '/user/settings':
        return <UserSettingsPage activeSection={activeSectionId} />;
      case '/user/ai-preferences':
        return <AIPreferencesPage activeSection={activeSectionId} />;
      default:
        return <ProfilePage activeSection="profile-personal" />; // Fallback
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Panel - Navigation */}
      <Card className={`p-4 lg:w-64 flex-shrink-0 ${theme.isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <nav className="space-y-2">
          {navItems.map((mainItem) => (
            <div key={mainItem.path}>
              <button
                onClick={() => {
                  // Toggle main tab visibility
                  setActiveMainTab(activeMainTab === mainItem.path ? '' : mainItem.path);
                  // If opening, set active section to its first sub-section
                  if (activeMainTab !== mainItem.path) {
                    setActiveSectionId(mainItem.sections[0]?.id);
                  }
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-300
                  ${activeMainTab === mainItem.path
                    ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-md`
                    : `${theme.textPrimary} hover:bg-gray-100 ${theme.isDark ? 'hover:bg-gray-700' : ''}`
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <mainItem.icon size={18} />
                  <span className="font-medium">{mainItem.name}</span>
                </div>
                <ChevronDown size={16} className={`transition-transform duration-300 ${activeMainTab === mainItem.path ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Sub-sections with smooth transition */}
              <div 
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                `}
                style={{
                  maxHeight: activeMainTab === mainItem.path ? `${mainItem.sections.length * 40 + 8}px` : '0', // 40px per item + padding
                  paddingTop: activeMainTab === mainItem.path ? '8px' : '0',
                  paddingBottom: activeMainTab === mainItem.path ? '8px' : '0',
                }}
              >
                <div className="ml-4 space-y-1"> {/* Indent sub-sections */}
                  {mainItem.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSectionId(section.id)}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-1.5 rounded-lg text-sm transition-colors duration-200
                        ${activeSectionId === section.id
                          ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-sm` // Distinct background for selected sub-item
                          : `${theme.textMuted} hover:bg-gray-50 ${theme.isDark ? 'hover:bg-gray-750' : ''}`
                        }
                      `}
                    >
                      <section.icon size={16} />
                      <span>{section.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>
      </Card>

      {/* Right Panel - Content */}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
}

export default UserPageLayout;