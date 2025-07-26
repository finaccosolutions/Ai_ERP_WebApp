// src/pages/Inventory/masters/ItemMasterListPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, FolderOpen, Edit, Trash2, RefreshCw, Save, ArrowLeft, Filter, Package, Tag, DollarSign, Ruler, Layers, MapPin, Calendar, Barcode, Weight, Clock, ListOrdered, Info, Upload, Image as ImageIcon } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import MasterSelectField from '../../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import ConfirmationModal from '../../../components/UI/ConfirmationModal';
import ItemMasterFilterModal from '../../../components/Modals/ItemMasterFilterModal';

interface Item {
  id: string;
  item_code: string;
  item_name: string;
  description: string | null;
  category_id: string | null;
  unit_id: string | null;
  item_type: string;
  is_sales_item: boolean;
  is_purchase_item: boolean;
  is_stock_item: boolean;
  has_batch: boolean;
  has_serial: boolean;
  has_expiry: boolean;
  standard_rate: number;
  purchase_rate: number;
  min_order_qty: number;
  reorder_level: number;
  max_level: number;
  lead_time_days: number;
  weight: number;
  weight_unit: string;
  barcode: string | null;
  hsn_code: string | null;
  tax_rate: number;
  image_url: string | null;
  is_active: boolean;
  custom_attributes: any | null;
  created_at: string;
  item_categories?: { name: string } | null;
  units_of_measure?: { name: string } | null;
  item_groups?: { name: string } | null; // NEW: Added item_groups for joined data
  // NEW: Add current_qty and current_value
  current_qty: number;
  current_value: number;
}

function ItemMasterListPage() {
  const { theme } = useTheme();
  const { currentCompany, currentPeriod } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    itemName: '',
    itemCode: '',
    itemType: 'all',
    categoryId: '',
    itemGroupId: '', // NEW: Added itemGroupId to filter criteria
    minSalesPrice: '',
    maxSalesPrice: '',
    isActive: 'all',
  });

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalItemsCount})` },
  ];

  const [numResultsToShow, setNumResultsToShow] = useState<string>('10');


  useEffect(() => {
    if (currentCompany?.id) {
      fetchItems();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentCompany?.id) {
        console.log('ItemMasterListPage: Document became visible, re-fetching items.');
        fetchItems();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentCompany?.id, currentPeriod?.id, filterCriteria, numResultsToShow, searchTerm]);

  const fetchItems = async () => {
    if (!currentCompany?.id || !currentPeriod?.id) return;
    setLoading(true);
    try {
      // 1. Fetch all items
      let itemsQuery = supabase
        .from('items')
        .select(`
          id, item_code, item_name, description, category_id, unit_id, item_type,
          is_sales_item, is_purchase_item, is_stock_item, has_batch, has_serial, has_expiry,
          standard_rate, purchase_rate, min_order_qty, reorder_level, max_level,
          lead_time_days, weight, weight_unit, barcode, hsn_code, tax_rate, image_url, is_active,
          created_at, item_group_id,
          item_categories ( name ),
          units_of_measure ( name ),
          item_groups ( name )
        `, { count: 'exact' }) // NEW: Select item_groups name
        .eq('company_id', currentCompany.id);

      // Apply search term
      if (searchTerm) {
        itemsQuery = itemsQuery.ilike('item_name', `%${searchTerm}%`);
      }
      if (filterCriteria.itemName) {
        itemsQuery = itemsQuery.ilike('item_name', `%${filterCriteria.itemName}%`);
      }
      if (filterCriteria.itemCode) {
        itemsQuery = itemsQuery.ilike('item_code', `%${filterCriteria.itemCode}%`);
      }
      if (filterCriteria.itemType !== 'all') {
        itemsQuery = itemsQuery.eq('item_type', filterCriteria.itemType);
      }
      if (filterCriteria.categoryId) {
        itemsQuery = itemsQuery.eq('category_id', filterCriteria.categoryId);
      }
      if (filterCriteria.itemGroupId) {
        itemsQuery = itemsQuery.eq('item_group_id', filterCriteria.itemGroupId);
      }
      if (filterCriteria.minSalesPrice) {
        itemsQuery = itemsQuery.gte('standard_rate', parseFloat(filterCriteria.minSalesPrice));
      }
      if (filterCriteria.maxSalesPrice) {
        itemsQuery = itemsQuery.lte('standard_rate', parseFloat(filterCriteria.maxSalesPrice));
      }
      if (filterCriteria.isActive !== 'all') {
        itemsQuery = itemsQuery.eq('is_active', filterCriteria.isActive === 'true');
      }

      itemsQuery = itemsQuery.order('item_name', { ascending: true });

      // Fetch all items first, then apply limit for display
      const { data: fetchedItems, error: itemsError, count } = await itemsQuery;
      if (itemsError) throw itemsError;

      setTotalItemsCount(count || 0);

      // 2. Get all item_ids for stock ledger query
      const itemIds = fetchedItems.map(item => item.id);

      // 3. Query stock_ledger for current period
      const { data: stockLedgerEntries, error: stockLedgerError } = await supabase
        .from('stock_ledger')
        .select('item_id, actual_qty, stock_value')
        .eq('company_id', currentCompany.id)
        .gte('posting_date', currentPeriod.startDate)
        .lte('posting_date', currentPeriod.endDate);

      if (stockLedgerError) throw stockLedgerError;

      // 4. Aggregate stock_ledger data
      const itemStockMap = new Map<string, { qty: number; value: number }>();
      stockLedgerEntries.forEach(entry => {
        const current = itemStockMap.get(entry.item_id) || { qty: 0, value: 0 };
        itemStockMap.set(entry.item_id, {
          qty: current.qty + (entry.actual_qty || 0),
          value: current.value + (entry.stock_value || 0),
        });
      });

      // 5. Merge aggregated data into items
      const itemsWithStock: Item[] = fetchedItems.map(item => {
        const stockData = itemStockMap.get(item.id) || { qty: 0, value: 0 };
        return {
          ...item,
          current_qty: stockData.qty,
          current_value: stockData.value,
        };
      });

      // Apply pagination limit for display after fetching all and calculating stock
      const paginatedItems = numResultsToShow !== 'all'
        ? itemsWithStock.slice(0, parseInt(numResultsToShow))
        : itemsWithStock;

      setItems(paginatedItems);

    } catch (err: any) {
      showNotification(`Error fetching items: ${err.message}`, 'error');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setItemToDeleteId(itemId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemToDeleteId);

      if (error) throw error;
      showNotification('Item deleted successfully!', 'success');
      fetchItems();
    } catch (err: any) {
      showNotification(`Error deleting item: ${err.message}`, 'error');
      console.error('Error deleting item:', err);
    } finally {
      setLoading(false);
      setItemToDeleteId(null);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    setShowFilterModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Item Master</h1>
          <p className={theme.textSecondary}>Manage all your inventory items, products, and services.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/inventory')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <Link to="/inventory/masters/items/new">
            <Button icon={<Plus size={16} />}>Add New Item</Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Items</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchItems()}
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
          <Button onClick={fetchItems} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No items found. Add a new item to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Price</th>
                  {/* NEW: Current Qty and Value columns */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.item_categories?.name || 'N/A'}</td>
                    {/* Adjusted "Group" column display logic */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.item_groups?.name || 'Primary'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.units_of_measure?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.standard_rate.toLocaleString()}</td>
                    {/* NEW: Display Current Qty and Value */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.current_qty.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.current_value.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/inventory/masters/items/edit/${item.id}`)} title="Edit">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        onConfirm={confirmDeleteItem}
        title="Confirm Item Deletion"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Yes, Delete Item"
      />

      <ItemMasterFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filterCriteria}
        onApplyFilters={handleApplyFilters}
        onFilterChange={(key, value) => setFilterCriteria(prev => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}

export default ItemMasterListPage;
