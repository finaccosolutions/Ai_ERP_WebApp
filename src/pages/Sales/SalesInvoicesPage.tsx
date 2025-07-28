// src/pages/Sales/SalesInvoicesPage.tsx
import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { Plus, FileText, Search, Calendar, Users, DollarSign, List, Save, Send, Trash2, Calculator, ArrowLeft, AlertTriangle, Percent } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { COUNTRIES, getCountryByCode, getStateByCode } from '../../constants/geoData';
import ConfirmationModal from '../../components/UI/ConfirmationModal';

// Interface for Invoice Items
interface InvoiceItem {
  id: string;
  itemId: string; // Stores the UUID of the selected item from the 'items' table
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string; // Display unit next to Qty
  rate: number;
  discountValue: number; // Single field for discount
  discountType: 'percentage' | 'amount'; // Type of discount (used for calculation, not stored directly)
  amount: number; // Amount after discount, before tax
  taxRate: number;
  taxAmount: number;
  lineTotal: number; // Total after discount and tax
}

// Interface for Ledger Entries (for Other Ledger Entries)
interface LedgerEntry {
  id: string;
  accountId: string; // Stores the UUID of the selected account from 'chart_of_accounts'
  accountName: string;
  amount: number; // Positive for debit, negative for credit
  notes: string;
}

// Interface for Tax Rows
interface TaxRow {
  id: string;
  accountId: string;
  accountName: string;
  percentage: number;
  amount: number;
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

function SalesInvoicesPage() {
  const { theme } = useTheme();
  const { suggestWithAI, createVoucherFromText } = useAI();
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [invoice, setInvoice] = useState({
    id: '',
    invoiceNo: '',
    customerId: '',
    customerName: '',
    customerGSTIN: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '', // Made optional
    placeOfSupply: '', // Full state name
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
      itemId: '',
      itemCode: '',
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      discountValue: 0, // Initial value for the single discount field
      discountType: 'percentage', // Default discount type
      amount: 0,
      taxRate: 18,
      taxAmount: 0,
      lineTotal: 0,
    }
  ]);

  const [additionalLedgerEntries, setAdditionalLedgerEntries] = useState<LedgerEntry[]>([
    { id: 'add-ledger-1', accountId: '', accountName: '', amount: 0, notes: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Master data for dropdowns
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [stockItems, setStockItems] = useState<ItemOption[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<AccountOption[]>([]);
  const [taxLedgers, setTaxLedgers] = useState<AccountOption[]>([]);
  const [otherLedgers, setOtherLedgers] = useState<AccountOption[]>([]);
  const [availableUnits, setAvailableUnits] = useState<{ id: string; name: string }[]>([]);

  const [companyDetails, setCompanyDetails] = useState<any | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerOption | null>(null);

  const [taxRows, setTaxRows] = useState<TaxRow[]>([]);

  const isEditMode = !!id;
  const isViewMode = location.pathname.includes('/view/');

  // State for confirmation modal for master creation
  const [showMasterConfirmModal, setShowMasterConfirmModal] = useState(false);
  const [pendingMasterCreation, setPendingMasterCreation] = useState<{ type: 'customer' | 'item' | 'account'; value: string; fieldIndex?: number; } | null>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchMasterData(currentCompany.id);
      if (isEditMode) {
        fetchInvoiceData(id as string);
      } else {
        resetForm();
      }
    }
  }, [currentCompany?.id, id, isEditMode]);

  useEffect(() => {
    // Handle return from master creation pages
    if (location.state?.fromInvoiceCreation) {
      const { createdId, createdName, masterType, fieldIndex } = location.state;
      // Restore form state from session storage
      const savedFormState = sessionStorage.getItem('invoiceFormState');
      if (savedFormState) {
        const { invoice: savedInvoice, items: savedItems, additionalLedgerEntries: savedAdditionalLedgerEntries } = JSON.parse(savedFormState);
        setInvoice(savedInvoice);
        setItems(savedItems);
        setAdditionalLedgerEntries(savedAdditionalLedgerEntries);
        sessionStorage.removeItem('invoiceFormState');
      }

      if (createdId && createdName && masterType) {
        if (masterType === 'customer') {
          // Find the newly created customer in the updated list
          const newCustomer = customers.find(c => c.id === createdId);
          if (newCustomer) {
            handleCustomerSelect(newCustomer.id, newCustomer.name, newCustomer);
            showNotification(`Customer "${newCustomer.name}" created and selected!`, 'success');
          }
        } else if (masterType === 'item' && fieldIndex !== undefined) {
          const newItemOption = stockItems.find(item => item.id === createdId);
          if (newItemOption) {
            updateItem(fieldIndex, 'itemId', createdId);
            updateItem(fieldIndex, 'itemName', createdName);
            updateItem(fieldIndex, 'itemCode', newItemOption.item_code);
            updateItem(fieldIndex, 'description', newItemOption.description);
            updateItem(fieldIndex, 'quantity', 1);
            updateItem(fieldIndex, 'unit', newItemOption.units_of_measure?.name || 'Nos');
            updateItem(fieldIndex, 'rate', newItemOption.standard_rate);
            updateItem(fieldIndex, 'taxRate', newItemOption.tax_rate);
            showNotification(`Item "${newItemOption.item_name}" created and selected!`, 'success');
          }
        } else if (masterType === 'account' && fieldIndex !== undefined) {
          const newAccountOption = chartOfAccounts.find(acc => acc.id === createdId);
          if (newAccountOption) {
            updateAdditionalLedgerEntry(fieldIndex, 'accountId', createdId);
            updateAdditionalLedgerEntry(fieldIndex, 'accountName', createdName);
            showNotification(`Account "${newAccountOption.account_name}" created and selected!`, 'success');
          }
        }
      }
      // Clear the state to prevent re-triggering on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, customers, stockItems, chartOfAccounts]); // Add dependencies for master data

  useEffect(() => {
    calculateInvoiceTotals(items);
  }, [items, additionalLedgerEntries, taxRows]);

  useEffect(() => {
    calculateTaxRows();
  }, [items, customerDetails, companyDetails]);

  const fetchMasterData = async (companyId: string) => {
    setLoading(true);
    try {
      const { data: compData, error: compError } = await supabase
        .from('companies')
        .select('id, name, country, tax_config, address')
        .eq('id', companyId)
        .single();
      if (compError) throw compError;
      setCompanyDetails(compData);

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, gstin, billing_address')
        .eq('company_id', companyId);
      if (customersError) throw customersError;
      setCustomers(customersData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id, item_code, item_name, description, standard_rate, tax_rate, hsn_code,
          units_of_measure ( name )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true);
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

      const { data: unitsData, error: unitsError } = await supabase
        .from('units_of_measure')
        .select('id, name')
        .or(`company_id.eq.${companyId},is_system_defined.eq.true`);
      if (unitsError) throw unitsError;
      setAvailableUnits(unitsData);

      const { data: accountsData, error: accountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, account_type, account_group, tax_rate')
        .eq('company_id', companyId);
      if (accountsError) throw accountsError;
      setChartOfAccounts(accountsData);

      const filteredTaxLedgers = accountsData.filter(acc =>
        acc.account_group === 'Duties & Taxes Payable' || acc.account_name.toLowerCase().includes('gst') || acc.account_name.toLowerCase().includes('vat')
      );
      setTaxLedgers(filteredTaxLedgers);

      const filteredOtherLedgers = accountsData.filter(acc =>
        !['Income', 'Expenses', 'Duties & Taxes Payable'].includes(acc.account_group) && !acc.is_group
      );
      setOtherLedgers(filteredOtherLedgers);

    } catch (err: any) {
      console.error('Error fetching master data:', err);
      setError(`Error fetching master data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceData = async (invoiceId: string) => {
    setLoading(true);
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('sales_invoices')
        .select(`
          *,
          customers ( name, gstin, billing_address )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      setInvoice({
        id: invoiceData.id,
        invoiceNo: invoiceData.invoice_no,
        customerId: invoiceData.customer_id,
        customerName: invoiceData.customers?.name || '',
        customerGSTIN: invoiceData.customers?.gstin || '',
        invoiceDate: invoiceData.invoice_date,
        dueDate: invoiceData.due_date || '',
        placeOfSupply: invoiceData.customers?.billing_address?.state ? getStateByCode(invoiceData.customers.billing_address.country || '', invoiceData.customers.billing_address.state)?.name || '' : '',
        referenceNo: invoiceData.reference_no || '',
        termsAndConditions: invoiceData.terms_and_conditions || '',
        notes: invoiceData.notes || '',
        status: invoiceData.status,
        subtotal: invoiceData.subtotal,
        totalTax: invoiceData.total_tax,
        totalAmount: invoiceData.total_amount,
        paidAmount: invoiceData.paid_amount || 0,
        outstandingAmount: invoiceData.outstanding_amount || 0,
      });

      setCustomerDetails(invoiceData.customers);

      const { data: itemsData, error: itemsError } = await supabase
        .from('sales_invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (itemsError) throw itemsError;

      if (itemsData && itemsData.length > 0) {
        setItems(itemsData.map(item => ({
          id: item.id,
          itemId: item.item_id || '',
          itemCode: item.item_code,
          itemName: item.item_name,
          description: item.description || '',
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discountValue: item.discount_amount || 0, // Populate discountValue from discount_amount
          discountType: 'amount', // Assume 'amount' type when loading from DB
          amount: item.amount,
          taxRate: item.tax_rate || 0,
          taxAmount: item.tax_amount || 0,
          lineTotal: item.line_total,
        })));
      } else {
        setItems([
          {
            id: 'item-1', itemId: '', itemCode: '', itemName: '', description: '', quantity: 1, unit: 'Nos', rate: 0,
            discountValue: 0, discountType: 'percentage', amount: 0, taxRate: 18, taxAmount: 0, lineTotal: 0,
          }
        ]);
      }

      if (invoiceData.tax_details) {
        setTaxRows(invoiceData.tax_details);
      }
      if (invoiceData.other_ledger_entries) {
        setAdditionalLedgerEntries(invoiceData.other_ledger_entries);
      }

    } catch (err: any) {
      showNotification(`Error fetching invoice: ${err.message}`, 'error');
      console.error('Error fetching invoice:', err);
      navigate('/sales/invoices');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setInvoice({
      id: '', invoiceNo: '', customerId: '', customerName: '', customerGSTIN: '',
      invoiceDate: new Date().toISOString().split('T')[0], dueDate: '', placeOfSupply: '',
      referenceNo: '', termsAndConditions: '', notes: '', status: 'draft',
      subtotal: 0, totalTax: 0, totalAmount: 0, paidAmount: 0, outstandingAmount: 0,
    });
    setItems([
      {
        id: 'item-1', itemId: '', itemCode: '', itemName: '', description: '', quantity: 1, unit: 'Nos', rate: 0,
        discountValue: 0, discountType: 'percentage', amount: 0, taxRate: 18, taxAmount: 0, lineTotal: 0,
      }
    ]);
    setAdditionalLedgerEntries([
      { id: 'add-ledger-1', accountId: '', accountName: '', amount: 0, notes: '' }
    ]);
    setError(null);
    setSuccessMessage(null);
    setCustomerDetails(null);
    setTaxRows([]);
  };

  const calculateItemTotals = (item: InvoiceItem) => {
    const grossAmount = item.quantity * item.rate;
    let amountAfterDiscount = grossAmount;
    let discountAmount = 0;

    // Assuming discountValue is always a percentage for now
    discountAmount = (grossAmount * item.discountValue) / 100;
    amountAfterDiscount = grossAmount - discountAmount;
    
    const taxAmount = (amountAfterDiscount * item.taxRate) / 100;
    const lineTotal = amountAfterDiscount + taxAmount;
    
    return {
      ...item,
      amount: isNaN(amountAfterDiscount) ? 0 : amountAfterDiscount,
      taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
      lineTotal: isNaN(lineTotal) ? 0 : lineTotal,
    };
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate totals for this item
    newItems[index] = calculateItemTotals(newItems[index]);
    
    setItems(newItems);

    if (index === newItems.length - 1 && (newItems[index].itemName || newItems[index].quantity > 0 || newItems[index].rate > 0 || newItems[index].discountValue > 0) && !isViewMode) {
      addItem();
    }
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: `item-${Date.now()}`, itemId: '', itemCode: '', itemName: '', description: '', quantity: 1, unit: 'Nos', rate: 0,
      discountValue: 0, discountType: 'percentage', amount: 0, taxRate: 18, taxAmount: 0, lineTotal: 0,
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

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
      outstandingAmount: totalAmount - prev.paidAmount
    }));
  };

  const updateAdditionalLedgerEntry = (index: number, field: keyof LedgerEntry, value: any) => {
    const newAdditionalLedgerEntries = [...additionalLedgerEntries];
    newAdditionalLedgerEntries[index] = { ...newAdditionalLedgerEntries[index], [field]: value };

    setAdditionalLedgerEntries(newAdditionalLedgerEntries);

    if (index === newAdditionalLedgerEntries.length - 1 && (newAdditionalLedgerEntries[index].accountName || newAdditionalLedgerEntries[index].amount !== 0) && !isViewMode) {
      addAdditionalLedgerEntry();
    }
  };

  const addAdditionalLedgerEntry = () => {
    setAdditionalLedgerEntries(prev => [...prev, {
      id: `add-ledger-${Date.now()}`, accountId: '', accountName: '', amount: 0, notes: ''
    }]);
  };

  const removeAdditionalLedgerEntry = (index: number) => {
    if (additionalLedgerEntries.length > 1) {
      setAdditionalLedgerEntries(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleInvoiceChange = (field: keyof typeof invoice, value: any) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveInvoice = async (e: React.FormEvent, status: 'draft' | 'sent' | 'paid') => {
    e.preventDefault();
    if (!currentCompany?.id || !user?.id) {
      showNotification('Company or user information is missing. Please log in and select a company.', 'error');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const invoiceToSave = {
        company_id: currentCompany.id,
        invoice_no: invoice.invoiceNo,
        customer_id: invoice.customerId,
        invoice_date: invoice.invoiceDate,
        due_date: invoice.dueDate || null, // Due date is now optional
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
        tax_details: taxRows,
        other_ledger_entries: additionalLedgerEntries,
      };

      let salesInvoiceId = invoice.id;
      if (invoice.id) {
        const { data, error } = await supabase
          .from('sales_invoices')
          .update(invoiceToSave)
          .eq('id', invoice.id)
          .select();
        if (error) throw error;
        salesInvoiceId = data[0].id;
        showNotification('Invoice updated successfully!', 'success');
      } else {
        const { data, error } = await supabase
          .from('sales_invoices')
          .insert(invoiceToSave)
          .select();
        if (error) throw error;
        salesInvoiceId = data[0].id;
        showNotification('Invoice created successfully!', 'success');
      }

      if (salesInvoiceId) {
        await supabase.from('sales_invoice_items').delete().eq('invoice_id', salesInvoiceId);

        const itemsToSave = items.filter(item => item.itemName).map(item => ({
          ...item,
          invoice_id: salesInvoiceId,
          item_id: item.itemId,
          item_code: item.itemCode,
          item_name: item.itemName,
          tax_rate: item.taxRate,
          tax_amount: item.taxAmount,
          line_total: item.lineTotal,
          discount_amount: item.discountType === 'amount' ? item.discountValue : (item.quantity * item.rate * item.discountValue / 100), // Save calculated discount amount
        }));
        const { error: itemsError } = await supabase.from('sales_invoice_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }

      resetForm();
      navigate('/sales/invoices');
    } catch (err: any) {
      setError(`Failed to save invoice: ${err.message}`);
      showNotification(`Failed to save invoice: ${err.message}`, 'error');
      console.error('Save invoice error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (id: string, name: string, additionalData: CustomerOption) => {
    setInvoice(prev => ({
      ...prev,
      customerId: id,
      customerName: name,
      customerGSTIN: additionalData?.gstin || '',
      placeOfSupply: additionalData?.billing_address?.state ? getStateByCode(additionalData.billing_address.country || '', additionalData.billing_address.state)?.name || '' : '',
    }));
    setCustomerDetails(additionalData);
  };

  const handleItemSelect = (index: number, id: string, name: string, additionalData: ItemOption) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      itemId: id,
      itemName: name,
      itemCode: additionalData?.item_code || '',
      description: additionalData?.description || '',
      rate: additionalData?.standard_rate || 0,
      taxRate: additionalData?.tax_rate || 0,
      unit: additionalData?.units_of_measure?.name || 'Nos',
    };
    setItems(newItems);
  };

  const handleLedgerSelect = (index: number, id: string, name: string, additionalData: AccountOption, isAdditional: boolean = false) => {
    if (isAdditional) {
      const newAdditionalLedgerEntries = [...additionalLedgerEntries];
      newAdditionalLedgerEntries[index] = {
        ...newAdditionalLedgerEntries[index],
        accountId: id,
        accountName: name,
        notes: '',
        amount: 0,
      };
      setAdditionalLedgerEntries(newAdditionalLedgerEntries);
    }
  };

  const handleVoiceToInvoice = async () => {
    try {
      const mockVoiceInput = "Create invoice for 5 units of Product A to ABC Corp for 12000 on 2024-07-20";
      const result = await createVoucherFromText(mockVoiceInput);

      if (result) {
        setInvoice(prev => ({
          ...prev,
          customerName: result.party || prev.customerName,
          totalAmount: result.amount || prev.totalAmount,
          invoiceDate: result.date || prev.invoiceDate,
          notes: result.narration || prev.notes,
        }));
        showNotification('Invoice data populated from voice command!', 'info');
      }
    } catch (error) {
      showNotification('Failed to process voice command for invoice.', 'error');
      console.error('Voice to invoice error:', error);
    }
  };

  const calculateTaxRows = () => {
    if (!companyDetails || !customerDetails || !chartOfAccounts.length) {
      setTaxRows([]);
      return;
    }

    const totalTaxableAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const companyStateCode = companyDetails.address?.state;
    const customerStateCode = customerDetails.billing_address?.state;
    const taxConfigType = companyDetails.tax_config?.type;

    let newTaxRows: TaxRow[] = [];

    if (taxConfigType === 'GST' && companyStateCode && customerStateCode) {
      const taxRatesMap = new Map<number, number>();
      items.forEach(item => {
        if (item.taxRate && item.taxAmount) {
          taxRatesMap.set(item.taxRate, (taxRatesMap.get(item.taxRate) || 0) + item.taxAmount);
        }
      });

      taxRatesMap.forEach((totalTaxAmountForRate, rate) => {
        if (companyStateCode === customerStateCode) {
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
      const defaultTaxRate = companyDetails.tax_config?.rates?.[0] || 5;
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
  };

  const updateTaxRow = (index: number, field: keyof TaxRow, value: any) => {
    const newTaxRows = [...taxRows];
    newTaxRows[index] = { ...newTaxRows[index], [field]: value };
    if (field === 'percentage') {
      const totalTaxableAmount = items.reduce((sum, item) => sum + item.amount, 0);
      newTaxRows[index].amount = (totalTaxableAmount * newTaxRows[index].percentage) / 100;
    }
    setTaxRows(newTaxRows);
  };

  const getStatesForCountry = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    return country ? country.states.map(s => ({ id: s.code, name: s.name })) : [];
  };

  const handleNewMasterCreation = (newValue: string, masterType: 'customer' | 'item' | 'account', fieldIndex?: number) => {
    // Store current form state in session storage before navigating
    sessionStorage.setItem('invoiceFormState', JSON.stringify({ invoice, items, additionalLedgerEntries }));

    let navigatePath = '';
    switch (masterType) {
      case 'customer': navigatePath = '/sales/customers/new'; break;
      case 'item': navigatePath = '/inventory/masters/items/new'; break;
      case 'account': navigatePath = '/accounting/masters/ledgers/new'; break;
      default: showNotification('Unknown master type for creation.', 'error'); return;
    }

    navigate(navigatePath, {
      state: {
        initialName: newValue,
        returnPath: location.pathname,
        fromInvoiceCreation: true,
        masterType: masterType,
        fieldIndex: fieldIndex // Pass index for item/account
      }
    });
  };

  const handleConfirmMasterCreation = () => {
    if (pendingMasterCreation) {
      handleNewMasterCreation(pendingMasterCreation.value, pendingMasterCreation.type, pendingMasterCreation.fieldIndex);
      setShowMasterConfirmModal(false);
      setPendingMasterCreation(null);
    }
  };

  const handleMasterSelectFieldNewValue = (newValue: string, masterType: 'customer' | 'item' | 'account', fieldIndex?: number) => {
    setPendingMasterCreation({ type: masterType, value: newValue, fieldIndex: fieldIndex });
    setShowMasterConfirmModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {isViewMode ? 'View Sales Invoice' : (isEditMode ? 'Edit Sales Invoice' : 'Create Sales Invoice')}
          </h1>
          <p className={theme.textSecondary}>
            {isViewMode ? 'Review invoice details.' : (isEditMode ? 'Update invoice information.' : 'Generate a new sales invoice.')}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/sales/invoices')} icon={<ArrowLeft size={16} />}>
          Back to Invoices List
        </Button>
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

      <Card className="p-6">
        {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
              <p className="ml-4 text-gray-500">Loading form data...</p>
            </div>
          ) : ( 
            <>
                <div className="flex justify-end items-center mb-4">
                  <div className="flex space-x-2">
                    <AIButton variant="voice" onSuggest={handleVoiceToInvoice} />
                    <AIButton variant="suggest" onSuggest={() => console.log('AI Invoice Suggestions')} />
                  </div>
                </div>

                <form onSubmit={(e) => handleSaveInvoice(e, invoice.status as 'draft' | 'sent' | 'paid')} className="space-y-6">
                  {/* Basic Information */}
                  <Card className="p-6">
                    <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Invoice Number"
                        value={invoice.invoiceNo}
                        onChange={(value) => handleInvoiceChange('invoiceNo', value)}
                        placeholder="Auto-generated or manual"
                        required
                        readOnly={isViewMode}
                      />
                      <FormField
                        label="Invoice Date"
                        type="date"
                        value={invoice.invoiceDate}
                        onChange={(value) => handleInvoiceChange('invoiceDate', value)}
                        required
                        readOnly={isViewMode}
                      />
                      <FormField
                        label="Due Date"
                        type="date"
                        value={invoice.dueDate}
                        onChange={(value) => handleInvoiceChange('dueDate', value)}
                        // Removed required attribute
                        readOnly={isViewMode}
                      />
                      <FormField
                        label="Reference No."
                        value={invoice.referenceNo}
                        onChange={(value) => handleInvoiceChange('referenceNo', value)}
                        placeholder="PO Number, etc."
                        readOnly={isViewMode}
                      />
                    </div>
                  </Card>

                  {/* Customer Information */}
                  <Card className="p-6">
                    <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MasterSelectField
                        label="Customer Name"
                        value={invoice.customerName}
                        onValueChange={(val) => handleInvoiceChange('customerName', val)}
                        onSelect={handleCustomerSelect}
                        options={customers}
                        placeholder="Start typing customer name..."
                        required
                        aiHelper={true}
                        context="sales_invoice_customer_selection"
                        readOnly={isViewMode}
                        allowCreation={true}
                        onNewValueConfirmed={(val) => handleMasterSelectFieldNewValue(val, 'customer')}
                      />
                      <FormField
                        label="Customer GSTIN"
                        value={invoice.customerGSTIN}
                        onChange={(value) => handleInvoiceChange('customerGSTIN', value)}
                        placeholder="22AAAAA0000A1Z5"
                        readOnly
                      />
                      <MasterSelectField
                        label="Place of Supply (State)"
                        value={invoice.placeOfSupply}
                        onValueChange={(val) => handleInvoiceChange('placeOfSupply', val)}
                        onSelect={(id, name) => handleInvoiceChange('placeOfSupply', name)}
                        options={getStatesForCountry(customerDetails?.billing_address?.country || currentCompany?.country || 'IN')}
                        placeholder="Select State"
                        required
                        readOnly={isViewMode}
                      />
                      <FormField
                        label="Sales Order ID (Optional)"
                        value={invoice.referenceNo} // Using referenceNo for sales order ID
                        onChange={(val) => handleInvoiceChange('referenceNo', val)}
                        placeholder="Link to a sales order"
                        readOnly={isViewMode}
                      />
                    </div>
                  </Card>

                  {/* Invoice Items Section */}
                  <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className={`text-md font-semibold ${theme.textPrimary}`}>Invoice Items</h4>
                      {!isViewMode && (
                        <div className="flex space-x-2">
                          <AIButton variant="suggest" onSuggest={() => console.log('AI Item Suggestions')} size="sm" />
                          <Button size="sm" icon={<Plus size={16} />} onClick={addItem}>Add Item</Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={item.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                          <div className="grid grid-cols-invoice-item-row-v2 gap-x-0 items-center"> {/* Adjusted grid */}
                            <div className="col-span-3"> {/* Item Name */}
                              <MasterSelectField
                                label="Item Name"
                                value={item.itemName}
                                onValueChange={(val) => updateItem(index, 'itemName', val)}
                                onSelect={(id, name, data) => handleItemSelect(index, id, name, data)}
                                options={stockItems}
                                placeholder="Product/Service name"
                                required
                                readOnly={isViewMode}
                                allowCreation={true}
                                onNewValueConfirmed={(val) => handleMasterSelectFieldNewValue(val, 'item', index)}
                                fieldIndex={index}
                              />
                            </div>
                            <div className="col-span-1"> {/* Qty */}
                              <FormField
                                label="Qty"
                                type="number"
                                value={item.quantity.toString()}
                                onChange={(val) => updateItem(index, 'quantity', parseFloat(val) || 0)}
                                required
                                readOnly={isViewMode}
                              />
                            </div>
                            <div className="col-span-1"> {/* Unit (display only) */}
                              {/* Removed label, displaying unit directly */}
                              <p className={`text-sm font-medium ${theme.textPrimary} mb-2`}>Unit</p>
                              <div className={`px-3 py-2.5 border ${theme.inputBorder} ${theme.borderRadius} ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary} text-sm`}>
                                {item.unit}
                              </div>
                            </div>
                            <div className="col-span-1"> {/* Rate */}
                              <FormField
                                label="Rate"
                                type="number"
                                value={item.rate.toString()}
                                onChange={(val) => updateItem(index, 'rate', parseFloat(val) || 0)}
                                required
                                readOnly={isViewMode}
                              />
                            </div>
                            <div className="col-span-1"> {/* Discount */}
                              <FormField
                                label="Discount (%)"
                                type="number"
                                value={item.discountValue.toString()}
                                onChange={(val) => updateItem(index, 'discountValue', parseFloat(val) || 0)}
                                readOnly={isViewMode}
                              />
                            </div>
                            <div className="col-span-1"> {/* Tax Rate */}
                              <FormField
                                label="Tax Rate (%)"
                                type="number"
                                value={item.taxRate.toString()}
                                onChange={(val) => updateItem(index, 'taxRate', parseFloat(val) || 0)}
                                readOnly={isViewMode}
                              />
                            </div>
                            <div className="col-span-1"> {/* Gross Amount */}
                              <label className={`block text-sm font-medium ${theme.textPrimary} whitespace-nowrap`}>Gross Amount</label>
                              <div className={`px-3 py-2.5 border ${theme.inputBorder} ${theme.borderRadius} ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary} text-sm`}>
                                ₹{item.amount.toLocaleString()}
                              </div>
                            </div>
                            <div className="col-span-1"> {/* Net Amount */}
                              <label className={`block text-sm font-medium ${theme.textPrimary} whitespace-nowrap`}>Net Amount</label>
                              <div className={`px-3 py-2.5 bg-emerald-50 border border-emerald-200 ${theme.borderRadius} font-semibold text-sm`}>
                                ₹{item.lineTotal.toLocaleString()}
                              </div>
                            </div>
                            <div className="col-span-1 flex items-center justify-center h-full"> {/* Aligned delete button */}
                              {!isViewMode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<Trash2 size={16} />}
                                  onClick={() => removeItem(index)}
                                  disabled={items.length === 1}
                                  className="text-red-600 hover:text-red-800"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Other Ledger Entries Section */}
                  <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className={`text-md font-semibold ${theme.textPrimary}`}>Other Ledger Entries</h4>
                      {!isViewMode && (
                        <Button size="sm" icon={<Plus size={16} />} onClick={addAdditionalLedgerEntry}>Add Ledger</Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {additionalLedgerEntries.map((entry, index) => (
                        <div key={entry.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-2 items-center"> {/* Adjusted gap */}
                            <div className="col-span-2">
                              <MasterSelectField
                                label="Account Name"
                                value={entry.accountName}
                                onValueChange={(val) => updateAdditionalLedgerEntry(index, 'accountName', val)}
                                onSelect={(id, name, data) => handleLedgerSelect(index, id, name, data, true)}
                                options={otherLedgers}
                                placeholder="Select account"
                                required
                                readOnly={isViewMode}
                                allowCreation={true}
                                onNewValueConfirmed={(val) => handleMasterSelectFieldNewValue(val, 'account', index)}
                                fieldIndex={index}
                              />
                            </div>
                            <div className="col-span-1">
                              <FormField
                                label="Amount"
                                type="number"
                                value={entry.amount.toString()}
                                onChange={(val) => updateAdditionalLedgerEntry(index, 'amount', parseFloat(val) || 0)}
                                readOnly={isViewMode}
                              />
                            </div>
                            <div className="col-span-1 flex items-center justify-end h-full"> {/* Aligned delete button */}
                              <FormField
                                label="Notes"
                                value={entry.notes}
                                onChange={(val) => updateAdditionalLedgerEntry(index, 'notes', val)}
                                placeholder="Entry notes"
                                readOnly={isViewMode}
                              />
                              {!isViewMode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<Trash2 size={16} />}
                                  onClick={() => removeAdditionalLedgerEntry(index)}
                                  disabled={additionalLedgerEntries.length === 1}
                                  className="text-red-600 hover:text-red-800 ml-2"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Tax Details Section */}
                  <Card className="p-6">
                    <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Tax Details</h4>
                    <div className="space-y-4">
                      {taxRows.length === 0 && !isViewMode ? (
                        <div className="text-center text-gray-500 py-4">
                          No tax details generated. Select customer and items to calculate tax.
                        </div>
                      ) : taxRows.map((row, index) => (
                        <div key={row.id} className={`p-4 border ${theme.borderColor} rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-center`}>
                          <FormField
                            label="Tax Name"
                            value={row.accountName}
                            readOnly
                          />
                          <FormField
                            label="Percentage (%)"
                            type="number"
                            value={row.percentage.toString()}
                            readOnly={isViewMode}
                            onChange={(val) => updateTaxRow(index, 'percentage', parseFloat(val) || 0)}
                          />
                          <FormField
                            label="Amount"
                            type="number"
                            value={row.amount.toString()}
                            readOnly
                          />
                          {!isViewMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={16} />}
                              onClick={() => setTaxRows(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-800"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Invoice Totals & Notes - Layout Adjusted */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Additional Information</h4>
                      <FormField
                        label="Terms and Conditions"
                        value={invoice.termsAndConditions}
                        onChange={(value) => handleInvoiceChange('termsAndConditions', value)}
                        placeholder="Payment terms, delivery terms, etc."
                        readOnly={isViewMode}
                      />
                      <FormField
                        label="Notes"
                        value={invoice.notes}
                        onChange={(value) => handleInvoiceChange('notes', value)}
                        placeholder="Any additional notes"
                        readOnly={isViewMode}
                      />
                    </Card>

                    <Card className="p-6">
                      <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                        <Calculator size={20} className="mr-2" />
                        Invoice Summary
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={theme.textMuted}>Subtotal:</span>
                          <span className={theme.textPrimary}>₹{invoice.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={theme.textMuted}>Total Tax:</span>
                          <span className={theme.textPrimary}>₹{invoice.totalTax.toLocaleString()}</span>
                        </div>
                        <hr className={theme.borderColor} />
                        <div className="flex justify-between text-lg font-semibold">
                          <span className={theme.textPrimary}>Grand Total:</span>
                          <span className="text-emerald-600">₹{invoice.totalAmount.toLocaleString()}</span>
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
                  </div>

                  {!isViewMode && (
                    <div className="flex justify-end space-x-2 mt-6">
                      <Button type="button" variant="outline" onClick={() => navigate('/sales/invoices')}>Cancel</Button>
                      <Button type="button" variant="outline" onClick={(e) => handleSaveInvoice(e, 'draft')}>
                        Save as Draft
                      </Button>
                      <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                        {loading ? 'Saving...' : (invoice.id ? 'Update Invoice' : 'Save Invoice')}
                      </Button>
                      {!invoice.id && (
                        <Button type="button" icon={<Send size={16} />}>Send Invoice</Button>
                      )}
                    </div>
                  )}
                </form>
              </>
            ) 
         }
        </Card>
        {/* Confirmation Modal for Master Creation */}
        <ConfirmationModal
          isOpen={showMasterConfirmModal}
          onClose={() => setShowMasterConfirmModal(false)}
          onConfirm={handleConfirmMasterCreation}
          title={`Create New ${pendingMasterCreation?.type === 'customer' ? 'Customer' : pendingMasterCreation?.type === 'item' ? 'Item' : 'Account'}?`}
          message={`The ${pendingMasterCreation?.type} "${pendingMasterCreation?.value}" does not exist. Do you want to create it?`}
          confirmText={`Yes, Create ${pendingMasterCreation?.type === 'customer' ? 'Customer' : pendingMasterCreation?.type === 'item' ? 'Item' : 'Account'}`}
        />
    </div>
  );
}

export default SalesInvoicesPage; 