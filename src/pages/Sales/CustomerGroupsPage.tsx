// src/pages/Sales/CustomerGroupsPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit, Trash2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface CustomerGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

function CustomerGroupsPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (currentCompany?.id) {
      fetchCustomerGroups();
    }
  }, [currentCompany?.id]);

  const fetchCustomerGroups = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    setFormErrors({});
    try {
      const { data, error } = await supabase
        .from('customer_groups')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomerGroups(data);
    } catch (err: any) {
      setFormErrors({ fetch: `Failed to fetch customer groups: ${err.message}` });
      console.error('Error fetching customer groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    setFormErrors({});
    setEditingGroup(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Group Name is required.';
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!currentCompany?.id || !user?.id) {
      showNotification('Company or user information is missing.', 'error');
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      const { error } = await supabase
        .from('customer_groups')
        .insert({
          company_id: currentCompany.id,
          name: formData.name,
          description: formData.description,
        });

      if (error) throw error;

      showNotification('Customer group created successfully!', 'success');
      setShowCreateForm(false);
      resetForm();
      fetchCustomerGroups();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Failed to create customer group.' });
      showNotification(err.message || 'Failed to create customer group.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !validateForm()) return;

    setLoading(true);
    setFormErrors({});

    try {
      const { error } = await supabase
        .from('customer_groups')
        .update({
          name: formData.name,
          description: formData.description,
        })
        .eq('id', editingGroup.id);

      if (error) throw error;

      showNotification('Customer group updated successfully!', 'success');
      setShowCreateForm(false);
      resetForm();
      fetchCustomerGroups();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Failed to update customer group.' });
      showNotification(err.message || 'Failed to update customer group.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this customer group? This action cannot be undone.')) return;

    // Check if any customers are assigned to this group
    const { count: assignedCustomersCount, error: countError } = await supabase
      .from('customers')
      .select('count', { count: 'exact', head: true })
      .eq('customer_group_id', groupId);

    if (countError) {
      showNotification(`Error checking assigned customers: ${countError.message}`, 'error');
      return;
    }

    if (assignedCustomersCount && assignedCustomersCount > 0) {
      showNotification(`Cannot delete group: ${assignedCustomersCount} customer(s) are currently assigned to this group. Please reassign them first.`, 'error');
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      const { error } = await supabase
        .from('customer_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      showNotification('Customer group deleted successfully!', 'success');
      fetchCustomerGroups();
    } catch (err: any) {
      setFormErrors({ delete: err.message || 'Failed to delete customer group.' });
      showNotification(err.message || 'Failed to delete customer group.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditGroup = (group: CustomerGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
    });
    setShowCreateForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Customer Groups</h1>
          <p className={theme.textSecondary}>Organize your customers into manageable groups.</p>
        </div>
        <div className="flex space-x-2">
          <Button icon={<Plus size={16} />} onClick={() => { setShowCreateForm(true); resetForm(); }}>
            Create New Group
          </Button>
          <Button icon={<RefreshCw size={16} />} onClick={fetchCustomerGroups} disabled={loading}>
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
            {editingGroup ? 'Edit Customer Group' : 'Create New Customer Group'}
          </h3>
          <form onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup} className="space-y-4">
            <FormField
              label="Group Name"
              value={formData.name}
              onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
              placeholder="e.g., Key Accounts, Retail Customers"
              required
              error={formErrors.name}
            />
            <FormField
              label="Description"
              value={formData.description}
              onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
              placeholder="Brief description of the group"
            />

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
                {loading ? 'Saving...' : (editingGroup ? 'Update Group' : 'Create Group')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!showCreateForm && ( // Conditionally render the list
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Customer Groups</h3>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6AC8A3]"></div>
              </div>
            ) : customerGroups.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
                <p>No customer groups found. Create a new group to get started.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerGroups.map((group) => (
                    <tr key={group.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.description || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(group.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => startEditGroup(group)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id)} className="text-red-600 hover:text-red-800">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default CustomerGroupsPage;
