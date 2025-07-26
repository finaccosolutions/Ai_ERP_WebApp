// src/pages/Sales/SalesReturnsPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeftRight, Search, Calendar, Users, Package, DollarSign, List, Save, Trash2, Calculator, RefreshCw, ArrowLeft, Filter } from 'lucide-react';
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

// NOTE: The 'sales_returns' and 'sales_return_items' tables are NOT present in your current database schema.
// You will need to create these tables in Supabase for this page's save/fetch functionality to work.
// Example schema for sales_returns:
// CREATE TABLE public.sales_returns (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
//   return_no text NOT NULL UNIQUE,
//   customer_id uuid REFERENCES public.customers(id),
//   invoice_id uuid REFERENCES public.sales_invoices(id),
//   return_date date DEFAULT CURRENT_DATE NOT NULL,
//   reason text,
//   notes text,
//   status text DEFAULT 'draft'::text CHECK (status IN ('draft', 'processed', 'cancelled')),
//   total_amount numeric(15,2) DEFAULT 0,
//   created_by uuid REFERENCES public.users(id),
//   created_at timestamp with time zone DEFAULT now(),
//   updated_at timestamp with time zone DEFAULT now()
// );
//
// Example schema for sales_return_items:
// CREATE TABLE public.sales_return_items (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   return_id uuid REFERENCES public.sales_returns(id) ON DELETE CASCADE,
//   item_id uuid REFERENCES public.items(id),
//   item_name text NOT NULL,
//   quantity numeric(15,3) NOT NULL DEFAULT 1,
//   unit text DEFAULT 'Nos'::text,
//   rate numeric(15,2) DEFAULT 0,
//   amount numeric(15,2) DEFAULT 0,
//   tax_rate numeric(5,2) DEFAULT 0,
//   tax_amount numeric(15,2) DEFAULT 0,
//   line_total numeric(15,2) DEFAULT 0,
//   description text,
//   created_at timestamp with time zone DEFAULT now()
// );

interface SalesReturnItem {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
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

function SalesReturnsPage() {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate(); // Initialize useNavigate

  const [viewMode, setViewMode] = useState<'create' | 'list'>('list');
  const [returnMode, setReturnMode] = useState<'item_mode' | 'voucher_mode'>('item_mode');

  const [salesReturn, setSalesReturn] = useState({
    id: '',
    returnNo: '',
    customerId: '',
    customerName: '',
    invoiceId: '',
    invoiceNo: '',
    returnDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
    status: 'draft', // draft, processed, cancelled
    totalAmount: 0,
  });

  const [items, setItems] = useState<SalesReturnItem[]>([
    {
      id: '1',
      itemId: '',
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      taxRate: 0,
      taxAmount: 0,
      lineTotal: 0,
    }
  ]);

  const [salesReturnsList, setSalesReturnsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableItems, setAvailableItems] = useState<ItemOption[]>([]); // State to store available items

  useEffect(() => {
    if (currentCompany?.id) {
      fetchSalesReturns();
      fetchAvailableItems(currentCompany.id);
    }
  }, [viewMode, currentCompany?.id]);

  const fetchSalesReturns = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    setError(null);
    try {
      // NOTE: This will fail if 'sales_returns' table does not exist
      const { data, error } = await supabase
        .from('sales_returns')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('return_date', { ascending: false });

      if (error) throw error;
      setSalesReturnsList(data);
    } catch (err: any) {
      setError(`Error fetching sales returns: ${err.message}. Make sure 'sales_returns' table exists.`);
      console.error('Error fetching sales returns:', err);
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
    setSalesReturn({
      id: '',
      returnNo: '',
      customerId: '',
      customerName: '',
      invoiceId: '',
      invoiceNo: '',
      returnDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
      status: 'draft',
      totalAmount: 0,
    });
    setItems([
      {
        id: '1',
        itemId: '',
        itemName: '',
        description: '',
        quantity: 1,
        unit: 'Nos',
        rate: 0,
        amount: 0,
        taxRate: 0,
        taxAmount: 0,
        lineTotal: 0,
      }
    ]);
    setReturnMode('item_mode');
    setError(null);
    setSuccessMessage(null);
  };

  const calculateItemTotals = (item: SalesReturnItem) => {
    const amount = item.quantity * item.rate;
    const taxAmount = (amount * item.taxRate) / 100;
    const lineTotal = amount + taxAmount;
    
    return {
      ...item,
      amount,
      taxAmount,
      lineTotal
    };
  };

  const updateItem = (index: number, field: keyof SalesReturnItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    newItems[index] = calculateItemTotals(newItems[index]);
    
    setItems(newItems);
    calculateSalesReturnTotals(newItems);
  };

  const addItemRow = () => {
    const newItem: SalesReturnItem = {
      id: Date.now().toString(),
      itemId: '',
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      taxRate: 0,
      taxAmount: 0,
      lineTotal: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      calculateSalesReturnTotals(newItems);
    }
  };

  const calculateSalesReturnTotals = (itemList: SalesReturnItem[]) => {
    const totalAmount = itemList.reduce((sum, item) => sum + item.lineTotal, 0);
    
    setSalesReturn(prev => ({
      ...prev,
      totalAmount,
    }));
  };

  const handleSalesReturnChange = (field: keyof typeof salesReturn, value: any) => {
    setSalesReturn(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSalesReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id || !user?.id) {
      setError('Company or user information is missing. Please log in and select a company.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const salesReturnToSave = {
        ...salesReturn,
        company_id: currentCompany.id,
        created_by: user.id,
        return_no: salesReturn.returnNo,
        customer_id: salesReturn.customerId,
        invoice_id: salesReturn.invoiceId,
        return_date: salesReturn.returnDate,
        invoice_no: salesReturn.invoiceNo, // Storing original invoice no here
        total_amount: salesReturn.totalAmount,
      };

      let salesReturnId = salesReturn.id;

      if (salesReturn.id) {
        // NOTE: This will fail if 'sales_returns' table does not exist
        const { data, error } = await supabase
          .from('sales_returns')
          .update(salesReturnToSave)
          .eq('id', salesReturn.id)
          .select();
        if (error) throw error;
        setSuccessMessage('Sales Return updated successfully!');
      } else {
        // NOTE: This will fail if 'sales_returns' table does not exist
        const { data, error } = await supabase
          .from('sales_returns')
          .insert(salesReturnToSave)
          .select();
        if (error) throw error;
        salesReturnId = data[0].id;
        setSuccessMessage('Sales Return created successfully!');
      }

      if (returnMode === 'item_mode' && salesReturnId) {
        // NOTE: This will fail if 'sales_return_items' table does not exist
        await supabase.from('sales_return_items').delete().eq('return_id', salesReturnId);

        const itemsToSave = items.map(item => ({
          ...item,
          return_id: salesReturnId,
          item_id: item.itemId,
          item_name: item.itemName,
          tax_rate: item.taxRate,
          tax_amount: item.taxAmount,
          line_total: item.lineTotal,
        }));
        const { error: itemsError } = await supabase.from('sales_return_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }

      resetForm();
      setViewMode('list');
      fetchSalesReturns();
    } catch (err: any) {
      setError(`Failed to save sales return: ${err.message}. Check console for details.`);
      console.error('Save sales return error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSalesReturn = (sr: any) => {
    setSalesReturn({
      id: sr.id,
      returnNo: sr.return_no,
      customerId: sr.customer_id,
      customerName: sr.customer_name || 'N/A',
      invoiceId: sr.invoice_id,
      invoiceNo: sr.invoice_no || '',
      returnDate: sr.return_date,
      reason: sr.reason || '',
      notes: sr.notes || '',
      status: sr.status,
      totalAmount: sr.total_amount,
    });
    // NOTE: This will fail if 'sales_return_items' table does not exist
    supabase.from('sales_return_items')
      .select('*')
      .eq('return_id', sr.id)
      .then(({ data, error }) => {
        if (!error && data) {
          setItems(data.map(item => ({
            id: item.id,
            itemId: item.item_id,
            itemName: item.item_name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount,
            taxRate: item.tax_rate,
            taxAmount: item.tax_amount,
            lineTotal: item.line_total,
          })));
          setReturnMode('item_mode');
        } else {
          setItems([]);
          setReturnMode('voucher_mode');
        }
      });
    setViewMode('create');
  };

  const handleDeleteSalesReturn = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sales return? This action cannot be undone.')) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // NOTE: This will fail if 'sales_returns' table does not exist
      const { error } = await supabase.from('sales_returns').delete().eq('id', id);
      if (error) throw error;
      setSuccessMessage('Sales Return deleted successfully!');
      fetchSalesReturns();
    } catch (err: any) {
      setError(`Failed to delete sales return: ${err.message}. Check console for details.`);
      console.error('Delete sales return error:', err);
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
    updateItem(index, 'rate', additionalData.standard_rate);
    updateItem(index, 'taxRate', additionalData.tax_rate);
  };

  // AI suggestion for item name (can suggest an item from availableItems)
  const handleItemAISuggestion = async (index: number, suggestedValue: string) => {
    try {
      const suggestions = await suggestWithAI({
        type: 'item_lookup',
        query: suggestedValue,
        context: 'sales_return',
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
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Returns</h1>
          <p className={theme.textSecondary}>Process and manage returned goods from customers.</p>
        </div>
        <div className="flex space-x-2">
          {/* Add this button */}
          <Button variant="outline" onClick={() => navigate('/sales')} icon={<ArrowLeft size={16} />} className="text-gray-600 hover:text-gray-800">
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Return Suggestions')} />
          {viewMode === 'list' ? (
            <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); }}>Record New Return</Button>
          ) : (
            <Button icon={<List size={16} />} onClick={() => setViewMode('list')}>View Returns List</Button>
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
              {salesReturn.id ? 'Edit Sales Return' : 'Record New Sales Return'}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${theme.textPrimary}`}>Mode:</span>
              <select
                value={returnMode}
                onChange={(e) => setReturnMode(e.target.value as 'item_mode' | 'voucher_mode')}
                className={`
                  px-3 py-1 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                `}
              >
                <option value="item_mode">Item Return Mode</option>
                <option value="voucher_mode">Voucher Mode</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleSaveSalesReturn} className="space-y-6">
            {/* Sales Return Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Sales Return Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Return Number"
                  value={salesReturn.returnNo}
                  onChange={(val) => handleSalesReturnChange('returnNo', val)}
                  placeholder="Auto-generated or manual"
                  required
                />
                <FormField
                  label="Return Date"
                  type="date"
                  value={salesReturn.returnDate}
                  onChange={(val) => handleSalesReturnChange('returnDate', val)}
                  required
                />
                <FormField
                  label="Original Invoice No."
                  value={salesReturn.invoiceNo}
                  onChange={(val) => handleSalesReturnChange('invoiceNo', val)}
                  placeholder="Invoice being returned against"
                />
                {/* You might want a hidden field for invoiceId if linking directly */}
                <FormField
                  label="Reason for Return"
                  value={salesReturn.reason}
                  onChange={(val) => handleSalesReturnChange('reason', val)}
                  placeholder="e.g., Damaged goods, wrong item"
                />
              </div>
            </Card>

            {/* Customer Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Customer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Customer Name"
                  value={salesReturn.customerName}
                  onChange={(val) => handleSalesReturnChange('customerName', val)}
                  placeholder="Start typing customer name..."
                  required
                  aiHelper={true}
                  context="customer_selection"
                />
                {/* Add more customer fields if needed */}
              </div>
            </Card>

            {/* Returned Items (Conditional) */}
            {returnMode === 'item_mode' && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className={`text-md font-semibold ${theme.textPrimary}`}>Returned Items</h4>
                  <div className="flex space-x-2">
                    <AIButton variant="suggest" onSuggest={() => console.log('AI Item Suggestions')} size="sm" />
                    <Button size="sm" icon={<Plus size={16} />} onClick={addItemRow}>Add Item Row</Button>
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
                            placeholder="Product/Service name"
                            required
                            aiHelper={true}
                            context="sales_return_item_selection"
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
                        <div>
                          <FormField
                            label="Rate"
                            type="number"
                            value={item.rate.toString()}
                            onChange={(value) => updateItem(index, 'rate', parseFloat(value) || 0)}
                            required
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => removeItemRow(index)}
                            disabled={items.length === 1}
                            className="text-red-600 hover:text-red-800"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>Amount</label>
                          <div className={`px-3 py-2 ${theme.inputBg} border ${theme.borderColor} rounded-lg`}>
                            ₹{item.amount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>Tax Amount</label>
                          <div className={`px-3 py-2 ${theme.inputBg} border ${theme.borderColor} rounded-lg`}>
                            ₹{item.taxAmount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>Line Total</label>
                          <div className={`px-3 py-2 bg-green-50 border border-green-200 rounded-lg font-semibold`}>
                            ₹{item.lineTotal.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Sales Return Totals & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                  <Calculator size={20} className="mr-2" />
                  Return Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className={theme.textPrimary}>Total Amount:</span>
                    <span className="text-red-600">₹{salesReturn.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <AIButton 
                    variant="calculate" 
                    onSuggest={() => console.log('AI Calculate')}
                    className="w-full"
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Additional Notes</h4>
                <FormField
                  label="Notes"
                  value={salesReturn.notes}
                  onChange={(val) => handleSalesReturnChange('notes', val)}
                  placeholder="Any additional notes"
                />
              </Card>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : (salesReturn.id ? 'Update Return' : 'Save Return')}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Returns List</h3>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6AC8A3]"></div>
              </div>
            ) : salesReturnsList.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
                <p>No sales returns found. Record a new return to get started.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Invoice No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesReturnsList.map((sr) => (
                    <tr key={sr.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sr.return_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sr.customer_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sr.return_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sr.invoice_no || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{sr.total_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{sr.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleEditSalesReturn(sr)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSalesReturn(sr.id)} className="text-red-600 hover:text-red-800">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <AIButton variant="predict" onSuggest={() => console.log('AI Return Analysis')} className="w-full" />
          </div>
        </Card>
      )}
    </div>
  );
}

export default SalesReturnsPage;

