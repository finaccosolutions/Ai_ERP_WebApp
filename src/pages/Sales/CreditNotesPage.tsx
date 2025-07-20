import React, { useState, useEffect } from 'react';
import { Plus, FileBadge, Search, Calendar, Users, DollarSign, List, Save, Send, Trash2, Calculator } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// Assuming Credit Notes are recorded as Sales Invoices with status 'credit_note'
// The 'items' array is kept for consistency with other voucher types, but might not be strictly necessary
// for all credit note scenarios.

interface CreditNoteItem {
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
}

function CreditNotesPage() {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'create' | 'list'>('list');
  // Credit Notes typically don't have an 'item_mode' toggle as they are adjustments
  const creditNoteMode = 'voucher_mode'; 

  const [creditNote, setCreditNote] = useState({
    id: '',
    creditNoteNo: '', // This will map to invoice_no in sales_invoices
    customerId: '',
    customerName: '',
    invoiceId: '', // Original invoice ID
    invoiceNo: '', // Original invoice number
    creditNoteDate: new Date().toISOString().split('T')[0], // Maps to invoice_date
    reason: '', // Stored in notes or a custom field if schema extended
    notes: '',
    status: 'credit_note', // Fixed status for credit notes
    subtotal: 0,
    totalTax: 0,
    totalAmount: 0,
  });

  const [items, setItems] = useState<CreditNoteItem[]>([
    {
      id: '1',
      itemCode: '',
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      taxRate: 0, // Credit notes might have 0 tax rate for returns
      taxAmount: 0,
      lineTotal: 0,
    }
  ]);

  const [creditNotesList, setCreditNotesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchCreditNotes();
    }
  }, [viewMode, currentCompany?.id]);

  const fetchCreditNotes = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('status', 'credit_note') // Filter for credit notes
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setCreditNotesList(data);
    } catch (err: any) {
      setError(`Error fetching credit notes: ${err.message}`);
      console.error('Error fetching credit notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCreditNote({
      id: '',
      creditNoteNo: '',
      customerId: '',
      customerName: '',
      invoiceId: '',
      invoiceNo: '',
      creditNoteDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
      status: 'credit_note',
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
        taxRate: 0,
        taxAmount: 0,
        lineTotal: 0,
      }
    ]);
    setError(null);
    setSuccessMessage(null);
  };

  const calculateItemTotals = (item: CreditNoteItem) => {
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

  const updateItem = (index: number, field: keyof CreditNoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    newItems[index] = calculateItemTotals(newItems[index]);
    
    setItems(newItems);
    calculateCreditNoteTotals(newItems);
  };

  const addItemRow = () => {
    const newItem: CreditNoteItem = {
      id: Date.now().toString(),
      itemCode: '',
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
      calculateCreditNoteTotals(newItems);
    }
  };

  const calculateCreditNoteTotals = (itemList: CreditNoteItem[]) => {
    const subtotal = itemList.reduce((sum, item) => sum + item.amount, 0);
    const totalTax = itemList.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + totalTax;
    
    setCreditNote(prev => ({
      ...prev,
      subtotal,
      totalTax,
      totalAmount,
    }));
  };

  const handleCreditNoteChange = (field: keyof typeof creditNote, value: any) => {
    setCreditNote(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id || !user?.id) {
      setError('Company or user information is missing. Please log in and select a company.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const creditNoteToSave = {
        ...creditNote,
        company_id: currentCompany.id,
        created_by: user.id,
        invoice_no: creditNote.creditNoteNo, // Mapping creditNoteNo to invoice_no
        customer_id: creditNote.customerId,
        order_id: creditNote.invoiceId, // Mapping original invoice ID to order_id (or create custom field)
        invoice_date: creditNote.creditNoteDate,
        reference_no: creditNote.invoiceNo, // Mapping original invoice number to reference_no
        notes: creditNote.notes + (creditNote.reason ? ` (Reason: ${creditNote.reason})` : ''), // Combine reason into notes
        status: 'credit_note', // Ensure status is credit_note
        total_tax: creditNote.totalTax,
        total_amount: creditNote.totalAmount,
        // For credit notes, paid_amount and outstanding_amount might need specific logic
        paid_amount: 0, 
        outstanding_amount: creditNote.totalAmount, // Or 0 if it's fully applied
      };

      let creditNoteId = creditNote.id;

      if (creditNote.id) {
        const { data, error } = await supabase
          .from('sales_invoices') // Saving to sales_invoices table
          .update(creditNoteToSave)
          .eq('id', creditNote.id)
          .select();
        if (error) throw error;
        setSuccessMessage('Credit Note updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('sales_invoices') // Saving to sales_invoices table
          .insert(creditNoteToSave)
          .select();
        if (error) throw error;
        creditNoteId = data[0].id;
        setSuccessMessage('Credit Note created successfully!');
      }

      // Handle items for credit note (optional, depending on how detailed you want them)
      if (creditNoteMode === 'item_mode' && creditNoteId) { // This block will not run as creditNoteMode is fixed to 'voucher_mode'
        await supabase.from('sales_invoice_items').delete().eq('invoice_id', creditNoteId);

        const itemsToSave = items.map(item => ({
          ...item,
          invoice_id: creditNoteId,
          item_code: item.itemCode,
          item_name: item.itemName,
          tax_rate: item.taxRate,
          tax_amount: item.taxAmount,
          line_total: item.lineTotal,
        }));
        const { error: itemsError } = await supabase.from('sales_invoice_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }

      resetForm();
      setViewMode('list');
      fetchCreditNotes();
    } catch (err: any) {
      setError(`Failed to save credit note: ${err.message}`);
      console.error('Save credit note error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCreditNote = (cn: any) => {
    setCreditNote({
      id: cn.id,
      creditNoteNo: cn.invoice_no,
      customerId: cn.customer_id,
      customerName: cn.customer_name || 'N/A',
      invoiceId: cn.order_id,
      invoiceNo: cn.reference_no || '',
      creditNoteDate: cn.invoice_date,
      reason: '', // Reason might need to be parsed from notes or a custom field
      notes: cn.notes || '',
      status: cn.status,
      subtotal: cn.subtotal,
      totalTax: cn.total_tax,
      totalAmount: cn.total_amount,
    });
    // Fetch items if credit notes can have them
    supabase.from('sales_invoice_items')
      .select('*')
      .eq('invoice_id', cn.id)
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
          })));
        } else {
          setItems([]);
        }
      });
    setViewMode('create');
  };

  const handleDeleteCreditNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credit note? This action cannot be undone.')) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.from('sales_invoices').delete().eq('id', id);
      if (error) throw error;
      setSuccessMessage('Credit Note deleted successfully!');
      fetchCreditNotes();
    } catch (err: any) {
      setError(`Failed to delete credit note: ${err.message}`);
      console.error('Delete credit note error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Credit Notes</h1>
          <p className={theme.textSecondary}>Issue and manage credit notes for returns or adjustments.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Credit Note Suggestions')} />
          {viewMode === 'list' ? (
            <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); }}>Create New Credit Note</Button>
          ) : (
            <Button icon={<List size={16} />} onClick={() => setViewMode('list')}>View Credit Notes List</Button>
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
              {creditNote.id ? 'Edit Credit Note' : 'Create New Credit Note'}
            </h3>
            {/* Credit Notes are typically always in voucher mode */}
            <span className={`px-3 py-1 text-sm font-medium ${theme.textPrimary} bg-gray-100 rounded-lg`}>
              Voucher Mode
            </span>
          </div>

          <form onSubmit={handleSaveCreditNote} className="space-y-6">
            {/* Credit Note Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Credit Note Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Credit Note Number"
                  value={creditNote.creditNoteNo}
                  onChange={(value) => handleCreditNoteChange('creditNoteNo', value)}
                  placeholder="Auto-generated or manual"
                  required
                />
                <FormField
                  label="Credit Note Date"
                  type="date"
                  value={creditNote.creditNoteDate}
                  onChange={(value) => handleCreditNoteChange('creditNoteDate', value)}
                  required
                />
                <FormField
                  label="Original Invoice No."
                  value={creditNote.invoiceNo}
                  onChange={(value) => handleCreditNoteChange('invoiceNo', value)}
                  placeholder="Invoice being credited"
                />
                {/* You might want a hidden field for invoiceId if linking directly */}
                <FormField
                  label="Reason for Credit Note"
                  value={creditNote.reason}
                  onChange={(value) => handleCreditNoteChange('reason', value)}
                  placeholder="e.g., Sales Return, Price Adjustment"
                />
              </div>
            </Card>

            {/* Customer Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Customer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Customer Name"
                  value={creditNote.customerName}
                  onChange={(value) => handleCreditNoteChange('customerName', value)}
                  placeholder="Start typing customer name..."
                  required
                  aiHelper={true}
                  context="customer_selection"
                />
                {/* Add more customer fields if needed */}
              </div>
            </Card>

            {/* Credit Note Items (Optional, based on creditNoteMode) */}
            {creditNoteMode === 'item_mode' && ( // This block will not render
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className={`text-md font-semibold ${theme.textPrimary}`}>Credit Note Items</h4>
                  <Button size="sm" icon={<Plus size={16} />} onClick={addItemRow}>Add Item Row</Button>
                </div>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                          <FormField label="Item Name" value={item.itemName} onChange={(val) => updateItem(index, 'itemName', val)} placeholder="Product/Service Name" />
                        </div>
                        <FormField label="Quantity" type="number" value={item.quantity.toString()} onChange={(val) => updateItem(index, 'quantity', parseFloat(val) || 0)} />
                        <FormField label="Unit" value={item.unit} onChange={(val) => updateItem(index, 'unit', val)} />
                        <FormField label="Rate" type="number" value={item.rate.toString()} onChange={(val) => updateItem(index, 'rate', parseFloat(val) || 0)} icon={<DollarSign size={18} />} />
                        <FormField label="Tax Rate (%)" type="number" value={item.taxRate.toString()} onChange={(val) => updateItem(index, 'taxRate', parseFloat(val) || 0)} />
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItemRow(index)}>Remove</Button>
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

            {/* Credit Note Totals & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                  <Calculator size={20} className="mr-2" />
                  Credit Note Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={theme.textMuted}>Subtotal:</span>
                    <span className={theme.textPrimary}>₹{creditNote.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme.textMuted}>Total Tax:</span>
                    <span className={theme.textPrimary}>₹{creditNote.totalTax.toLocaleString()}</span>
                  </div>
                  <hr className={theme.borderColor} />
                  <div className="flex justify-between text-lg font-semibold">
                    <span className={theme.textPrimary}>Total Amount:</span>
                    <span className="text-red-600">₹{creditNote.totalAmount.toLocaleString()}</span> {/* Credit notes are usually negative impact */}
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
                  value={creditNote.notes}
                  onChange={(value) => handleCreditNoteChange('notes', value)}
                  placeholder="Any additional notes"
                />
              </Card>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : (creditNote.id ? 'Update Credit Note' : 'Save Credit Note')}
              </Button>
              {!creditNote.id && (
                <Button type="button" icon={<Send size={16} />}>Send Credit Note</Button>
              )}
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Credit Notes List</h3>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
              </div>
            ) : creditNotesList.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
                <p>No credit notes found. Create a new credit note to get started.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Note No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Invoice No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {creditNotesList.map((cn) => (
                    <tr key={cn.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cn.invoice_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cn.customer_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cn.invoice_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cn.reference_no || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{cn.total_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{cn.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleEditCreditNote(cn)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCreditNote(cn.id)} className="text-red-600 hover:text-red-800">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <AIButton variant="audit" onSuggest={() => console.log('AI Fraud Detection')} className="w-full" />
          </div>
        </Card>
      )}
    </div>
  );
}

export default CreditNotesPage;