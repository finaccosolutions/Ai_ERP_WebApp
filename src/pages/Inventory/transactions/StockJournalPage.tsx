// src/pages/Inventory/transactions/StockJournalPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, ClipboardList, Edit, Trash2, RefreshCw, Save, ArrowLeft, Filter } from 'lucide-react';
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
import StockJournalFilterModal from '../../../components/Modals/StockJournalFilterModal'; // Import the new filter modal

interface StockEntry {
  id: string;
  entry_no: string;
  entry_type: string;
  entry_date: string;
  from_warehouse_id: string | null;
  to_warehouse_id: string | null;
  reference_type: string | null;
  reference_id: string | null;
  reference_no: string | null;
  status: string;
  total_value: number | null;
  notes: string | null;
  created_at: string;
  // Joined data
  from_warehouses?: { name: string } | null;
  to_warehouses?: { name: string } | null;
}

interface StockEntryItem {
  id: string;
  item_id: string;
  quantity: number;
  rate: number;
  amount: number;
  batch_no: string | null;
  serial_nos: string[] | null;
  expiry_date: string | null;
  // Joined data
  items?: { item_name: string } | null;
}

function StockJournalPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalEntriesCount, setTotalEntriesCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDeleteId, setEntryToDeleteId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [formData, setFormData] = useState({
    id: '',
    entryNo: '',
    entryType: 'stock_adjustment', // Fixed for this page
    entryDate: new Date().toISOString().split('T')[0],
    warehouseId: '', // For stock adjustment, single warehouse
    notes: '',
    status: 'draft',
    items: [{
      id: 'new-1',
      itemId: '',
      quantity: 0,
      rate: 0,
      batchNo: '',
      serialNos: '',
      expiryDate: '',
    }],
  });

  const [availableItems, setAvailableItems] = useState<{ id: string; name: string; has_batch: boolean; has_serial: boolean; has_expiry: boolean; standard_rate: number; }[]>([]);
  const [availableWarehouses, setAvailableWarehouses] = useState<{ id: string; name: string }[]>([]);

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    entryNo: '',
    entryType: 'stock_adjustment', // Fixed for this page
    startDate: '',
    endDate: '',
    warehouseId: '',
    status: 'all',
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10'); // Default to 10

  useEffect(() => {
    if (currentCompany?.id) {
      fetchMastersData(currentCompany.id);
      if (viewMode === 'list') {
        fetchStockEntries();
      }
    }
  }, [currentCompany?.id, viewMode, filterCriteria, numResultsToShow]); // Added filterCriteria and numResultsToShow to dependencies

  const fetchMastersData = async (companyId: string) => {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('id, item_name, has_batch, has_serial, has_expiry, standard_rate')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (itemsError) throw itemsError;
      setAvailableItems(itemsData);

      const { data: warehousesData, error: warehousesError } = await supabase
        .from('warehouses')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (warehousesError) throw warehousesError;
      setAvailableWarehouses(warehousesData);
    } catch (error) {
      console.error('Error fetching master data:', error);
      showNotification('Failed to load items or warehouses.', 'error');
    }
  };

  const fetchStockEntries = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('stock_entries')
        .select(`
          *,
          from_warehouses:warehouses!stock_entries_from_warehouse_id_fkey ( name ),
          to_warehouses:warehouses!stock_entries_to_warehouse_id_fkey ( name )
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id)
        .eq('entry_type', 'stock_adjustment'); // Filter for stock adjustments

      // Apply search term
      if (searchTerm) {
        query = query.ilike('entry_no', `%${searchTerm}%`);
      }

      // Apply filters
      if (filterCriteria.entryNo) {
        query = query.ilike('entry_no', `%${filterCriteria.entryNo}%`);
      }
      if (filterCriteria.startDate) {
        query = query.gte('entry_date', filterCriteria.startDate);
      }
      if (filterCriteria.endDate) {
        query = query.lte('entry_date', filterCriteria.endDate);
      }
      if (filterCriteria.warehouseId) {
        query = query.eq('from_warehouse_id', filterCriteria.warehouseId); // Assuming adjustment is always from one warehouse
      }
      if (filterCriteria.status !== 'all') {
        query = query.eq('status', filterCriteria.status);
      }

      query = query.order('entry_date', { ascending: false });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setStockEntries(data || []);
      setTotalEntriesCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching stock entries: ${err.message}`, 'error');
      console.error('Error fetching stock entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof typeof formData['items'][0], value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'itemId') {
      const selectedItem = availableItems.find(item => item.id === value);
      if (selectedItem) {
        newItems[index].rate = selectedItem.standard_rate;
        newItems[index].batchNo = selectedItem.has_batch ? newItems[index].batchNo : '';
        newItems[index].serialNos = selectedItem.has_serial ? newItems[index].serialNos : '';
        newItems[index].expiryDate = selectedItem.has_expiry ? newItems[index].expiryDate : '';
      }
    }
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].rate || 0);
    }

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: `new-${Date.now()}`,
        itemId: '',
        quantity: 0,
        rate: 0,
        batchNo: '',
        serialNos: '',
        expiryDate: '',
      }],
    }));
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      entryNo: '',
      entryType: 'stock_adjustment',
      entryDate: new Date().toISOString().split('T')[0],
      warehouseId: '',
      notes: '',
      status: 'draft',
      items: [{
        id: 'new-1',
        itemId: '',
        quantity: 0,
        rate: 0,
        batchNo: '',
        serialNos: '',
        expiryDate: '',
      }],
    });
  };

  const validateForm = () => {
    if (!formData.entryNo.trim()) {
      showNotification('Entry Number is required.', 'error');
      return false;
    }
    if (!formData.warehouseId) {
      showNotification('Warehouse is required.', 'error');
      return false;
    }
    if (formData.items.length === 0 || formData.items.some(item => !item.itemId || item.quantity <= 0)) {
      showNotification('At least one item with a valid quantity is required.', 'error');
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
      const totalValue = formData.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.rate || 0)), 0);

      const stockEntryToSave = {
        company_id: currentCompany.id,
        entry_no: formData.entryNo,
        entry_type: formData.entryType,
        entry_date: formData.entryDate,
        from_warehouse_id: formData.warehouseId, // For adjustment, from and to are the same logical warehouse
        to_warehouse_id: formData.warehouseId,
        notes: formData.notes,
        status: formData.status,
        total_value: totalValue,
      };

      let entryId = formData.id;
      if (formData.id) {
        const { error } = await supabase
          .from('stock_entries')
          .update(stockEntryToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Stock entry updated successfully!', 'success');
      } else {
        const { data, error } = await supabase
          .from('stock_entries')
          .insert(stockEntryToSave)
          .select('id')
          .single();
        if (error) throw error;
        entryId = data.id;
        showNotification('Stock entry created successfully!', 'success');
      }

      // Save items
      if (entryId) {
        await supabase.from('stock_entry_items').delete().eq('entry_id', entryId);
        const itemsToInsert = formData.items.map(item => ({
          entry_id: entryId,
          item_id: item.itemId,
          quantity: item.quantity,
          rate: item.rate,
          amount: (item.quantity || 0) * (item.rate || 0),
          batch_no: item.batchNo || null,
          serial_nos: item.serialNos ? item.serialNos.split(',').map(s => s.trim()) : null,
          expiry_date: item.expiryDate || null,
          from_warehouse_id: formData.warehouseId, // For adjustment, from and to are the same logical warehouse
          to_warehouse_id: formData.warehouseId,
        }));
        const { error: itemsError } = await supabase.from('stock_entry_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      setViewMode('list');
      resetForm();
      fetchStockEntries();
    } catch (err: any) {
      showNotification(`Failed to save stock entry: ${err.message}`, 'error');
      console.error('Save stock entry error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = async (entry: StockEntry) => {
    setLoading(true);
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('stock_entry_items')
        .select('*')
        .eq('entry_id', entry.id);
      if (itemsError) throw itemsError;

      setFormData({
        id: entry.id,
        entryNo: entry.entry_no,
        entryType: entry.entry_type as any,
        entryDate: entry.entry_date,
        warehouseId: (entry.from_warehouse_id || entry.to_warehouse_id) || '', // Use either from or to for adjustment
        notes: entry.notes || '',
        status: entry.status,
        items: itemsData.map(item => ({
          id: item.id,
          itemId: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          batchNo: item.batch_no || '',
          serialNos: item.serial_nos ? item.serial_nos.join(', ') : '',
          expiryDate: item.expiry_date || '',
        })),
      });
      setViewMode('edit');
    } catch (err: any) {
      showNotification(`Error loading stock entry for edit: ${err.message}`, 'error');
      console.error('Error loading stock entry for edit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntryToDeleteId(entryId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEntry = async () => {
    if (!entryToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      await supabase.from('stock_entry_items').delete().eq('entry_id', entryToDeleteId);
      const { error } = await supabase
        .from('stock_entries')
        .delete()
        .eq('id', entryToDeleteId);

      if (error) throw error;
      showNotification('Stock entry deleted successfully!', 'success');
      fetchStockEntries();
    } catch (err: any) {
      showNotification(`Error deleting stock entry: ${err.message}`, 'error');
      console.error('Error deleting stock entry:', err);
    } finally {
      setLoading(false);
      setEntryToDeleteId(null);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    setShowFilterModal(false);
  };

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalEntriesCount})` },
  ];

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
              {viewMode === 'create' ? 'Record Stock Adjustment' : 'Edit Stock Adjustment'}
            </h1>
            <p className={theme.textSecondary}>
              {viewMode === 'create' ? 'Adjust stock levels for inventory items.' : 'Update stock adjustment details.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setViewMode('list')} icon={<ArrowLeft size={16} />}>
            Back to List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Adjustment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Entry Number"
                value={formData.entryNo}
                onChange={(val) => handleInputChange('entryNo', val)}
                placeholder="Auto-generated or manual"
                required
              />
              <FormField
                label="Entry Date"
                type="date"
                value={formData.entryDate}
                onChange={(val) => handleInputChange('entryDate', val)}
                required
              />
              <MasterSelectField
                label="Warehouse"
                value={availableWarehouses.find(wh => wh.id === formData.warehouseId)?.name || ''}
                onValueChange={(val) => {}}
                onSelect={(id) => handleInputChange('warehouseId', id)}
                options={availableWarehouses}
                placeholder="Select Warehouse"
                required
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>Items to Adjust</h3>
              <Button size="sm" icon={<Plus size={16} />} onClick={addItemRow}>Add Item</Button>
            </div>
            <div className="space-y-4">
              {formData.items.map((item, index) => {
                const selectedItem = availableItems.find(i => i.id === item.itemId);
                return (
                  <div key={item.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="md:col-span-2">
                        <MasterSelectField
                          label="Item Name"
                          value={selectedItem?.item_name || ''}
                          onValueChange={(val) => {}}
                          onSelect={(id) => handleItemChange(index, 'itemId', id)}
                          options={availableItems.map(i => ({ id: i.id, name: i.item_name }))}
                          placeholder="Select Item"
                          required
                        />
                      </div>
                      <FormField
                        label="Quantity"
                        type="number"
                        value={item.quantity.toString()}
                        onChange={(val) => handleItemChange(index, 'quantity', parseFloat(val) || 0)}
                        required
                      />
                      <FormField
                        label="Rate"
                        type="number"
                        value={item.rate.toString()}
                        onChange={(val) => handleItemChange(index, 'rate', parseFloat(val) || 0)}
                      />
                      <div className="col-span-2 flex items-end justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => removeItemRow(index)}
                          disabled={formData.items.length === 1}
                          className="text-red-600 hover:text-red-800"
                        />
                      </div>
                    </div>
                    {selectedItem && (selectedItem.has_batch || selectedItem.has_serial || selectedItem.has_expiry) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {selectedItem.has_batch && (
                          <FormField
                            label="Batch No."
                            value={item.batchNo}
                            onChange={(val) => handleItemChange(index, 'batchNo', val)}
                          />
                        )}
                        {selectedItem.has_serial && (
                          <FormField
                            label="Serial Nos. (comma-separated)"
                            value={item.serialNos}
                            onChange={(val) => handleItemChange(index, 'serialNos', val)}
                          />
                        )}
                        {selectedItem.has_expiry && (
                          <FormField
                            label="Expiry Date"
                            type="date"
                            value={item.expiryDate}
                            onChange={(val) => handleItemChange(index, 'expiryDate', val)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Notes</h3>
            <FormField
              label="Notes"
              value={formData.notes}
              onChange={(val) => handleInputChange('notes', val)}
              placeholder="Any additional notes for this adjustment"
            />
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => setViewMode('list')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} icon={<Save size={16} />}>
              {loading ? 'Saving...' : 'Save Adjustment'}
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
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Stock Journal (Adjustments)</h1>
          <p className={theme.textSecondary}>Record increases or decreases in inventory stock levels.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/inventory')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Adjustment Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); }}>
            Record New Adjustment
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Stock Adjustments</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by entry number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchStockEntries()}
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
            value={numResultsOptions.find(opt => opt.id === numResultsToShow)?.name || ''}
            onValueChange={() => {}} // Not used for typing
            onSelect={(id) => setNumResultsToShow(id)}
            options={numResultsOptions}
            placeholder="Show"
            className="w-32"
          />
          <Button onClick={fetchStockEntries} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : stockEntries.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No stock adjustments found. Record a new one to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.entry_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.entry_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.from_warehouses?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{entry.total_value?.toLocaleString() || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => handleEditEntry(entry)} title="Edit">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        onConfirm={confirmDeleteEntry}
        title="Confirm Stock Adjustment Deletion"
        message="Are you sure you want to delete this stock adjustment entry? This action cannot be undone."
        confirmText="Yes, Delete Entry"
      />

      <StockJournalFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filterCriteria}
        onApplyFilters={handleApplyFilters}
        onFilterChange={(key, value) => setFilterCriteria(prev => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}

export default StockJournalPage;