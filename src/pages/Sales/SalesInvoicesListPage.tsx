// src/pages/Sales/SalesInvoicesListPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, RefreshCw, Eye, Edit, Trash2, Send, Download, Filter, Calendar, Users, ArrowLeft } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import SalesInvoiceFilterModal from '../../components/Modals/SalesInvoiceFilterModal';
// Removed import of CreateInvoice as it's now a separate route

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
  tax_details: any | null; // Added new field
  other_ledger_entries: any | null; // Added new field
}

function SalesInvoicesListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalInvoicesCount, setTotalInvoicesCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<string | null>(null);

  // Removed viewMode state as it's no longer needed here

  // State for filter modal
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
    sortBy: 'invoice_date', // New filter option
    sortOrder: 'desc',     // New filter option
    referenceNo: '',       // New filter option
    createdBy: '',         // New filter option
  });

  useEffect(() => {
    // No need to check location.state.mode here, this page is always the list
    if (currentCompany?.id) {
      fetchSalesInvoices();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentCompany?.id) {
        console.log('SalesInvoicesListPage: Document became visible, re-fetching sales invoices.');
        fetchSalesInvoices();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentCompany?.id, filterCriteria]); // Removed viewMode from dependency array

  const fetchSalesInvoices = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('sales_invoices')
        .select(`
          id, invoice_no, invoice_date, due_date, status, total_amount, paid_amount, outstanding_amount, created_at,
          customers ( name ), tax_details, other_ledger_entries
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id);

      // Apply filters from filterCriteria state
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
      if (filterCriteria.referenceNo) { // New filter
        query = query.ilike('reference_no', `%${filterCriteria.referenceNo}%`);
      }
      // Note: createdBy filter would require joining with users table or storing user name in sales_invoices

      if (filterCriteria.numResults !== 'all') {
        query = query.limit(parseInt(filterCriteria.numResults));
      }

      // Apply sorting
      query = query.order(filterCriteria.sortBy, { ascending: filterCriteria.sortOrder === 'asc' });


      const { data, error, count } = await query;

      if (error) throw error;
      setInvoices(data || []);
      setTotalInvoicesCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching sales invoices: ${err.message}`, 'error');
      console.error('Error fetching sales invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    setShowFilterModal(false);
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
      // Delete associated items first (if not cascaded by DB)
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

  // Removed the conditional rendering for viewMode === 'create'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Invoices</h1>
          <p className={theme.textSecondary}>Manage your sales invoices, track payments, and generate reports.</p>
        </div>
        <div className="flex space-x-2">
          {/* Add this button */}
          <Button variant="outline" onClick={() => navigate('/sales')} icon={<ArrowLeft size={16} />} className="text-gray-600 hover:text-gray-800">
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Invoice Suggestions')} />
          <Button
            icon={<Plus size={16} />}
            onClick={() => navigate('/sales/invoices/create')} // Navigate to the dedicated create page
          >
            Create New Invoice
          </Button>
        </div>
      </div>

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
                {invoices.map((invoice) => (
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
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/invoices/edit/${invoice.id}`)} title="Edit">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/invoices/view/${invoice.id}`)} title="View">
                        <Eye size={16} />
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

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteInvoice}
        title="Confirm Invoice Deletion"
        message="Are you sure you want to delete this invoice? This action cannot be undone and will also delete all associated items."
        confirmText="Yes, Delete Invoice"
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

export default SalesInvoicesListPage;
