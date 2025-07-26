// src/pages/Accounting/masters/LedgersUnderGroupPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, Edit, Trash2, RefreshCw, Search } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { useNotification } from '../../../contexts/NotificationContext';
import ConfirmationModal from '../../../components/UI/ConfirmationModal';
import MasterSelectField from '../../../components/UI/MasterSelectField';

interface Ledger {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_group: string;
  opening_balance: number;
  balance_type: string;
  is_active: boolean;
}

function LedgersUnderGroupPage() {
  const { theme } = useTheme();
  const { id: groupId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();

  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalLedgersCount, setTotalLedgersCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ledgerToDeleteId, setLedgerToDeleteId] = useState<string | null>(null);

  const [numResultsToShow, setNumResultsToShow] = useState<string>('10');

  useEffect(() => {
    if (groupId && currentCompany?.id) {
      fetchGroupAndLedgers();
    }
  }, [groupId, currentCompany?.id, searchTerm, numResultsToShow]);

  const fetchGroupAndLedgers = async () => {
    setLoading(true);
    try {
      // 1. Fetch Group Details
      const { data: group, error: groupError } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('id', groupId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (groupError) throw groupError;
      setGroupDetails(group);

      // 2. Fetch Ledgers under this group
      let query = supabase
        .from('chart_of_accounts')
        .select('*', { count: 'exact' })
        .eq('company_id', currentCompany?.id)
        .eq('parent_account_id', groupId)
        .eq('is_group', false); // Only ledgers

      if (searchTerm) {
        query = query.ilike('account_name', `%${searchTerm}%`);
      }

      query = query.order('account_name', { ascending: true });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data: ledgersData, error: ledgersError, count } = await query;

      if (ledgersError) throw ledgersError;
      setLedgers(ledgersData || []);
      setTotalLedgersCount(count || 0);

    } catch (err: any) {
      showNotification(`Error fetching group or ledgers: ${err.message}`, 'error');
      console.error('Error fetching group or ledgers:', err);
      setGroupDetails(null);
      setLedgers([]);
    } finally {
      setLoading(false);
    }
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
      fetchGroupAndLedgers();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
      </div>
    );
  }

  if (!groupDetails) {
    return (
      <div className="text-center py-12">
        <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>Account Group Not Found</h2>
        <p className={theme.textSecondary}>The requested account group could not be loaded.</p>
        <Button onClick={() => navigate('/accounting/masters/groups')} className="mt-4">
          Back to Groups
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            Ledgers under {groupDetails.account_name}
          </h1>
          <p className={theme.textSecondary}>
            View and manage ledgers categorized under this group.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/accounting/masters/groups')} icon={<ArrowLeft size={16} />}>
            Back to Groups List
          </Button>
          <Button icon={<RefreshCw size={16} />} onClick={fetchGroupAndLedgers}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Ledgers</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ledgers by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchGroupAndLedgers()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          <MasterSelectField
            label="" // No label needed for this dropdown
            value={numResultsOptions.find(opt => opt.id === numResultsToShow)?.name || ''}
            onValueChange={() => {}} // Not used for typing
            onSelect={(id) => setNumResultsToShow(id)}
            options={numResultsOptions}
            placeholder="Show"
            className="w-32"
          />
        </div>

        <div className="overflow-x-auto">
          {ledgers.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No ledgers found under this group.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Balance</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ledger.account_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{ledger.opening_balance?.toLocaleString()} ({ledger.balance_type})
                    </td>
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

export default LedgersUnderGroupPage;
