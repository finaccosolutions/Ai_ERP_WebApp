// src/pages/Admin/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Mail, Phone, Building, Briefcase, Key, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';

// Helper to generate a random password
const generateRandomPassword = (length = 12) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

interface UserData {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  employee_id: string | null;
  company_id: string | null;
  company_name: string | null;
  role_id: string | null;
  role_name: string | null;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

function UserManagement() {
  const { theme } = useTheme();
  const { user: currentUser, hasPermission } = useAuth();
  const { currentCompany, companies } = useCompany();
  const { showNotification } = useNotification();

  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    department: '',
    designation: '',
    employeeId: '',
    companyId: currentCompany?.id || '',
    roleId: '',
  });

  useEffect(() => {
    fetchUsersAndRoles();
  }, [currentCompany?.id]);

  const fetchUsersAndRoles = async () => {
    setLoading(true);
    setFormErrors({});
    try {
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, name, description');
      if (rolesError) throw rolesError;
      setRoles(rolesData);

      // Fetch users with their profiles, companies, and roles
      const { data: usersData, error: usersError } = await supabase
        .from('users_companies')
        .select(`
          user_id,
          company_id,
          role_id,
          user_profiles (
            full_name,
            phone,
            department,
            designation,
            employee_id,
            created_at
          ),
          companies (
            name
          ),
          user_roles (
            name
          )
        `);

      if (usersError) throw usersError;

      // Fetch emails from auth.users (only accessible by service_role key, but we're in client-side)
      // For client-side, we can only get emails of authenticated users or rely on user_profiles if email is stored there.
      // Since email is not in user_profiles, we'll use a placeholder or assume it's available via auth.users directly if RLS allows.
      // A more robust solution for admin would be a Supabase Edge Function to fetch auth.users.
      const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
      if (authUsersError) {
        console.warn("Could not list auth users directly from client. This is expected if not using service_role key. User emails might be missing.");
      }
      const authUsersMap = new Map(authUsers?.users.map(u => [u.id, u.email]));


      const formattedUsers: UserData[] = usersData.map(uc => ({
        id: uc.user_id,
        email: authUsersMap.get(uc.user_id) || 'N/A', // Fallback if email not fetched
        full_name: uc.user_profiles?.full_name || 'N/A',
        phone: uc.user_profiles?.phone || null,
        department: uc.user_profiles?.department || null,
        designation: uc.user_profiles?.designation || null,
        employee_id: uc.user_profiles?.employee_id || null,
        company_id: uc.company_id,
        company_name: uc.companies?.name || 'N/A',
        role_id: uc.role_id,
        role_name: uc.user_roles?.name || 'N/A',
        created_at: uc.user_profiles?.created_at || 'N/A',
      }));
      setUsers(formattedUsers);

    } catch (err: any) {
      setFormErrors({ fetch: `Failed to fetch data: ${err.message}` });
      console.error('Error fetching users or roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      fullName: '',
      phone: '',
      department: '',
      designation: '',
      employeeId: '',
      companyId: currentCompany?.id || '',
      roleId: '',
    });
    setFormErrors({});
    setGeneratedPassword(null);
    setEditingUser(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format.';
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.';
    if (!formData.companyId) newErrors.companyId = 'Company is required.';
    if (!formData.roleId) newErrors.roleId = 'Role is required.';

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!hasPermission('user_management', 'create')) {
      showNotification('You do not have permission to create users.', 'error');
      return;
    }

    setLoading(true);
    setFormErrors({});
    setGeneratedPassword(null);

    try {
      const newPassword = generateRandomPassword();
      
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: newPassword,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User not created in auth.");

      const newUserId = authData.user.id;

      // 2. Insert into user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: newUserId,
          full_name: formData.fullName,
          phone: formData.phone,
          department: formData.department,
          designation: formData.designation,
          employee_id: formData.employeeId,
        });
      if (profileError) throw profileError;

      // 3. Link user to company and role
      const { error: userCompanyError } = await supabase
        .from('users_companies')
        .insert({
          user_id: newUserId,
          company_id: formData.companyId,
          role_id: formData.roleId,
          is_active: true,
        });
      if (userCompanyError) throw userCompanyError;

      setGeneratedPassword(newPassword);
      showNotification('User created successfully! Verification email sent.', 'success');
      setShowCreateForm(false);
      resetForm();
      fetchUsersAndRoles(); // Refresh list
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Failed to create user.' });
      showNotification(err.message || 'Failed to create user.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !validateForm()) return;
    if (!hasPermission('user_management', 'update')) {
      showNotification('You do not have permission to update users.', 'error');
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      // 1. Update user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          department: formData.department,
          designation: formData.designation,
          employee_id: formData.employeeId,
        })
        .eq('id', editingUser.id);
      if (profileError) throw profileError;

      // 2. Update users_companies (role and company link)
      const { error: userCompanyError } = await supabase
        .from('users_companies')
        .update({
          company_id: formData.companyId,
          role_id: formData.roleId,
        })
        .eq('user_id', editingUser.id);
      if (userCompanyError) throw userCompanyError;

      showNotification('User updated successfully!', 'success');
      setShowCreateForm(false);
      resetForm();
      fetchUsersAndRoles(); // Refresh list
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Failed to update user.' });
      showNotification(err.message || 'Failed to update user.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    if (!hasPermission('user_management', 'delete')) {
      showNotification('You do not have permission to delete users.', 'error');
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      // Supabase admin.deleteUser will delete from auth.users and cascade to user_profiles
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      // Also delete from users_companies if not cascaded by user_profiles (depends on FK setup)
      await supabase.from('users_companies').delete().eq('user_id', userId);

      showNotification('User deleted successfully!', 'success');
      fetchUsersAndRoles(); // Refresh list
    } catch (err: any) { // FIX: Changed `=> {` to `{`
      setFormErrors({ delete: err.message || 'Failed to delete user.' });
      showNotification(err.message || 'Failed to delete user.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Are you sure you want to send a password reset email to ${email}?`)) return;
    if (!hasPermission('user_management', 'update')) { // Assuming reset password is part of update permission
      showNotification('You do not have permission to reset user passwords.', 'error');
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`, // Or your actual reset password page
      });
      if (error) throw error;
      showNotification(`Password reset email sent to ${email}!`, 'success');
    } catch (err: any) {
      setFormErrors({ resetPassword: err.message || 'Failed to send password reset email.' });
      showNotification(err.message || 'Failed to send password reset email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditUser = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      fullName: user.full_name,
      phone: user.phone || '',
      department: user.department || '',
      designation: user.designation || '',
      employeeId: user.employee_id || '',
      companyId: user.company_id || '',
      roleId: user.role_id || '',
    });
    setShowCreateForm(true);
    setGeneratedPassword(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>User Management</h1>
          <p className={theme.textSecondary}>Manage all users, roles, and access permissions.</p>
        </div>
        <div className="flex space-x-2">
          {hasPermission('user_management', 'create') && (
            <Button icon={<Plus size={16} />} onClick={() => { setShowCreateForm(true); resetForm(); }}>
              Add New User
            </Button>
          )}
          <Button icon={<RefreshCw size={16} />} onClick={fetchUsersAndRoles} disabled={loading}>
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
            {editingUser ? 'Edit User' : 'Create New User'}
          </h3>
          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(val) => setFormData(prev => ({ ...prev, email: val }))}
                placeholder="user@example.com"
                required
                icon={<Mail size={18} />}
                error={formErrors.email}
                readOnly={!!editingUser} // Email is read-only when editing
              />
              <FormField
                label="Full Name"
                value={formData.fullName}
                onChange={(val) => setFormData(prev => ({ ...prev, fullName: val }))}
                placeholder="John Doe"
                required
                icon={<User size={18} />}
                error={formErrors.fullName}
              />
              <FormField
                label="Phone"
                value={formData.phone}
                onChange={(val) => setFormData(prev => ({ ...prev, phone: val }))}
                placeholder="+91 9876543210"
                icon={<Phone size={18} />}
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                  Company <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                  className={`
                    w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                    ${theme.inputBg} ${theme.textPrimary}
                    focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                  `}
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
                {formErrors.companyId && <p className="mt-2 text-sm text-red-500">{formErrors.companyId}</p>}
              </div>
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData(prev => ({ ...prev, roleId: e.target.value }))}
                  className={`
                    w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                    ${theme.inputBg} ${theme.textPrimary}
                    focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                  `}
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                {formErrors.roleId && <p className="mt-2 text-sm text-red-500">{formErrors.roleId}</p>}
              </div>
              <FormField
                label="Department"
                value={formData.department}
                onChange={(val) => setFormData(prev => ({ ...prev, department: val }))}
                placeholder="Sales"
                icon={<Building size={18} />}
              />
              <FormField
                label="Designation"
                value={formData.designation}
                onChange={(val) => setFormData(prev => ({ ...prev, designation: val }))}
                placeholder="Manager"
                icon={<Briefcase size={18} />}
              />
              <FormField
                label="Employee ID"
                value={formData.employeeId}
                onChange={(val) => setFormData(prev => ({ ...prev, employeeId: val }))}
                placeholder="EMP001"
                icon={<Key size={18} />}
              />
            </div>

            {generatedPassword && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <div className="text-green-600 text-sm font-medium">
                    User created. Temporary Password: <span className="font-bold">{generatedPassword}</span>. Please provide this to the user.
                  </div>
                </div>
              </div>
            )}

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
                {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Users</h3>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6AC8A3]"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No users found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.company_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {hasPermission('user_management', 'update') && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => startEditUser(user)}>Edit</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleResetPassword(user.email)}>Reset Password</Button>
                        </>
                      )}
                      {hasPermission('user_management', 'delete') && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800">Delete</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

export default UserManagement;
