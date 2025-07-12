import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, Save, Send, Trash2, Calculator, List, Eye, EyeOff } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField'; // Import new component
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

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

interface LedgerEntry {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  notes: string;
  isTaxLedger?: boolean;
  taxRate?: number; // For tax ledgers
}

function SalesInvoicesPage() {
  const { theme } = useTheme();
  const { suggestWithAI, createVoucherFromText } = useAI();
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'create' | 'list'>('list'); // 'create' or 'list'
  const [invoiceMode, setInvoiceMode] = useState<'item_mode' | 'voucher_mode'>('item_mode'); // 'item_mode' or 'voucher_mode'

  const [invoice, setInvoice] = useState({
    id: '', // For editing existing invoice
    invoiceNo: '',
    customerId: '', // Link to customers table
    customerName: '',
    customerGSTIN: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    placeOfSupply: '',
    referenceNo: '',
    termsAndConditions: '',
    notes: '',
    status: 'draft', // draft, sent, paid, partially_paid, overdue, cancelled
    subtotal: 0,
    totalTax: 0,
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0,
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
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

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    { id: 'ledger-1', accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }
  ]);

  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Master data for dropdowns
  const [customers, setCustomers] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchSalesInvoices();
    }
    fetchMasterData();
  }, [viewMode, currentCompany?.id]);

  useEffect(() => {
    // Recalculate totals when items or ledger entries change
    if (invoiceMode === 'item_mode') {
      calculateInvoiceTotals(items);
    } else {
      calculateVoucherModeTotals(ledgerEntries);
    }
  }, [items, ledgerEntries, invoiceMode]);


  const fetchMasterData = async () => {
    if (!currentCompany?.id) return;
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, gstin, billing_address')
        .eq('company_id', currentCompany.id);
      if (customersError) throw customersError;
      setCustomers(customersData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('id, item_code, item_name, description, standard_rate, tax_rate, unit_id, units_of_measure(name)')
        .eq('company_id', currentCompany.id);
      if (itemsError) throw itemsError;
      setStockItems(itemsData.map(item => ({
        id: item.id,
        name: item.item_name,
        itemCode: item.item_code,
        description: item.description,
        rate: item.standard_rate,
        taxRate: item.tax_rate,
        unit: item.units_of_measure?.name || 'Nos'
      })));

      const { data: accountsData, error: accountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, account_type, tax_rate')
        .eq('company_id', currentCompany.id);
      if (accountsError) throw accountsError;
      setChartOfAccounts(accountsData.map(acc => ({
        id: acc.id,
        name: acc.account_name,
        accountCode: acc.account_code,
        accountType: acc.account_type,
        taxRate: acc.tax_rate
      })));

    } catch (err: any) {
      console.error('Error fetching master data:', err);
      setError(`Error fetching master data: ${err.message}`);
    }
  };

  const fetchSalesInvoices = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setSalesInvoices(data);
    } catch (err: any) {
      setError(`Error fetching invoices: ${err.message}`);
      console.error('Error fetching sales invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setInvoice({
      id: '',
      invoiceNo: '',
      customerId: '',
      customerName: '',
      customerGSTIN: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      placeOfSupply: '',
      referenceNo: '',
      termsAndConditions: '',
      notes: '',
      status: 'draft',
      subtotal: 0,
      totalTax: 0,
      totalAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
    });
    setItems([
      {
        id: 'item-1',
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
    setLedgerEntries([
      { id: 'ledger-1', accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }
    ]);
    setInvoiceMode('item_mode');
    setError(null);
    setSuccessMessage(null);
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

    // Auto-add new row if last row is being edited and has data
    if (index === newItems.length - 1 && (newItems[index].itemName || newItems[index].quantity > 0 || newItems[index].rate > 0)) {
      addItem();
    }
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: `item-${Date.now()}`,
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
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const calculateInvoiceTotals = (itemList: InvoiceItem[]) => {
    const subtotal = itemList.reduce((sum, item) => sum + item.amount, 0);
    const totalTax = itemList.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + totalTax;
    
    setInvoice(prev => ({
      ...prev,
      subtotal,
      totalTax,
      totalAmount,
      outstandingAmount: totalAmount - prev.paidAmount // Update outstanding
    }));
  };

  const updateLedgerEntry = (index: number, field: keyof LedgerEntry, value: any) => {
    const newLedgerEntries = [...ledgerEntries];
    newLedgerEntries[index] = { ...newLedgerEntries[index], [field]: value };

    // Ensure only one of debit/credit has a value
    if (field === 'debit' && value > 0) {
      newLedgerEntries[index].credit = 0;
    } else if (field === 'credit' && value > 0) {
      newLedgerEntries[index].debit = 0;
    }
    
    setLedgerEntries(newLedgerEntries);

    // Auto-add new row if last row is being edited and has data
    if (index === newLedgerEntries.length - 1 && (newLedgerEntries[index].accountName || newLedgerEntries[index].debit > 0 || newLedgerEntries[index].credit > 0)) {
      addLedgerEntry();
    }
    calculateVoucherModeTotals(newLedgerEntries);
  };

  const addLedgerEntry = () => {
    setLedgerEntries(prev => [...prev, {
      id: `ledger-${Date.now()}`,
      accountId: '',
      accountName: '',
      debit: 0,
      credit: 0,
      notes: ''
    }]);
  };

  const removeLedgerEntry = (index: number) => {
    if (ledgerEntries.length > 1) {
      const newLedgerEntries = ledgerEntries.filter((_, i) => i !== index);
      setLedgerEntries(newLedgerEntries);
      calculateVoucherModeTotals(newLedgerEntries);
    }
  };

  const calculateVoucherModeTotals = (entries: LedgerEntry[]) => {
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    
    setInvoice(prev => ({
      ...prev,
      totalAmount: totalDebit, // Or totalCredit, assuming balanced entry
      subtotal: totalDebit, // Simplified for display
      totalTax: 0, // Tax handled per ledger
      outstandingAmount: totalDebit - prev.paidAmount
    }));
  };

  const handleInvoiceChange = (field: keyof typeof invoice, value: any) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id || !user?.id) {
      setError('Company or user information is missing. Please log in and select a company.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const invoiceToSave = {
        ...invoice,
        company_id: currentCompany.id,
        created_by: user.id,
        // Ensure correct Supabase column names
        invoice_no: invoice.invoiceNo,
        customer_id: invoice.customerId,
        invoice_date: invoice.invoiceDate,
        due_date: invoice.dueDate,
        reference_no: invoice.referenceNo,
        terms_and_conditions: invoice.termsAndConditions,
        total_tax: invoice.totalTax,
        total_amount: invoice.totalAmount,
        paid_amount: invoice.paidAmount,
        outstanding_amount: invoice.outstandingAmount,
      };

      let salesInvoiceId = invoice.id;

      if (invoice.id) {
        // Update existing invoice
        const { data, error } = await supabase
          .from('sales_invoices')
          .update(invoiceToSave)
          .eq('id', invoice.id)
          .select();
        if (error) throw error;
        setSuccessMessage('Invoice updated successfully!');
      } else {
        // Insert new invoice
        const { data, error } = await supabase
          .from('sales_invoices')
          .insert(invoiceToSave)
          .select();
        if (error) throw error;
        salesInvoiceId = data[0].id;
        setSuccessMessage('Invoice created successfully!');
      }

      // Handle invoice items (if in item_mode)
      if (invoiceMode === 'item_mode' && salesInvoiceId) {
        // Delete existing items for this invoice first (simpler for now)
        await supabase.from('sales_invoice_items').delete().eq('invoice_id', salesInvoiceId);

        const itemsToSave = items.filter(item => item.itemName).map(item => ({
          ...item,
          invoice_id: salesInvoiceId,
          // Ensure correct Supabase column names
          item_code: item.itemCode,
          item_name: item.itemName,
          tax_rate: item.taxRate,
          tax_amount: item.taxAmount,
          line_total: item.lineTotal,
        }));
        const { error: itemsError } = await supabase.from('sales_invoice_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      } else if (invoiceMode === 'voucher_mode' && salesInvoiceId) {
        // Handle ledger entries for voucher mode
        // This would typically go into a journal_entries and journal_entry_items table
        // For simplicity, we'll log it here, but in a real app, you'd save to accounting tables
        console.log('Saving ledger entries:', ledgerEntries);
        // Example: Save to journal_entries and journal_entry_items
        // const { data: journalEntry, error: jeError } = await supabase.from('journal_entries').insert({...}).select();
        // if (jeError) throw jeError;
        // await supabase.from('journal_entry_items').insert(ledgerEntries.map(entry => ({ journal_id: journalEntry.id, ...entry })));
      }

      resetForm();
      setViewMode('list');
      fetchSalesInvoices(); // Refresh list
    } catch (err: any) {
      setError(`Failed to save invoice: ${err.message}`);
      console.error('Save invoice error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = (inv: any) => {
    setInvoice({
      id: inv.id,
      invoiceNo: inv.invoice_no,
      customerId: inv.customer_id,
      customerName: inv.customer_name || 'N/A', // You might need to fetch customer name
      customerGSTIN: inv.customer_gstin || '',
      invoiceDate: inv.invoice_date,
      dueDate: inv.due_date,
      placeOfSupply: inv.place_of_supply || '',
      referenceNo: inv.reference_no || '',
      termsAndConditions: inv.terms_and_conditions || '',
      notes: inv.notes || '',
      status: inv.status,
      subtotal: inv.subtotal,
      totalTax: inv.total_tax,
      totalAmount: inv.total_amount,
      paidAmount: inv.paid_amount,
      outstandingAmount: inv.outstanding_amount,
    });
    // Fetch items for this invoice
    supabase.from('sales_invoice_items')
      .select('*')
      .eq('invoice_id', inv.id)
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
            hsnCode: item.hsn_code || '',
          })));
          setInvoiceMode('item_mode'); // Assume item mode if items exist
        } else {
          setItems([]);
          // If no items, try to load ledger entries if this was a voucher mode invoice
          // This would require a join with journal_entries/journal_entry_items
          setLedgerEntries([
            { id: 'ledger-1', accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }
          ]);
          setInvoiceMode('voucher_mode'); // Fallback to voucher mode
        }
      });
    setViewMode('create');
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.from('sales_invoices').delete().eq('id', id);
      if (error) throw error;
      setSuccessMessage('Invoice deleted successfully!');
      fetchSalesInvoices();
    } catch (err: any) {
      setError(`Failed to delete invoice: ${err.message}`);
      console.error('Delete invoice error:', err);
    } finally {
      setLoading(false);
    }
  };

  // AI Suggestion handlers (simplified for this context)
  const handleCustomerSelect = (id: string, name: string, additionalData: any) => {
    setInvoice(prev => ({
      ...prev,
      customerId: id,
      customerName: name,
      customerGSTIN: additionalData?.gstin || '',
      placeOfSupply: additionalData?.billing_address?.state || '', // Assuming state is place of supply
    }));
  };

  const handleItemSelect = (index: number, id: string, name: string, additionalData: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      itemId: id,
      itemName: name,
      itemCode: additionalData?.itemCode || '',
      description: additionalData?.description || '',
      rate: additionalData?.rate || 0,
      taxRate: additionalData?.taxRate || 0,
      unit: additionalData?.unit || 'Nos'
    };
    setItems(newItems);
    calculateInvoiceTotals(newItems);
  };

  const handleLedgerSelect = (index: number, id: string, name: string, additionalData: any) => {
    const newLedgerEntries = [...ledgerEntries];
    newLedgerEntries[index] = {
      ...newLedgerEntries[index],
      accountId: id,
      accountName: name,
      isTaxLedger: additionalData?.accountType === 'tax', // Example classification
      taxRate: additionalData?.taxRate || 0
    };
    setLedgerEntries(newLedgerEntries);
  };

  // Determine tax ledgers based on company country
  const getTaxLedgers = () => {
    if (currentCompany?.country === 'India' && currentCompany?.taxConfig?.type === 'GST') {
      const gstAccounts = chartOfAccounts.filter(acc => acc.accountName.includes('GST') || acc.accountType === 'tax');
      const cgst = gstAccounts.find(acc => acc.accountName.includes('CGST'));
      const sgst = gstAccounts.find(acc => acc.accountName.includes('SGST'));
      const igst = gstAccounts.find(acc => acc.accountName.includes('IGST'));
      
      const taxLedgers: LedgerEntry[] = [];
      if (cgst) taxLedgers.push({ id: `cgst-${cgst.id}`, accountId: cgst.id, accountName: cgst.name, debit: 0, credit: 0, notes: 'CGST', isTaxLedger: true, taxRate: currentCompany.taxConfig.rates[3] || 18 }); // Assuming 18% is default
      if (sgst) taxLedgers.push({ id: `sgst-${sgst.id}`, accountId: sgst.id, accountName: sgst.name, debit: 0, credit: 0, notes: 'SGST', isTaxLedger: true, taxRate: currentCompany.taxConfig.rates[3] || 18 });
      if (igst) taxLedgers.push({ id: `igst-${igst.id}`, accountId: igst.id, accountName: igst.name, debit: 0, credit: 0, notes: 'IGST', isTaxLedger: true, taxRate: currentCompany.taxConfig.rates[3] || 18 });
      
      return taxLedgers;
    }
    return [];
  };

  const taxLedgers = getTaxLedgers();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Invoices</h1>
          <p className={theme.textSecondary}>Manage your sales invoices, track payments, and generate reports.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Invoice Suggestions')} />
          {viewMode === 'list' ? (
            <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); }}>Create New Invoice</Button>
          ) : (
            <Button icon={<List size={16} />} onClick={() => setViewMode('list')}>View Invoices List</Button>
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
              {invoice.id ? 'Edit Sales Invoice' : 'Create New Sales Invoice'}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${theme.textPrimary}`}>Mode:</span>
              <select
                value={invoiceMode}
                onChange={(e) => setInvoiceMode(e.target.value as 'item_mode' | 'voucher_mode')}
                className={`
                  px-3 py-1 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                `}
              >
                <option value="item_mode">Item Invoice Mode</option>
                <option value="voucher_mode">Voucher Mode</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleSaveInvoice} className="space-y-6">
            {/* Invoice Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Invoice Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Invoice Number"
                  value={invoice.invoiceNo}
                  onChange={(value) => handleInvoiceChange('invoiceNo', value)}
                  placeholder="Auto-generated or manual"
                  required
                />
                <FormField
                  label="Invoice Date"
                  type="date"
                  value={invoice.invoiceDate}
                  onChange={(value) => handleInvoiceChange('invoiceDate', value)}
                  required
                />
                <FormField
                  label="Due Date"
                  type="date"
                  value={invoice.dueDate}
                  onChange={(value) => handleInvoiceChange('dueDate', value)}
                />
                <FormField
                  label="Reference No."
                  value={invoice.referenceNo}
                  onChange={(value) => handleInvoiceChange('referenceNo', value)}
                  placeholder="PO Number, etc."
                />
              </div>
            </Card>

            {/* Customer Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Customer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MasterSelectField
                  label="Customer Name"
                  value={invoice.customerName}
                  onValueChange={(val) => handleInvoiceChange('customerName', val)}
                  onSelect={handleCustomerSelect}
                  options={customers}
                  placeholder="Start typing customer name..."
                  required
                />
                <FormField
                  label="Customer GSTIN"
                  value={invoice.customerGSTIN}
                  onChange={(value) => handleInvoiceChange('customerGSTIN', value)}
                  placeholder="22AAAAA0000A1Z5"
                  readOnly // Usually populated from customer master
                />
                <FormField
                  label="Place of Supply"
                  value={invoice.placeOfSupply}
                  onChange={(value) => handleInvoiceChange('placeOfSupply', value)}
                  placeholder="State/UT"
                  required
                  readOnly // Usually populated from customer master
                />
              </div>
            </Card>

            {/* Invoice Items (Conditional) */}
            {invoiceMode === 'item_mode' && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className={`text-md font-semibold ${theme.textPrimary}`}>Invoice Items</h4>
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
                            onSelect={(id, name, data) => handleItemSelect(index, id, name, data)}
                            options={stockItems}
                            placeholder="Product/Service name"
                            required
                          />
                        </div>
                        <div>
                          <FormField
                            label="HSN/SAC Code"
                            value={item.hsnCode}
                            onChange={(value) => updateItem(index, 'hsnCode', value)}
                            placeholder="8471"
                            readOnly // Usually populated from item master
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
                            readOnly // Usually populated from item master
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

            {/* Ledger Entries (Conditional) */}
            {invoiceMode === 'voucher_mode' && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className={`text-md font-semibold ${theme.textPrimary}`}>Ledger Entries</h4>
                  <Button size="sm" icon={<Plus size={16} />} onClick={addLedgerEntry}>Add Ledger</Button>
                </div>

                <div className="space-y-4">
                  {ledgerEntries.map((entry, index) => (
                    <div key={entry.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                          <MasterSelectField
                            label="Account Name"
                            value={entry.accountName}
                            onValueChange={(val) => updateLedgerEntry(index, 'accountName', val)}
                            onSelect={(id, name, data) => handleLedgerSelect(index, id, name, data)}
                            options={chartOfAccounts}
                            placeholder="Select account"
                            required
                          />
                        </div>
                        <div>
                          <FormField
                            label="Debit"
                            type="number"
                            value={entry.debit.toString()}
                            onChange={(val) => updateLedgerEntry(index, 'debit', parseFloat(val) || 0)}
                          />
                        </div>
                        <div>
                          <FormField
                            label="Credit"
                            type="number"
                            value={entry.credit.toString()}
                            onChange={(val) => updateLedgerEntry(index, 'credit', parseFloat(val) || 0)}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => removeLedgerEntry(index)}
                            disabled={ledgerEntries.length === 1}
                            className="text-red-600 hover:text-red-800"
                          />
                        </div>
                      </div>
                      <FormField
                        label="Notes"
                        value={entry.notes}
                        onChange={(val) => updateLedgerEntry(index, 'notes', val)}
                        placeholder="Entry notes"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Invoice Totals & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                  <Calculator size={20} className="mr-2" />
                  Invoice Summary
                </h4>
                <div className="space-y-3">
                  {invoiceMode === 'item_mode' ? (
                    <>
                      <div className="flex justify-between">
                        <span className={theme.textMuted}>Subtotal:</span>
                        <span className={theme.textPrimary}>₹{invoice.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={theme.textMuted}>Total Tax:</span>
                        <span className={theme.textPrimary}>₹{invoice.totalTax.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className={theme.textMuted}>Total Debit:</span>
                        <span className={theme.textPrimary}>₹{ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={theme.textMuted}>Total Credit:</span>
                        <span className={theme.textPrimary}>₹{ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <hr className={theme.borderColor} />
                  <div className="flex justify-between text-lg font-semibold">
                    <span className={theme.textPrimary}>Total Amount:</span>
                    <span className="text-green-600">₹{invoice.totalAmount.toLocaleString()}</span>
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
                  value={invoice.termsAndConditions}
                  onChange={(value) => handleInvoiceChange('termsAndConditions', value)}
                  placeholder="Payment terms, delivery terms, etc."
                />
                <FormField
                  label="Notes"
                  value={invoice.notes}
                  onChange={(value) => handleInvoiceChange('notes', value)}
                  placeholder="Any additional notes"
                />
              </Card>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : (invoice.id ? 'Update Invoice' : 'Save Invoice')}
              </Button>
              {!invoice.id && ( // Only show Send button for new invoices
                <Button type="button" icon={<Send size={16} />}>Send Invoice</Button>
              )}
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Invoices List</h3>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6AC8A3]"></div>
              </div>
            ) : salesInvoices.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
                <p>No sales invoices found. Create a new invoice to get started.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.invoice_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.customer_name || 'N/A'}</td> {/* Placeholder for customer name */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.invoice_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{inv.total_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{inv.outstanding_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{inv.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleEditInvoice(inv)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice(inv.id)} className="text-red-600 hover:text-red-800">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <AIButton variant="predict" onSuggest={() => console.log('AI Payment Prediction')} className="w-full" />
          </div>
        </Card>
      )}
    </div>
  );
}

export default SalesInvoicesPage;
