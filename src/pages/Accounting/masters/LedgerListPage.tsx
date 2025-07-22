// src/pages/Accounting/masters/LedgerListPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Edit, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import MasterSelectField from '../../../components/UI/MasterSelectField';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import ConfirmationModal from '../../../components/UI/ConfirmationModal';

interface Ledger {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_group: string;
  is_group: boolean;
  opening_balance: number;
  balance_type: string;
  created_at: string;
  parent_account_id: string | null; // Keep this as ID
  parent_account_name?: string; // Add a field for the resolved parent name
}

function LedgerListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalLedgersCount, setTotalLedgersCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ledgerToDeleteId, setLedgerToDeleteId] = useState<string | null>(null);

  // Filter state (basic for now, can be expanded)
  const [filterCriteria, setFilterCriteria] = useState({
    name: '',
    group: '',
    type: 'all',
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10');

  useEffect(() => {
    if (currentCompany?.id) {
      fetchLedgers();
    }
  }, [currentCompany?.id, filterCriteria, numResultsToShow]);

  const fetchLedgers = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      // First, fetch all chart of accounts to create a lookup map for parent names
      const { data: allAccounts, error: allAccountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_name')
        .eq('company_id', currentCompany.id);

      if (allAccountsError) throw allAccountsError;

      const accountNameMap = new Map(allAccounts.map(acc => [acc.id, acc.account_name]));

      // Now, fetch ledgers without the problematic join
      let query = supabase
        .from('chart_of_accounts')
        .select(`
          id, account_code, account_name, account_type, account_group,
          is_group, opening_balance, balance_type, created_at, parent_account_id
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id)
        .eq('is_group', false); // Only fetch ledgers, not groups

      // Apply search term
      if (searchTerm) {
        query = query.ilike('account_name', `%${searchTerm}%`);
      }

      // Apply filters
      if (filterCriteria.name) {
        query = query.ilike('account_name', `%${filterCriteria.name}%`);
      }
      if (filterCriteria.group) {
        query = query.eq('account_group', filterCriteria.group);
      }
      if (filterCriteria.type !== 'all') {
        query = query.eq('account_type', filterCriteria.type);
      }

      query = query.order('account_name', { ascending: true });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Manually resolve parent account names
      const resolvedLedgers: Ledger[] = data.map(ledger => ({
        ...ledger,
        parent_account_name: ledger.parent_account_id ? accountNameMap.get(ledger.parent_account_id) : null,
      }));

      setLedgers(resolvedLedgers);
      setTotalLedgersCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching ledgers: ${err.message}`, 'error');
      console.error('Error fetching ledgers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    // In a real app, you might have a filter modal here
  };

  const handleDeleteLedger = (ledgerId: string) => {
    setLedgerToDeleteId(ledgerId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLedger = async () => {
    if (!ledgerToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      // Check if any journal entries are linked to this ledger
      const { count: linkedEntriesCount, error: entriesCountError } = await supabase
        .from('journal_entry_items')
        .select('count', { count: 'exact', head: true })
        .eq('account_id', ledgerToDeleteId);

      if (entriesCountError) throw entriesCountError;

      if (linkedEntriesCount && linkedEntriesCount > 0) {
        showNotification(`Cannot delete ledger: ${linkedEntriesCount} journal entry item(s) are linked to it.`, 'error');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('id', ledgerToDeleteId);

      if (error) throw error;
      showNotification('Ledger deleted successfully!', 'success');
      fetchLedgers();
    } catch (err: any) {
      showNotification(`Error deleting ledger: ${err.message}`, 'error');
      console.error('Error deleting ledger:', err);
    } finally {
      setLoading(false);
      setLedgerToDeleteId(null);
    }
  };

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalLedgersCount})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Ledgers</h1>
          <p className={theme.textSecondary}>Manage all your financial ledger accounts.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/accounting')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Ledger Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => navigate('/accounting/masters/ledgers/new')}>
            Add Ledger
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Ledgers</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ledgers by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchLedgers()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          {/* Filter dropdowns can be added here */}
          <MasterSelectField
            label="" // No label needed for this dropdown
            value={numResultsOptions.find(opt => opt.id === numResultsToShow)?.name || ''}
            onValueChange={() => {}} // Not used for typing
            onSelect={(id) => setNumResultsToShow(id)}
            options={numResultsOptions}
            placeholder="Show"
            className="w-32"
          />
          <Button onClick={fetchLedgers} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : ledgers.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No ledgers found. Add a new ledger to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closing Balance</th> {/* Changed header */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th> {/* New column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th> {/* New column */}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ledgers.map((ledger) => (
                  <tr key={ledger.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/accounting/ledgers/${ledger.id}/report`} className="text-blue-600 hover:underline">
                        {ledger.account_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ledger.account_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ledger.account_group}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{ledger.opening_balance?.toLocaleString()} {/* Simplified for now */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹0.00</td> {/* Placeholder */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹0.00</td> {/* Placeholder */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/accounting/masters/ledgers/edit/${ledger.id}`)} title="Edit">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteLedger(ledger.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        onConfirm={confirmDeleteLedger}
        title="Confirm Ledger Deletion"
        message="Are you sure you want to delete this ledger? This action cannot be undone. All associated journal entries will be affected."
        confirmText="Yes, Delete Ledger"
      />
    </div>
  );
}

export default LedgerListPage;