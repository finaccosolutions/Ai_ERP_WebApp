// src/pages/Inventory/masters/ItemMasterPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, FolderOpen, Edit, Trash2, RefreshCw, Save, ArrowLeft, Filter, Package, Tag, DollarSign, Ruler, Layers, MapPin, Calendar, Barcode, Weight, Clock, ListOrdered, Info, Upload, Image as ImageIcon } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import MasterSelectField from '../../../components/UI/MasterSelectField';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { useNotification } from '../../../contexts/NotificationContext';
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
  is_sales_item: boolean; // Keeping in interface for DB compatibility, but removed from UI
  is_purchase_item: boolean; // Keeping in interface for DB compatibility, but removed from UI
  is_stock_item: boolean; // Keeping in interface for DB compatibility, but removed from UI
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
}

function ItemMasterPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [formData, setFormData] = useState({
    id: '',
    itemCode: '',
    itemName: '',
    description: '',
    categoryId: '',
    unitId: '',
    itemType: 'stock', // Default to stock
    hasBatch: false,
    hasSerial: false,
    hasExpiry: false,
    standardRate: 0,
    purchaseRate: 0,
    minOrderQty: 0,
    reorderLevel: 0,
    maxLevel: 0,
    leadTimeDays: 0,
    weight: 0,
    weightUnit: 'kg',
    barcode: '',
    hsnCode: '',
    taxRate: 0,
    imageUrl: '', // For image preview
    isActive: true,
    itemGroupId: '', // NEW: Added itemGroupId to form data
  });

  const [imageFile, setImageFile] = useState<File | null>(null); // State for image file upload

  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string }[]>([]);
  const [availableUnits, setAvailableUnits] = useState<{ id: string; name: string }[]>([]);
  const [availableItemGroups, setAvailableItemGroups] = useState<{ id: string; name: string }[]>([]); // NEW: State for Item Groups

  // NEW: State for the search term of the Unit of Measure dropdown
  const [unitSearchTerm, setUnitSearchTerm] = useState('');

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

  // Flag to check if navigated from Sales Invoice Create Page
  const fromSalesInvoiceCreate = location.state?.fromInvoiceCreation === true;

  useEffect(() => {
    console.log("ItemMasterPage useEffect triggered.");
    console.log("Current URL Pathname:", location.pathname);
    console.log("URL Param ID:", id);

    if (currentCompany?.id) {
      fetchMastersData(currentCompany.id);
      if (id) {
        console.log("Detected ID in URL. Setting viewMode to 'edit'.");
        fetchItemData(id);
        setViewMode('edit');
      } else if (location.pathname.endsWith('/new')) {
        console.log("Detected '/new' in URL. Setting viewMode to 'create'.");
        setViewMode('create');
        resetForm(); // Ensure form is clean for new item
        generateItemCode(currentCompany.id); // Autofill item code
      } else {
        console.log("No ID or '/new' detected. Setting viewMode to 'list'.");
        fetchItems();
        setViewMode('list');
      }
    } else {
      console.log("No currentCompany.id. Skipping data fetch.");
      setLoading(false);
    }
  }, [currentCompany?.id, id, location.pathname, filterCriteria]);

  const fetchMastersData = async (companyId: string) => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('item_categories')
        .select('id, name')
        .eq('company_id', companyId);
      if (categoriesError) throw categoriesError;
      setAvailableCategories(categoriesData);

      // Fetch both company-specific and global units
      const { data: unitsData, error: unitsError } = await supabase
        .from('units_of_measure')
        .select('id, name')
        .or(`company_id.eq.${companyId},is_system_defined.eq.true`); // NEW: Fetch both
      if (unitsError) throw unitsError;
      setAvailableUnits(unitsData);

      // --- ADD THIS CONSOLE LOG ---
      console.log('ItemMasterPage: Available Units for Item Master dropdown:', unitsData);
      // --- END ADD ---

      // NEW: Fetch Item Groups
      const { data: itemGroupsData, error: itemGroupsError } = await supabase
        .from('item_groups')
        .select('id, name')
        .eq('company_id', companyId);
      if (itemGroupsError) throw itemGroupsError;
      setAvailableItemGroups(itemGroupsData);

    } catch (error) {
      console.error('Error fetching master data:', error);
      showNotification('Failed to load categories, units, or item groups.', 'error');
    }
  };

  const fetchItems = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('items')
        .select(`
          *,
          item_categories ( name ),
          units_of_measure ( name ),
          item_groups ( name )
        `, { count: 'exact' }) // NEW: Select item_groups name
        .eq('company_id', currentCompany.id);

      // Apply search term
      if (searchTerm) {
        query = query.ilike('item_name', `%${searchTerm}%`);
      }

      // Apply filters
      if (filterCriteria.itemName) {
        query = query.ilike('item_name', `%${filterCriteria.itemName}%`);
      }
      if (filterCriteria.itemCode) {
        query = query.ilike('item_code', `%${filterCriteria.itemCode}%`);
      }
      if (filterCriteria.itemType !== 'all') {
        query = query.eq('item_type', filterCriteria.itemType);
      }
      if (filterCriteria.categoryId) {
        query = query.eq('category_id', filterCriteria.categoryId);
      }
      if (filterCriteria.itemGroupId) { // NEW: Apply item group filter
        query = query.eq('item_group_id', filterCriteria.itemGroupId);
      }
      if (filterCriteria.minSalesPrice) {
        query = query.gte('standard_rate', parseFloat(filterCriteria.minSalesPrice));
      }
      if (filterCriteria.maxSalesPrice) {
        query = query.lte('standard_rate', parseFloat(filterCriteria.maxSalesPrice));
      }
      if (filterCriteria.isActive !== 'all') {
        query = query.eq('is_active', filterCriteria.isActive === 'true');
      }

      query = query.order('item_name', { ascending: true });


      const { data, error, count } = await query;

      if (error) throw error;
      setItems(data || []);
      setTotalItemsCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching items: ${err.message}`, 'error');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemData = async (itemId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          itemCode: data.item_code,
          itemName: data.item_name,
          description: data.description || '',
          categoryId: data.category_id || '',
          unitId: data.unit_id || '',
          itemType: data.item_type,
          hasBatch: data.has_batch,
          hasSerial: data.has_serial,
          hasExpiry: data.has_expiry,
          standardRate: data.standard_rate,
          purchaseRate: data.purchase_rate,
          minOrderQty: data.min_order_qty,
          reorderLevel: data.reorder_level,
          maxLevel: data.max_level,
          leadTimeDays: data.lead_time_days,
          weight: data.weight,
          weightUnit: data.weight_unit,
          barcode: data.barcode || '',
          hsnCode: data.hsn_code || '',
          taxRate: data.tax_rate,
          imageUrl: data.image_url || '',
          isActive: data.is_active,
          itemGroupId: data.item_group_id || '', // NEW: Set itemGroupId
        });
        // NEW: Initialize unitSearchTerm when editing
        const unit = availableUnits.find(u => u.id === data.unit_id);
        setUnitSearchTerm(unit?.name || '');
      }
    } catch (err: any) {
      showNotification(`Error loading item: ${err.message}`, 'error');
      console.error('Error loading item:', err);
      navigate('/inventory/masters/items');
    } finally {
      setLoading(false);
    }
  };

  const generateItemCode = async (companyId: string) => {
    try {
      const { count, error } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (error) throw error;

      const nextNumber = (count || 0) + 1;
      const newItemCode = `ITEM-${String(nextNumber).padStart(4, '0')}`; // e.g., ITEM-0001
      setFormData(prev => ({ ...prev, itemCode: newItemCode }));
    } catch (err) {
      console.error('Error generating item code:', err);
      showNotification('Failed to generate item code. Please enter manually.', 'error');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Display a preview of the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File) => {
    if (!currentCompany?.id) {
      throw new Error("Company ID is missing for image upload.");
    }
    // Define the path in Supabase Storage
    const filePath = `${currentCompany.id}/item_images/${Date.now()}_${file.name}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('item_images') // Ensure you have a bucket named 'item_images' in Supabase Storage
      .upload(filePath, file, {
        cacheControl: '3600', // Cache for 1 hour
        upsert: false, // Do not overwrite if file exists
      });

    if (error) {
      console.error("Supabase Storage Upload Error:", error);
      throw new Error(`Failed to upload image: ${error.message}. Please check Supabase Storage bucket and RLS policies.`);
    }
    
    // Get the public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage.from('item_images').getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const resetForm = () => {
    setFormData({
      id: '',
      itemCode: '',
      itemName: '',
      description: '',
      categoryId: '',
      unitId: '',
      itemType: 'stock',
      hasBatch: false,
      hasSerial: false,
      hasExpiry: false,
      standardRate: 0,
      purchaseRate: 0,
      minOrderQty: 0,
      reorderLevel: 0,
      maxLevel: 0,
      leadTimeDays: 0,
      weight: 0,
      weightUnit: 'kg',
      barcode: '',
      hsnCode: '',
      taxRate: 0,
      imageUrl: '',
      isActive: true,
      itemGroupId: '', // NEW: Reset itemGroupId
    });
    setImageFile(null);
    // NEW: Reset unitSearchTerm
    setUnitSearchTerm('');
  };

  const validateForm = () => {
    if (!formData.itemName.trim()) {
      showNotification('Item Name is required.', 'error');
      return false;
    }
    if (!formData.itemCode.trim()) {
      showNotification('Item Code is required.', 'error');
      return false;
    }
    if (!formData.unitId) {
      showNotification('Unit of Measure is required.', 'error');
      return false;
    }
    if (formData.standardRate < 0) {
      showNotification('Default Sales Price cannot be negative.', 'error');
      return false;
    }
    if (formData.purchaseRate < 0) {
      showNotification('Default Purchase Price cannot be negative.', 'error');
      return false;
    }
    if (formData.taxRate < 0 || formData.taxRate > 100) {
      showNotification('Tax Rate must be between 0 and 100.', 'error');
      return false;
    }
    // Only validate inventory-specific fields if it's a stock item
    if (formData.itemType === 'stock') {
      if (formData.reorderLevel < 0) {
        showNotification('Reorder Level cannot be negative.', 'error');
        return false;
      }
      if (formData.minOrderQty < 0) {
        showNotification('Min Order Quantity cannot be negative.', 'error');
        return false;
      }
      if (formData.maxLevel < 0) {
        showNotification('Max Level cannot be negative.', 'error');
        return false;
      }
      if (formData.leadTimeDays < 0) {
        showNotification('Lead Time (Days) cannot be negative.', 'error');
        return false;
      }
      if (formData.weight < 0) {
        showNotification('Weight cannot be negative.', 'error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting to save item. Form Data:", formData); // Debugging log
    if (!validateForm()) {
      console.log("Form validation failed."); // Debugging log
      return;
    }
    if (!currentCompany?.id) {
      showNotification('Company information is missing. Please select a company.', 'error');
      console.log("Company ID missing."); // Debugging log
      return;
    }

    setLoading(true);
    try {
      let uploadedImageUrl = formData.imageUrl;
      if (imageFile) {
        console.log("Uploading image file..."); // Debugging log
        uploadedImageUrl = await uploadImage(imageFile);
        console.log("Image uploaded. URL:", uploadedImageUrl); // Debugging log
      }

      const itemToSave = {
        company_id: currentCompany.id,
        item_code: formData.itemCode,
        item_name: formData.itemName,
        description: formData.description,
        category_id: formData.categoryId || null,
        unit_id: formData.unitId || null,
        item_type: formData.itemType,
        // Implicitly set these based on itemType
        is_sales_item: formData.itemType !== 'service', // Assume sales if not service
        is_purchase_item: true, // All items can be purchased
        is_stock_item: formData.itemType === 'stock', // Only stock items are stock items
        has_batch: formData.hasBatch,
        has_serial: formData.hasSerial,
        has_expiry: formData.hasExpiry,
        standard_rate: formData.standardRate,
        purchase_rate: formData.purchaseRate,
        min_order_qty: formData.minOrderQty,
        reorder_level: formData.reorderLevel,
        max_level: formData.maxLevel,
        lead_time_days: formData.leadTimeDays,
        weight: formData.weight,
        weight_unit: formData.weightUnit,
        barcode: formData.barcode,
        hsn_code: formData.hsnCode,
        tax_rate: formData.taxRate,
        image_url: uploadedImageUrl,
        is_active: formData.isActive,
        item_group_id: formData.itemGroupId || null, // FIX: Set to null if empty string
      };

      console.log("Item data to save:", itemToSave); // Debugging log

      let newItemId = formData.id;
      if (formData.id) {
        console.log("Updating existing item:", formData.id); // Debugging log
        const { error } = await supabase
          .from('items')
          .update(itemToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Item updated successfully!', 'success');
      } else {
        console.log("Inserting new item."); // Debugging log
        const { data, error } = await supabase
          .from('items')
          .insert(itemToSave)
          .select('id, item_name')
          .single();
        if (error) throw error;
        newItemId = data.id;
        showNotification('Item created successfully!', 'success');
      }
      
      if (fromSalesInvoiceCreate) {
        navigate(location.state.returnPath, {
          replace: true,
          state: {
            fromInvoiceCreation: true,
            createdId: newItemId,
            createdName: formData.itemName,
            masterType: 'item'
          }
        });
      } else {
        console.log("Navigating to /inventory/masters/items after successful save."); // Debugging log
        navigate('/inventory/masters/items'); // Navigate back to list on success
      }
      resetForm();
    } catch (err: any) {
      console.error('Save item error:', err); // Detailed error log
      showNotification(`Failed to save item: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      console.log("Loading state set to false."); // Debugging log
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

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalItemsCount})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {viewMode === 'create' ? 'Create New Item' : (viewMode === 'edit' ? 'Edit Item' : 'Item Master')}
          </h1>
          <p className={theme.textSecondary}>
            {viewMode === 'create' ? 'Define a new inventory item.' : (viewMode === 'edit' ? 'Update existing item details.' : 'Manage all your inventory items, products, and services.')}
          </p>
        </div>
        {!fromSalesInvoiceCreate && (
          <Button variant="outline" onClick={() => navigate('/inventory/masters/items')} icon={<ArrowLeft size={16} />}>
            Back to Item List
          </Button>
        )}
        {fromSalesInvoiceCreate && (
          <Button variant="outline" onClick={() => navigate(location.state.returnPath, { replace: true, state: { fromInvoiceCreation: true } })} icon={<ArrowLeft size={16} />}>
            Cancel
          </Button>
        )}
      </div>

      {viewMode === 'list' ? (
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
            <Button onClick={fetchItems} disabled={loading} icon={<RefreshCw size={16} />}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Link to="/inventory/masters/items/new">
              <Button icon={<Plus size={16} />}>Add New Item</Button>
            </Link>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th> {/* NEW: Table header for Item Group */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Price</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.item_groups?.name || 'N/A'}</td> {/* NEW: Display Item Group */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.units_of_measure?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.standard_rate.toLocaleString()}</td>
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
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <Package size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Item Name"
                value={formData.itemName}
                onChange={(val) => handleInputChange('itemName', val)}
                placeholder="e.g., Product A, Consulting Service"
                required
              />
              <FormField
                label="Item Code (SKU)"
                value={formData.itemCode}
                onChange={(val) => handleInputChange('itemCode', val)}
                placeholder="e.g., PROD-A-001, SVC-CONSULT"
                required
                readOnly={!!formData.id} // Make read-only if editing existing item
              />
              <FormField
                label="Description"
                value={formData.description}
                onChange={(val) => handleInputChange('description', val)}
                placeholder="Detailed description of the item"
                className="md:col-span-2"
              />
              <MasterSelectField
                label="Item Group" // NEW: Item Group Field
                value={availableItemGroups.find(group => group.id === formData.itemGroupId)?.name || ''}
                onValueChange={(val) => {}}
                onSelect={(id) => handleInputChange('itemGroupId', id)}
                options={availableItemGroups}
                placeholder="Select Item Group"
              />
              <MasterSelectField
                label="Item Category"
                value={availableCategories.find(cat => cat.id === formData.categoryId)?.name || ''}
                onValueChange={(val) => {}} // No direct typing for this field
                onSelect={(id) => handleInputChange('categoryId', id)}
                options={availableCategories}
                placeholder="Select Category"
              />
              <MasterSelectField
                label="Unit of Measure"
                value={unitSearchTerm} // NEW: Use unitSearchTerm for display
                onValueChange={setUnitSearchTerm} // NEW: Update unitSearchTerm on type
                onSelect={(id, name) => { // NEW: Update unitId and unitSearchTerm on select
                  handleInputChange('unitId', id);
                  setUnitSearchTerm(name);
                }}
                options={availableUnits}
                placeholder="Select Unit"
                required
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Item Type</label>
                <select
                  value={formData.itemType}
                  onChange={(e) => handleInputChange('itemType', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  <option value="stock">Stock Item</option>
                  <option value="non_stock">Non-Stock Item</option>
                  <option value="service">Service Item</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <DollarSign size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Pricing & Taxation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Default Sales Price"
                type="number"
                value={formData.standardRate.toString()}
                onChange={(val) => handleInputChange('standardRate', parseFloat(val) || 0)}
                icon={<DollarSign size={18} />}
              />
              <FormField
                label="Default Purchase Price"
                type="number"
                value={formData.purchaseRate.toString()}
                onChange={(val) => handleInputChange('purchaseRate', parseFloat(val) || 0)}
                icon={<DollarSign size={18} />}
              />
              <FormField
                label={currentCompany?.country === 'IN' ? "GST (%)" : "Tax Rate (%)"}
                type="number"
                value={formData.taxRate.toString()}
                onChange={(val) => handleInputChange('taxRate', parseFloat(val) || 0)}
                icon={<Tag size={18} />}
              />
              <FormField
                label="HSN/SAC Code"
                value={formData.hsnCode}
                onChange={(val) => handleInputChange('hsnCode', val)}
                placeholder="e.g., 8471 (for goods), 9983 (for services)"
                icon={<Barcode size={18} />}
              />
            </div>
          </Card>

          {/* Inventory & Tracking section - only for stock items */}
          {formData.itemType === 'stock' && (
            <Card className="p-6">
              <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                <MapPin size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                Inventory & Tracking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Reorder Level"
                  type="number"
                  value={formData.reorderLevel.toString()}
                  onChange={(val) => handleInputChange('reorderLevel', parseFloat(val) || 0)}
                  icon={<ListOrdered size={18} />}
                />
                <FormField
                  label="Min Order Quantity"
                  type="number"
                  value={formData.minOrderQty.toString()}
                  onChange={(val) => handleInputChange('minOrderQty', parseFloat(val) || 0)}
                  icon={<Package size={18} />}
                />
                <FormField
                  label="Max Level"
                  type="number"
                  value={formData.maxLevel.toString()}
                  onChange={(val) => handleInputChange('maxLevel', parseFloat(val) || 0)}
                  icon={<Package size={18} />}
                />
                <FormField
                  label="Lead Time (Days)"
                  type="number"
                  value={formData.leadTimeDays.toString()}
                  onChange={(val) => handleInputChange('leadTimeDays', parseInt(val) || 0)}
                  icon={<Clock size={18} />}
                />
                <FormField
                  label="Barcode / QR Code"
                  value={formData.barcode}
                  onChange={(val) => handleInputChange('barcode', val)}
                  placeholder="Scan or enter barcode"
                  icon={<Barcode size={18} />}
                />
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="hasBatch" checked={formData.hasBatch} onChange={(e) => handleInputChange('hasBatch', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                  <label htmlFor="hasBatch" className={`text-sm font-medium ${theme.textPrimary}`}>Track by Batch</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="hasSerial" checked={formData.hasSerial} onChange={(e) => handleInputChange('hasSerial', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                  <label htmlFor="hasSerial" className={`text-sm font-medium ${theme.textPrimary}`}>Track by Serial Number</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="hasExpiry" checked={formData.hasExpiry} onChange={(e) => handleInputChange('hasExpiry', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                  <label htmlFor="hasExpiry" className={`text-sm font-medium ${theme.textPrimary}`}>Track by Expiry Date</label>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <Info size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Other Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <FormField
                  label="Weight"
                  type="number"
                  value={formData.weight.toString()}
                  onChange={(val) => handleInputChange('weight', parseFloat(val) || 0)}
                  icon={<Weight size={18} />}
                  className="flex-1"
                />
                <div className="space-y-2 flex-1">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>Unit</label>
                  <select
                    value={formData.weightUnit}
                    onChange={(e) => handleInputChange('weightUnit', e.target.value)}
                    className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                  </select>
                </div>
              </div>
              {/* Image Upload */}
              <div className="md:col-span-2 space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Item Image</label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Item Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={48} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      id="item-image-upload"
                    />
                    <label htmlFor="item-image-upload" className={`
                      inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium
                      text-gray-700 bg-white hover:bg-gray-50 cursor-pointer
                    `}>
                      <Upload size={16} className="mr-2" />
                      Upload Image
                    </label>
                    {imageFile && <p className="text-sm text-gray-500 mt-2">{imageFile.name}</p>}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 md:col-span-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                <label htmlFor="isActive" className={`text-sm font-medium ${theme.textPrimary}`}>Is Active</label>
              </div>
            </div>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/inventory/masters/items')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} icon={<Save size={16} />}>
              {loading ? 'Saving...' : 'Save Item'}
            </Button>
          </div>
        </form>
      )}

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

export default ItemMasterPage;