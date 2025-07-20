// src/pages/Sales/CustomerGroupsPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit, Trash2, RefreshCw, AlertTriangle, CheckCircle, Search, Info, ArrowLeft, Eye } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import { useLocation, useNavigate } from 'react-router-dom';
import AIButton from '../../components/UI/AIButton'; // Import AIButton
import MasterSelectField from '../../components/UI/MasterSelectField'; // Import MasterSelectField

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
  const location = useLocation();
  const navigate = useNavigate();

  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [numGroupsToShow, setNumGroupsToShow] = useState<string>('10');
  const [totalGroupsCount, setTotalGroupsCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);

  // Tab state for the create/edit form
  const [activeFormTab, setActiveFormTab] = useState('general_info');
  const formTabs = [
    { id: 'general_info', label: 'General Information', icon: Info },
    // Add more tabs here if customer group creation becomes more complex
  ];

  useEffect(() => {
    if (currentCompany?.id) {
      fetchCustomerGroups();
    }

    // Check if navigated from CustomerFormPage
    if (location.state?.fromCustomerForm) {
      setShowCreateForm(true); // Immediately show the create form
      if (location.state.newGroupName) {
        setFormData(prev => ({ ...prev, name: location.state.newGroupName }));
      }
      // No need to clear location.state here, it's handled by CustomerFormPage on return
    }
  }, [currentCompany?.id, location.state]);


  const fetchCustomerGroups = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    setFormErrors({});
    try {
      let query = supabase
        .from('customer_groups')
        .select('*', { count: 'exact' })
        .eq('company_id', currentCompany.id)
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (numGroupsToShow !== 'all') {
        query = query.limit(parseInt(numGroupsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setCustomerGroups(data || []);
      setTotalGroupsCount(count || 0);
    } catch (err: any) {
      setFormErrors({ fetch: `Failed to fetch customer groups: ${err.message}` });
      console.error('Error fetching customer groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCustomerGroups();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    setFormErrors({});
    setEditingGroup(null);
    setActiveFormTab('general_info'); // Reset to first tab
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
      const { data, error } = await supabase
        .from('customer_groups')
        .insert({
          company_id: currentCompany.id,
          name: formData.name,
          description: formData.description,
        })
        .select('id, name')
        .single();

      if (error) throw error;

      // Only show notification here if NOT coming from CustomerFormPage
      if (!location.state?.fromCustomerForm) {
        showNotification('Customer group created successfully!', 'success');
      }
      
      // Navigate back to CustomerFormPage, passing the new group info and original form data
      if (location.state?.fromCustomerForm && location.state?.returnPath) {
        navigate(location.state.returnPath, {
          replace: true, // Replace current history entry
          state: {
            createdGroupId: data.id,
            createdGroupName: data.name,
            customerFormData: location.state.customerFormData, // Pass original customer form data back
            fromCustomerGroupCreation: true // Flag for CustomerFormPage to know it's a return from group creation
          },
        });
      } else {
        // Default behavior if not part of the special flow
        setShowCreateForm(false);
        resetForm();
        fetchCustomerGroups();
      }
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

  const handleDeleteGroup = (groupId: string) => {
    setGroupToDeleteId(groupId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    setFormErrors({});

    try {
      const { count: assignedCustomersCount, error: countError } = await supabase
        .from('customers')
        .select('count', { count: 'exact', head: true })
        .eq('customer_group_id', groupToDeleteId);

      if (countError) {
        showNotification(`Error checking assigned customers: ${countError.message}`, 'error');
        setLoading(false);
        return;
      }

      if (assignedCustomersCount && assignedCustomersCount > 0) {
        showNotification(`Cannot delete group: ${assignedCustomersCount} customer(s) are currently assigned to this group. Please reassign them first.`, 'error');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('customer_groups')
        .delete()
        .eq('id', groupToDeleteId);

      if (error) throw error;

      showNotification('Customer group deleted successfully!', 'success');
      fetchCustomerGroups();
    } catch (err: any) {
      setFormErrors({ delete: err.message || 'Failed to delete customer group.' });
      showNotification(err.message || 'Failed to delete customer group.', 'error');
    } finally {
      setLoading(false);
      setGroupToDeleteId(null);
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

  const numGroupsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalGroupsCount})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Customer Groups</h1>
          <p className={theme.textSecondary}>Organize your customers into manageable groups.</p>
        </div>
        <div className="flex space-x-2">
          {/* Conditional rendering of "Back" button */}
          {!location.state?.fromCustomerForm && (
            <Button variant="outline" onClick={() => navigate('/sales')} icon={<ArrowLeft size={16} />} className="text-gray-600 hover:text-gray-800">
              Back
            </Button>
          )}
          <AIButton variant="suggest" onSuggest={() => console.log('AI Customer Group Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => { setShowCreateForm(true); resetForm(); }}>
            Create New Group
          </Button>
        </div>
      </div>

      {formErrors.fetch && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {formErrors.fetch}</span>
        </div>
      )}

      {showCreateForm ? (
        <Card className="p-6">
          {/* Form Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
              {editingGroup ? 'Edit Customer Group' : 'Create New Customer Group'}
            </h3>
            {/* "Back to List" button is now handled by the main "Back" button or Cancel */}
          </div>

          {/* Tab Navigation for Form */}
          <Card className="p-4 mb-6">
            <nav className="flex justify-between items-center">
              {formTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeFormTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFormTab(tab.id)}
                    className={`
                      flex flex-col items-center px-4 py-2 text-sm font-medium transition-colors duration-300
                      ${isActive
                        ? `bg-emerald-100 text-emerald-800 border-b-2 border-emerald-500 shadow-sm`
                        : `bg-emerald-50 text-emerald-700 hover:bg-emerald-100`
                      }
                    `}
                  >
                    <Icon size={20} className="mb-1" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>

          {/* Form Content based on Tab */}
          <form onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup} className="space-y-4">
            {activeFormTab === 'general_info' && (
              <>
                <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                  <Info size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                  General Information
                </h3>
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
              </>
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
              <Button type="button" variant="outline" onClick={() => {
                if (location.state?.fromCustomerForm && location.state?.returnPath) {
                  navigate(location.state.returnPath, {
                    replace: true,
                    state: {
                      customerFormData: location.state.customerFormData,
                      fromCustomerGroupCreation: true, // Keep this flag for CustomerFormPage to restore data
                    },
                  });
                } else {
                  setShowCreateForm(false);
                }
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (editingGroup ? 'Update Group' : 'Create Group')}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Customer Groups</h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="relative flex-grow">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customer groups by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className={`
                  w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              />
            </div>
            <div className="flex items-center space-x-2">
              <MasterSelectField
                label="" // No label needed for this dropdown
                value={numGroupsOptions.find(opt => opt.id === numGroupsToShow)?.name || ''}
                onValueChange={() => {}} // Not used for typing
                onSelect={(id) => setNumGroupsToShow(id)}
                options={numGroupsOptions}
                placeholder="Show"
                className="w-32"
              />
              <Button onClick={handleSearch} disabled={loading} icon={<RefreshCw size={16} />}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
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
                        <Button variant="ghost" size="sm" onClick={() => startEditGroup(group)} title="Edit">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/customer-groups/edit/${group.id}?viewOnly=true`)} title="View">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id)} className="text-red-600 hover:text-red-800" title="Delete">
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteGroup}
        title="Confirm Group Deletion"
        message="Are you sure you want to delete this customer group? This action cannot be undone. If customers are assigned to this group, you must reassign them first."
        confirmText="Yes, Delete Group"
      />
    </div>
  );
}

export default CustomerGroupsPage;