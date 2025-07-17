// src/pages/User/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { Settings, Palette, Globe, Calendar, Lock, Database, Save, Bell, LayoutDashboard, Volume2 } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';

interface UserSettingsPageProps {
  activeSection: string; // e.g., 'settings-appearance', 'settings-localization'
}

function UserSettingsPage({ activeSection }: UserSettingsPageProps) {
  const { theme, toggleDarkMode, updateTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();

  const [settings, setSettings] = useState<any>({
    defaultTheme: theme.isDark ? 'dark' : 'light',
    language: 'en',
    dateFormat: 'DD-MM-YYYY',
    enableTwoFactorAuth: false,
    notificationEmail: true,
    notificationInApp: true,
    notificationSound: true,
    dashboardLayout: 'default', // e.g., 'default', 'compact'
    defaultModuleView: { // Example for default views per module
      sales: 'invoices',
      purchase: 'orders',
    },
    timezone: 'Asia/Kolkata', // Default timezone
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch user preferences from database on component mount
    const fetchPreferences = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user preferences:', error);
        } else if (data?.preferences) {
          setSettings((prev: any) => ({ ...prev, ...data.preferences }));
        }
      }
    };
    fetchPreferences();
  }, [user]);

  const handleSettingChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleNestedSettingChange = (parentField: string, childField: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] || {}),
        [childField]: value,
      },
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        showNotification('User not authenticated.', 'error');
        return;
      }

      const { data, error } = await supabase // Added data
        .from('user_profiles')
        .update({ preferences: settings })
        .eq('id', user.id)
        .select(); // Added select() to get data back

      if (error) {
        console.error('Supabase Settings Update Error:', error); // Log error
        throw error;
      }
      console.log('Supabase Settings Update Success:', data); // Log success

      if (settings.defaultTheme === 'dark' && !theme.isDark) {
        toggleDarkMode();
      } else if (settings.defaultTheme === 'light' && theme.isDark) {
        toggleDarkMode();
      }
      
      showNotification('Settings saved successfully!', 'success');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      showNotification(error.message || 'Failed to save settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>User Settings</h1>
          <p className={theme.textSecondary}>Configure your application preferences.</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={loading} icon={<Save size={16} />}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {activeSection === 'settings-appearance' && (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
            <Palette size={20} className="mr-2 text-[#6AC8A3]" />
            Appearance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Theme
              </label>
              <select
                value={settings.defaultTheme}
                onChange={(e) => handleSettingChange('defaultTheme', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                `}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <FormField
              label="Timezone"
              value={settings.timezone}
              onChange={(val) => handleSettingChange('timezone', val)}
              placeholder="e.g., Asia/Kolkata"
              icon={<Calendar size={18} />}
            />
          </div>
        </Card>
      )}

      {activeSection === 'settings-localization' && (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mt-6 mb-4 flex items-center`}>
            <Globe size={20} className="mr-2 text-[#6AC8A3]" />
            Localization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                `}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Date Format
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                `}
              >
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {activeSection === 'settings-notifications' && (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mt-6 mb-4 flex items-center`}>
            <Bell size={20} className="mr-2 text-[#6AC8A3]" />
            Notification Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="notificationEmail"
                checked={settings.notificationEmail}
                onChange={(e) => handleSettingChange('notificationEmail', e.target.checked)}
                className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
              />
              <label htmlFor="notificationEmail" className={`text-sm font-medium ${theme.textPrimary}`}>
                Email Notifications
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="notificationInApp"
                checked={settings.notificationInApp}
                onChange={(e) => handleSettingChange('notificationInApp', e.target.checked)}
                className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
              />
              <label htmlFor="notificationInApp" className={`text-sm font-medium ${theme.textPrimary}`}>
                In-App Notifications
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="notificationSound"
                checked={settings.notificationSound}
                onChange={(e) => handleSettingChange('notificationSound', e.target.checked)}
                className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
              />
              <label htmlFor="notificationSound" className={`text-sm font-medium ${theme.textPrimary}`}>
                Play Notification Sound
              </label>
            </div>
          </div>
        </Card>
      )}

      {activeSection === 'settings-dashboard' && (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mt-6 mb-4 flex items-center`}>
            <LayoutDashboard size={20} className="mr-2 text-[#6AC8A3]" />
            Dashboard & Module Views
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Dashboard Layout
              </label>
              <select
                value={settings.dashboardLayout}
                onChange={(e) => handleSettingChange('dashboardLayout', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                `}
              >
                <option value="default">Default</option>
                <option value="compact">Compact</option>
                <option value="expanded">Expanded</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Sales Module Default View
              </label>
              <select
                value={settings.defaultModuleView.sales}
                onChange={(e) => handleNestedSettingChange('defaultModuleView', 'sales', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                `}
              >
                <option value="dashboard">Sales Dashboard</option>
                <option value="invoices">Sales Invoices</option>
                <option value="orders">Sales Orders</option>
                <option value="customers">Customer List</option>
              </select>
            </div>
            {/* Add more default module views as needed */}
          </div>
        </Card>
      )}

      {activeSection === 'settings-security' && (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mt-6 mb-4 flex items-center`}>
            <Lock size={20} className="mr-2 text-[#6AC8A3]" />
            Security
          </h3>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="twoFactorAuth"
              checked={settings.enableTwoFactorAuth}
              onChange={(e) => handleSettingChange('enableTwoFactorAuth', e.target.checked)}
              className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
            />
            <label htmlFor="twoFactorAuth" className={`text-sm font-medium ${theme.textPrimary}`}>
              Enable Two-Factor Authentication
            </label>
          </div>
        </Card>
      )}
    </div>
  );
}

export default UserSettingsPage;
