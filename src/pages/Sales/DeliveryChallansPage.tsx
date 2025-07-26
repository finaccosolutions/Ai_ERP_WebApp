// src/pages/Sales/DeliveryChallansPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Truck, Search, Calendar, Users, Package, List, Save, Send, Trash2, MapPin, RefreshCw, ArrowLeft, Filter } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField'; // Import MasterSelectField
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom'; // Add this line

// NOTE: The 'delivery_challans' and 'delivery_challan_items' tables are NOT present in your current database schema.
// You will need to create these tables in Supabase for this page's save/fetch functionality to work.
// Example schema for delivery_challans:
// CREATE TABLE public.delivery_challans (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
//   challan_no text NOT NULL UNIQUE,
//   customer_id uuid REFERENCES public.customers(id),
//   sales_order_id uuid REFERENCES public.sales_orders(id),
//   challan_date date DEFAULT CURRENT_DATE NOT NULL,
//   delivery_address jsonb DEFAULT '{}'::jsonb,
//   notes text,
//   status text DEFAULT 'draft'::text CHECK (status IN ('draft', 'dispatched', 'delivered', 'cancelled')),
//   created_by uuid REFERENCES public.users(id),
//   created_at timestamp with time zone DEFAULT now(),
//   updated_at timestamp with time zone DEFAULT now()
// );
//
// Example schema for delivery_challan_items:
// CREATE TABLE public.delivery_challan_items (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   challan_id uuid REFERENCES public.delivery_challans(id) ON DELETE CASCADE,
//   item_id uuid REFERENCES public.items(id),
//   item_name text NOT NULL,
//   quantity numeric(15,3) NOT NULL DEFAULT 1,
//   unit text DEFAULT 'Nos'::text,
//   description text,
//   created_at timestamp with time zone DEFAULT now()
// );


interface DeliveryChallanItem {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
}

// Define Item type for MasterSelectField options
interface ItemOption {
  id: string;
  name: string;
  item_code: string;
  standard_rate: number;
  unit_id: string;
  tax_rate: number;
  hsn_code: string;
  description: string;
  units_of_measure: { name: string } | null; // Nested unit name
}

function DeliveryChallansPage() {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate(); // Initialize useNavigate

  const [viewMode, setViewMode] = useState<'create' | 'list'>('list');
  const [challanMode, setChallanMode] = useState<'item_mode' | 'voucher_mode'>('item_mode'); // Delivery Challans typically always have items

  const [challan, setChallan] = useState({
    id: '',
    challanNo: '',
    customerId: '',
    customerName: '',
    salesOrderId: '',
    challanDate: new Date().toISOString().split('T')[0], // Changed to string
    deliveryAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
    notes: '',
    status: 'draft', // draft, dispatched, delivered, cancelled
  });

  const [items, setItems] = useState<DeliveryChallanItem[]>([
    {
      id: '1',
      itemId: '',
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'Nos',
    }
  ]);

  const [deliveryChallans, setDeliveryChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableItems, setAvailableItems] = useState<ItemOption[]>([]); // State to store available items

  useEffect(() => {
    if (currentCompany?.id) {
      fetchDeliveryChallans();
      fetchAvailableItems(currentCompany.id);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentCompany?.id) {
        console.log('DeliveryChallansPage: Document became visible, re-fetching delivery challans.');
        fetchDeliveryChallans();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [viewMode, currentCompany?.id]);

  const fetchDeliveryChallans = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    setError(null);
    try {
      // NOTE: This will fail if 'delivery_challans' table does not exist
      const { data, error } = await supabase
        .from('delivery_challans')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('challan_date', { ascending: false });

      if (error) throw error;
      setDeliveryChallans(data);
    } catch (err: any) {
      setError(`Error fetching delivery challans: ${err.message}. Make sure 'delivery_challans' table exists.`);
      console.error('Error fetching delivery challans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableItems = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          id,
          item_code,
          item_name,
          standard_rate,
          tax_rate,
          hsn_code,
          description,
          units_of_measure ( name )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (error) throw error;
      setAvailableItems(data.map(item => ({
        id: item.id,
        name: item.item_name,
        item_code: item.item_code,
        standard_rate: item.standard_rate,
        unit_id: item.units_of_measure?.name || 'Nos', // Assuming unit_id is the name of the unit
        tax_rate: item.tax_rate,
        hsn_code: item.hsn_code,
        description: item.description,
        units_of_measure: item.units_of_measure,
      })));
    } catch (error) {
      console.error('Error fetching available items:', error);
    }
  };

  const resetForm = () => {
    setChallan({
      id: '',
      challanNo: '',
      customerId: '',
      customerName: '',
      salesOrderId: '',
      challanDate: new Date().toISOString().split('T')[0],
      deliveryAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
      notes: '',
      status: 'draft',
    });
    setItems([
      {
        id: '1',
        itemId: '',
        itemName: '',
        description: '',
        quantity: 1,
        unit: 'Nos',
      }
    ]);
    setChallanMode('item_mode');
    setError(null);
    setSuccessMessage(null);
  };

  const updateItem = (index: number, field: keyof DeliveryChallanItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    const newItem: DeliveryChallanItem = {
      id: Date.now().toString(),
      itemId: '',
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'Nos',
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleChallanChange = (field: keyof typeof challan, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setChallan(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setChallan(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id || !user?.id) {
      setError('Company or user information is missing. Please log in and select a company.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const challanToSave = {
        ...challan,
        company_id: currentCompany.id,
        created_by: user.id,
        challan_no: challan.challanNo,
        customer_id: challan.customerId,
        sales_order_id: challan.salesOrderId,
        challan_date: challan.challanDate,
        delivery_address: challan.deliveryAddress,
      };

      let challanId = challan.id;

      if (challan.id) {
        // NOTE: This will fail if 'delivery_challans' table does not exist
        const { data, error } = await supabase
          .from('delivery_challans')
          .update(challanToSave)
          .eq('id', challan.id)
          .select();
        if (error) throw error;
        setSuccessMessage('Delivery Challan updated successfully!');
      } else {
        // NOTE: This will fail if 'delivery_challans' table does not exist
        const { data, error } = await supabase
          .from('delivery_challans')
          .insert(challanToSave)
          .select();
        if (error) throw error;
        challanId = data[0].id; // Correctly get the ID from the insert result
        setSuccessMessage('Delivery Challan created successfully!');
      }

      if (challanMode === 'item_mode' && challanId) {
        // NOTE: This will fail if 'delivery_challan_items' table does not exist
        await supabase.from('delivery_challan_items').delete().eq('challan_id', challanId);

        const itemsToSave = items.map(item => ({
          ...item,
          challan_id: challanId,
          item_id: item.itemId,
          item_name: item.itemName,
        }));
        const { error: itemsError } = await supabase.from('delivery_challan_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }

      resetForm();
      setViewMode('list');
      fetchDeliveryChallans();
    } catch (err: any) {
      setError(`Failed to save delivery challan: ${err.message}. Check console for details.`);
      console.error('Save delivery challan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChallan = (ch: any) => {
    setChallan({
      id: ch.id,
      challanNo: ch.challan_no,
      customerId: ch.customer_id,
      customerName: ch.customer_name || 'N/A',
      salesOrderId: ch.sales_order_id,
      challanDate: ch.challan_date,
      deliveryAddress: ch.delivery_address || { street: '', city: '', state: '', zipCode: '', country: '' },
      notes: ch.notes || '',
      status: ch.status,
    });
    // NOTE: This will fail if 'delivery_challan_items' table does not exist
    supabase.from('delivery_challan_items')
      .select('*')
      .eq('challan_id', ch.id)
      .then(({ data, error }) => {
        if (!error && data) {
          setItems(data.map(item => ({
            id: item.id,
            itemId: item.item_id,
            itemName: item.item_name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
          })));
          setChallanMode('item_mode');
        } else {
          setItems([]);
          setChallanMode('voucher_mode');
        }
      });
    setViewMode('create');
  };

  const handleDeleteChallan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery challan? This action cannot be undone.')) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // NOTE: This will fail if 'delivery_challans' table does not exist
      const { error } = await supabase.from('delivery_challans').delete().eq('id', id);
      if (error) throw error;
      setSuccessMessage('Delivery Challan deleted successfully!');
      fetchDeliveryChallans();
    } catch (err: any) {
      setError(`Failed to delete delivery challan: ${err.message}. Check console for details.`);
      console.error('Delete delivery challan error:', err);
    } finally {
      setLoading(false);
    }
  };

  // New handler for MasterSelectField item selection
  const handleItemSelect = (index: number, selectedId: string, selectedName: string, additionalData: ItemOption) => {
    updateItem(index, 'itemId', selectedId); // Store item ID
    updateItem(index, 'itemName', selectedName);
    updateItem(index, 'description', additionalData.description);
    updateItem(index, 'quantity', 1); // Default to 1
    updateItem(index, 'unit', additionalData.units_of_measure?.name || 'Nos');
  };

  // AI suggestion for item name (can suggest an item from availableItems)
  const handleItemAISuggestion = async (index: number, suggestedValue: string) => {
    try {
      const suggestions = await suggestWithAI({
        type: 'item_lookup',
        query: suggestedValue,
        context: 'delivery_challan',
        availableItems: availableItems.map(item => ({ id: item.id, name: item.name, code: item.item_code }))
      });
      
      if (suggestions?.item) {
        const suggestedItem = availableItems.find(item => item.id === suggestions.item.id || item.item_name === suggestions.item.name);
        if (suggestedItem) {
          handleItemSelect(index, suggestedItem.id, suggestedItem.name, suggestedItem);
        }
      }
    } catch (error) {
      console.error('Item AI suggestion error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Delivery Challans</h1>
          <p className={theme.textSecondary}>Generate and manage delivery challans for dispatched goods.</p>
        </div>
        <div className="flex space-x-2">
          {/* Add this button */}
          <Button variant="outline" onClick={() => navigate('/sales')} icon={<ArrowLeft size={16} />} className="text-gray-600 hover:text-gray-800">
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Challan Suggestions')} />
          {viewMode === 'list' ? (
            <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); }}>Create New Challan</Button>
          ) : (
            <Button icon={<List size={16} />} onClick={() => setViewMode('list')}>View Challans List</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {successMessage}</span>
        </div>
      )}

      {viewMode === 'create' ? (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
              {challan.id ? 'Edit Delivery Challan' : 'Create New Delivery Challan'}
            </h3>
            {/* Delivery Challans typically always have items, so no mode select */}
          </div>

          <form onSubmit={handleSaveChallan} className="space-y-6">
            {/* Challan Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Challan Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Challan Number"
                  value={challan.challanNo}
                  onChange={(value) => handleChallanChange('challanNo', value)}
                  placeholder="Auto-generated or manual"
                  required
                />
                <FormField
                  label="Challan Date"
                  type="date"
                  value={challan.challanDate}
                  onChange={(value) => handleChallanChange('challanDate', value)}
                  required
                />
                <FormField
                  label="Sales Order ID (Optional)"
                  value={challan.salesOrderId}
                  onChange={(value) => handleChallanChange('salesOrderId', value)}
                  placeholder="Link to a sales order"
                />
              </div>
            </Card>

            {/* Customer & Delivery Address Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Customer & Delivery Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Customer Name"
                  value={challan.customerName}
                  onChange={(value) => handleChallanChange('customerName', value)}
                  placeholder="Start typing customer name..."
                  required
                  aiHelper={true}
                  context="customer_selection"
                />
                <div className="md:col-span-2">
                  <FormField
                    label="Delivery Street Address"
                    value={challan.deliveryAddress.street}
                    onChange={(value) => handleChallanChange('deliveryAddress.street', value)}
                    icon={<MapPin size={18} />}
                  />
                </div>
                <FormField
                  label="City"
                  value={challan.deliveryAddress.city}
                  onChange={(value) => handleChallanChange('deliveryAddress.city', value)}
                  placeholder="City"
                />
                <FormField
                  label="State"
                  value={challan.deliveryAddress.state}
                  onChange={(value) => handleChallanChange('deliveryAddress.state', value)}
                  placeholder="State"
                />
                <FormField
                  label="ZIP Code"
                  value={challan.deliveryAddress.zipCode}
                  onChange={(value) => handleChallanChange('deliveryAddress.zipCode', value)}
                  placeholder="ZIP Code"
                />
                <FormField
                  label="Country"
                  value={challan.deliveryAddress.country}
                  onChange={(value) => handleChallanChange('deliveryAddress.country', value)}
                  placeholder="Country"
                />
              </div>
            </Card>

            {/* Challan Items */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className={`text-md font-semibold ${theme.textPrimary}`}>Challan Items</h4>
                <div className="flex space-x-2">
                  <AIButton variant="suggest" onSuggest={() => console.log('AI Item Suggestions')} size="sm" />
                  <Button size="sm" icon={<Plus size={16} />} onClick={addItem}>Add Item</Button>
                </div>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <MasterSelectField
                          label="Item Name"
                          value={item.itemName}
                          onValueChange={(value) => updateItem(index, 'itemName', value)}
                          onSelect={(id, name, data) => handleItemSelect(index, id, name, data as ItemOption)}
                          options={availableItems.map(item => ({ id: item.id, name: item.item_name, ...item }))}
                          placeholder="Product name"
                          required
                          aiHelper={true}
                          context="delivery_challan_item_selection"
                        />
                      </div>
                      <div>
                        <FormField
                          label="Quantity"
                          type="number"
                          value={item.quantity.toString()}
                          onChange={(value) => updateItem(index, 'quantity', parseFloat(value) || 0)}
                          required
                        />
                      </div>
                      <div>
                        <FormField
                          label="Unit"
                          value={item.unit}
                          onChange={(value) => updateItem(index, 'unit', value)}
                          placeholder="Nos, Kgs, etc."
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="text-red-600 hover:text-red-800"
                        />
                      </div>
                    </div>
                    <FormField
                      label="Description"
                      value={item.description}
                      onChange={(value) => updateItem(index, 'description', value)}
                      placeholder="Item description"
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Additional Notes */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Additional Notes</h4>
              <FormField
                label="Notes"
                value={challan.notes}
                onChange={(value) => handleChallanChange('notes', value)}
                placeholder="Any additional notes or instructions"
              />
            </Card>

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : (challan.id ? 'Update Challan' : 'Save Challan')}
              </Button>
              {!challan.id && (
                <Button type="button" icon={<Send size={16} />}>Send Challan</Button>
              )}
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Delivery Challans List</h3>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
              </div>
            ) : deliveryChallans.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
                <p>No delivery challans found. Create a new challan to get started.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challan No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveryChallans.map((ch) => (
                    <tr key={ch.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ch.challan_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ch.customer_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ch.challan_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ch.sales_order_id || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{ch.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleEditChallan(ch)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteChallan(ch.id)} className="text-red-600 hover:text-red-800">Delete</Button>
                        <Button variant="ghost" size="sm" icon={<Package size={16} />}>Convert to Invoice</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <AIButton variant="predict" onSuggest={() => console.log('AI Route Optimization')} className="w-full" />
          </div>
        </Card>
      )}
    </div>
  );
}

export default DeliveryChallansPage;
