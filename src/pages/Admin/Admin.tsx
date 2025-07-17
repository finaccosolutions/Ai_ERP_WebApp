import React from 'react';
import { Settings, Users, Database, Shield, Plus, KeyRound } from 'lucide-react'; // Import KeyRound for Role Management
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, Outlet, Route, Routes, useLocation } from 'react-router-dom'; // Import Outlet, Route, Routes, useLocation
import UserManagement from './UserManagement'; // Import UserManagement
import RoleManagement from './RoleManagement'; // Import RoleManagement

function Admin() {
  const { theme } = useTheme();
  const location = useLocation();

  const adminModules = [
    { name: 'User Management', icon: Users, path: '/admin/users', count: 45, color: 'bg-blue-500' },
    { name: 'Role Management', icon: KeyRound, path: '/admin/roles', count: 8, color: 'bg-orange-500' }, // New module
    { name: 'System Settings', icon: Settings, path: '/admin/settings', count: 1, color: 'bg-green-500' },
    { name: 'Data Backup', icon: Database, path: '/admin/backup', count: 7, color: 'bg-purple-500' },
    { name: 'Security', icon: Shield, path: '/admin/security', count: 3, color: 'bg-red-500' },
  ];

  const isMainAdminPage = location.pathname === '/admin' || location.pathname === '/admin/';

  if (!isMainAdminPage) {
    return (
      <Routes>
        <Route path="users" element={<UserManagement />} />
        <Route path="roles" element={<RoleManagement />} /> {/* New Route */}
        {/* Add other admin sub-routes here */}
        <Route path="settings" element={<div>System Settings Page</div>} />
        <Route path="backup" element={<div>Data Backup Page</div>} />
        <Route path="security" element={<div>Security Page</div>} />
      </Routes>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-600">Manage users, settings, and system configuration</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Admin Suggestions')} />
          <Link to="/admin/users"> {/* Link to User Management */}
            <Button icon={<Plus size={16} />}>Add User</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link to={module.path} key={module.name} className="flex"> {/* Use Link for navigation */}
              <Card hover className="p-6 cursor-pointer flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{module.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{module.count}</p>
                  </div>
                  <div className={`p-3 ${module.color} ${theme.borderRadius}`}>
                    <Icon size={24} className="text-white" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="space-y-3">
          {[
            { metric: 'System Health', status: 'Good', color: 'text-green-600' },
            { metric: 'Database Performance', status: 'Excellent', color: 'text-green-600' },
            { metric: 'Backup Status', status: 'Up to date', color: 'text-green-600' },
            { metric: 'Security Scan', status: 'Passed', color: 'text-green-600' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{item.metric}</p>
              <span className={`font-medium ${item.color}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Admin;
