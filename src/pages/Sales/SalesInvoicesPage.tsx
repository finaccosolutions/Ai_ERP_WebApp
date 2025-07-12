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

// Interface for Invoice Items
interface InvoiceItem {
  id: string;
  itemId: string; // Stores the UUID of the selected item from the 'items' table
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

// Interface for Ledger Entries (for Voucher Mode and Tax Ledgers)
interface LedgerEntry {
  id: string;
  accountId: string; // Stores the UUID of the selected account from 'chart_of_accounts'
  accountName: string;
  debit: number;
  credit: number;
  notes: string;
  isTaxLedger?: boolean; // Flag to identify if it's a tax ledger
  taxRate?: number; // Tax rate associated with the ledger, if applicable
}

function SalesInvoicesPage() {
  const { theme } = useTheme();
  const { suggestWithAI, createVoucherFromText } = useAI();
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'create' | 'list'>('list'); // 'create' or 'list'
  // Controls whether the form is in 'item_mode' (for detailed item entry) or 'voucher_mode' (for direct ledger entry)
  const [invoiceMode, setInvoiceMode] = useState<'item_mode' | 'voucher_mode'>('item_mode'); 

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
    salesAccountId: '', // New: For sales ledger selection
    salesAccountName: '', // New: For sales ledger selection
  });

  // State for managing invoice items (used in 'item_mode')
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      itemId: '',
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

  // State for managing ledger entries (used in 'voucher_mode')
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    { id: 'ledger-1', accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }
  ]);

  // State for managing additional ledger entries (used in 'item_mode' for other postings)
  const [additionalLedgerEntries, setAdditionalLedgerEntries] = useState<LedgerEntry[]>([
    { id: 'add-ledger-1', accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }
  ]);

  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Master data for dropdowns (fetched from Supabase)
  const [customers, setCustomers] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([]);

  // Effect hook to fetch data when view mode or company changes
  useEffect(() => {
    if (viewMode === 'list') {
      fetchSalesInvoices();
    }
    fetchMasterData();
  }, [viewMode, currentCompany?.id]);

  // Effect hook to recalculate totals when items or ledger entries change
  useEffect(() => {
    if (invoiceMode === 'item_mode') {
      calculateInvoiceTotals(items);
    } else {
      calculateVoucherModeTotals(ledgerEntries);
    }
  }, [items, ledgerEntries, invoiceMode, additionalLedgerEntries]); // Added additionalLedgerEntries

  // Fetches master data (customers, items, chart of accounts) from Supabase
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

  // Fetches existing sales invoices from Supabase
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

  // Resets the form to its initial state
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
      salesAccountId: '',
      salesAccountName: '',
    });
    setItems([
      {
        id: 'item-1',
        itemId: '',
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
    setAdditionalLedgerEntries([
      { id: 'add-ledger-1', accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }
    ]);
    setInvoiceMode('item_mode'); // Default to item mode on reset
    setError(null);
    setSuccessMessage(null);
  };

  // Calculates totals for a single invoice item
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

  // Updates an item in the items array and recalculates its totals
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate totals for this item
    newItems[index] = calculateItemTotals(newItems[index]);
    
    setItems(newItems);

    // Dynamic row addition: If the last row is being edited and has data, add a new empty row
    if (index === newItems.length - 1 && (newItems[index].itemName || newItems[index].quantity > 0 || newItems[index].rate > 0)) {
      addItem();
    }
  };

  // Adds a new empty item row
  const addItem = () => {
    setItems(prev => [...prev, {
      id: `item-${Date.now()}`,
      itemId: '',
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

  // Removes an item row, ensuring at least one row remains
  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  // Calculates overall invoice totals based on items (for 'item_mode')
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

  // Updates a ledger entry in the ledgerEntries array (for voucher mode)
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

    // Dynamic row addition: If the last row is being edited and has data, add a new empty row
    if (index === newLedgerEntries.length - 1 && (newLedgerEntries[index].accountName || newLedgerEntries[index].debit > 0 || newLedgerEntries[index].credit > 0)) {
      addLedgerEntry();
    }
    calculateVoucherModeTotals(newLedgerEntries);
  };

  // Adds a new empty ledger entry row (for voucher mode)
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

  // Removes a ledger entry row, ensuring at least one row remains (for voucher mode)
  const removeLedgerEntry = (index: number) => {
    if (ledgerEntries.length > 1) {
      const newLedgerEntries = ledgerEntries.filter((_, i) => i !== index);
      setLedgerEntries(newLedgerEntries);
      calculateVoucherModeTotals(newLedgerEntries);
    }
  };

  // Calculates overall invoice totals based on ledger entries (for 'voucher_mode')
  const calculateVoucherModeTotals = (entries: LedgerEntry[]) => {
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    
    setInvoice(prev => ({
      ...prev,
      totalAmount: totalDebit, // Assuming a balanced entry, total amount is either total debit or total credit
      subtotal: totalDebit, // Simplified for display in summary
      totalTax: 0, // Tax is handled per ledger entry in this mode
      outstandingAmount: totalDebit - prev.paidAmount
    }));
  };

  // Updates an additional ledger entry (for item mode)
  const updateAdditionalLedgerEntry = (index: number, field: keyof LedgerEntry, value: any) => {
    const newAdditionalLedgerEntries = [...additionalLedgerEntries];
    newAdditionalLedgerEntries[index] = { ...newAdditionalLedgerEntries[index], [field]: value };

    if (field === 'debit' && value > 0) {
      newAdditionalLedgerEntries[index].credit = 0;
    } else if (field === 'credit' && value > 0) {
      newAdditionalLedgerEntries[index].debit = 0;
    }

    setAdditionalLedgerEntries(newAdditionalLedgerEntries);

    // Dynamic row addition
    if (index === newAdditionalLedgerEntries.length - 1 && (newAdditionalLedgerEntries[index].accountName || newAdditionalLedgerEntries[index].debit > 0 || newAdditionalLedgerEntries[index].credit > 0)) {
      addAdditionalLedgerEntry();
    }
  };

  // Adds a new empty additional ledger entry row (for item mode)
  const addAdditionalLedgerEntry = () => {
    setAdditionalLedgerEntries(prev => [...prev, {
      id: `add-ledger-${Date.now()}`,
      accountId: '',
      accountName: '',
      debit: 0,
      credit: 0,
      notes: ''
    }]);
  };

  // Removes an additional ledger entry row (for item mode)
  const removeAdditionalLedgerEntry = (index: number) => {
    if (additionalLedgerEntries.length > 1) {
      const newAdditionalLedgerEntries = additionalLedgerEntries.filter((_, i) => i !== index);
      setAdditionalLedgerEntries(newAdditionalLedgerEntries);
    }
  };

  // Handles changes to the main invoice fields
  const handleInvoiceChange = (field: keyof typeof invoice, value: any) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  // Handles saving the invoice (both item and voucher mode)
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
        // New sales account fields
        sales_account_id: invoice.salesAccountId,
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
          item_id: item.itemId, // Save itemId
          item_code: item.itemCode,
          item_name: item.itemName,
          tax_rate: item.taxRate,
          tax_amount: item.taxAmount,
          line_total: item.lineTotal,
        }));
        const { error: itemsError } = await supabase.from('sales_invoice_items').insert(itemsToSave);
        if (itemsError) throw itemsError;

        // Handle additional ledger entries for item mode
        // In a real application, these would go into journal_entries/journal_entry_items
        console.log('Saving additional ledger entries for item mode:', additionalLedgerEntries);

      } else if (invoiceMode === 'voucher_mode' && salesInvoiceId) {
        // Handle ledger entries for voucher mode
        // In a real application, these would typically be saved to 'journal_entries' and 'journal_entry_items' tables
        console.log('Saving ledger entries for voucher mode:', ledgerEntries);
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

  // Handles editing an existing invoice
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
      salesAccountId: inv.sales_account_id || '', // Populate sales account
      salesAccountName: inv.sales_account_name || '', // Populate sales account name
    });
    // Fetch items for this invoice
    supabase.from('sales_invoice_items')
      .select('*')
      .eq('invoice_id', inv.id)
      .then(({ data, error }) => {
        if (!error && data) {
          setItems(data.map(item => ({
            id: item.id,
            itemId: item.item_id, // Populate itemId
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
    // Fetch additional ledger entries if needed (requires separate table/logic)
    setAdditionalLedgerEntries([
      { id: 'add-ledger-1', accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }
    ]);
    setViewMode('create');
  };

  // Handles deleting an invoice
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

  // Callback for MasterSelectField when a customer is selected
  const handleCustomerSelect = (id: string, name: string, additionalData: any) => {
    setInvoice(prev => ({
      ...prev,
      customerId: id,
      customerName: name,
      customerGSTIN: additionalData?.gstin || '',
      placeOfSupply: additionalData?.billing_address?.state || '', // Assuming state is place of supply
    }));
  };

  // Callback for MasterSelectField when an item is selected
  const handleItemSelect = (index: number, id: string, name: string, additionalData: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      itemId: id, // Set itemId
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

  // Callback for MasterSelectField when a ledger account is selected (for voucher mode and additional ledgers)
  const handleLedgerSelect = (index: number, id: string, name: string, additionalData: any, isAdditional: boolean = false) => {
    if (isAdditional) {
      const newAdditionalLedgerEntries = [...additionalLedgerEntries];
      newAdditionalLedgerEntries[index] = {
        ...newAdditionalLedgerEntries[index],
        accountId: id,
        accountName: name,
        isTaxLedger: additionalData?.accountType === 'tax',
        taxRate: additionalData?.taxRate || 0
      };
      setAdditionalLedgerEntries(newAdditionalLedgerEntries);
    } else {
      const newLedgerEntries = [...ledgerEntries];
      newLedgerEntries[index] = {
        ...newLedgerEntries[index],
        accountId: id, // Set accountId
        accountName: name,
        isTaxLedger: additionalData?.accountType === 'tax', // Example classification
        taxRate: additionalData?.taxRate || 0
      };
      setLedgerEntries(newLedgerEntries);
    }
  };

  // Callback for MasterSelectField for Sales Account
  const handleSalesAccountSelect = (id: string, name: string, additionalData: any) => {
    setInvoice(prev => ({
      ...prev,
      salesAccountId: id,
      salesAccountName: name,
    }));
  };

  // Determines and returns default tax ledgers based on company's tax configuration
  const getTaxLedgers = () => {
    if (!currentCompany || !chartOfAccounts.length) return [];

    const taxLedgers: LedgerEntry[] = [];
    const companyTaxConfig = currentCompany.taxConfig;

    // Only show tax section if tax is enabled in company master
    if (!companyTaxConfig?.enabled) return [];

    // Example for India's GST
    if (currentCompany.country === 'India' && companyTaxConfig?.type === 'GST') {
      // Filter chart of accounts for potential tax accounts
      const gstAccounts = chartOfAccounts.filter(acc => 
        acc.account_name.toLowerCase().includes('gst') || 
        acc.account_name.toLowerCase().includes('tax') || 
        acc.account_type === 'expense' || // Broaden search for tax accounts
        acc.account_type === 'income'
      );
      
      // Find specific GST accounts
      const cgstAccount = gstAccounts.find(acc => acc.account_name.toLowerCase().includes('cgst'));
      const sgstAccount = gstAccounts.find(acc => acc.account_name.toLowerCase().includes('sgst'));
      const igstAccount = gstAccounts.find(acc => acc.account_name.toLowerCase().includes('igst'));
      
      // Use a default tax rate from company config, or a fallback
      const defaultTaxRate = companyTaxConfig.rates?.[3] || 18; // Assuming 18% is a common default

      if (cgstAccount) taxLedgers.push({ id: `cgst-${cgstAccount.id}`, accountId: cgstAccount.id, accountName: cgstAccount.name, debit: 0, credit: 0, notes: 'CGST', isTaxLedger: true, taxRate: defaultTaxRate });
      if (sgstAccount) taxLedgers.push({ id: `sgst-${sgstAccount.id}`, accountId: sgstAccount.id, accountName: sgstAccount.name, debit: 0, credit: 0, notes: 'SGST', isTaxLedger: true, taxRate: defaultTaxRate });
      if (igstAccount) taxLedgers.push({ id: `igst-${igstAccount.id}`, accountId: igstAccount.id, accountName: igstAccount.name, debit: 0, credit: 0, notes: 'IGST', isTaxLedger: true, taxRate: defaultTaxRate });
    }
    // TODO: Add logic for other countries/tax types (e.g., VAT) if needed
    
    return taxLedgers;
  };

  const taxLedgers = getTaxLedgers();

  // Calculates the total tax amount for a specific tax rate across all items
  const calculateTaxAmountForRate = (rate: number) => {
    // If in item mode, calculate based on item tax amounts
    if (invoiceMode === 'item_mode') {
      return items.reduce((sum, item) => {
        if (item.taxRate === rate) {
          return sum + item.taxAmount;
        }
        return sum;
      }, 0);
    } 
    // If in voucher mode, tax amount would typically be entered directly as a ledger entry
    // or derived from the sales ledger amount if a fixed tax rate applies to all sales.
    // For now, return 0 or implement specific logic if needed.
    return 0; 
  };

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
            {/* Option to switch between Item Invoice Mode and Voucher Mode */}
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
                {/* MasterSelectField for Customer Name */}
                <MasterSelectField
                  label="Customer Name"
                  value={invoice.customerName}
                  onValueChange={(val) => handleInvoiceChange('customerName', val)}
                  onSelect={handleCustomerSelect}
                  options={customers} // Provides list of customers from DB
                  placeholder="Start typing customer name..."
                  required
                />
                <FormField
                  label="Customer GSTIN"
                  value={invoice.customerGSTIN}
                  onChange={(value) => handleInvoiceChange('customerGSTIN', value)}
                  placeholder="22AAAAA0000A1Z5"
                  readOnly // Populated automatically from customer master
                />
                <FormField
                  label="Place of Supply"
                  value={invoice.placeOfSupply}
                  onChange={(value) => handleInvoiceChange('placeOfSupply', value)}
                  placeholder="State/UT"
                  required
                  readOnly // Populated automatically from customer master
                />
              </div>
            </Card>

            {/* Sales Ledger Selection (Always visible) */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Sales Account</h4>
              <MasterSelectField
                label="Sales Ledger"
                value={invoice.salesAccountName}
                onValueChange={(val) => handleInvoiceChange('salesAccountName', val)}
                onSelect={handleSalesAccountSelect}
                options={chartOfAccounts.filter(acc => acc.accountType === 'income')} // Filter for income accounts
                placeholder="Select sales account"
                required
              />
              {invoiceMode === 'voucher_mode' && (
                <FormField
                  label="Sales Amount"
                  type="number"
                  value={invoice.totalAmount.toString()} // In voucher mode, this is the total amount
                  onChange={(val) => handleInvoiceChange('totalAmount', parseFloat(val) || 0)}
                  readOnly={invoiceMode === 'item_mode'} // Read-only in item mode
                  className="mt-4"
                />
              )}
            </Card>

            {/* Invoice Items Section (Visible only in 'item_mode') */}
            {invoiceMode === 'item_mode' && (
              <>
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
                        {/* Adjusted grid for single row display */}
                        <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-end">
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
                              // Removed readOnly to allow user input
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
                              placeholder="Nos"
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
                          {/* Reordered: Amount then Tax Rate */}
                          <div>
                            <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>Amount</label>
                            <div className={`px-3 py-2 ${theme.inputBg} border ${theme.borderColor} rounded-lg`}>
                              ₹{item.amount.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <FormField
                              label="Tax Rate (%)"
                              type="number"
                              value={item.taxRate.toString()}
                              onChange={(value) => updateItem(index, 'taxRate', parseFloat(value) || 0)}
                              // Removed readOnly to allow user input
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
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Dedicated Tax Section (below stock items, for 'item_mode') */}
                {taxLedgers.length > 0 && ( // Only show if tax is enabled and ledgers are found
                  <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className={`text-md font-semibold ${theme.textPrimary}`}>Tax Details</h4>
                    </div>
                    <div className="space-y-4">
                      {taxLedgers.map((taxLedger, index) => (
                        <div key={taxLedger.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>Tax Ledger</label>
                              <div className={`px-3 py-2 ${theme.inputBg} border ${theme.borderColor} rounded-lg`}>
                                {taxLedger.accountName}
                              </div>
                            </div>
                            <div>
                              <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>Tax Rate (%)</label>
                              <div className={`px-3 py-2 ${theme.inputBg} border ${theme.borderColor} rounded-lg`}>
                                {taxLedger.taxRate}%
                              </div>
                            </div>
                            <div>
                              <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>Tax Amount</label>
                              <div className={`px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg font-semibold`}>
                                {/* Displays tax amount matching the percentage from stock items */}
                                ₹{calculateTaxAmountForRate(taxLedger.taxRate || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Additional Ledger Entries Section (for item mode) */}
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className={`text-md font-semibold ${theme.textPrimary}`}>Other Ledger Entries</h4>
                    <Button size="sm" icon={<Plus size={16} />} onClick={addAdditionalLedgerEntry}>Add Ledger</Button>
                  </div>

                  <div className="space-y-4">
                    {additionalLedgerEntries.map((entry, index) => (
                      <div key={entry.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="md:col-span-2">
                            <MasterSelectField
                              label="Account Name"
                              value={entry.accountName}
                              onValueChange={(val) => updateAdditionalLedgerEntry(index, 'accountName', val)}
                              onSelect={(id, name, data) => handleLedgerSelect(index, id, name, data, true)} // Pass true for additional
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
                              onChange={(val) => updateAdditionalLedgerEntry(index, 'debit', parseFloat(val) || 0)}
                            />
                          </div>
                          <div>
                            <FormField
                              label="Credit"
                              type="number"
                              value={entry.credit.toString()}
                              onChange={(val) => updateAdditionalLedgerEntry(index, 'credit', parseFloat(val) || 0)}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={16} />}
                              onClick={() => removeAdditionalLedgerEntry(index)}
                              disabled={additionalLedgerEntries.length === 1}
                              className="text-red-600 hover:text-red-800"
                            />
                          </div>
                        </div>
                        <FormField
                          label="Notes"
                          value={entry.notes}
                          onChange={(val) => updateAdditionalLedgerEntry(index, 'notes', val)}
                          placeholder="Entry notes"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {/* Ledger Entries Section (Visible only in 'voucher_mode') */}
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
                          {/* MasterSelectField for Account Name */}
                          <MasterSelectField
                            label="Account Name"
                            value={entry.accountName}
                            onValueChange={(val) => updateLedgerEntry(index, 'accountName', val)}
                            onSelect={(id, name, data) => handleLedgerSelect(index, id, name, data)}
                            options={chartOfAccounts} // Provides list of accounts from DB
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
                          {/* Delete icon for each ledger line */}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => removeLedgerEntry(index)}
                            disabled={ledgerEntries.length === 1} // Disable if only one row
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
                      {/* Display total debit/credit for voucher mode */}
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
