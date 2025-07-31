// src/pages/Accounting/masters/LedgerFormPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Save, ArrowLeft, BookOpen, Users, DollarSign, Tag, Info, Bot, Mic } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import MasterSelectField from '../../../components/UI/MasterSelectField';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom'; // Import useLocation

interface AccountGroupOption {
  id: string;
  name: string;
  account_code: string;
  account_name: string;
  account_type: string;
  balance_type: string;
}

function LedgerFormPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get ID from URL for edit mode
  const location = useLocation();

  const [formData, setFormData] = useState({
    id: '',
    accountCode: '',
    accountName: '',
    accountType: 'asset', // Default type, will be derived
    accountGroup: '', // Will be populated from parent_account_id
    parentAccountId: '',
    isGroup: false, // Ledgers are not groups
    isActive: true,
    openingBalance: 0,
    balanceType: 'debit', // Default balance type, will be derived
    taxRate: 0,
    isDefault: false, // NEW: Add isDefault to form data
    notes: '', // Custom field for notes
  });

  const [availableGroups, setAvailableGroups] = useState<AccountGroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!id;
  // Flag to check if navigated from Sales Invoice Create Page
  const fromSalesInvoiceCreate = location.state?.fromInvoiceCreation === true;

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      await fetchGroups(); // Fetch groups first, as they are needed for both modes
      if (isEditMode) {
        await fetchLedgerData(id as string);
      } else {
        resetForm();
        await generateAccountCode(currentCompany?.id as string, 'USR-'); // Generate for user-created
        // Handle initialName from SalesInvoiceCreatePage
        if (location.state?.fromInvoiceCreation && location.state?.initialName) {
          setFormData(prev => ({ ...prev, accountName: location.state.initialName }));
        }
      }
      setLoading(false);
    };

    if (currentCompany?.id) {
      initializeForm();
    }
  }, [currentCompany?.id, id, isEditMode, location.state]); // Added location.state to dependencies

  const fetchGroups = async () => {
    if (!currentCompany?.id) return;
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, account_type, balance_type')
        .eq('company_id', currentCompany.id)
        .eq('is_group', true) // Fetch only groups
        .order('account_name', { ascending: true });

      if (error) throw error;
      setAvailableGroups(data.map(group => ({
        id: group.id,
        name: group.account_name,
        account_code: group.account_code,
        account_name: group.account_name,
        account_type: group.account_type,
        balance_type: group.balance_type,
      })));
    } catch (err: any) {
      showNotification(`Error fetching groups: ${err.message}`, 'error');
      console.error('Error fetching groups:', err);
    }
  };

  const fetchLedgerData = async (ledgerId: string) => {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('id', ledgerId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          accountCode: data.account_code,
          accountName: data.account_name,
          accountType: data.account_type,
          accountGroup: data.account_group,
          parentAccountId: data.parent_account_id || '',
          isGroup: data.is_group,
          isActive: data.is_active,
          openingBalance: data.opening_balance || 0,
          balanceType: data.balance_type || 'debit',
          taxRate: data.tax_rate || 0,
          isDefault: data.is_default || false, // NEW: Set isDefault from fetched data
          notes: data.comment || '', // Assuming 'comment' can be used for notes
        });
      }
    } catch (err: any) {
      showNotification(`Error loading ledger: ${err.message}`, 'error');
      console.error('Error loading ledger:', err);
      navigate('/accounting/masters/ledgers');
    }
  };

  const generateAccountCode = async (companyId: string, prefix: string) => {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('account_code')
        .eq('company_id', companyId)
        .eq('is_group', false)
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

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGroupSelect = (selectedId: string, selectedName: string, additionalData: AccountGroupOption) => {
    const derivedBalanceType = ['asset', 'expense'].includes(additionalData.account_type) ? 'debit' : 'credit';
    setFormData(prev => ({
      ...prev,
      parentAccountId: selectedId,
      accountGroup: selectedName,
      accountType: additionalData.account_type, // Inherit type from group
      balanceType: derivedBalanceType, // Inherit balance type from group
    }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      accountCode: '',
      accountName: '',
      accountType: 'asset', // Default, will be derived
      accountGroup: '',
      parentAccountId: '',
      isGroup: false,
      isActive: true,
      openingBalance: 0,
      balanceType: 'debit', // Default, will be derived
      taxRate: 0,
      isDefault: false, // NEW: Reset isDefault
      notes: '',
    });
  };

  const validateForm = () => {
    if (!formData.accountName.trim()) {
      showNotification('Ledger Name is required.', 'error');
      return false;
    }
    if (!formData.accountCode.trim()) {
      showNotification('Ledger Code is required.', 'error');
      return false;
    }
    if (!formData.parentAccountId) {
      showNotification('Account Group is required.', 'error');
      return false;
    }
    // Balance type validation is now handled by derived value, but still check opening balance sign
    if (formData.openingBalance < 0 && formData.balanceType === 'debit') {
      showNotification('Debit balance cannot be negative.', 'error');
      return false;
    }
    if (formData.openingBalance < 0 && formData.balanceType === 'credit') {
      showNotification('Credit balance cannot be negative.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!currentCompany?.id) {
      showNotification('Company information is missing. Please select a company.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const ledgerToSave = {
        company_id: currentCompany.id,
        account_code: formData.accountCode,
        account_name: formData.accountName,
        account_type: formData.accountType,
        account_group: formData.accountGroup,
        parent_account_id: formData.parentAccountId || null,
        is_group: false, // Always false for ledgers
        is_active: formData.isActive,
        opening_balance: formData.openingBalance,
        balance_type: formData.balanceType,
        tax_rate: formData.taxRate,
        is_default: formData.isDefault, // NEW: Save is_default
        comment: formData.notes, // Using 'comment' for notes
      };

      let newLedgerId = formData.id;
      if (formData.id) {
        const { error } = await supabase
          .from('chart_of_accounts')
          .update(ledgerToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Ledger updated successfully!', 'success');
      } else {
        const { data, error } = await supabase
          .from('chart_of_accounts')
          .insert(ledgerToSave)
          .select('id, account_name')
          .single();
        if (error) throw error;
        newLedgerId = data.id;
        showNotification('Ledger created successfully!', 'success');
      }

      if (fromSalesInvoiceCreate) {
        navigate(location.state.returnPath, {
          replace: true,
          state: {
            fromInvoiceCreation: true,
            createdId: newLedgerId,
            createdName: formData.accountName,
            masterType: 'account'
          }
        });
      } else {
        navigate('/accounting/masters/ledgers');
      }
      resetForm();
     } catch (err: any) {
      showNotification(`Failed to save ledger: ${err.message}`, 'error');
      console.error('Save ledger error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI Integration Handlers (Placeholders)
  const handleAISuggestion = (suggestion: any) => {
    // Logic to apply AI suggestion to form fields
    console.log('AI Suggestion:', suggestion);
    showNotification('AI suggestion applied!', 'info');
  };

  const handleAITeach = (correction: any) => {
    // Logic to teach AI from user correction
    console.log('AI Correction:', correction);
    showNotification('AI learned from your correction!', 'info');
  };

  // Get the full path of the selected parent group for display
  const getFullAccountGroupPath = () => {
    if (!formData.parentAccountId) return 'N/A';
    const selectedGroup = availableGroups.find(g => g.id === formData.parentAccountId);
    if (!selectedGroup) return 'N/A';

    let path = selectedGroup.account_name;
    let current = selectedGroup;
    // This loop assumes a flat structure or a very specific hierarchy for simplicity
    // A more robust solution would involve recursively finding parents if the hierarchy is deep
    // For now, it just displays the selected group's name.
    return path;
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {isEditMode ? 'Edit Ledger' : 'Add New Ledger'}
          </h1>
          <p className={theme.textSecondary}>
            {isEditMode ? 'Update existing ledger account details.' : 'Create a new financial ledger account.'}
          </p>
        </div>
        {!fromSalesInvoiceCreate && (
          <Button variant="outline" onClick={() => navigate('/accounting/masters/ledgers')} icon={<ArrowLeft size={16} />}>
            Back to Ledgers List
          </Button>
        )}
        {fromSalesInvoiceCreate && (
          <Button variant="outline" onClick={() => navigate(location.state.returnPath, { replace: true, state: { fromInvoiceCreation: true } })} icon={<ArrowLeft size={16} />}>
            Cancel
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 overflow-visible">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <BookOpen size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Ledger Name"
                value={formData.accountName}
                onChange={(val) => handleInputChange('accountName', val)}
                placeholder="e.g., Cash, Sales, Rent Expense"
                required
                aiHelper={true}
                context="ledger_name"
                onAISuggestion={handleAISuggestion}
                onAITeach={handleAITeach}
              />
              <FormField
                label="Ledger Code"
                value={formData.accountCode}
                onChange={(val) => handleInputChange('accountCode', val)}
                placeholder="e.g., USR-0001"
                required
                aiHelper={true}
                context="ledger_code"
                onAISuggestion={handleAISuggestion}
                onAITeach={handleAITeach}
              />
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <MasterSelectField
                  label="Account Group"
                  value={availableGroups.find(group => group.id === formData.parentAccountId)?.name || ''}
                  onValueChange={(val) => handleInputChange('accountGroup', val)} // This updates the text input
                  onSelect={(id, name, data) => handleGroupSelect(id, name, data as AccountGroupOption)}
                  options={availableGroups}
                  placeholder="Select Group"
                  required
                  aiHelper={true}
                  context="account_group"
                  onAISuggestion={handleAISuggestion}
                  onAITeach={handleAITeach}
                />
                <div className="flex items-center space-x-3 pt-7"> {/* pt-7 to align with MasterSelectField label */}
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                  <label htmlFor="isActive" className={`text-sm font-medium ${theme.textPrimary}`}>Is Active</label>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${theme.textPrimary} mb-1`}>Mapped Account Type</label>
                <p className={`text-md ${theme.textMuted}`}>
                  {getFullAccountGroupPath()} ({formData.accountType.charAt(0).toUpperCase() + formData.accountType.slice(1)})
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <DollarSign size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Opening Balance & Tax
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Opening Balance"
                type="number"
                value={formData.openingBalance.toString()}
                onChange={(val) => handleInputChange('openingBalance', parseFloat(val) || 0)}
                icon={<DollarSign size={18} />}
              />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.textPrimary}`}>Balance Type</label>
                <select
                  value={formData.balanceType}
                  onChange={(e) => handleInputChange('balanceType', e.target.value)}
                  className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
                >
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
              <FormField
                label="Tax Rate (%)"
                type="number"
                value={formData.taxRate.toString()}
                onChange={(val) => handleInputChange('taxRate', parseFloat(val) || 0)}
                icon={<Tag size={18} />}
              />
              <div className="flex items-center space-x-3"> {/* NEW: isDefault checkbox */}
                <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={(e) => handleInputChange('isDefault', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                <label htmlFor="isDefault" className={`text-sm font-medium ${theme.textPrimary}`}>Mark as Default</label>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <Info size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Notes
            </h3>
            <FormField
              label="Notes"
              value={formData.notes}
              onChange={(val) => handleInputChange('notes', val)}
              placeholder="Any additional notes for this ledger"
              className="md:col-span-2"
            />
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => {
              if (fromSalesInvoiceCreate) {
                navigate(location.state.returnPath, { replace: true, state: { fromInvoiceCreation: true } });
              } else {
                navigate('/accounting/masters/ledgers');
              }
            }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} icon={<Save size={16} />}>
              {isSubmitting ? 'Saving...' : 'Save Ledger'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default LedgerFormPage;