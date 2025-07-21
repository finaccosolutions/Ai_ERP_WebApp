// src/pages/Inventory/masters/ItemGroupsPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Tag, Edit, Trash2, RefreshCw, Save, ArrowLeft, Filter } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import MasterSelectField from '../../../components/UI/MasterSelectField';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../../components/UI/ConfirmationModal';

interface ItemGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

function ItemGroupsPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalGroupsCount, setTotalGroupsCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupIdToDelete, setGroupIdToDelete] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
  });

  // Filter state (basic for now, can be expanded)
  const [filterCriteria, setFilterCriteria] = useState({
    name: '',
    description: '',
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10'); // Default to 10

  useEffect(() => {
    if (currentCompany?.id) {
      fetchItemGroups();
    }
  }, [currentCompany?.id, filterCriteria, numResultsToShow]);

  const fetchItemGroups = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('item_groups')
        .select('*', { count: 'exact' })
        .eq('company_id', currentCompany.id);

      // Apply search term
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      // Apply filters
      if (filterCriteria.name) {
        query = query.ilike('name', `%${filterCriteria.name}%`);
      }
      if (filterCriteria.description) {
        query = query.ilike('description', `%${filterCriteria.description}%`);
      }

      query = query.order('name', { ascending: true });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setItemGroups(data || []);
      setTotalGroupsCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching item groups: ${err.message}`, 'error');
      console.error('Error fetching item groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showNotification('Group Name is required.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!currentCompany?.id) {
      showNotification('Company information is missing.', 'error');
      return;
    }

    setLoading(true);
    try {
      const groupToSave = {
        company_id: currentCompany.id,
        name: formData.name,
        description: formData.description,
      };

      if (formData.id) {
        const { error } = await supabase
          .from('item_groups')
          .update(groupToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Item group updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('item_groups')
          .insert(groupToSave);
        if (error) throw error;
        showNotification('Item group created successfully!', 'success');
      }
      setViewMode('list');
      resetForm();
      fetchItemGroups();
    } catch (err: any) {
      showNotification(`Failed to save item group: ${err.message}`, 'error');
      console.error('Save item group error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = (group: ItemGroup) => {
    setFormData({
      id: group.id,
      name: group.name,
      description: group.description || '',
    });
    setViewMode('edit');
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroupIdToDelete(groupId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGroup = async () => {
    if (!groupIdToDelete) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      // Check if any items are linked to this group
      const { count: linkedItemsCount, error: itemsCountError } = await supabase
        .from('items')
        .select('count', { count: 'exact', head: true })
        .eq('item_group_id', groupIdToDelete);

      if (itemsCountError) throw itemsCountError;

      if (linkedItemsCount && linkedItemsCount > 0) {
        showNotification(`Cannot delete group: ${linkedItemsCount} item(s) are linked to it. Please reassign them first.`, 'error');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('item_groups')
        .delete()
        .eq('id', groupIdToDelete);

      if (error) throw error;
      showNotification('Item group deleted successfully!', 'success');
      fetchItemGroups();
    } catch (err: any) {
      showNotification(`Error deleting item group: ${err.message}`, 'error');
      console.error('Error deleting item group:', err);
    } finally {
      setLoading(false);
      setGroupIdToDelete(null);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    // setShowFilterModal(false); // Uncomment if you add a filter modal
  };

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalGroupsCount})` },
  ];

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
              {viewMode === 'create' ? 'Create New Item Group' : 'Edit Item Group'}
            </h1>
            <p className={theme.textSecondary}>
              {viewMode === 'create' ? 'Define a new way to classify your items.' : 'Update item group details.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setViewMode('list')} icon={<ArrowLeft size={16} />}>
            Back to List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Group Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Name"
                value={formData.name}
                onChange={(val) => handleInputChange('name', val)}
                placeholder="e.g., Raw Materials, Finished Goods"
                required
              />
              <FormField
                label="Description"
                value={formData.description}
                onChange={(val) => handleInputChange('description', val)}
                placeholder="Brief description of the group"
              />
            </div>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => setViewMode('list')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} icon={<Save size={16} />}>
              {loading ? 'Saving...' : 'Save Group'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Item Groups</h1>
          <p className={theme.textSecondary}>Manage broader classifications for your inventory items.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/inventory')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Item Group Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); }}>
            Create New
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Item Groups</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchItemGroups()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          {/* Filter button can be added here if a filter modal is created for Item Groups */}
          {/* <Button onClick={() => setShowFilterModal(true)} icon={<Filter size={16} />}>
            Filter
          </Button> */}
          <MasterSelectField
            label="" // No label needed for this dropdown
            value={numResultsOptions.find(opt => opt.id === numResultsToShow)?.name || ''}
            onValueChange={() => {}} // Not used for typing
            onSelect={(id) => setNumResultsToShow(id)}
            options={numResultsOptions}
            placeholder="Show"
            className="w-32"
          />
          <Button onClick={fetchItemGroups} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : itemGroups.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No item groups found. Create a new one to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itemGroups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.description || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(group.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => handleEditGroup(group)} title="Edit">
                        <Edit size={16} />
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

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteGroup}
        title="Confirm Group Deletion"
        message="Are you sure you want to delete this item group? This action cannot be undone. Items linked to this group will need to be reassigned."
        confirmText="Yes, Delete Group"
      />
    </div>
  );
}

export default ItemGroupsPage;