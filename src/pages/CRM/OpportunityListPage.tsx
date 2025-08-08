// src/pages/CRM/OpportunityListPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Target, Edit, Trash2, RefreshCw, ArrowLeft, Filter, DollarSign, Calendar, Users } from 'lucide-react';
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

interface Opportunity {
  id: string;
  opportunity_name: string;
  customer_id: string | null;
  lead_id: string | null;
  opportunity_amount: number | null;
  probability: number | null;
  stage: string;
  expected_close_date: string | null;
  actual_close_date: string | null;
  next_step: string | null;
  description: string | null;
  competitor: string | null;
  created_at: string;
  // Joined data
  customers?: { name: string } | null;
  leads?: { lead_name: string } | null;
  opportunity_owner?: { first_name: string; last_name: string } | null;
}

function OpportunityListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalOpportunitiesCount, setTotalOpportunitiesCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [opportunityToDeleteId, setOpportunityToDeleteId] = useState<string | null>(null);

  const [filterCriteria, setFilterCriteria] = useState({
    name: '',
    stage: 'all',
    customer: '',
    owner: '',
    expectedCloseDateBefore: '',
    expectedCloseDateAfter: '',
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10');

  const [availableCustomers, setAvailableCustomers] = useState<{ id: string; name: string }[]>([]);
  const [availableOwners, setAvailableOwners] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchOpportunities();
      fetchMasterData(currentCompany.id);
    }
  }, [currentCompany?.id, filterCriteria, numResultsToShow, searchTerm]);

  const fetchOpportunities = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('opportunities')
        .select(`
          *,
          customers ( name ),
          leads ( lead_name ),
          opportunity_owner:employees ( first_name, last_name )
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id);

      if (searchTerm) {
        query = query.ilike('opportunity_name', `%${searchTerm}%`);
      }

      if (filterCriteria.name) {
        query = query.ilike('opportunity_name', `%${filterCriteria.name}%`);
      }
      if (filterCriteria.stage !== 'all') {
        query = query.eq('stage', filterCriteria.stage);
      }
      if (filterCriteria.customer) {
        query = query.eq('customer_id', filterCriteria.customer);
      }
      if (filterCriteria.owner) {
        query = query.eq('opportunity_owner_id', filterCriteria.owner);
      }
      if (filterCriteria.expectedCloseDateBefore) {
        query = query.lte('expected_close_date', filterCriteria.expectedCloseDateBefore);
      }
      if (filterCriteria.expectedCloseDateAfter) {
        query = query.gte('expected_close_date', filterCriteria.expectedCloseDateAfter);
      }

      query = query.order('expected_close_date', { ascending: true });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setOpportunities(data || []);
      setTotalOpportunitiesCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching opportunities: ${err.message}`, 'error');
      console.error('Error fetching opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async (companyId: string) => {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (customersError) throw customersError;
      setAvailableCustomers(customersData || []);

      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .eq('status', 'active');
      if (employeesError) throw employeesError;
      setAvailableOwners(employeesData.map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}` })) || []);

    } catch (error) {
      console.error('Error fetching master data:', error);
      showNotification('Failed to load customers or employees.', 'error');
    }
  };

  const handleDeleteOpportunity = (opportunityId: string) => {
    setOpportunityToDeleteId(opportunityId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteOpportunity = async () => {
    if (!opportunityToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', opportunityToDeleteId);

      if (error) throw error;
      showNotification('Opportunity deleted successfully!', 'success');
      fetchOpportunities();
    } catch (err: any) {
      showNotification(`Error deleting opportunity: ${err.message}`, 'error');
      console.error('Error deleting opportunity:', err);
    } finally {
      setLoading(false);
      setOpportunityToDeleteId(null);
    }
  };

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalOpportunitiesCount})` },
  ];

  const opportunityStages = [
    { id: 'all', name: 'All Stages' },
    { id: 'prospecting', name: 'Prospecting' },
    { id: 'qualification', name: 'Qualification' },
    { id: 'proposal', name: 'Proposal' },
    { id: 'negotiation', name: 'Negotiation' },
    { id: 'closed_won', name: 'Closed Won' },
    { id: 'closed_lost', name: 'Closed Lost' },
  ];

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'prospecting': return 'bg-blue-100 text-blue-800';
      case 'qualification': return 'bg-sky-100 text-sky-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-yellow-100 text-yellow-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Opportunities</h1>
          <p className={theme.textSecondary}>Track and manage your sales opportunities and deals.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/crm')} icon={<ArrowLeft size={16} />}>
            Back to CRM Dashboard
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Opportunity Suggestions')} />
          <Link to="/crm/opportunities/new">
            <Button icon={<Plus size={16} />}>Add New Opportunity</Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Opportunities</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search opportunities by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchOpportunities()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          {/* Filter options */}
          <div className="flex items-center space-x-2">
            <select
              value={filterCriteria.stage}
              onChange={(e) => setFilterCriteria(prev => ({ ...prev, stage: e.target.value }))}
              className={`
                px-3 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            >
              {opportunityStages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
            <MasterSelectField
              label=""
              value={availableCustomers.find(cust => cust.id === filterCriteria.customer)?.name || ''}
              onValueChange={(val) => setFilterCriteria(prev => ({ ...prev, customer: val }))}
              onSelect={(id) => setFilterCriteria(prev => ({ ...prev, customer: id }))}
              options={availableCustomers}
              placeholder="Customer"
              className="w-32"
            />
            <MasterSelectField
              label=""
              value={availableOwners.find(owner => owner.id === filterCriteria.owner)?.name || ''}
              onValueChange={(val) => setFilterCriteria(prev => ({ ...prev, owner: val }))}
              onSelect={(id) => setFilterCriteria(prev => ({ ...prev, owner: id }))}
              options={availableOwners}
              placeholder="Owner"
              className="w-32"
            />
            <Button onClick={fetchOpportunities} disabled={loading} icon={<RefreshCw size={16} />}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No opportunities found. Add a new opportunity to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Close</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{opportunity.opportunity_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{opportunity.customers?.name || opportunity.leads?.lead_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{opportunity.opportunity_amount?.toLocaleString() || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(opportunity.stage)}`}>
                        {opportunity.stage.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{opportunity.probability}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{opportunity.expected_close_date || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{opportunity.opportunity_owner ? `${opportunity.opportunity_owner.first_name} ${opportunity.opportunity_owner.last_name}` : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/crm/opportunities/edit/${opportunity.id}`}>
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteOpportunity(opportunity.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        onConfirm={confirmDeleteOpportunity}
        title="Confirm Opportunity Deletion"
        message="Are you sure you want to delete this opportunity? This action cannot be undone."
        confirmText="Yes, Delete Opportunity"
      />
    </div>
  );
}

export default OpportunityListPage;

