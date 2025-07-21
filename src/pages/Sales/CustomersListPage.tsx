// src/pages/Sales/CustomersListPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Mail, Phone, RefreshCw, Eye, Edit, Trash2, ArrowLeft } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal'; // Import ConfirmationModal
import MasterSelectField from '../../components/UI/MasterSelectField'; // Import MasterSelectField

interface Customer {
  id: string;
  customer_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  tax_id: string | null;
  gstin: string | null;
  customer_group_id: string | null;
  customer_groups?: { name: string } | null; // Joined data
  created_at: string;
}

function CustomersListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [numCustomersToShow, setNumCustomersToShow] = useState<string>('10'); // Default to 10
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // State for confirmation modal
  const [customerToDeleteId, setCustomerToDeleteId] = useState<string | null>(null); // State to store ID of customer to delete

  useEffect(() => {
    if (currentCompany?.id) {
      fetchCustomers();
    }
  }, [currentCompany?.id, numCustomersToShow]); // Refetch when numCustomersToShow changes

  const fetchCustomers = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('customers')
        .select(`
          id, customer_code, name, email, phone, mobile, tax_id, gstin, created_at,
          customer_group_id,
          customer_groups ( name )
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (numCustomersToShow !== 'all') {
        query = query.limit(parseInt(numCustomersToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setCustomers(data || []);
      setTotalCustomersCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching customers: ${err.message}`, 'error');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCustomers(); // Trigger fetch with current search term
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomerToDeleteId(customerId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDeleteId) return;

    setShowDeleteConfirm(false); // Close modal immediately
    setLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDeleteId);

      if (error) throw error;
      showNotification('Customer deleted successfully!', 'success');
      fetchCustomers(); // Refresh list
    } catch (err: any) {
      showNotification(`Error deleting customer: ${err.message}`, 'error');
      console.error('Error deleting customer:', err);
    } finally {
      setLoading(false);
      setCustomerToDeleteId(null); // Clear customer to delete ID
    }
  };

  const numCustomersOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalCustomersCount})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Customer Master</h1>
          <p className={theme.textSecondary}>Manage your customer profiles and details.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/sales')} icon={<ArrowLeft size={16} />} className="text-gray-600 hover:text-gray-800">
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Customer Suggestions')} />
          <Link to="/sales/customers/new">
            <Button icon={<Plus size={16} />}>Add New Customer</Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Customer List</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name..."
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
            <MasterSelectField
              label="" // No label needed for this dropdown
              value={numCustomersOptions.find(opt => opt.id === numCustomersToShow)?.name || ''}
              onValueChange={() => {}} // Not used for typing
              onSelect={(id) => setNumCustomersToShow(id)}
              options={numCustomersOptions}
              placeholder="Show"
              className="w-32"
            />
            <Button onClick={handleSearch} disabled={loading} icon={<RefreshCw size={16} />}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No customers found. Add a new customer to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.customer_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || customer.mobile || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.customer_groups?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/customers/edit/${customer.id}`)} title="Edit">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/customers/edit/${customer.id}?viewOnly=true`)} title="View">
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCustomer(customer.id)} className="text-red-600 hover:text-red-800" title="Delete">
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="audit" onSuggest={() => console.log('AI Duplicate Check')} className="w-full" />
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteCustomer}
        title="Confirm Customer Deletion"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText="Yes, Delete Customer"
      />
    </div>
  );
}

export default CustomersListPage; 