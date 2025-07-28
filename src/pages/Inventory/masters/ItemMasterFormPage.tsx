// src/pages/Inventory/masters/ItemMasterFormPage.tsx
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

function ItemMasterFormPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
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

  const isEditMode = !!id;
  // Flag to check if navigated from Sales Invoice Create Page
  const fromSalesInvoiceCreate = location.state?.fromInvoiceCreation === true;


  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true); // Start loading
      try {
        // Fetch master data (categories, units, item groups)
        await fetchMastersData(currentCompany.id);

        if (isEditMode) {
          await fetchItemData(id as string); // This function already handles setLoading(false) in its finally
        } else {
          resetForm(); // Resets form data
          await generateItemCode(currentCompany.id); // Generates code
          // Handle initialName from SalesInvoiceCreatePage
          if (location.state?.fromInvoiceCreation && location.state?.initialName) {
            setFormData(prev => ({ ...prev, itemName: location.state.initialName }));
          }
          setLoading(false); // Explicitly set loading to false for create mode after setup
        }
      } catch (error) {
        console.error("Error during form initialization:", error);
        showNotification("Failed to initialize form data.", "error");
        setLoading(false); // Ensure loading is false on error
      }
    };

    if (currentCompany?.id) {
      initializeForm();
    }
  }, [currentCompany?.id, id, isEditMode, location.state]); // Added location.state to dependencies

  const fetchMastersData = async (companyId: string) => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('item_categories')
        .select('id, name')
        .eq('company_id', companyId);
      if (categoriesError) throw categoriesError;
      setAvailableCategories(categoriesData);

      const { data: unitsData, error: unitsError } = await supabase
        .from('units_of_measure')
        .select('id, name')
        .or(`company_id.eq.${companyId},is_system_defined.eq.true`);
      if (unitsError) throw unitsError;
      setAvailableUnits(unitsData);

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
          itemGroupId: data.item_group_id || '',
        });
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
      const newItemCode = `ITEM-${String(nextNumber).padStart(4, '0')}`;
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
    const filePath = `${currentCompany.id}/item_images/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('item_images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error("Supabase Storage Upload Error:", error);
      throw new Error(`Failed to upload image: ${error.message}. Please check Supabase Storage bucket and RLS policies.`);
    }
    
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
      itemGroupId: '',
    });
    setImageFile(null);
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
    if (!validateForm()) {
      return;
    }
    if (!currentCompany?.id) {
      showNotification('Company information is missing. Please select a company.', 'error');
      return;
    }

    setLoading(true);
    try {
      let uploadedImageUrl = formData.imageUrl;
      if (imageFile) {
        uploadedImageUrl = await uploadImage(imageFile);
      }

      const itemToSave = {
        company_id: currentCompany.id,
        item_code: formData.itemCode,
        item_name: formData.itemName,
        description: formData.description,
        category_id: formData.categoryId || null,
        unit_id: formData.unitId || null,
        item_type: formData.itemType,
        is_sales_item: formData.itemType !== 'service',
        is_purchase_item: true,
        is_stock_item: formData.itemType === 'stock',
        has_batch: formData.hasBatch,
        has_serial: formData.hasSerial,
        has_expiry: formData.hasExpiry,
        standard_rate: formData.standardRate,
        purchase_rate: formData.purchaseRate,
        min_order_qty: formData.minOrderQty,
        reorder_level: formData.reorderLevel,
        max_level: formData.max_level,
        lead_time_days: formData.leadTimeDays,
        weight: formData.weight,
        weight_unit: formData.weightUnit,
        barcode: formData.barcode,
        hsn_code: formData.hsnCode,
        tax_rate: formData.taxRate,
        image_url: uploadedImageUrl,
        is_active: formData.isActive,
        item_group_id: formData.itemGroupId || null,
      };

      let newItemId = formData.id;
      if (formData.id) {
        const { error } = await supabase
          .from('items')
          .update(itemToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Item updated successfully!', 'success');
      } else {
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
        navigate('/inventory/masters/items');
      }
      resetForm();
    } catch (err: any) {
      showNotification(`Failed to save item: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {isEditMode ? 'Edit Item' : 'Create New Item'}
          </h1>
          <p className={theme.textSecondary}>
            {isEditMode ? 'Update existing item details.' : 'Define a new inventory item.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/inventory/masters/items')} icon={<ArrowLeft size={16} />}>
          Back to Item List
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
        </div>
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
                readOnly={isEditMode}
              />
              <FormField
                label="Description"
                value={formData.description}
                onChange={(val) => handleInputChange('description', val)}
                placeholder="Detailed description of the item"
                className="md:col-span-2"
              />
              <MasterSelectField
                label="Item Group"
                value={availableItemGroups.find(group => group.id === formData.itemGroupId)?.name || ''}
                onValueChange={(val) => {}}
                onSelect={(id) => handleInputChange('itemGroupId', id)}
                options={availableItemGroups}
                placeholder="Select Item Group"
              />
              <MasterSelectField
                label="Item Category"
                value={availableCategories.find(cat => cat.id === formData.categoryId)?.name || ''}
                onValueChange={(val) => {}}
                onSelect={(id) => handleInputChange('categoryId', id)}
                options={availableCategories}
                placeholder="Select Category"
              />
              <MasterSelectField
                label="Unit of Measure"
                value={unitSearchTerm}
                onValueChange={setUnitSearchTerm}
                onSelect={(id, name) => {
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
    </div>
  );
}

export default ItemMasterFormPage;