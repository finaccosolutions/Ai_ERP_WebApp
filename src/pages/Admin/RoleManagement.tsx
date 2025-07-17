// src/pages/Admin/RoleManagement.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, KeyRound, Check, X, AlertTriangle, Save, Info } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { ALL_PERMISSIONS } from '../../constants/permissions'; // Import the permissions constant

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: { [module: string]: { [action: string]: boolean } };
  is_system_role: boolean;
}

function RoleManagement() {
  const { theme } = useTheme();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotification();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {} as { [module: string]: { [action: string]: boolean } },
    is_system_role: false,
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    setFormErrors({});
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setRoles(data);
    } catch (err: any) {
      setFormErrors({ fetch: `Failed to fetch roles: ${err.message}` });
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: {},
      is_system_role: false,
    });
    setFormErrors({});
    setEditingRole(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Role Name is required.';
    if (Object.keys(formData.permissions).length === 0) newErrors.permissions = 'At least one permission must be selected.';

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    setFormData(prev => {
      const newPermissions = { ...prev.permissions };
      if (!newPermissions[module]) {
        newPermissions[module] = {};
      }
      newPermissions[module][action] = checked;

      // Clean up empty modules/actions
      if (!checked) {
        const allFalse = Object.values(newPermissions[module]).every(val => val === false);
        if (allFalse) {
          delete newPermissions[module];
        }
      }
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!hasPermission('role_management', 'create')) {
      showNotification('You do not have permission to create roles.', 'error');
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          is_system_role: formData.is_system_role,
        });

      if (error) throw error;

      showNotification('Role created successfully!', 'success');
      setShowCreateForm(false);
      resetForm();
      fetchRoles();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Failed to create role.' });
      showNotification(err.message || 'Failed to create role.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !validateForm()) return;
    if (!hasPermission('role_management', 'update')) {
      showNotification('You do not have permission to update roles.', 'error');
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          // is_system_role cannot be changed via UI for existing system roles
          is_system_role: editingRole.is_system_role ? true : formData.is_system_role,
        })
        .eq('id', editingRole.id);

      if (error) throw error;

      showNotification('Role updated successfully!', 'success');
      setShowCreateForm(false);
      resetForm();
      fetchRoles();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Failed to update role.' });
      showNotification(err.message || 'Failed to update role.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!hasPermission('role_management', 'delete')) {
      showNotification('You do not have permission to delete roles.', 'error');
      return;
    }

    // Check if any users are assigned to this role
    const { count: assignedUsersCount, error: countError } = await supabase
      .from('users_companies')
      .select('count', { count: 'exact', head: true })
      .eq('role_id', roleId);

    if (countError) {
      showNotification(`Error checking assigned users: ${countError.message}`, 'error');
      return;
    }

    if (assignedUsersCount && assignedUsersCount > 0) {
      showNotification(`Cannot delete role: ${assignedUsersCount} user(s) are currently assigned to this role. Please reassign them first.`, 'error');
      return;
    }

    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;

    setLoading(true);
    setFormErrors({});

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      showNotification('Role deleted successfully!', 'success');
      fetchRoles();
    } catch (err: any) {
      setFormErrors({ delete: err.message || 'Failed to delete role.' });
      showNotification(err.message || 'Failed to delete role.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      is_system_role: role.is_system_role,
    });
    setShowCreateForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Role Management</h1>
          <p className={theme.textSecondary}>Define and manage user roles and their permissions.</p>
        </div>
        <div className="flex space-x-2">
          {hasPermission('role_management', 'create') && (
            <Button icon={<Plus size={16} />} onClick={() => { setShowCreateForm(true); resetForm(); }}>
              Create New Role
            </Button>
          )}
          <Button icon={<RefreshCw size={16} />} onClick={fetchRoles} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {formErrors.fetch && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {formErrors.fetch}</span>
        </div>
      )}

      {showCreateForm && (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            {editingRole ? 'Edit Role' : 'Create New Role'}
          </h3>
          <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Role Name"
                value={formData.name}
                onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
                placeholder="e.g., Sales Manager"
                required
                error={formErrors.name}
              />
              <FormField
                label="Description"
                value={formData.description}
                onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                placeholder="Brief description of the role"
              />
              <div className="flex items-center space-x-3 md:col-span-2">
                <input
                  type="checkbox"
                  id="is_system_role"
                  checked={formData.is_system_role}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_system_role: e.target.checked }))}
                  className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                  disabled={editingRole?.is_system_role} // Prevent changing system role status
                />
                <label htmlFor="is_system_role" className={`text-sm font-medium ${theme.textPrimary}`}>
                  System Role (Cannot be deleted or modified by non-admins)
                </label>
              </div>
            </div>

            <h4 className={`text-md font-semibold ${theme.textPrimary} mt-6 mb-4`}>Permissions</h4>
            {formErrors.permissions && <p className="mt-2 text-sm text-red-500">{formErrors.permissions}</p>}

            <div className="space-y-6">
              {Object.entries(ALL_PERMISSIONS).map(([moduleName, actions]) => (
                <div key={moduleName} className="border border-gray-200 rounded-lg p-4">
                  <h5 className={`font-semibold ${theme.textPrimary} mb-3 capitalize`}>
                    {moduleName.replace(/_/g, ' ')}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(actions).map(([actionName, description]) => (
                      <div key={`${moduleName}-${actionName}`} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`${moduleName}-${actionName}`}
                          checked={!!formData.permissions[moduleName]?.[actionName]}
                          onChange={(e) => handlePermissionChange(moduleName, actionName, e.target.checked)}
                          className="w-4 h-4 text-[#6AC8A3] border-gray-300 rounded focus:ring-[#6AC8A3]"
                        />
                        <label htmlFor={`${moduleName}-${actionName}`} className={`text-sm ${theme.textPrimary}`}>
                          {description as string}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {formErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={20} className="text-red-600" />
                  <div className="text-red-600 text-sm font-medium">
                    {formErrors.submit}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (editingRole ? 'Update Role' : 'Create Role')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Roles</h3>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6AC8A3]"></div>
            </div>
          ) : roles.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No roles found. Create a new role to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Role</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {role.is_system_role ? <Check size={18} className="text-green-500" /> : <X size={18} className="text-red-500" />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {hasPermission('role_management', 'update') && (
                        <Button variant="ghost" size="sm" onClick={() => startEditRole(role)}>Edit</Button>
                      )}
                      {hasPermission('role_management', 'delete') && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(role.id)} className="text-red-600 hover:text-red-800" disabled={role.is_system_role}>Delete</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
          <Info size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Important Notes:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>System roles (like 'Admin') cannot be deleted or have their 'System Role' status changed.</li>
              <li>A role cannot be deleted if any users are currently assigned to it.</li>
              <li>Permissions are additive: if a user has multiple roles (not currently supported in this implementation, but common in advanced RBAC), their effective permissions would be the union of all granted permissions.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default RoleManagement;
