// src/pages/CRM/LeadListPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Mail, Phone, RefreshCw, Edit, Trash2, ArrowLeft, Filter, ArrowLeftRight } from 'lucide-react'; // MODIFIED: Changed 'Convert' to 'ArrowLeftRight'
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';

interface Lead {
  id: string;
  lead_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  status: string;
  lead_source_id: string | null;
  lead_sources?: { name: string } | null; // Joined data
  created_at: string;
  next_contact_date: string | null;
  converted_customer_id: string | null;
}

function LeadListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leadToDeleteId, setLeadToDeleteId] = useState<string | null>(null);

  const [filterCriteria, setFilterCriteria] = useState({
    name: '',
    status: 'all',
    sourceId: '',
    priority: 'all',
    startDate: '',
    endDate: '',
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10');

  const [availableSources, setAvailableSources] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchLeads();
      fetchLeadSources(currentCompany.id);
    }
  }, [currentCompany?.id, filterCriteria, numResultsToShow, searchTerm]);

  const fetchLeads = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select(`
          id, lead_name, company_name, email, phone, mobile, status, created_at, next_contact_date, converted_customer_id,
          lead_sources ( name )
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id);

      if (searchTerm) {
        query = query.ilike('lead_name', `%${searchTerm}%`);
      }

      if (filterCriteria.name) {
        query = query.ilike('lead_name', `%${filterCriteria.name}%`);
      }
      if (filterCriteria.status !== 'all') {
        query = query.eq('status', filterCriteria.status);
      }
      if (filterCriteria.sourceId) {
        query = query.eq('lead_source_id', filterCriteria.sourceId);
      }
      // Priority filter not directly supported by current schema, would need custom logic or schema update
      if (filterCriteria.startDate) {
        query = query.gte('created_at', filterCriteria.startDate);
      }
      if (filterCriteria.endDate) {
        query = query.lte('created_at', filterCriteria.endDate);
      }

      query = query.order('created_at', { ascending: false });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setLeads(data || []);
      setTotalLeadsCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching leads: ${err.message}`, 'error');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadSources = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (error) throw error;
      setAvailableSources(data || []);
    } catch (err: any) {
      console.error('Error fetching lead sources:', err);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    // In a real app, you might have a filter modal here
  };

  const handleDeleteLead = (leadId: string) => {
    setLeadToDeleteId(leadId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLead = async () => {
    if (!leadToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadToDeleteId);

      if (error) throw error;
      showNotification('Lead deleted successfully!', 'success');
      fetchLeads();
    } catch (err: any) {
      showNotification(`Error deleting lead: ${err.message}`, 'error');
      console.error('Error deleting lead:', err);
    } finally {
      setLoading(false);
      setLeadToDeleteId(null);
    }
  };

  const handleConvertLead = async (lead: Lead) => {
    if (lead.converted_customer_id) {
      showNotification('This lead is already converted.', 'info');
      return;
    }
    if (!confirm(`Are you sure you want to convert "${lead.lead_name}" to a customer?`)) return;

    setLoading(true);
    try {
      // 1. Create Customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          company_id: currentCompany?.id,
          customer_code: `CUST-${Date.now()}`, // Simple auto-gen code
          name: lead.company_name || lead.lead_name,
          email: lead.email,
          phone: lead.phone || lead.mobile,
          // Copy other relevant lead data to customer
        })
        .select('id')
        .single();

      if (customerError) throw customerError;

      // 2. Update Lead Status and Link to New Customer
      const { error: updateLeadError } = await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_customer_id: newCustomer.id,
          converted_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', lead.id);

      if (updateLeadError) throw updateLeadError;

      showNotification(`Lead "${lead.lead_name}" converted to customer successfully!`, 'success');
      fetchLeads(); // Refresh list
      // MODIFIED: Navigate to the new customer's edit page in Sales module
      navigate(`/sales/customers/edit/${newCustomer.id}`);
    } catch (err: any) {
      showNotification(`Failed to convert lead: ${err.message}`, 'error');
      console.error('Error converting lead:', err);
    } finally {
      setLoading(false);
    }
  };

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalLeadsCount})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Leads</h1>
          <p className={theme.textSecondary}>Manage your sales enquiries and potential customers.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/crm')} icon={<ArrowLeft size={16} />}>
            Back to CRM Dashboard
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Lead Suggestions')} />
          <Link to="/crm/leads/new">
            <Button icon={<Plus size={16} />}>Add New Lead</Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Leads</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchLeads()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          {/* Filter options can be expanded into a modal or dropdown */}
          <div className="flex items-center space-x-2">
            <select
              value={filterCriteria.status}
              onChange={(e) => setFilterCriteria(prev => ({ ...prev, status: e.target.value }))}
              className={`
                px-3 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
            <MasterSelectField
              label=""
              value={numResultsOptions.find(opt => opt.id === numResultsToShow)?.name || ''}
              onValueChange={() => {}}
              onSelect={(id) => setNumResultsToShow(id)}
              options={numResultsOptions}
              placeholder="Show"
              className="w-32"
            />
            <Button onClick={fetchLeads} disabled={loading} icon={<RefreshCw size={16} />}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No leads found. Add a new lead to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Contact</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.lead_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.company_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.phone || lead.mobile || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.lead_sources?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        lead.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'contacted' ? 'bg-sky-100 text-sky-800' :
                        lead.status === 'qualified' ? 'bg-emerald-100 text-emerald-800' :
                        lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lead.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.next_contact_date || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/crm/leads/edit/${lead.id}`}>
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      {!lead.converted_customer_id && (
                        <Button variant="ghost" size="sm" onClick={() => handleConvertLead(lead)} title="Convert to Customer">
                          <ArrowLeftRight size={16} /> {/* MODIFIED: Changed 'Convert' to 'ArrowLeftRight' */}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteLead(lead.id)} className="text-red-600 hover:text-red-800" title="Delete">
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteLead}
        title="Confirm Lead Deletion"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmText="Yes, Delete Lead"
      />
    </div>
  );
}

export default LeadListPage;
