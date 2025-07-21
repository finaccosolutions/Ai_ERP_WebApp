// src/pages/Sales/SalesQuotationsPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, Calendar, Users, DollarSign, List, Save, Send, Trash2, Calculator } from 'lucide-react';
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

interface QuotationItem {
  id: string;
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  hsnCode: string; // Added HSN Code for consistency with items table
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

function SalesQuotationsPage() {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'create' | 'list'>('list');
  const [quotationMode, setQuotationMode] = useState<'item_mode' | 'voucher_mode'>('item_mode');

  const [quotation, setQuotation] = useState({
    id: '',
    quotationNo: '',
    customerId: '',
    customerName: '',
    quotationDate: new Date().toISOString().split('T')[0], // Changed to string
    validTill: '',
    referenceNo: '',
    termsAndConditions: '',
    notes: '',
    status: 'draft', // draft, sent, accepted, rejected, expired
    subtotal: 0,
    totalTax: 0,
    totalAmount: 0,
  });

  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: '1',
      itemCode: '',
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      taxRate: 18,
      taxAmount: 0,
      lineTotal: 0,
      hsnCode: ''
    }
  ]);

  const [salesQuotations, setSalesQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableItems, setAvailableItems] = useState<ItemOption[]>([]); // State to store available items

  useEffect(() => {
    if (currentCompany?.id) {
      fetchSalesQuotations();
      fetchAvailableItems(currentCompany.id);
    }
  }, [viewMode, currentCompany?.id]);

  const fetchSalesQuotations = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('quotation_date', { ascending: false });

      if (error) throw error;
      setSalesQuotations(data);
    } catch (err: any) {
      setError(`Error fetching quotations: ${err.message}`);
      console.error('Error fetching sales quotations:', err);
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
    setQuotation({
      id: '',
      quotationNo: '',
      customerId: '',
      customerName: '',
      quotationDate: new Date().toISOString().split('T')[0],
      validTill: '',
      referenceNo: '',
      termsAndConditions: '',
      notes: '',
      status: 'draft',
      subtotal: 0,
      totalTax: 0,
      totalAmount: 0,
    });
    setItems([
      {
        id: '1',
        itemCode: '',
        itemName: '',
        description: '',
        quantity: 1,
        unit: 'Nos',
        rate: 0,
        amount: 0,
        taxRate: 18,
        taxAmount: 0,
        lineTotal: 0,
        hsnCode: ''
      }
    ]);
    setQuotationMode('item_mode');
    setError(null);
    setSuccessMessage(null);
  };

  const calculateItemTotals = (item: QuotationItem) => {
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

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    newItems[index] = calculateItemTotals(newItems[index]);
    
    setItems(newItems);
    calculateQuotationTotals(newItems);
  };

  const addItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      itemCode: '',
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      taxRate: 18,
      taxAmount: 0,
      lineTotal: 0,
      hsnCode: ''
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      calculateQuotationTotals(newItems);
    }
  };

  const calculateQuotationTotals = (itemList: QuotationItem[]) => {
    const subtotal = itemList.reduce((sum, item) => sum + item.amount, 0);
    const totalTax = itemList.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + totalTax;
    
    setQuotation(prev => ({
      ...prev,
      subtotal,
      totalTax,
      totalAmount,
    }));
  };

  const handleQuotationChange = (field: keyof typeof quotation, value: any) => {
    setQuotation(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id || !user?.id) {
      setError('Company or user information is missing. Please log in and select a company.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const quotationToSave = {
        ...quotation,
        company_id: currentCompany.id,
        created_by: user.id,
        quotation_no: quotation.quotationNo,
        customer_id: quotation.customerId,
        quotation_date: quotation.quotationDate,
        valid_till: quotation.validTill,
        reference_no: quotation.referenceNo,
        terms_and_conditions: quotation.termsAndConditions,
        total_tax: quotation.totalTax,
        total_amount: quotation.totalAmount,
      };

      let quotationId = quotation.id;

      if (quotation.id) {
        const { data, error } = await supabase
          .from('quotations')
          .update(quotationToSave)
          .eq('id', quotation.id)
          .select();
        if (error) throw error;
        setSuccessMessage('Quotation updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('quotations')
          .insert(quotationToSave)
          .select();
        if (error) throw error;
        quotationId = data[0].id; // Correctly get the ID from the insert result
        setSuccessMessage('Quotation created successfully!');
      }

      if (quotationMode === 'item_mode' && quotationId) {
        await supabase.from('quotation_items').delete().eq('quotation_id', quotationId);

        const itemsToSave = items.map(item => ({
          ...item,
          quotation_id: quotationId,
          item_code: item.itemCode,
          item_name: item.itemName,
          tax_rate: item.taxRate,
          tax_amount: item.taxAmount,
          line_total: item.lineTotal,
          description: item.description, // Ensure description is saved
        }));
        const { error: itemsError } = await supabase.from('quotation_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }

      resetForm();
      setViewMode('list');
      fetchSalesQuotations();
    } catch (err: any) {
      setError(`Failed to save quotation: ${err.message}`);
      console.error('Save quotation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuotation = (quote: any) => {
    setQuotation({
      id: quote.id,
      quotationNo: quote.quotation_no,
      customerId: quote.customer_id,
      customerName: quote.customer_name || 'N/A',
      quotationDate: quote.quotation_date,
      validTill: quote.valid_till,
      referenceNo: quote.reference_no || '',
      termsAndConditions: quote.terms_and_conditions || '',
      notes: quote.notes || '',
      status: quote.status,
      subtotal: quote.subtotal,
      totalTax: quote.total_tax,
      totalAmount: quote.total_amount,
    });
    supabase.from('quotation_items')
      .select('*')
      .eq('quotation_id', quote.id)
      .then(({ data, error }) => {
        if (!error && data) {
          setItems(data.map(item => ({
            id: item.id,
            itemCode: item.item_code,
            itemName: item.item_name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount,
            taxRate: item.tax_rate,
            taxAmount: item.tax_amount,
            lineTotal: item.line_total,
            hsnCode: item.hsn_code || '', // Ensure HSN code is loaded
          })));
          setQuotationMode('item_mode');
        } else {
          setItems([]);
          setQuotationMode('voucher_mode');
        }
      });
    setViewMode('create');
  };

  const handleDeleteQuotation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.from('quotations').delete().eq('id', id);
      if (error) throw error;
      setSuccessMessage('Quotation deleted successfully!');
      fetchSalesQuotations();
    } catch (err: any) {
      setError(`Failed to delete quotation: ${err.message}`);
      console.error('Delete quotation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // New handler for MasterSelectField item selection
  const handleItemSelect = (index: number, selectedId: string, selectedName: string, additionalData: ItemOption) => {
    updateItem(index, 'itemCode', additionalData.item_code);
    updateItem(index, 'itemName', selectedName);
    updateItem(index, 'description', additionalData.description);
    updateItem(index, 'quantity', 1); // Default to 1
    updateItem(index, 'unit', additionalData.units_of_measure?.name || 'Nos');
    updateItem(index, 'rate', additionalData.standard_rate);
    updateItem(index, 'taxRate', additionalData.tax_rate);
    updateItem(index, 'hsnCode', additionalData.hsn_code);
  };

  // AI suggestion for item name (can suggest an item from availableItems)
  const handleItemAISuggestion = async (index: number, suggestedValue: string) => {
    try {
      const suggestions = await suggestWithAI({
        type: 'item_lookup',
        query: suggestedValue,
        context: 'sales_quotation',
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
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Quotations</h1>
          <p className={theme.textSecondary}>Create, manage, and track your sales quotations.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Quotation Suggestions')} />
          {viewMode === 'list' ? (
            <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); }}>Create New Quotation</Button>
          ) : (
            <Button icon={<List size={16} />} onClick={() => setViewMode('list')}>View Quotations List</Button>
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
              {quotation.id ? 'Edit Sales Quotation' : 'Create New Sales Quotation'}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${theme.textPrimary}`}>Mode:</span>
              <select
                value={quotationMode}
                onChange={(e) => setQuotationMode(e.target.value as 'item_mode' | 'voucher_mode')}
                className={`
                  px-3 py-1 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                <option value="item_mode">Item Quotation Mode</option>
                <option value="voucher_mode">Voucher Mode</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleSaveQuotation} className="space-y-6">
            {/* Quotation Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Quotation Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Quotation Number"
                  value={quotation.quotationNo}
                  onChange={(value) => handleQuotationChange('quotationNo', value)}
                  placeholder="Auto-generated or manual"
                  required
                />
                <FormField
                  label="Quotation Date"
                  type="date"
                  value={quotation.quotationDate}
                  onChange={(value) => handleQuotationChange('quotationDate', value)}
                  required
                />
                <FormField
                  label="Valid Till"
                  type="date"
                  value={quotation.validTill}
                  onChange={(value) => handleQuotationChange('validTill', value)}
                />
                <FormField
                  label="Reference No."
                  value={quotation.referenceNo}
                  onChange={(value) => handleQuotationChange('referenceNo', value)}
                  placeholder="Customer reference, etc."
                />
              </div>
            </Card>

            {/* Customer Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Customer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Customer Name"
                  value={quotation.customerName}
                  onChange={(value) => handleQuotationChange('customerName', value)}
                  placeholder="Start typing customer name..."
                  required
                  aiHelper={true}
                  context="customer_selection"
                />
                {/* Add more customer fields if needed, e.g., customerId, contact info */}
              </div>
            </Card>

            {/* Quotation Items (Conditional) */}
            {quotationMode === 'item_mode' && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className={`text-md font-semibold ${theme.textPrimary}`}>Quotation Items</h4>
                  <div className="flex space-x-2">
                    <AIButton variant="suggest" onSuggest={() => console.log('AI Item Suggestions')} size="sm" />
                    <Button size="sm" icon={<Plus size={16} />} onClick={addItem}>Add Item</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                          <MasterSelectField
                            label="Item Name"
                            value={item.itemName}
                            onValueChange={(val) => updateItem(index, 'itemName', val)}
                            onSelect={(id, name, data) => handleItemSelect(index, id, name, data as ItemOption)}
                            options={availableItems.map(item => ({ id: item.id, name: item.item_name, ...item }))}
                            placeholder="Select or type item name"
                            required
                            aiHelper={true}
                            context="sales_quotation_item_selection"
                          />
                        </div>
                        <div>
                          <FormField
                            label="HSN/SAC Code"
                            value={item.hsnCode}
                            onChange={(value) => updateItem(index, 'hsnCode', value)}
                            placeholder="8471"
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
                            label="Rate"
                            type="number"
                            value={item.rate.toString()}
                            onChange={(value) => updateItem(index, 'rate', parseFloat(value) || 0)}
                            required
                          />
                        </div>
                        <div>
                          <FormField
                            label="Tax Rate (%)"
                            type="number"
                            value={item.taxRate.toString()}
                            onChange={(value) => updateItem(index, 'taxRate', parseFloat(value) || 0)}
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
                          <div className={`px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg font-semibold`}>
                            ₹{item.lineTotal.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quotation Totals & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                  <Calculator size={20} className="mr-2" />
                  Quotation Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={theme.textMuted}>Subtotal:</span>
                    <span className={theme.textPrimary}>₹{quotation.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme.textMuted}>Total Tax:</span>
                    <span className={theme.textPrimary}>₹{quotation.totalTax.toLocaleString()}</span>
                  </div>
                  <hr className={theme.borderColor} />
                  <div className="flex justify-between text-lg font-semibold">
                    <span className={theme.textPrimary}>Total Amount:</span>
                    <span className="text-emerald-600">₹{quotation.totalAmount.toLocaleString()}</span>
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
                <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Additional Information</h4>
                <FormField
                  label="Terms and Conditions"
                  value={quotation.termsAndConditions}
                  onChange={(value) => handleQuotationChange('termsAndConditions', value)}
                  placeholder="Payment terms, delivery terms, etc."
                />
                <FormField
                  label="Notes"
                  value={quotation.notes}
                  onChange={(value) => handleQuotationChange('notes', value)}
                  placeholder="Any additional notes"
                />
              </Card>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : (quotation.id ? 'Update Quotation' : 'Save Quotation')}
              </Button>
              {!quotation.id && (
                <Button type="button" icon={<Send size={16} />}>Send Quotation</Button>
              )}
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Quotations List</h3>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
              </div>
            ) : salesQuotations.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
                <p>No sales quotations found. Create a new quotation to get started.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesQuotations.map((quote) => (
                    <tr key={quote.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{quote.quotation_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.customer_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.quotation_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{quote.total_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{quote.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleEditQuotation(quote)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteQuotation(quote.id)} className="text-red-600 hover:text-red-800">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <AIButton variant="predict" onSuggest={() => console.log('AI Win Probability')} className="w-full" />
          </div>
        </Card>
      )}
    </div>
  );
}

export default SalesQuotationsPage;