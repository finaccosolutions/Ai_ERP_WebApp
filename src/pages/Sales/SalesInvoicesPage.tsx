// src/pages/Sales/SalesInvoicesPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Plus, FileText, Search, RefreshCw, Eye, Edit, Trash2, Send, Download, Filter, Calendar, Users, ArrowLeft, Calculator, Save, Info, ChevronDown, ChevronUp, Tag, List } from 'lucide-react'; // ADDED 'List' here
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField, { MasterSelectFieldRef } from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import SalesInvoiceFilterModal from '../../components/Modals/SalesInvoiceFilterModal';
import { COUNTRIES } from '../../constants/geoData';
import { useAI } from '../../contexts/AIContext';

interface SalesInvoiceItem {
  id: string;
  invoice_id: string | null;
  item_code: string;
  item_name: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number; // Gross Amount after discount
  tax_rate: number | null;
  tax_amount: number | null;
  line_total: number; // Net Amount
  created_at: string;
  hsn_code: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
}

interface OtherLedgerEntry {
  id: string;
  account_id: string;
  account_name: string;
  amount: number;
  isDebit: boolean; // True for Debit, False for Credit
  notes: string;
}

interface SalesInvoice {
  id: string;
  invoice_no: string;
  customer_id: string | null;
  order_id: string | null;
  invoice_date: string;
  due_date: string | null;
  status: string;
  reference_no: string | null;
  terms_and_conditions: string | null;
  notes: string | null;
  subtotal: number | null;
  total_tax: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  outstanding_amount: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  tax_details: any | null; // JSONB to store dynamic tax rows
  other_ledger_entries: any | null; // JSONB to store other ledger entries
  total_discount: number | null;
}

interface ItemOption {
  id: string;
  name: string;
  item_code: string;
  standard_rate: number;
  unit_id: string;
  tax_rate: number;
  hsn_code: string;
  description: string;
  units_of_measure: { name: string } | null;
}

interface CustomerOption {
  id: string;
  name: string;
  customer_code: string;
  billing_address: any;
  shipping_address: any;
}

interface AccountOption {
  id: string;
  name: string;
  account_code: string;
  account_name: string;
  account_type: string;
  balance_type: string;
}

function SalesInvoicesPage() {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalInvoicesCount, setTotalInvoicesCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'view'>(id ? (location.pathname.includes('/view') ? 'view' : 'edit') : 'list');

  const [invoice, setInvoice] = useState({
    id: '',
    invoiceNo: '',
    customerId: '',
    customerName: '',
    orderId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    referenceNo: '',
    termsAndConditions: '',
    notes: '',
    status: 'draft',
    subtotal: 0,
    totalTax: 0,
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    totalDiscount: 0,
  });

  const [items, setItems] = useState<SalesInvoiceItem[]>([
    {
      id: '1',
      invoice_id: null,
      item_code: '',
      item_name: '',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      tax_rate: 0,
      tax_amount: 0,
      line_total: 0,
      created_at: '',
      hsn_code: null,
      discount_percent: 0,
      discount_amount: 0,
    }
  ]);

  const [otherLedgerEntries, setOtherLedgerEntries] = useState<OtherLedgerEntry[]>([]);

  const [availableCustomers, setAvailableCustomers] = useState<{ id: string; name: string }[]>([]);
  const [availableItems, setAvailableItems] = useState<ItemOption[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<AccountOption[]>([]);

  // State for collapsible sections
  const [isInvoiceDetailsExpanded, setIsInvoiceDetailsExpanded] = useState(true);
  const [isInvoiceItemsExpanded, setIsInvoiceItemsExpanded] = useState(true);
  const [isOtherLedgerEntriesExpanded, setIsOtherLedgerEntriesExpanded] = useState(true);
  const [isTaxSummaryExpanded, setIsTaxSummaryExpanded] = useState(true);
  const [isInvoiceSummaryExpanded, setIsInvoiceSummaryExpanded] = useState(true);

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    customerName: '',
    minAmount: '',
    maxAmount: '',
    invoiceNo: '',
    status: 'all',
    startDate: '',
    endDate: '',
    numResults: '10',
    sortBy: 'invoice_date',
    sortOrder: 'desc',
    referenceNo: '',
    createdBy: '',
  });

  // F2 Confirmation Modal states
  const [showF2ConfirmModal, setShowF2ConfirmModal] = useState(false);
  const [f2ConfirmData, setF2ConfirmData] = useState<{ field: string; value: string; index?: number; masterType?: string; existingId?: string; } | null>(null);

  // Refs for MasterSelectFields to trigger F2 confirmation
  const itemMasterSelectRefs = useRef<(MasterSelectFieldRef | null)[]>([]);
  const accountMasterSelectRefs = useRef<(MasterSelectFieldRef | null)[]>([]);
  const customerMasterSelectRef = useRef<MasterSelectFieldRef>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchMastersData(currentCompany.id);
      if (id) {
        fetchInvoiceData(id);
        if (location.pathname.includes('/view')) {
          setViewMode('view');
        } else {
          setViewMode('edit');
        }
      } else if (location.pathname.includes('/create')) {
        setViewMode('create');
        resetForm();
        generateInvoiceNo(currentCompany.id);
      } else {
        setViewMode('list');
        fetchSalesInvoices();
      }
    }
  }, [currentCompany?.id, id, location.pathname, filterCriteria]);

  // Handle return from master creation/alteration pages
  useEffect(() => {
    if (location.state?.fromInvoiceCreation && location.state?.createdId) {
      const { createdId, createdName, masterType } = location.state;

      switch (masterType) {
        case 'customer':
          setInvoice(prev => ({ ...prev, customerId: createdId, customerName: createdName }));
          customerMasterSelectRef.current?.selectOption(createdId);
          break;
        case 'item':
          fetchMastersData(currentCompany?.id || '').then(() => {
            const newItem = availableItems.find(i => i.id === createdId);
            if (newItem) {
              updateItem(0, 'item_code', newItem.item_code);
              updateItem(0, 'item_name', newItem.name);
              updateItem(0, 'unit', newItem.units_of_measure?.name || 'Nos');
              updateItem(0, 'rate', newItem.standard_rate);
              updateItem(0, 'taxRate', newItem.tax_rate);
              updateItem(0, 'hsnCode', newItem.hsn_code);
            }
          });
          showNotification(`Item "${createdName}" created and available for selection.`, 'info');
          break;
        case 'account':
          fetchMastersData(currentCompany?.id || '').then(() => {
            const newAccount = availableAccounts.find(a => a.id === createdId);
            if (newAccount) {
              handleOtherLedgerEntryChange(0, 'account_id', newAccount.id);
              handleOtherLedgerEntryChange(0, 'account_name', newAccount.name);
            }
          });
          showNotification(`Account "${createdName}" created and available for selection.`, 'info');
          break;
        default:
          break;
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);


  const fetchMastersData = async (companyId: string) => {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (customersError) throw customersError;
      setAvailableCustomers(customersData || []);

      const { data: itemsData, error: itemsError } = await supabase
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
      if (itemsError) throw itemsError;
      setAvailableItems(itemsData.map(item => ({
        id: item.id,
        name: item.item_name,
        item_code: item.item_code,
        standard_rate: item.standard_rate,
        unit_id: item.units_of_measure?.name || 'Nos',
        tax_rate: item.tax_rate,
        hsn_code: item.hsn_code,
        description: item.description,
        units_of_measure: item.units_of_measure,
      })));

      const { data: accountsData, error: accountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, account_type, balance_type')
        .eq('company_id', companyId)
        .eq('is_group', false)
        .order('account_name', { ascending: true });
      if (accountsError) throw accountsError;
      setAvailableAccounts(accountsData.map(acc => ({
        id: acc.id,
        name: acc.account_name,
        account_code: acc.account_code,
        account_name: acc.account_name,
        account_type: acc.account_type,
        balance_type: acc.balance_type,
      })));

    } catch (error) {
      console.error('Error fetching master data:', error);
      showNotification('Failed to load customers, items, or accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesInvoices = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('sales_invoices')
        .select(`
          id, invoice_no, invoice_date, due_date, status, total_amount, paid_amount, outstanding_amount, created_at,
          customers ( name ), tax_details, other_ledger_entries, total_discount
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id);

      if (filterCriteria.invoiceNo) {
        query = query.ilike('invoice_no', `%${filterCriteria.invoiceNo}%`);
      }
      if (filterCriteria.status !== 'all') {
        query = query.eq('status', filterCriteria.status);
      }
      if (filterCriteria.startDate) {
        query = query.gte('invoice_date', filterCriteria.startDate);
      }
      if (filterCriteria.endDate) {
        query = query.lte('invoice_date', filterCriteria.endDate);
      }
      if (filterCriteria.customerName) {
        query = query.ilike('customers.name', `%${filterCriteria.customerName}%`);
      }
      if (filterCriteria.minAmount) {
        query = query.gte('total_amount', parseFloat(filterCriteria.minAmount));
      }
      if (filterCriteria.maxAmount) {
        query = query.lte('total_amount', parseFloat(filterCriteria.maxAmount));
      }
      if (filterCriteria.referenceNo) {
        query = query.ilike('reference_no', `%${filterCriteria.referenceNo}%`);
      }

      query = query.order(filterCriteria.sortBy, { ascending: filterCriteria.sortOrder === 'asc' });

      if (filterCriteria.numResults !== 'all') {
        query = query.limit(parseInt(filterCriteria.numResults));
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('SalesInvoicesListPage: Error fetching sales invoices:', error);
        throw error;
      }
      setInvoices(data || []);
      setTotalInvoicesCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching sales invoices: ${err.message}`, 'error');
      console.error('SalesInvoicesListPage: Caught error fetching sales invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceData = async (invoiceId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select(`
          *,
          sales_invoice_items (*),
          customers ( name )
        `)
        .eq('id', invoiceId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (error) throw error;

      if (data) {
        setInvoice({
          id: data.id,
          invoiceNo: data.invoice_no,
          customerId: data.customer_id || '',
          customerName: data.customers?.name || '',
          orderId: data.order_id || '',
          invoiceDate: data.invoice_date,
          dueDate: data.due_date || '',
          referenceNo: data.reference_no || '',
          termsAndConditions: data.terms_and_conditions || '',
          notes: data.notes || '',
          status: data.status,
          subtotal: data.subtotal || 0,
          totalTax: data.total_tax || 0,
          totalAmount: data.total_amount || 0,
          paidAmount: data.paid_amount || 0,
          outstandingAmount: data.outstanding_amount || 0,
          totalDiscount: data.total_discount || 0,
        });
        setItems(data.sales_invoice_items.map((item: any) => ({
          id: item.id,
          itemCode: item.item_code,
          itemName: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.amount,
          taxRate: item.tax_rate,
          taxAmount: item.tax_amount,
          lineTotal: item.line_total,
          hsnCode: item.hsn_code,
          discountPercent: item.discount_percent,
          discountAmount: item.discount_amount,
        })));
        setOtherLedgerEntries(data.other_ledger_entries || []);
      }
    } catch (err: any) {
      showNotification(`Error loading invoice: ${err.message}`, 'error');
      console.error('Error loading invoice:', err);
      navigate('/sales/invoices');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNo = async (companyId: string) => {
    try {
      const { count, error } = await supabase
        .from('sales_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (error) throw error;

      const nextNumber = (count || 0) + 1;
      const newInvoiceNo = `INV-${String(nextNumber).padStart(4, '0')}`;
      setInvoice(prev => ({ ...prev, invoiceNo: newInvoiceNo }));
    } catch (err) {
      console.error('Error generating invoice number:', err);
      showNotification('Failed to generate invoice number. Please enter manually.', 'error');
    }
  };

  const handleInvoiceChange = (field: keyof typeof invoice, value: any) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const calculateItemTotals = (item: SalesInvoiceItem) => {
    const amount = item.quantity * item.rate;
    const discountAmount = (amount * (item.discountPercent || 0)) / 100;
    const grossAmountAfterDiscount = amount - discountAmount;
    const taxAmount = (grossAmountAfterDiscount * (item.taxRate || 0)) / 100;
    const lineTotal = grossAmountAfterDiscount + taxAmount;

    return {
      ...item,
      amount: grossAmountAfterDiscount,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      line_total: lineTotal,
    };
  };

  const updateItem = (index: number, field: keyof SalesInvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    newItems[index] = calculateItemTotals(newItems[index]);

    setItems(newItems);
    calculateInvoiceTotals(newItems, otherLedgerEntries);
  };

  const addItem = () => {
    const newItem: SalesInvoiceItem = {
      id: 'new-' + Date.now().toString(),
      invoice_id: null,
      item_code: '',
      item_name: '',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      tax_rate: 0,
      tax_amount: 0,
      line_total: 0,
      created_at: '',
      hsn_code: null,
      discount_percent: 0,
      discount_amount: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      calculateInvoiceTotals(newItems, otherLedgerEntries);
    }
  };

  const handleOtherLedgerEntryChange = (index: number, field: keyof OtherLedgerEntry, value: any) => {
    const newEntries = [...otherLedgerEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setOtherLedgerEntries(newEntries);
    calculateInvoiceTotals(items, newEntries);
  };

  const addOtherLedgerEntry = () => {
    setOtherLedgerEntries(prev => [...prev, {
      id: Date.now().toString(),
      account_id: '',
      account_name: '',
      amount: 0,
      isDebit: true,
      notes: '',
    }]);
  };

  const removeOtherLedgerEntry = (index: number) => {
    setOtherLedgerEntries(prev => prev.filter((_, i) => i !== index));
    calculateInvoiceTotals(items, otherLedgerEntries.filter((_, i) => i !== index));
  };

  const calculateInvoiceTotals = (itemList: SalesInvoiceItem[], otherEntries: OtherLedgerEntry[]) => {
    const subtotal = itemList.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
    const totalDiscount = itemList.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
    const totalTax = itemList.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const totalItemsAmountAfterDiscount = itemList.reduce((sum, item) => sum + (item.amount || 0), 0);

    let finalTotalAmount = totalItemsAmountAfterDiscount + totalTax;

    otherEntries.forEach(entry => {
      if (entry.isDebit) {
        finalTotalAmount += entry.amount;
      } else {
        finalTotalAmount -= entry.amount;
      }
    });

    setInvoice(prev => ({
      ...prev,
      subtotal: subtotal,
      totalDiscount: totalDiscount,
      totalTax: totalTax,
      totalAmount: finalTotalAmount,
      outstandingAmount: finalTotalAmount - prev.paidAmount,
    }));
  };

  const resetForm = () => {
    setInvoice({
      id: '',
      invoiceNo: '',
      customerId: '',
      customerName: '',
      orderId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      referenceNo: '',
      termsAndConditions: '',
      notes: '',
      status: 'draft',
      subtotal: 0,
      totalTax: 0,
      totalAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      totalDiscount: 0,
    });
    setItems([
      {
        id: '1',
        invoice_id: null,
        item_code: '',
        item_name: '',
        quantity: 1,
        unit: 'Nos',
        rate: 0,
        amount: 0,
        tax_rate: 0,
        tax_amount: 0,
        line_total: 0,
        created_at: '',
        hsn_code: null,
        discount_percent: 0,
        discount_amount: 0,
      }
    ]);
    setOtherLedgerEntries([]);
  };

  const validateForm = () => {
    if (!invoice.invoiceNo.trim()) {
      showNotification('Invoice Number is required.', 'error');
      return false;
    }
    if (!invoice.customerId) {
      showNotification('Customer is required.', 'error');
      return false;
    }
    if (items.length === 0 || items.some(item => !item.itemName || item.quantity <= 0 || item.rate < 0)) {
      showNotification('All invoice items must have a name, positive quantity, and non-negative rate.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!currentCompany?.id) {
      showNotification('Company information is missing. Please log in and select a company.', 'error');
      return;
    }

    setLoading(true);
    try {
      const invoiceToSave = {
        company_id: currentCompany.id,
        created_by: user?.id,
        invoice_no: invoice.invoiceNo,
        customer_id: invoice.customerId,
        order_id: invoice.orderId || null,
        invoice_date: invoice.invoiceDate,
        due_date: invoice.dueDate || null,
        status: invoice.status,
        reference_no: invoice.referenceNo || null,
        terms_and_conditions: invoice.termsAndConditions || null,
        notes: invoice.notes || null,
        subtotal: invoice.subtotal,
        total_tax: invoice.totalTax,
        total_amount: invoice.totalAmount,
        paid_amount: invoice.paidAmount,
        outstanding_amount: invoice.outstandingAmount,
        total_discount: invoice.totalDiscount,
        other_ledger_entries: otherLedgerEntries,
      };

      let invoiceId = invoice.id;

      if (invoice.id) {
        const { error } = await supabase
          .from('sales_invoices')
          .update(invoiceToSave)
          .eq('id', invoice.id);
        if (error) throw error;
        showNotification('Invoice updated successfully!', 'success');
      } else {
        const { data, error } = await supabase
          .from('sales_invoices')
          .insert(invoiceToSave)
          .select('id')
          .single();
        if (error) throw error;
        invoiceId = data.id;
        showNotification('Invoice created successfully!', 'success');
      }

      if (invoiceId) {
        await supabase.from('sales_invoice_items').delete().eq('invoice_id', invoiceId);

        const itemsToSave = items.map(item => ({
          invoice_id: invoiceId,
          item_code: item.itemCode,
          item_name: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.amount,
          tax_rate: item.taxRate,
          tax_amount: item.taxAmount,
          line_total: item.line_total,
          hsn_code: item.hsn_code,
          discount_percent: item.discountPercent,
          discount_amount: item.discountAmount,
        }));
        const { error: itemsError } = await supabase.from('sales_invoice_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }

      if (location.state?.fromInvoiceCreation) {
        navigate(location.state.returnPath, {
          replace: true,
          state: {
            fromInvoiceCreation: true,
            createdId: invoiceId,
            createdName: invoice.invoiceNo,
            masterType: 'invoice'
          }
        });
      } else {
        navigate('/sales/invoices');
      }
      resetForm();
    } catch (err: any) {
      showNotification(`Failed to save invoice: ${err.message}`, 'error');
      console.error('Save invoice error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoiceToDeleteId(invoiceId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      await supabase.from('sales_invoice_items').delete().eq('invoice_id', invoiceToDeleteId);

      const { error } = await supabase
        .from('sales_invoices')
        .delete()
        .eq('id', invoiceToDeleteId);

      if (error) throw error;
      showNotification('Invoice deleted successfully!', 'success');
      fetchSalesInvoices();
    } catch (err: any) {
      showNotification(`Error deleting invoice: ${err.message}`, 'error');
      console.error('Error deleting invoice:', err);
    } finally {
      setLoading(false);
      setInvoiceToDeleteId(null);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    setShowFilterModal(false);
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

  // F2 Confirmation Logic
  const handleF2Press = (field: string, value: string, index?: number, masterType?: string) => {
    let existingMaster: any = null;
    let navigatePath = '';
    let confirmMessage = '';
    let confirmBtnText = '';

    if (value.trim() === '') {
      confirmMessage = `Do you want to create a new ${masterType}?`;
      confirmBtnText = `Yes, Create ${masterType}`;
      switch (masterType) {
        case 'customer': navigatePath = '/sales/customers/new'; break;
        case 'item': navigatePath = '/inventory/masters/items/new'; break;
        case 'account': navigatePath = '/accounting/masters/ledgers/new'; break;
        default: break;
      }
    } else {
      switch (masterType) {
        case 'customer':
          existingMaster = availableCustomers.find(c => c.name.toLowerCase() === value.toLowerCase());
          navigatePath = existingMaster ? `/sales/customers/edit/${existingMaster.id}` : `/sales/customers/new`;
          confirmMessage = existingMaster ? `Do you want to alter customer "${value}"?` : `Do you want to create a new customer named "${value}"?`;
          confirmBtnText = existingMaster ? `Yes, Alter Customer` : `Yes, Create Customer`;
          break;
        case 'item':
          existingMaster = availableItems.find(i => i.name.toLowerCase() === value.toLowerCase());
          navigatePath = existingMaster ? `/inventory/masters/items/edit/${existingMaster.id}` : `/inventory/masters/items/new`;
          confirmMessage = existingMaster ? `Do you want to alter item "${value}"?` : `Do you want to create a new item named "${value}"?`;
          confirmBtnText = existingMaster ? `Yes, Alter Item` : `Yes, Create Item`;
          break;
        case 'account':
          existingMaster = availableAccounts.find(a => a.name.toLowerCase() === value.toLowerCase());
          navigatePath = existingMaster ? `/accounting/masters/ledgers/edit/${existingMaster.id}` : `/accounting/masters/ledgers/new`;
          confirmMessage = existingMaster ? `Do you want to alter account "${value}"?` : `Do you want to create a new account named "${value}"?`;
          confirmBtnText = existingMaster ? `Yes, Alter Account` : `Yes, Create Account`;
          break;
        default:
          break;
      }
    }

    setF2ConfirmData({ field, value, index, masterType, existingId: existingMaster?.id });
    setShowF2ConfirmModal(true);
  };

  const confirmF2Action = () => {
    if (!f2ConfirmData) return;

    const { value, masterType, existingId } = f2ConfirmData;
    let targetPath = '';
    let initialName = value.trim();

    if (existingId) {
      targetPath = `/sales/customers/edit/${existingId}`; // Default, will be overridden
      switch (masterType) {
        case 'customer': targetPath = `/sales/customers/edit/${existingId}`; break;
        case 'item': targetPath = `/inventory/masters/items/edit/${existingId}`; break;
        case 'account': targetPath = `/accounting/masters/ledgers/edit/${existingId}`; break;
        default: break;
      }
    } else {
      targetPath = '/sales/customers/new'; // Default, will be overridden
      switch (masterType) {
        case 'customer': targetPath = '/sales/customers/new'; break;
        case 'item': targetPath = '/inventory/masters/items/new'; break;
        case 'account': targetPath = '/accounting/masters/ledgers/new'; break;
        default: break;
      }
    }

    setShowF2ConfirmModal(false);
    setF2ConfirmData(null);

    navigate(targetPath, {
      state: {
        fromInvoiceCreation: true,
        initialName: initialName,
        returnPath: location.pathname,
      }
    });
  };

  const getTaxRatesForDropdown = () => {
    const countryConfig = COUNTRIES.find(c => c.code === currentCompany?.country);
    const taxRates = countryConfig?.taxConfig?.rates || [];
    return taxRates.map(rate => ({ id: rate.toString(), name: `${rate}%` }));
  };

  const getAggregatedTaxDetails = () => {
    const aggregated: { [key: string]: { tax_type: string; tax_rate: number; tax_amount: number } } = {};
    items.forEach(item => {
      if (item.tax_rate && item.tax_amount) {
        const countryConfig = COUNTRIES.find(c => c.code === currentCompany?.country);
        
        if (countryConfig?.taxConfig?.type === 'GST') {
          const halfTaxRate = item.tax_rate / 2;
          const halfTaxAmount = item.tax_amount / 2;

          const cgstKey = `CGST-${halfTaxRate}`;
          if (!aggregated[cgstKey]) {
            aggregated[cgstKey] = { tax_type: 'CGST', tax_rate: halfTaxRate, tax_amount: 0 };
          }
          aggregated[cgstKey].tax_amount += halfTaxAmount;

          const sgstKey = `SGST-${halfTaxRate}`;
          if (!aggregated[sgstKey]) {
            aggregated[sgstKey] = { tax_type: 'SGST', tax_rate: halfTaxRate, tax_amount: 0 };
          }
          aggregated[sgstKey].tax_amount += halfTaxAmount;

        } else {
          const taxType = countryConfig?.taxConfig?.type || 'Other Tax';
          const key = `${taxType}-${item.tax_rate}`;
          if (!aggregated[key]) {
            aggregated[key] = { tax_type: taxType, tax_rate: item.tax_rate, tax_amount: 0 };
          }
          aggregated[key].tax_amount += item.tax_amount;
        }
      }
    });

    return Object.values(aggregated);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Invoices</h1>
          <p className={theme.textSecondary}>Manage your sales invoices, track payments, and generate reports.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/sales')} icon={<ArrowLeft size={16} />} className="text-gray-600 hover:text-gray-800">
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Invoice Suggestions')} />
          <Button
            icon={<Plus size={16} />}
            onClick={() => navigate('/sales/invoices/create')}
          >
            Create New Invoice
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Invoices List</h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="relative flex-grow">
              <p className={`text-sm ${theme.textMuted}`}>
                Showing {invoices.length} of {totalInvoicesCount} invoices.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => setShowFilterModal(true)} icon={<Filter size={16} />}>
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
            ) : invoices.length === 0 ? (
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
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.invoice_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.customers?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.invoice_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.due_date || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(inv.total_amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(inv.outstanding_amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(inv.status)}`}>
                          {inv.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/invoices/edit/${inv.id}`)} title="Edit">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/invoices/view/${inv.id}`)} title="View">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice(inv.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Details */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                <FileText size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                Invoice Details
              </h3>
              <button type="button" onClick={() => setIsInvoiceDetailsExpanded(!isInvoiceDetailsExpanded)} className={`${theme.textMuted} hover:${theme.textPrimary}`}>
                {isInvoiceDetailsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isInvoiceDetailsExpanded ? 'max-h-screen' : 'max-h-0'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Invoice Number"
                  value={invoice.invoiceNo}
                  onChange={(val) => handleInvoiceChange('invoiceNo', val)}
                  placeholder="Auto-generated or manual"
                  required
                  readOnly={viewMode === 'view'}
                />
                <MasterSelectField
                  ref={customerMasterSelectRef}
                  label="Customer Name"
                  value={invoice.customerName}
                  onValueChange={(val) => handleInvoiceChange('customerName', val)}
                  onSelect={(id, name) => {
                    handleInvoiceChange('customerId', id);
                    handleInvoiceChange('customerName', name);
                  }}
                  options={availableCustomers}
                  placeholder="Select or type customer name"
                  required
                  readOnly={viewMode === 'view'}
                  onF2Press={(val) => handleF2Press('Customer Name', val, undefined, 'customer')}
                />
                <FormField
                  label="Invoice Date"
                  type="date"
                  value={invoice.invoiceDate}
                  onChange={(val) => handleInvoiceChange('invoiceDate', val)}
                  required
                  readOnly={viewMode === 'view'}
                />
                <FormField
                  label="Due Date"
                  type="date"
                  value={invoice.dueDate}
                  onChange={(val) => handleInvoiceChange('dueDate', val)}
                  readOnly={viewMode === 'view'}
                />
                <FormField
                  label="Reference No."
                  value={invoice.referenceNo}
                  onChange={(val) => handleInvoiceChange('referenceNo', val)}
                  placeholder="e.g., Customer PO, Sales Order"
                  readOnly={viewMode === 'view'}
                />
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>Status</label>
                  <select
                    value={invoice.status}
                    onChange={(e) => handleInvoiceChange('status', e.target.value)}
                    className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent ${viewMode === 'view' ? 'bg-gray-100 dark:bg-gray-750 cursor-not-allowed' : ''}`}
                    disabled={viewMode === 'view'}
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <FormField
                  label="Terms and Conditions"
                  value={invoice.termsAndConditions}
                  onChange={(val) => handleInvoiceChange('termsAndConditions', val)}
                  placeholder="Payment terms, delivery terms, etc."
                  className="md:col-span-2"
                  readOnly={viewMode === 'view'}
                />
                <FormField
                  label="Notes"
                  value={invoice.notes}
                  onChange={(val) => handleInvoiceChange('notes', val)}
                  placeholder="Any additional notes"
                  className="md:col-span-2"
                  readOnly={viewMode === 'view'}
                />
              </div>
            </div>
          </Card>

          {/* Invoice Items */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                <List size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                Invoice Items
              </h3>
              <button type="button" onClick={() => setIsInvoiceItemsExpanded(!isInvoiceItemsExpanded)} className={`${theme.textMuted} hover:${theme.textPrimary}`}>
                {isInvoiceItemsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isInvoiceItemsExpanded ? 'max-h-screen' : 'max-h-0'}`}>
              {viewMode !== 'view' && (
                <div className="flex justify-end mb-4">
                  <Button size="sm" icon={<Plus size={16} />} onClick={addItem}>Add Item</Button>
                </div>
              )}
              <div className="space-y-4">
                {items.map((item, index) => {
                  return (
                    <div key={item.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                      <div className="grid grid-cols-invoice-item-row-custom gap-x-2 gap-y-4 items-center">
                        <MasterSelectField
                          ref={el => itemMasterSelectRefs.current[index] = el}
                          label="Item Name"
                          value={item.item_name}
                          onValueChange={(val) => updateItem(index, 'item_name', val)}
                          onSelect={(id, name, data) => {
                            const selected = data as ItemOption;
                            updateItem(index, 'item_code', id); // Store item ID as item_code
                            updateItem(index, 'item_name', name);
                            updateItem(index, 'unit', selected.units_of_measure?.name || 'Nos');
                            updateItem(index, 'rate', selected.standard_rate);
                            updateItem(index, 'taxRate', selected.tax_rate);
                            updateItem(index, 'hsnCode', selected.hsn_code);
                          }}
                          options={availableItems.map(i => ({ id: i.id, name: i.item_name, ...i }))}
                          placeholder="Select or type item name"
                          required
                          readOnly={viewMode === 'view'}
                          onF2Press={(val) => handleF2Press('Item Name', val, index, 'item')}
                        />
                        <FormField
                          label="HSN/SAC"
                          value={item.hsn_code || ''}
                          onChange={(val) => updateItem(index, 'hsn_code', val)}
                          placeholder="8471"
                          readOnly={viewMode === 'view'}
                        />
                        <FormField
                          label="Qty"
                          type="number"
                          value={item.quantity.toString()}
                          onChange={(val) => updateItem(index, 'quantity', parseFloat(val) || 0)}
                          required
                          readOnly={viewMode === 'view'}
                        />
                        <FormField
                          label="Unit"
                          value={item.unit}
                          onChange={(val) => updateItem(index, 'unit', val)}
                          placeholder="Nos"
                          readOnly={viewMode === 'view'}
                        />
                        <FormField
                          label="Rate"
                          type="number"
                          value={item.rate.toString()}
                          onChange={(val) => updateItem(index, 'rate', parseFloat(val) || 0)}
                          required
                          readOnly={viewMode === 'view'}
                        />
                        <FormField
                          label="Disc (%)"
                          type="number"
                          value={item.discount_percent?.toString() || '0'}
                          onChange={(val) => updateItem(index, 'discount_percent', parseFloat(val) || 0)}
                          readOnly={viewMode === 'view'}
                        />
                        <MasterSelectField
                          label="Tax %"
                          value={item.tax_rate?.toString() || '0'}
                          onValueChange={(val) => updateItem(index, 'tax_rate', parseFloat(val) || 0)}
                          onSelect={(id) => updateItem(index, 'tax_rate', parseFloat(id) || 0)}
                          options={getTaxRatesForDropdown()}
                          placeholder="Select Tax %"
                          readOnly={viewMode === 'view'}
                        />
                        <div className="flex flex-col">
                          <label className={`block text-sm font-medium ${theme.textPrimary}`}>Gross Amt</label>
                          <div className={`px-3 py-2 ${theme.inputBg} border ${theme.borderColor} rounded-lg text-sm`}>
                            {formatCurrency(item.quantity * item.rate)}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <label className={`block text-sm font-medium ${theme.textPrimary}`}>Net Amt</label>
                          <div className={`px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg font-semibold text-sm`}>
                            {formatCurrency(item.line_total)}
                          </div>
                        </div>
                        {viewMode !== 'view' && (
                          <div className="flex items-center justify-center h-full self-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={16} />}
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                              className="text-red-600 hover:text-red-800"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Other Ledger Entries */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                <Users size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                Other Ledger Entries
              </h3>
              <button type="button" onClick={() => setIsOtherLedgerEntriesExpanded(!isOtherLedgerEntriesExpanded)} className={`${theme.textMuted} hover:${theme.textPrimary}`}>
                {isOtherLedgerEntriesExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOtherLedgerEntriesExpanded ? 'max-h-screen' : 'max-h-0'}`}>
              {viewMode !== 'view' && (
                <div className="flex justify-end mb-4">
                  <Button size="sm" icon={<Plus size={16} />} onClick={addOtherLedgerEntry}>Add Entry</Button>
                </div>
              )}
              <div className="space-y-4">
                {otherLedgerEntries.map((entry, index) => (
                  <div key={entry.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                    <div className="grid grid-cols-ledger-entry-row-custom gap-x-2 gap-y-4 items-center">
                      <MasterSelectField
                        ref={el => accountMasterSelectRefs.current[index] = el}
                        label="Account Name"
                        value={entry.account_name}
                        onValueChange={(val) => handleOtherLedgerEntryChange(index, 'account_name', val)}
                        onSelect={(id, name) => {
                          handleOtherLedgerEntryChange(index, 'account_id', id);
                          handleOtherLedgerEntryChange(index, 'account_name', name);
                        }}
                        options={availableAccounts.map(acc => ({ id: acc.id, name: acc.account_name, ...acc }))}
                        placeholder="Select Account"
                        required
                        readOnly={viewMode === 'view'}
                        onF2Press={(val) => handleF2Press('Account Name', val, index, 'account')}
                      />
                      <FormField
                        label="Amount"
                        type="number"
                        value={entry.amount.toString()}
                        onChange={(val) => handleOtherLedgerEntryChange(index, 'amount', parseFloat(val) || 0)}
                        required
                        readOnly={viewMode === 'view'}
                      />
                      <FormField
                        label="Notes"
                        value={entry.notes}
                        onChange={(val) => handleOtherLedgerEntryChange(index, 'notes', val)}
                        placeholder="Entry notes"
                        readOnly={viewMode === 'view'}
                      />
                      {viewMode !== 'view' && (
                        <div className="flex items-center justify-center h-full self-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => removeOtherLedgerEntry(index)}
                            disabled={otherLedgerEntries.length === 1}
                            className="text-red-600 hover:text-red-800"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Tax Summary Section */}
          {getAggregatedTaxDetails().length > 0 && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                  <Tag size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                  Tax Summary
                </h3>
                <button type="button" onClick={() => setIsTaxSummaryExpanded(!isTaxSummaryExpanded)} className={`${theme.textMuted} hover:${theme.textPrimary}`}>
                  {isTaxSummaryExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isTaxSummaryExpanded ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="space-y-2">
                  {getAggregatedTaxDetails().map((tax: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className={theme.textMuted}>{tax.tax_type} @ {tax.tax_rate}%:</span>
                      <span className={theme.textPrimary}>{formatCurrency(tax.tax_amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Invoice Summary */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
                <Calculator size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                Invoice Summary
              </h3>
              <button type="button" onClick={() => setIsInvoiceSummaryExpanded(!isInvoiceSummaryExpanded)} className={`${theme.textMuted} hover:${theme.textPrimary}`}>
                {isInvoiceSummaryExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isInvoiceSummaryExpanded ? 'max-h-screen' : 'max-h-0'}`}>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={theme.textMuted}>Subtotal:</span>
                  <span className={theme.textPrimary}>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.textMuted}>Total Discount:</span>
                  <span className={theme.textPrimary}>{formatCurrency(invoice.totalDiscount)}</span>
                </div>
                {getAggregatedTaxDetails().map((tax: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span className={theme.textMuted}>Total {tax.tax_type}:</span>
                    <span className={theme.textPrimary}>{formatCurrency(tax.tax_amount)}</span>
                  </div>
                ))}
                {otherLedgerEntries.length > 0 && (
                  <div className="flex justify-between">
                    <span className={theme.textMuted}>Other Adjustments:</span>
                    <span className={theme.textPrimary}>
                      {formatCurrency(otherLedgerEntries.reduce((sum, entry) => sum + (entry.isDebit ? entry.amount : -entry.amount), 0))}
                    </span>
                  </div>
                )}
                <hr className={theme.borderColor} />
                <div className="flex justify-between text-lg font-semibold">
                  <span className={theme.textPrimary}>Total Amount:</span>
                  <span className="text-emerald-600">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.textMuted}>Paid Amount:</span>
                  <span className={theme.textPrimary}>{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span className={theme.textMuted}>Outstanding Amount:</span>
                  <span className="text-red-600">{formatCurrency(invoice.outstandingAmount)}</span>
                </div>
              </div>
              {viewMode !== 'view' && (
                <div className="mt-4">
                  <AIButton
                    variant="calculate"
                    onSuggest={() => console.log('AI Calculate')}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Additional Information</h3>
            <FormField
              label="Terms and Conditions"
              value={invoice.termsAndConditions}
              onChange={(val) => handleInvoiceChange('termsAndConditions', val)}
              placeholder="Payment terms, delivery terms, etc."
              readOnly={viewMode === 'view'}
            />
            <FormField
              label="Notes"
              value={invoice.notes}
              onChange={(val) => handleInvoiceChange('notes', val)}
              placeholder="Any additional notes"
              readOnly={viewMode === 'view'}
            />
          </Card>

          {viewMode !== 'view' && (
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/sales/invoices')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : 'Save Invoice'}
              </Button>
              {!invoice.id && (
                <Button type="button" icon={<Send size={16} />}>Send Invoice</Button>
              )}
            </div>
          )}
        </form>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteInvoice}
        title="Confirm Invoice Deletion"
        message="Are you sure you want to delete this invoice? This action cannot be undone and will also delete all associated items."
        confirmText="Yes, Delete Invoice"
      />

      <ConfirmationModal
        isOpen={showF2ConfirmModal}
        onClose={() => setShowF2ConfirmModal(false)}
        onConfirm={confirmF2Action}
        title={f2ConfirmData?.existingId ? `Alter ${f2ConfirmData?.masterType}` : `Create New ${f2ConfirmData?.masterType}`}
        message={f2ConfirmData?.value.trim() === ''
          ? `Do you want to create a new ${f2ConfirmData?.masterType}?`
          : f2ConfirmData?.existingId
            ? `Do you want to alter ${f2ConfirmData?.masterType} "${f2ConfirmData?.value}"?`
            : `Do you want to create a new ${f2ConfirmData?.masterType} named "${f2ConfirmData?.value}"?`
        }
        confirmText={f2ConfirmData?.existingId ? `Yes, Alter ${f2ConfirmData?.masterType}` : `Yes, Create ${f2ConfirmData?.masterType}`}
      />

      <SalesInvoiceFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filterCriteria}
        onApplyFilters={handleApplyFilters}
        onFilterChange={(key, value) => setFilterCriteria(prev => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}

export default SalesInvoicesPage;
