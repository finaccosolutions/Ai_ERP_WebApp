// src/pages/Sales/CreateInvoice.tsx
import React, { useState, useEffect } from 'react';
import { Save, Send, FileText, Plus, Trash2, Calculator } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import AIButton from '../../components/UI/AIButton';
import MasterSelectField from '../../components/UI/MasterSelectField'; // Import MasterSelectField
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase'; // Import supabase
import { useCompany } from '../../contexts/CompanyContext'; // Import useCompany

interface InvoiceItem {
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
  hsnCode: string;
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

function CreateInvoice() {
  const { theme } = useTheme();
  const { suggestWithAI, createVoucherFromText } = useAI();
  const { currentCompany } = useCompany(); // Get current company context

  const [invoice, setInvoice] = useState({
    invoiceNo: '',
    customerId: '',
    customerName: '',
    customerGSTIN: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    placeOfSupply: '',
    reference: '',
    notes: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([
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

  const [totals, setTotals] = useState({
    subtotal: 0,
    totalTax: 0,
    totalAmount: 0
  });

  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [availableItems, setAvailableItems] = useState<ItemOption[]>([]); // State to store available items

  useEffect(() => {
    if (currentCompany?.id) {
      fetchAvailableItems(currentCompany.id);
    }
  }, [currentCompany?.id]);

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

  const calculateItemTotals = (item: InvoiceItem) => {
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

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate totals for this item
    newItems[index] = calculateItemTotals(newItems[index]);
    
    setItems(newItems);
    calculateTotals(newItems);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
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
      calculateTotals(newItems);
    }
  };

  const calculateTotals = (itemList: InvoiceItem[]) => {
    const subtotal = itemList.reduce((sum, item) => sum + item.amount, 0);
    const totalTax = itemList.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + totalTax;
    
    setTotals({ subtotal, totalTax, totalAmount });
  };

  const handleAISuggestion = async () => {
    try {
      const invoiceData = { invoice, items, totals };
      const suggestions = await suggestWithAI({
        type: 'sales_invoice',
        data: invoiceData,
        context: 'create_invoice'
      });
      
      setAiSuggestions(suggestions);
      setShowAIPreview(true);
    } catch (error) {
      console.error('AI suggestion error:', error);
    }
  };

  const handleVoiceToInvoice = async () => {
    try {
      // This would be triggered by voice command
      const voiceText = "Create invoice for 10 units of Product A to ABC Corp at rate 1000 with 18% GST";
      const result = await createVoucherFromText(voiceText);
      
      if (result && result.voucherType === 'sales') {
        // Apply AI suggestions to form
        setInvoice(prev => ({
          ...prev,
          customerName: result.party || prev.customerName,
          invoiceDate: result.date || prev.invoiceDate
        }));
        
        if (result.items && result.items.length > 0) {
          const aiItems = result.items.map((item: any, index: number) => ({
            id: (index + 1).toString(),
            itemCode: item.code || '',
            itemName: item.name || '',
            description: item.description || '',
            quantity: item.quantity || 1,
            unit: item.unit || 'Nos',
            rate: item.rate || 0,
            amount: (item.quantity || 1) * (item.rate || 0),
            taxRate: item.taxRate || 18,
            taxAmount: 0,
            lineTotal: 0,
            hsnCode: item.hsnCode || ''
          }));
          
          const calculatedItems = aiItems.map(calculateItemTotals);
          setItems(calculatedItems);
          calculateTotals(calculatedItems);
        }
      }
    } catch (error) {
      console.error('Voice to invoice error:', error);
    }
  };

  // Modified to be explicitly called by AIFormHelper
  const handleCustomerSuggestion = async (suggestedValue: string) => {
    try {
      const suggestions = await suggestWithAI({
        type: 'customer_lookup',
        query: suggestedValue,
        context: 'sales_invoice'
      });
      
      if (suggestions?.customer) {
        setInvoice(prev => ({
          ...prev,
          customerName: suggestions.customer.name,
          customerId: suggestions.customer.id, // Assuming customer ID is returned
          customerGSTIN: suggestions.customer.gstin || '',
          placeOfSupply: suggestions.customer.state || ''
        }));
      }
    } catch (error) {
      console.error('Customer suggestion error:', error);
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
        context: 'sales_invoice',
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Create Sales Invoice</h1>
          <p className={theme.textSecondary}>Generate GST compliant sales invoice with AI assistance</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="voice" onSuggest={handleVoiceToInvoice} />
          <AIButton variant="suggest" onSuggest={handleAISuggestion} />
          <Button variant="outline" icon={<FileText size={16} />}>Preview</Button>
          <Button icon={<Save size={16} />}>Save Draft</Button>
          <Button icon={<Send size={16} />}>Send Invoice</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Invoice Number"
                value={invoice.invoiceNo}
                onChange={(value) => setInvoice(prev => ({ ...prev, invoiceNo: value }))}
                placeholder="Auto-generated"
                aiHelper={true}
                context="sales_invoice"
              />
              <FormField
                label="Invoice Date"
                type="date"
                value={invoice.invoiceDate}
                onChange={(value) => setInvoice(prev => ({ ...prev, invoiceDate: value }))}
                required
              />
              <FormField
                label="Due Date"
                type="date"
                value={invoice.dueDate}
                onChange={(value) => setInvoice(prev => ({ ...prev, dueDate: value }))}
              />
              <FormField
                label="Reference"
                value={invoice.reference}
                onChange={(value) => setInvoice(prev => ({ ...prev, reference: value }))}
                placeholder="PO Number, etc."
              />
            </div>
          </Card>

          {/* Customer Details */}
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Customer Name"
                value={invoice.customerName}
                onChange={(value) => setInvoice(prev => ({ ...prev, customerName: value }))}
                placeholder="Start typing customer name..."
                required
                aiHelper={true}
                context="customer_selection"
                onAISuggestion={handleCustomerSuggestion} // Passed to AIFormHelper
              />
              <FormField
                label="Customer GSTIN"
                value={invoice.customerGSTIN}
                onChange={(value) => setInvoice(prev => ({ ...prev, customerGSTIN: value }))}
                placeholder="22AAAAA0000A1Z5"
                aiHelper={true}
                context="gstin_validation"
              />
              <FormField
                label="Place of Supply"
                value={invoice.placeOfSupply}
                onChange={(value) => setInvoice(prev => ({ ...prev, placeOfSupply: value }))}
                placeholder="State/UT"
                required
                aiHelper={true}
                context="place_of_supply"
              />
            </div>
          </Card>

          {/* Invoice Items */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>Invoice Items</h3>
              <div className="flex space-x-2">
                <AIButton variant="suggest" onSuggest={() => handleAISuggestion()} size="sm" />
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
                        context="item_selection"
                        onAISuggestion={(val) => handleItemAISuggestion(index, val)}
                      />
                    </div>
                    <div>
                      <FormField
                        label="HSN/SAC Code"
                        value={item.hsnCode}
                        onChange={(value) => updateItem(index, 'hsnCode', value)}
                        placeholder="8471"
                        aiHelper={true}
                        context="hsn_code"
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
                      <FormField
                        label="Tax Rate (%)"
                        type="number"
                        value={item.taxRate.toString()}
                        onChange={(value) => updateItem(index, 'taxRate', parseFloat(value) || 0)}
                      />
                    </div>
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

          {/* Notes */}
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Additional Information</h3>
            <FormField
              label="Notes"
              value={invoice.notes}
              onChange={(value) => setInvoice(prev => ({ ...prev, notes: value }))}
              placeholder="Terms and conditions, payment instructions, etc."
            />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <Calculator size={20} className="mr-2" />
              Invoice Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={theme.textMuted}>Subtotal:</span>
                <span className={theme.textPrimary}>₹{totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme.textMuted}>Total Tax:</span>
                <span className={theme.textPrimary}>₹{totals.totalTax.toLocaleString()}</span>
              </div>
              <hr className={theme.borderColor} />
              <div className="flex justify-between text-lg font-semibold">
                <span className={theme.textPrimary}>Total Amount:</span>
                <span className="text-green-600">₹{totals.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-4">
              <AIButton 
                variant="calculate" 
                onSuggest={() => handleAISuggestion()}
                className="w-full"
              />
            </div>
          </Card>

          {/* AI Suggestions */}
          {aiSuggestions && (
            <Card className="p-6">
              <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                <Bot size={20} className="mr-2 text-[#6AC8A3]" />
                AI Suggestions
              </h3>
              <div className="space-y-3">
                {aiSuggestions.suggestions?.map((suggestion: any, index: number) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">{suggestion.text}</p>
                    <div className="mt-2 flex space-x-2">
                      <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                        Apply
                      </button>
                      <button className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600">
                        Ignore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText size={16} className="mr-2" />
                Save as Template
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Send size={16} className="mr-2" />
                Send via Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calculator size={16} className="mr-2" />
                Convert to Proforma
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CreateInvoice;
