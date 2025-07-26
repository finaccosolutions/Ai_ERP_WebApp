// src/pages/Accounting/masters/AccountGroupsPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Edit, Trash2, RefreshCw, Save, ArrowLeft, Filter } from 'lucide-react';
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

interface AccountGroup {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  balance_type: string;
  is_group: boolean;
  is_active: boolean;
  created_at: string;
  parent_account_id: string | null; // Keep this as ID
  parent_account_name?: string; // Add a field for the resolved parent name
}

function AccountGroupsPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalGroupsCount, setTotalGroupsCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [formData, setFormData] = useState({
    id: '',
    accountCode: '',
    accountName: '',
    accountType: 'asset', // Default type
    parentAccountId: '',
    isActive: true,
    balanceType: 'debit', // Default balance type
  });

  // Filter state (basic for now, can be expanded)
  const [filterCriteria, setFilterCriteria] = useState({
    name: '',
    type: 'all',
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10');


  useEffect(() => {
    if (currentCompany?.id) {
      fetchGroups();
    }
  }, [currentCompany?.id, filterCriteria, numResultsToShow, searchTerm]); // Added searchTerm to dependencies for real-time search

  const fetchGroups = async () => {
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

      // Now, fetch groups without the problematic join
      let query = supabase
        .from('chart_of_accounts')
        .select(`
          id, account_code, account_name, account_type, balance_type,
          is_group, is_active, created_at, parent_account_id
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id)
        .eq('is_group', true); // Only fetch groups

      // Apply search term
      if (searchTerm) {
        query = query.ilike('account_name', `%${searchTerm}%`);
      }

      // Apply filters
      if (filterCriteria.name) {
        query = query.ilike('account_name', `%${filterCriteria.name}%`);
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
      const resolvedGroups: AccountGroup[] = data.map(group => ({
        ...group,
        parent_account_name: group.parent_account_id ? accountNameMap.get(group.parent_account_id) : null,
      }));

      setGroups(resolvedGroups);
      setTotalGroupsCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching account groups: ${err.message}`, 'error');
      console.error('Error fetching account groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      accountCode: '',
      accountName: '',
      accountType: 'asset',
      parentAccountId: '',
      isActive: true,
      balanceType: 'debit',
    });
  };

  const generateAccountCode = async (companyId: string, prefix: string) => {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('account_code')
        .eq('company_id', companyId)
        .eq('is_group', true)
        .ilike('account_code', `${prefix}%`)
        .order('account_code', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastCode = data[0].account_code;
        const lastNum = parseInt(lastCode.replace(prefix, ''));
        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        }
      }
      const newAccountCode = `${prefix}${String(nextNumber).padStart(4, '0')}`;
      setFormData(prev => ({ ...prev, accountCode: newAccountCode }));
    } catch (err) {
      console.error('Error generating account code:', err);
      showNotification('Failed to generate account code. Please enter manually.', 'error');
    }
  };

  const validateForm = () => {
    if (!formData.accountName.trim()) {
      showNotification('Group Name is required.', 'error');
      return false;
    }
    if (!formData.accountCode.trim()) {
      showNotification('Group Code is required.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!currentCompany?.id) {
      showNotification('Company information is missing.', 'error');
      return;
    }

    setLoading(true);
    try {
      const derivedBalanceType = ['asset', 'expense'].includes(formData.accountType) ? 'debit' : 'credit';
      const groupToSave = {
        company_id: currentCompany.id,
        account_code: formData.accountCode,
        account_name: formData.accountName,
        account_type: formData.accountType,
        account_group: formData.accountName, // Group name is also its own group
        parent_account_id: formData.parentAccountId || null,
        is_group: true, // Always true for groups
        is_active: formData.isActive,
        balance_type: derivedBalanceType, // Derived balance type
      };

      if (formData.id) {
        const { error } = await supabase
          .from('chart_of_accounts')
          .update(groupToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Account group updated successfully!', 'success');
      } else {
        const { data, error } = await supabase
          .from('chart_of_accounts')
          .insert(groupToSave);
        if (error) throw error;
        showNotification('Account group created successfully!', 'success');
      }
      setViewMode('list');
      resetForm();
      fetchGroups();
    } catch (err: any) {
      showNotification(`Failed to save account group: ${err.message}`, 'error');
      console.error('Save account group error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = (group: AccountGroup) => {
    setFormData({
      id: group.id,
      accountCode: group.account_code,
      accountName: group.account_name,
      accountType: group.account_type,
      parentAccountId: group.parent_account_id || '',
      isActive: group.is_active,
      balanceType: group.balance_type,
    });
    setViewMode('edit');
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroupToDeleteId(groupId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      // Check if any ledgers or sub-groups are linked to this group
      const { count: linkedAccountsCount, error: accountsCountError } = await supabase
        .from('chart_of_accounts')
        .select('count', { count: 'exact', head: true })
        .eq('parent_account_id', groupToDeleteId);

      if (accountsCountError) throw accountsCountError;

      if (linkedAccountsCount && linkedAccountsCount > 0) {
        showNotification(`Cannot delete group: ${linkedAccountsCount} ledger(s) or sub-group(s) are linked to it. Please reassign them first.`, 'error');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('id', groupToDeleteId);

      if (error) throw error;
      showNotification('Account group deleted successfully!', 'success');
      fetchGroups();
    } catch (err: any) {
      showNotification(`Error deleting account group: ${err.message}`, 'error');
      console.error('Error deleting account group:', err);
    } finally {
      setLoading(false);
      setGroupToDeleteId(null);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    // In a real app, you might have a filter modal here
  };

  // Helper function to format balance with Dr/Cr (placeholder for groups)
  const formatBalance = (amount: number, accountType: string): string => {
    const formattedAmount = `₹${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    let type: 'Dr' | 'Cr';
    if (accountType === 'asset' || accountType === 'expense') {
      type = amount >= 0 ? 'Dr' : 'Cr';
    } else { // liability, equity, income
      type = amount >= 0 ? 'Cr' : 'Dr';
    }
    return `${formattedAmount} ${type}`;
  };

  const numResultsOptions = [
    { id: '10', name: 'Top 10' },
    { id: '25', name: 'Top 25' },
    { id: '50', name: 'Top 50' },
    { id: '100', name: 'Top 100' },
    { id: totalGroupsCount.toString(), name: `Show All (${totalGroupsCount})` },
  ];

  const handleNumResultsSelect = (id: string) => {
    setNumResultsToShow(id);
    setSearchTerm(''); // Clear search term when selecting predefined option
  };

  const handleNumResultsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const num = parseInt(searchTerm);
      if (!isNaN(num) && num > 0) {
        setNumResultsToShow(num.toString());
      } else {
        showNotification('Please enter a valid number.', 'error');
      }
    }
  };

  // Filter available parent groups for the dropdown (cannot be its own child)
  const availableParentGroups = groups.filter(group => group.id !== formData.id);

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
              {viewMode === 'create' ? 'Create New Account Group' : 'Edit Account Group'}
            </h1>
            <p className={theme.textSecondary}>
              {viewMode === 'create' ? 'Define a new category for your ledger accounts.' : 'Update account group details.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }} icon={<ArrowLeft size={16} />}>
            Back to Groups List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <Users size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Group Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Group Name"
                value={formData.accountName}
                onChange={(val) => handleInputChange('accountName', val)}
                placeholder="e.g., Current Assets, Direct Expenses"
                required
              />
              <FormField
                label="Group Code"
                value={formData.accountCode}
                onChange={(val) => handleInputChange('accountCode', val)}
                placeholder="e.g., GRP-0001"
                required
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Account Type</label>
                <select
                  value={formData.accountType}
                  onChange={(e) => handleInputChange('accountType', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <MasterSelectField
                label="Parent Group"
                value={availableParentGroups.find(group => group.id === formData.parentAccountId)?.account_name || ''}
                onValueChange={(val) => {}}
                onSelect={(id) => handleInputChange('parentAccountId', id)}
                options={availableParentGroups.map(group => ({ id: group.id, name: group.account_name }))}
                placeholder="Select Parent (Optional)"
              />
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                <label htmlFor="isActive" className={`text-sm font-medium ${theme.textPrimary}`}>Is Active</label>
              </div>
            </div>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} icon={<Save size={16} />}>
              {loading ? 'Saving...' : 'Save Group'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Account Groups</h1>
          <p className={theme.textSecondary}>Categorize your ledger accounts for better financial reporting.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/accounting')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Group Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); generateAccountCode(currentCompany?.id as string, 'GRP-'); }}>
            Create New
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Account Groups</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchGroups()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          {/* Number of Items Control */}
          <div className="flex items-center space-x-2">
            <MasterSelectField
              label="" // No label needed for this dropdown
              value={numResultsOptions.find(opt => opt.id === numResultsToShow)?.name || searchTerm} // Display selected name or typed search term
              onValueChange={setSearchTerm} // Update searchTerm on type
              onSelect={handleNumResultsSelect} // Handle predefined options
              options={numResultsOptions}
              placeholder="Show"
              className="w-32"
              onKeyDown={handleNumResultsKeyDown} // Handle custom number input
            />
            <Button onClick={fetchGroups} disabled={loading} icon={<RefreshCw size={16} />}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No account groups found. Create a new one to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/accounting/groups/${group.id}/ledgers`} className="text-blue-600 hover:underline">
                        {group.account_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.account_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.account_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.parent_account_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹0.00</td> {/* Placeholder */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹0.00</td> {/* Placeholder */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹0.00</td> {/* Placeholder */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => handleEditGroup(group)} title="Edit">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        onConfirm={confirmDeleteGroup}
        title="Confirm Account Group Deletion"
        message="Are you sure you want to delete this account group? This action cannot be undone. All linked ledgers and sub-groups will be affected."
        confirmText="Yes, Delete Group"
      />
    </div>
  );
}

export default AccountGroupsPage;
