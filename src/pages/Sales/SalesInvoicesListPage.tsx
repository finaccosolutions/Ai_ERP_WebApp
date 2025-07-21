import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, RefreshCw, Eye, Edit, Trash2, Send, Download, Filter, Calendar, Users } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, useNavigate } from 'react-router-dom'; // Keep Link for other uses, but remove from this button
import ConfirmationModal from '../../components/UI/ConfirmationModal';

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
}

function SalesInvoicesListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate(); // This is correctly imported and used

  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [totalInvoicesCount, setTotalInvoicesCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchSalesInvoices();
    }
  }, [currentCompany?.id, filterStatus, filterStartDate, filterEndDate]); // Refetch when filters change

  const fetchSalesInvoices = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('sales_invoices')
        .select(`
          id, invoice_no, invoice_date, due_date, status, total_amount, paid_amount, outstanding_amount, created_at,
          customers ( name )
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
      setInvoices(data || []);
      setTotalInvoicesCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching sales invoices: ${err.message}`, 'error');
      console.error('Error fetching sales invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchSalesInvoices();
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Invoices</h1>
          <p className={theme.textSecondary}>Manage your sales invoices, track payments, and generate reports.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Invoice Suggestions')} />
          {/* MODIFIED CODE START */}
          {/* Removed the <Link> component wrapping the Button */}
          <Button 
            icon={<Plus size={16} />} 
            onClick={() => {
              // Use navigate to go to the /sales/invoices route and pass state
              // The SalesInvoicesPage.tsx component will pick up this state
              // and switch its viewMode to 'create'
              navigate('/sales/invoices', { state: { mode: 'create' } });
            }}
          >
            Create New Invoice
          </Button>
          {/* MODIFIED CODE END */}
        </div>
      </div>

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
    </div>
  );
}

export default SalesInvoicesListPage;
