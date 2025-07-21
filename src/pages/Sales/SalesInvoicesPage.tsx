import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, RefreshCw, Eye, Edit, Trash2, Send, Download, Filter, Calendar, Users, Calculator, Info, DollarSign, Percent, AlertTriangle, List, Save } from 'lucide-react'; // Added AlertTriangle, List, Save
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField'; // Import new component
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { COUNTRIES, getCountryByCode } from '../../constants/geoData';

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
  amount: number; // Positive for debit, negative for credit
  notes: string;
  isTaxLedger?: boolean; // Flag to identify if it's a tax ledger
  taxRate?: number; // Tax rate associated with the ledger, if applicable
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

interface CustomerOption {
  id: string;
  name: string;
  billing_address: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  } | null;
  gstin?: string;
}

interface AccountOption {
  id: string;
  name: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_group: string;
  tax_rate?: number;
}

interface SalesInvoice {
  id: string;
  invoice_no: string;
  customer_id: string | null;
  invoice_date: string;
  due_date: string | null;
  status: string;
  total_amount: number | null;
  paid_amount: number | null;
  outstanding_amount: number | null;
  created_at: string;
  customers: { name: string } | null; // Joined customer data
  tax_details: any | null;
  other_ledger_entries: any | null;
}

function SalesInvoicesPage() {
  const { theme } = useTheme();
  const { suggestWithAI, createVoucherFromText } = useAI();
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation

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
    { id: 'ledger-1', accountId: '', accountName: '', amount: 0, notes: '' }
  ]);

  // State for managing additional ledger entries (used in 'item_mode' for other postings)
  const [additionalLedgerEntries, setAdditionalLedgerEntries] = useState<LedgerEntry[]>([
    { id: 'add-ledger-1', accountId: '', accountName: '', amount: 0, notes: '' }
  ]);

  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Master data for dropdowns (fetched from Supabase)
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [stockItems, setStockItems] = useState<ItemOption[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<AccountOption[]>([]);
  const [taxLedgers, setTaxLedgers] = useState<AccountOption[]>([]);
  const [otherLedgers, setOtherLedgers] = useState<AccountOption[]>([]);

  const [companyDetails, setCompanyDetails] = useState<any | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerOption | null>(null);

  const [taxRows, setTaxRows] = useState<
    { id: string; accountId: string; accountName: string; percentage: number; amount: number }[]
  >([]);

  // List view states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [totalInvoicesCount, setTotalInvoicesCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<string | null>(null);

  // Effect hook to fetch data when view mode or company changes
  useEffect(() => {
    console.log('SalesInvoicesPage: useEffect triggered. viewMode:', viewMode, 'currentCompany.id:', currentCompany?.id);
    if (currentCompany?.id) {
      fetchMasterData(currentCompany.id);
      if (viewMode === 'list') {
        fetchSalesInvoices();
      }
    }
  }, [viewMode, currentCompany?.id, filterStatus, filterStartDate, filterEndDate]);

  // Effect to handle navigation state for 'create' mode
  useEffect(() => {
    console.log('SalesInvoicesPage: location.state changed:', location.state);
    if (location.state?.mode === 'create') {
      setViewMode('create');
      resetForm(); // Ensure form is clean for new invoice
      // Clear the state so a refresh doesn't keep it in create mode
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]); // Depend on location.state

  // Effect hook to recalculate totals when items or ledger entries change
  useEffect(() => {
    console.log('SalesInvoicesPage: Recalculating totals. invoiceMode:', invoiceMode);
    if (invoiceMode === 'item_mode') {
      calculateInvoiceTotals(items);
    } else {
      calculateVoucherModeTotals(ledgerEntries);
    }
  }, [items, ledgerEntries, invoiceMode, additionalLedgerEntries]);

  // Effect hook to recalculate tax rows when items, company/customer details change
  useEffect(() => {
    console.log('SalesInvoicesPage: Recalculating tax rows. items:', items.length, 'companyDetails:', companyDetails, 'customerDetails:', customerDetails);
    calculateTaxRows();
  }, [items, customerDetails, companyDetails]);

  // Fetches master data (customers, items, chart of accounts) from Supabase
  const fetchMasterData = async (companyId: string) => {
    setLoading(true);
    try {
      // Fetch company details
      const { data: compData, error: compError } = await supabase
        .from('companies')
        .select('id, name, country, tax_config, address')
        .eq('id', companyId)
        .single();
      if (compError) throw compError;
      setCompanyDetails(compData);
      console.log('SalesInvoicesPage: Fetched companyDetails:', compData);

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, gstin, billing_address')
        .eq('company_id', companyId);
      if (customersError) throw customersError;
      setCustomers(customersData);
      console.log('SalesInvoicesPage: Fetched customers:', customersData.length);

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id, item_code, item_name, description, standard_rate, tax_rate, hsn_code,
          units_of_measure ( name )
        `)
        .eq('company_id', companyId);
      if (itemsError) throw itemsError;
      setStockItems(itemsData.map(item => ({
        id: item.id,
        name: item.item_name,
        item_code: item.item_code,
        description: item.description,
        standard_rate: item.standard_rate,
        tax_rate: item.tax_rate,
        hsn_code: item.hsn_code,
        unit_id: item.units_of_measure?.name || 'Nos'
      })));
      console.log('SalesInvoicesPage: Fetched stockItems:', itemsData.length);

      const { data: accountsData, error: accountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, account_type, account_group, tax_rate')
        .eq('company_id', companyId);
      if (accountsError) throw accountsError;
      setChartOfAccounts(accountsData);
      console.log('SalesInvoicesPage: Fetched chartOfAccounts:', accountsData.length);

      // Filter COA for tax ledgers (e.g., under 'Duties & Taxes Payable')
      const filteredTaxLedgers = accountsData.filter(acc =>
        acc.account_group === 'Duties & Taxes Payable' || acc.account_name.toLowerCase().includes('gst') || acc.account_name.toLowerCase().includes('vat')
      );
      setTaxLedgers(filteredTaxLedgers);
      console.log('SalesInvoicesPage: Filtered taxLedgers:', filteredTaxLedgers.length);

      // Filter COA for other ledgers (excluding tax, income, expense groups for simplicity here)
      const filteredOtherLedgers = accountsData.filter(acc =>
        !['Income', 'Expenses', 'Duties & Taxes Payable'].includes(acc.account_group) && !acc.is_group
      );
      setOtherLedgers(filteredOtherLedgers);
      console.log('SalesInvoicesPage: Filtered otherLedgers:', filteredOtherLedgers.length);

    } catch (err: any) {
      console.error('Error fetching master data:', err);
      setError(`Error fetching master data: ${err.message}`);
    } finally {
      setLoading(false);
      console.log('SalesInvoicesPage: Master data loading complete.');
    }
  };

  // Fetches existing sales invoices from Supabase
  const fetchSalesInvoices = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('sales_invoices')
        .select(`
          id, invoice_no, invoice_date, due_date, status, total_amount, paid_amount, outstanding_amount, created_at,
          customers ( name ), tax_details, other_ledger_entries
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id)
        .order('invoice_date', { ascending: false });

      if (searchTerm) {
        query = query.ilike('invoice_no', `%${searchTerm}%`);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (filterStartDate) {
        query = query.gte('invoice_date', filterStartDate);
      }
      if (filterEndDate) {
        query = query.lte('invoice_date', filterEndDate);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setSalesInvoices(data || []);
      setTotalInvoicesCount(count || 0);
      console.log('SalesInvoicesPage: Fetched sales invoices for list view:', data.length);
    } catch (err: any) {
      setError(`Error fetching invoices: ${err.message}`);
      console.error('Error fetching sales invoices:', err);
    } finally {
      setLoading(false);
      console.log('SalesInvoicesPage: List view loading complete.');
    }
  };

  // Resets the form to its initial state
  const resetForm = () => {
    console.log('SalesInvoicesPage: Resetting form.');
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
      { id: 'ledger-1', accountId: '', accountName: '', amount: 0, notes: '' }
    ]);
    setAdditionalLedgerEntries([
      { id: 'add-ledger-1', accountId: '', accountName: '', amount: 0, notes: '' }
    ]);
    setInvoiceMode('item_mode'); // Default to item mode on reset
    setError(null);
    setSuccessMessage(null);
    setCustomerDetails(null); // Clear customer details
    setTaxRows([]); // Clear tax rows
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
    const totalTax = taxRows.reduce((sum, row) => sum + row.amount, 0);
    const otherLedgerTotal = additionalLedgerEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const totalAmount = subtotal + totalTax + otherLedgerTotal;
    
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

    setLedgerEntries(newLedgerEntries);

    // Dynamic row addition: If the last row is being edited and has data, add a new empty row
    if (index === newLedgerEntries.length - 1 && (newLedgerEntries[index].accountName || newLedgerEntries[index].amount !== 0)) {
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
      amount: 0,
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
    const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0); // Sum of amounts
    
    setInvoice(prev => ({
      ...prev,
      totalAmount: totalAmount,
      subtotal: totalAmount, // Simplified for display in summary
      totalTax: 0, // Tax is handled per ledger entry in this mode
      outstandingAmount: totalAmount - prev.paidAmount
    }));
  };

  // Updates an additional ledger entry (for item mode)
  const updateAdditionalLedgerEntry = (index: number, field: keyof LedgerEntry, value: any) => {
    const newAdditionalLedgerEntries = [...additionalLedgerEntries];
    newAdditionalLedgerEntries[index] = { ...newAdditionalLedgerEntries[index], [field]: value };

    setAdditionalLedgerEntries(newAdditionalLedgerEntries);

    // Dynamic row addition
    if (index === newAdditionalLedgerEntries.length - 1 && (newAdditionalLedgerEntries[index].accountName || newAdditionalLedgerEntries[index].amount !== 0)) {
      addAdditionalLedgerEntry();
    }
  };

  // Adds a new empty additional ledger entry row (for item mode)
  const addAdditionalLedgerEntry = () => {
    setAdditionalLedgerEntries(prev => [...prev, {
      id: `add-ledger-${Date.now()}`,
      accountId: '',
      accountName: '',
      amount: 0,
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
  const handleSaveInvoice = async (e: React.FormEvent, status: 'draft' | 'sent' | 'paid') => {
    e.preventDefault();
    if (!currentCompany?.id || !user?.id) {
      showNotification('Company or user information is missing. Please log in and select a company.', 'error');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const invoiceToSave = {
        company_id: currentCompany.id,
        invoice_no: invoice.invoiceNo,
        customer_id: invoice.customerId,
        invoice_date: invoice.invoiceDate,
        due_date: invoice.dueDate,
        status: status,
        reference_no: invoice.referenceNo,
        terms_and_conditions: invoice.termsAndConditions,
        notes: invoice.notes,
        subtotal: invoice.subtotal,
        total_tax: invoice.totalTax,
        total_amount: invoice.totalAmount,
        paid_amount: status === 'paid' ? invoice.totalAmount : 0,
        outstanding_amount: status === 'paid' ? 0 : invoice.totalAmount,
        created_by: user.id,
        sales_account_id: invoice.salesAccountId,
        tax_details: taxRows, // Store tax rows as JSONB
        other_ledger_entries: additionalLedgerEntries, // Store other ledger entries as JSONB
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
        salesInvoiceId = data[0].id;
        showNotification('Invoice updated successfully!', 'success');
      } else {
        // Insert new invoice
        const { data, error } = await supabase
          .from('sales_invoices')
          .insert(invoiceToSave)
          .select();
        if (error) throw error;
        salesInvoiceId = data[0].id;
        showNotification('Invoice created successfully!', 'success');
      }

      // Handle invoice items (if in item_mode)
      if (invoiceMode === 'item_mode' && salesInvoiceId) {
        // Delete existing items for this invoice first (simpler for now)
        await supabase.from('sales_invoice_items').delete().eq('invoice_id', salesInvoiceId);

        const itemsToSave = items.filter(item => item.itemName).map(item => ({
          ...item,
          invoice_id: salesInvoiceId,
          item_id: item.itemId, // Save itemId
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
  const handleEditInvoice = (inv: SalesInvoice) => {
    console.log('SalesInvoicesPage: Editing invoice:', inv);
    setInvoice({
      id: inv.id,
      invoiceNo: inv.invoice_no,
      customerId: inv.customer_id || '',
      customerName: inv.customers?.name || 'N/A', // You might need to fetch customer name
      customerGSTIN: '', // Needs to be fetched from customer master
      invoiceDate: inv.invoice_date,
      dueDate: inv.due_date || '',
      placeOfSupply: '', // Needs to be fetched from customer master
      referenceNo: inv.reference_no || '',
      termsAndConditions: inv.terms_and_conditions || '',
      notes: inv.notes || '',
      status: inv.status,
      subtotal: inv.subtotal || 0,
      totalTax: inv.total_tax || 0,
      totalAmount: inv.total_amount || 0,
      paidAmount: inv.paid_amount || 0,
      outstandingAmount: inv.outstanding_amount || 0,
      salesAccountId: '', // Needs to be fetched from invoice or default
      salesAccountName: '', // Needs to be fetched from invoice or default
    });

    // Fetch customer details to populate GSTIN and Place of Supply
    if (inv.customer_id) {
      supabase.from('customers').select('gstin, billing_address').eq('id', inv.customer_id).single()
        .then(({ data, error }) => {
          if (!error && data) {
            setCustomerDetails(data); // Set customerDetails for tax calculation
            setInvoice(prev => ({
              ...prev,
              customerGSTIN: data.gstin || '',
              placeOfSupply: data.billing_address?.state || '',
            }));
          }
        });
    }

    // Fetch items for this invoice
    supabase.from('sales_invoice_items')
      .select('*')
      .eq('invoice_id', inv.id)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setItems(data.map(item => ({
            id: item.id,
            itemId: item.item_id || '',
            itemCode: item.item_code,
            itemName: item.item_name,
            description: item.description || '',
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount,
            taxRate: item.tax_rate || 0,
            taxAmount: item.tax_amount || 0,
            lineTotal: item.line_total,
            hsnCode: item.hsn_code || '',
          })));
          setInvoiceMode('item_mode');
          // Populate tax rows if available in invoice data
          if (inv.tax_details) {
            setTaxRows(inv.tax_details);
          }
          if (inv.other_ledger_entries) {
            setAdditionalLedgerEntries(inv.other_ledger_entries);
          }
        } else {
          setItems([ // Default to one empty item row if no items found
            { id: 'item-1', itemId: '', itemCode: '', itemName: '', description: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0, taxRate: 18, taxAmount: 0, lineTotal: 0, hsnCode: '' }
          ]);
          // If no items, try to load ledger entries if this was a voucher mode invoice
          // This would require a join with journal_entries/journal_entry_items
          setLedgerEntries([
            { id: 'ledger-1', accountId: '', accountName: '', amount: 0, notes: '' }
          ]);
          setInvoiceMode('voucher_mode'); // Fallback to voucher mode
        }
      });
    setViewMode('create');
  };

  // Handles deleting an invoice
  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // Delete associated items first
      await supabase.from('sales_invoice_items').delete().eq('invoice_id', id);
      
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
  const handleCustomerSelect = (id: string, name: string, additionalData: CustomerOption) => {
    console.log('SalesInvoicesPage: Customer selected:', id, name, additionalData);
    setInvoice(prev => ({
      ...prev,
      customerId: id,
      customerName: name,
      customerGSTIN: additionalData?.gstin || '',
      placeOfSupply: additionalData?.billing_address?.state || '', // Assuming state is place of supply
    }));
    setCustomerDetails(additionalData); // Store full customer details
  };

  // Callback for MasterSelectField when an item is selected
  const handleItemSelect = (index: number, id: string, name: string, additionalData: ItemOption) => {
    console.log('SalesInvoicesPage: Item selected:', id, name, additionalData);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      itemId: id, // Set itemId
      itemName: name,
      itemCode: additionalData?.item_code || '',
      description: additionalData?.description || '',
      rate: additionalData?.standard_rate || 0,
      taxRate: additionalData?.tax_rate || 0,
      unit: additionalData?.unit_id || 'Nos', // Use unit_id from ItemOption
      hsnCode: additionalData?.hsn_code || '',
    };
    setItems(newItems);
    calculateInvoiceTotals(newItems);
  };

  // Callback for MasterSelectField when a ledger account is selected (for voucher mode and additional ledgers)
  const handleLedgerSelect = (index: number, id: string, name: string, additionalData: AccountOption, isAdditional: boolean = false) => {
    console.log('SalesInvoicesPage: Ledger selected:', id, name, additionalData, 'isAdditional:', isAdditional);
    if (isAdditional) {
      const newAdditionalLedgerEntries = [...additionalLedgerEntries];
      newAdditionalLedgerEntries[index] = {
        ...newAdditionalLedgerEntries[index],
        accountId: id,
        accountName: name,
        notes: '', // Clear notes for new selection
        amount: 0, // Reset amount for new selection
      };
      setAdditionalLedgerEntries(newAdditionalLedgerEntries);
    } else {
      const newLedgerEntries = [...ledgerEntries];
      newLedgerEntries[index] = {
        ...newLedgerEntries[index],
        accountId: id, // Set accountId
        accountName: name,
        notes: '', // Clear notes for new selection
        amount: 0, // Reset amount for new selection
      };
      setLedgerEntries(newLedgerEntries);
    }
  };

  // Callback for MasterSelectField for Sales Account
  const handleSalesAccountSelect = (id: string, name: string, additionalData: any) => {
    console.log('SalesInvoicesPage: Sales Account selected:', id, name);
    setInvoice(prev => ({
      ...prev,
      salesAccountId: id,
      salesAccountName: name,
    }));
  };

  // Determines and returns default tax ledgers based on company's tax configuration
  const calculateTaxRows = () => {
    console.log('SalesInvoicesPage: Calculating tax rows...');
    if (!companyDetails || !customerDetails || !chartOfAccounts.length) {
      console.log('SalesInvoicesPage: Skipping tax row calculation due to missing details.');
      setTaxRows([]);
      return;
    }

    const totalTaxableAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const companyState = companyDetails.address?.state;
    const customerState = customerDetails.billing_address?.state;
    const taxConfigType = companyDetails.tax_config?.type;

    let newTaxRows: { id: string; accountId: string; accountName: string; percentage: number; amount: number }[] = [];

    if (taxConfigType === 'GST' && companyState && customerState) {
      // Sum tax amounts from items for each tax rate
      const taxRatesMap = new Map<number, number>(); // Map<taxRate, totalTaxAmountForRate>
      items.forEach(item => {
        if (item.taxRate && item.taxAmount) {
          taxRatesMap.set(item.taxRate, (taxRatesMap.get(item.taxRate) || 0) + item.taxAmount);
        }
      });

      taxRatesMap.forEach((totalTaxAmountForRate, rate) => {
        if (companyState === customerState) {
          // Intra-state: CGST and SGST
          const cgstAccount = taxLedgers.find(acc => acc.account_name.toLowerCase().includes('cgst'));
          const sgstAccount = taxLedgers.find(acc => acc.account_name.toLowerCase().includes('sgst'));

          if (cgstAccount) {
            newTaxRows.push({
              id: `cgst-${cgstAccount.id}-${rate}`,
              accountId: cgstAccount.id,
              accountName: cgstAccount.account_name,
              percentage: rate / 2,
              amount: totalTaxAmountForRate / 2,
            });
          }
          if (sgstAccount) {
            newTaxRows.push({
              id: `sgst-${sgstAccount.id}-${rate}`,
              accountId: sgstAccount.id,
              accountName: sgstAccount.account_name,
              percentage: rate / 2,
              amount: totalTaxAmountForRate / 2,
            });
          }
        } else {
          // Inter-state: IGST
          const igstAccount = taxLedgers.find(acc => acc.account_name.toLowerCase().includes('igst'));

          if (igstAccount) {
            newTaxRows.push({
              id: `igst-${igstAccount.id}-${rate}`,
              accountId: igstAccount.id,
              accountName: igstAccount.account_name,
              percentage: rate,
              amount: totalTaxAmountForRate,
            });
          }
        }
      });
    } else if (taxConfigType === 'VAT' || taxConfigType === 'Sales Tax') {
      // For VAT/Sales Tax, assume a single tax row based on total taxable amount
      const defaultTaxRate = companyDetails.tax_config?.rates?.[0] || 5; // Use first rate or default to 5%
      const taxAmount = (totalTaxableAmount * defaultTaxRate) / 100;
      const salesTaxAccount = taxLedgers.find(acc => acc.account_name.toLowerCase().includes('sales tax') || acc.account_name.toLowerCase().includes('vat'));

      if (salesTaxAccount) {
        newTaxRows.push({
          id: `vat_sales_tax-${salesTaxAccount.id}`,
          accountId: salesTaxAccount.id,
          accountName: salesTaxAccount.account_name,
          percentage: defaultTaxRate,
          amount: taxAmount,
        });
      }
    }
    setTaxRows(newTaxRows);
    console.log('SalesInvoicesPage: Calculated taxRows:', newTaxRows);
  };

  const updateTaxRow = (index: number, field: keyof typeof taxRows[0], value: any) => {
    const newTaxRows = [...taxRows];
    newTaxRows[index] = { ...newTaxRows[index], [field]: value };
    // Recalculate amount if percentage changes
    if (field === 'percentage') {
      const totalTaxableAmount = items.reduce((sum, item) => sum + item.amount, 0);
      newTaxRows[index].amount = (totalTaxableAmount * newTaxRows[index].percentage) / 100;
    }
    setTaxRows(newTaxRows);
  };

  const handleSearch = () => {
    fetchSalesInvoices();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-purple-100 text-purple-800';
      case 'credit_note': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currentCompany?.currency || 'INR'
    }).format(amount);
  };

  const getStatesForCountry = (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    return country ? country.states.map(s => ({ id: s.code, name: s.name })) : [];
  };

  // Main render logic
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
            // Button to switch to create mode
            <Button icon={<Plus size={16} />} onClick={() => { 
              alert("DEBUG: Create New Invoice button clicked!"); // ADD THIS LINE
              console.log("DEBUG: 'Create New Invoice' button clicked from list. Setting viewMode to 'create' and resetting form.");
              setViewMode('create'); 
              resetForm(); 
            }}>Create New Invoice</Button>
          ) : (
            // Button to switch back to list mode
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
          {loading ? ( // Explicit loading check for the form
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
              <p className="ml-4 text-gray-500">Loading form data...</p>
            </div>
          ) : (
            // Check if essential master data is available before rendering the full form
            // ADDED CONSOLE LOG HERE for debugging
            console.log("SalesInvoicesPage: Rendering create form. Customers loaded:", customers.length > 0, "Items loaded:", stockItems.length > 0, "Accounts loaded:", chartOfAccounts.length > 0),
            customers.length === 0 || stockItems.length === 0 || chartOfAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 bg-red-100 border-4 border-red-500 rounded-lg p-8 text-center"> {/* MADE MORE PROMINENT */}
                <AlertTriangle size={48} className="text-red-700 mb-4" />
                <p className="text-xl font-bold text-red-800 mb-2">Critical Data Missing!</p>
                <p className="text-lg text-red-700">Essential form data (customers, items, accounts) could not be loaded.</p>
                <p className="text-md text-red-600 mt-2">Please ensure your company is selected and try refreshing the page.</p>
                <Button onClick={() => fetchMasterData(currentCompany?.id || '')} className="mt-4">Retry Loading Data</Button> {/* ADDED RETRY BUTTON */}
              </div>
            ) : (
              // Render the actual form
              <>
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

                <form onSubmit={(e) => handleSaveInvoice(e, invoice.status as 'draft' | 'sent' | 'paid')} className="space-y-6">
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
                        required
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
                      <MasterSelectField
                        label="Place of Supply (State)"
                        value={invoice.placeOfSupply}
                        onValueChange={(value) => handleInvoiceChange('placeOfSupply', value)}
                        onSelect={(id, name) => handleInvoiceChange('placeOfSupply', name)} // Select full state name
                        options={getStatesForCountry(customerDetails?.billing_address?.country || companyDetails?.country || 'IN')}
                        placeholder="Select State"
                        required
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
                      options={chartOfAccounts.filter(acc => acc.account_type === 'income')} // Filter for income accounts
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
                              <div className="grid grid-cols-invoice-item-row gap-2 items-end">
                                <div className="col-span-2">
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
                                    label="HSN/SAC"
                                    value={item.hsnCode}
                                    onChange={(value) => updateItem(index, 'hsnCode', value)}
                                    placeholder="Code"
                                  />
                                </div>
                                <div>
                                  <FormField
                                    label="Qty"
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
                                <div className="flex items-end justify-end">
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
                      {taxRows.length > 0 && ( // Only show if tax is enabled and ledgers are found
                        <Card className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className={`text-md font-semibold ${theme.textPrimary}`}>Tax Details</h4>
                          </div>
                          <div className="space-y-4">
                            {taxRows.map((taxRow, index) => (
                              <div key={taxRow.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>Tax Ledger</label>
                                    <MasterSelectField
                                      label="" // Hidden label
                                      value={taxRow.accountName}
                                      onValueChange={(val) => updateTaxRow(index, 'accountName', val)}
                                      onSelect={(id, name) => updateTaxRow(index, 'accountId', id)}
                                      options={taxLedgers}
                                      placeholder="Select Tax Ledger"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <FormField
                                      label="Percentage (%)"
                                      type="number"
                                      value={taxRow.percentage.toString()}
                                      onChange={(val) => updateTaxRow(index, 'percentage', parseFloat(val) || 0)}
                                      icon={<Percent size={18} />}
                                    />
                                  </div>
                                  <div>
                                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>Amount</label>
                                    <div className={`px-3 py-2 ${theme.inputBg} border ${theme.borderColor} rounded-lg`}>
                                      ₹{taxRow.amount.toLocaleString()}
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
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                  <MasterSelectField
                                    label="Account Name"
                                    value={entry.accountName}
                                    onValueChange={(val) => updateAdditionalLedgerEntry(index, 'accountName', val)}
                                    onSelect={(id, name, data) => handleLedgerSelect(index, id, name, data, true)} // Pass true for additional
                                    options={otherLedgers}
                                    placeholder="Select account"
                                    required
                                  />
                                </div>
                                <div>
                                  <FormField
                                    label="Amount"
                                    type="number"
                                    value={entry.amount.toString()}
                                    onChange={(val) => updateAdditionalLedgerEntry(index, 'amount', parseFloat(val) || 0)}
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                  label="Amount"
                                  type="number"
                                  value={entry.amount.toString()}
                                  onChange={(val) => updateLedgerEntry(index, 'amount', parseFloat(val) || 0)}
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
                              <span className={theme.textMuted}>Total Amount:</span>
                              <span className={theme.textPrimary}>₹{invoice.totalAmount.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                        <hr className={theme.borderColor} />
                        <div className="flex justify-between text-lg font-semibold">
                          <span className={theme.textPrimary}>Grand Total:</span>
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
              </>
            )
          )}
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Invoices List</h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="relative flex-grow">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className={`
                  w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              />
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`
                  px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
                <option value="credit_note">Credit Note</option>
              </select>
              <FormField
                label="" // Hidden label
                type="date"
                value={filterStartDate}
                onChange={setFilterStartDate}
                className="w-auto"
                placeholder="Start Date"
              />
              <FormField
                label="" // Hidden label
                type="date"
                value={filterEndDate}
                onChange={setFilterEndDate}
                className="w-auto"
                placeholder="End Date"
              />
              <Button onClick={handleSearch} disabled={loading} icon={<Filter size={16} />}>
                Filter
              </Button>
              <Button onClick={fetchSalesInvoices} disabled={loading} icon={<RefreshCw size={16} />}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoice_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.customers?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.invoice_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.due_date || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(invoice.total_amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(invoice.outstanding_amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleEditInvoice(invoice)} title="Edit">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice(invoice.id)} className="text-red-600 hover:text-red-800" title="Delete">
                          <Trash2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" title="Send">
                          <Send size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" title="Download">
                          <Download size={16} />
                        </Button>
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