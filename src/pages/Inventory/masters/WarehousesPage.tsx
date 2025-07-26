// src/pages/Inventory/masters/WarehousesPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Edit, Trash2, RefreshCw, Save, ArrowLeft, Filter } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../../components/UI/ConfirmationModal';
import WarehouseFilterModal from '../../../components/Modals/WarehouseFilterModal'; // Import the new filter modal
import MasterSelectField from '../../../components/UI/MasterSelectField'; // Import MasterSelectField for num results

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

function WarehousesPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalWarehousesCount, setTotalWarehousesCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [warehouseToDeleteId, setWarehouseToDeleteId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    code: '',
    address: { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
    isDefault: false,
    isActive: true,
  });

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    name: '',
    code: '',
    city: '',
    isActive: 'all',
    isDefault: 'all',
  });
  const [numWarehousesToShow, setNumWarehousesToShow] = useState<string>('10'); // Default to 10

  useEffect(() => {
    if (currentCompany?.id) {
      fetchWarehouses();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentCompany?.id) {
        console.log('WarehousesPage: Document became visible, re-fetching warehouses.');
        fetchWarehouses();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentCompany?.id, filterCriteria, numWarehousesToShow]); // Added filterCriteria and numWarehousesToShow to dependencies

  const fetchWarehouses = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('warehouses')
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
      if (filterCriteria.code) {
        query = query.ilike('code', `%${filterCriteria.code}%`);
      }
      if (filterCriteria.city) {
        query = query.ilike('address->>city', `%${filterCriteria.city}%`); // Filter by JSONB field
      }
      if (filterCriteria.isActive !== 'all') {
        query = query.eq('is_active', filterCriteria.isActive === 'true');
      }
      if (filterCriteria.isDefault !== 'all') {
        query = query.eq('is_default', filterCriteria.isDefault === 'true');
      }

      query = query.order('name', { ascending: true });

      if (numWarehousesToShow !== 'all') {
        query = query.limit(parseInt(numWarehousesToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setWarehouses(data || []);
      setTotalWarehousesCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching warehouses: ${err.message}`, 'error');
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: keyof typeof formData['address'], value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      code: '',
      address: { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
      isDefault: false,
      isActive: true,
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showNotification('Warehouse Name is required.', 'error');
      return false;
    }
    if (!formData.code.trim()) {
      showNotification('Warehouse Code is required.', 'error');
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
      const warehouseToSave = {
        company_id: currentCompany.id,
        name: formData.name,
        code: formData.code,
        address: formData.address,
        is_default: formData.isDefault,
        is_active: formData.isActive,
      };

      if (formData.id) {
        const { error } = await supabase
          .from('warehouses')
          .update(warehouseToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Warehouse updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('warehouses')
          .insert(warehouseToSave);
        if (error) throw error;
        showNotification('Warehouse created successfully!', 'success');
      }
      setViewMode('list');
      resetForm();
      fetchWarehouses();
    } catch (err: any) {
      showNotification(`Failed to save warehouse: ${err.message}`, 'error');
      console.error('Save warehouse error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setFormData({
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
      isDefault: warehouse.is_default,
      isActive: warehouse.is_active,
    });
    setViewMode('edit');
  };

  const handleDeleteWarehouse = (warehouseId: string) => {
    setWarehouseToDeleteId(warehouseId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteWarehouse = async () => {
    if (!warehouseToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      // Check if any stock entries or items are linked to this warehouse
      const { count: linkedStockEntries, error: stockEntriesError } = await supabase
        .from('stock_entries')
        .select('count', { count: 'exact', head: true })
        .or(`from_warehouse_id.eq.${warehouseToDeleteId},to_warehouse_id.eq.${warehouseToDeleteId}`);

      if (stockEntriesError) throw stockEntriesError;

      if (linkedStockEntries && linkedStockEntries > 0) {
        showNotification(`Cannot delete warehouse: ${linkedStockEntries} stock entries are linked to it.`, 'error');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', warehouseToDeleteId);

      if (error) throw error;
      showNotification('Warehouse deleted successfully!', 'success');
      fetchWarehouses();
    } catch (err: any) {
      showNotification(`Error deleting warehouse: ${err.message}`, 'error');
      console.error('Error deleting warehouse:', err);
    } finally {
      setLoading(false);
      setWarehouseToDeleteId(null);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    setShowFilterModal(false);
  };

  const numWarehousesOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalWarehousesCount})` },
  ];

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
              {viewMode === 'create' ? 'Create New Warehouse' : 'Edit Warehouse'}
            </h1>
            <p className={theme.textSecondary}>
              {viewMode === 'create' ? 'Define a new storage location.' : 'Update warehouse details.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setViewMode('list')} icon={<ArrowLeft size={16} />}>
            Back to List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Warehouse Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Name"
                value={formData.name}
                onChange={(val) => handleInputChange('name', val)}
                placeholder="e.g., Main Warehouse, Branch A"
                required
              />
              <FormField
                label="Code"
                value={formData.code}
                onChange={(val) => handleInputChange('code', val)}
                placeholder="e.g., WH001"
                required
              />
              <FormField
                label="Address Line 1"
                value={formData.address.street1 || ''}
                onChange={(val) => handleAddressChange('street1', val)}
                placeholder="Street address, P.O. box"
                className="md:col-span-2"
              />
              <FormField
                label="Address Line 2"
                value={formData.address.street2 || ''}
                onChange={(val) => handleAddressChange('street2', val)}
                placeholder="Apartment, suite, unit, building, floor, etc."
                className="md:col-span-2"
              />
              <FormField
                label="City"
                value={formData.address.city || ''}
                onChange={(val) => handleAddressChange('city', val)}
                placeholder="City"
              />
              <FormField
                label="State"
                value={formData.address.state || ''}
                onChange={(val) => handleAddressChange('state', val)}
                placeholder="State"
              />
              <FormField
                label="Country"
                value={formData.address.country || ''}
                onChange={(val) => handleAddressChange('country', val)}
                placeholder="Country"
              />
              <FormField
                label="ZIP Code"
                value={formData.address.zipCode || ''}
                onChange={(val) => handleAddressChange('zipCode', val)}
                placeholder="ZIP Code"
              />
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={(e) => handleInputChange('isDefault', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                <label htmlFor="isDefault" className={`text-sm font-medium ${theme.textPrimary}`}>Set as Default</label>
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                <label htmlFor="isActive" className={`text-sm font-medium ${theme.textPrimary}`}>Is Active</label>
              </div>
            </div>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => setViewMode('list')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} icon={<Save size={16} />}>
              {loading ? 'Saving...' : 'Save Warehouse'}
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
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Warehouses / Locations</h1>
          <p className={theme.textSecondary}>Manage your inventory storage locations.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/inventory')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Warehouse Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); }}>
            Create New
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Warehouses</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search warehouses by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchWarehouses()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          <Button onClick={() => setShowFilterModal(true)} icon={<Filter size={16} />}>
            Filter
          </Button>
          <MasterSelectField
            label="" // No label needed for this dropdown
            value={numWarehousesOptions.find(opt => opt.id === numWarehousesToShow)?.name || ''}
            onValueChange={() => {}} // Not used for typing
            onSelect={(id) => setNumWarehousesToShow(id)}
            options={numWarehousesOptions}
            placeholder="Show"
            className="w-32"
          />
          <Button onClick={fetchWarehouses} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : warehouses.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No warehouses found. Create a new one to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{warehouse.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{warehouse.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{warehouse.address?.city || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{warehouse.is_default ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{warehouse.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => handleEditWarehouse(warehouse)} title="Edit">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteWarehouse(warehouse.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        onConfirm={confirmDeleteWarehouse}
        title="Confirm Warehouse Deletion"
        message="Are you sure you want to delete this warehouse? This action cannot be undone. Stock entries or items linked to this warehouse will be affected."
        confirmText="Yes, Delete Warehouse"
      />

      <WarehouseFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filterCriteria}
        onApplyFilters={handleApplyFilters}
        onFilterChange={(key, value) => setFilterCriteria(prev => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}

export default WarehousesPage;
