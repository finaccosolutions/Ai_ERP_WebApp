// src/pages/Accounting/reports/LedgerAccountPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, FileText, DollarSign, RefreshCw, Eye, EyeOff } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { useNotification } from '../../../contexts/NotificationContext';

interface JournalEntryItem {
  id: string;
  entry_id: string;
  posting_date: string; // From journal_entries
  entry_no: string; // From journal_entries
  debit_amount: number;
  credit_amount: number;
  user_remark: string; // From journal_entries
  particulars: string; // Derived from other side of entry
}

function LedgerAccountPage() {
  const { theme } = useTheme();
  const { id: ledgerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCompany, currentPeriod } = useCompany();
  const { showNotification } = useNotification();

  const [ledgerDetails, setLedgerDetails] = useState<any>(null);
  const [transactions, setTransactions] = useState<JournalEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  const [showHeaderPanel, setShowHeaderPanel] = useState(true); // State for header visibility
  const [showFooterPanel, setShowFooterPanel] = useState(true); // State for footer visibility

  useEffect(() => {
    if (ledgerId && currentCompany?.id && currentPeriod?.id) {
      fetchLedgerAccountData();
    }
  }, [ledgerId, currentCompany?.id, currentPeriod?.id]);

  const fetchLedgerAccountData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Ledger Details
      const { data: ledger, error: ledgerError } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('id', ledgerId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (ledgerError) throw ledgerError;
      setLedgerDetails(ledger);

      // 2. Fetch Journal Entry Items for this ledger within the current period
      const { data: entryItems, error: entryItemsError } = await supabase
        .from('journal_entry_items')
        .select(`
          id, debit_amount, credit_amount,
          journal_entries ( entry_no, posting_date, user_remark, id )
        `)
        .eq('account_id', ledgerId)
        .gte('journal_entries.posting_date', currentPeriod?.startDate)
        .lte('journal_entries.posting_date', currentPeriod?.endDate);

      if (entryItemsError) throw entryItemsError;

      // 3. Process transactions and calculate running balance
      let runningBalance = ledger.opening_balance || 0;
      let currentTotalDebit = 0;
      let currentTotalCredit = 0;

      const processedTransactions: JournalEntryItem[] = [];

      // Sort client-side by posting_date
      const sortedEntryItems = entryItems.sort((a, b) => {
        const dateA = new Date(a.journal_entries?.posting_date || 0).getTime();
        const dateB = new Date(b.journal_entries?.posting_date || 0).getTime();
        return dateA - dateB;
      });


      for (const item of sortedEntryItems) { // Use sorted items here
        const debit = item.debit_amount || 0;
        const credit = item.credit_amount || 0;

        runningBalance += (debit - credit);
        currentTotalDebit += debit;
        currentTotalCredit += credit;

        // For 'Particulars', we'd ideally fetch the other side of the journal entry.
        // For simplicity here, we'll use the user_remark from the main journal entry.
        // In a real system, this would involve more complex queries to get the 'against account'.
        processedTransactions.push({
          id: item.id,
          entry_id: item.journal_entries?.id,
          posting_date: item.journal_entries?.posting_date,
          entry_no: item.journal_entries?.entry_no,
          debit_amount: debit,
          credit_amount: credit,
          user_remark: item.journal_entries?.user_remark || '',
          particulars: item.journal_entries?.user_remark || `Entry for ${ledger.account_name}`,
        });
      }

      setTransactions(processedTransactions);
      setTotalDebit(currentTotalDebit);
      setTotalCredit(currentTotalCredit);
      setClosingBalance(runningBalance);

    } catch (err: any) {
      showNotification(`Error fetching ledger account data: ${err.message}`, 'error');
      console.error('Error fetching ledger account data:', err);
      setLedgerDetails(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
      </div>
    );
  }

  if (!ledgerDetails) {
    return (
      <div className="text-center py-12">
        <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>Ledger Not Found</h2>
        <p className={theme.textSecondary}>The requested ledger account could not be loaded.</p>
        <Button onClick={() => navigate('/accounting/masters/ledgers')} className="mt-4">
          Back to Ledgers
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem-24px)]"> {/* Adjust height for header/footer */}
      {/* Header Section */}
      <Card className={`p-4 mb-2 flex-shrink-0 transition-all duration-300 ${showHeaderPanel ? 'block' : 'hidden'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
              {ledgerDetails.account_name}
            </h1>
            <p className={theme.textSecondary}>
              Ledger Account Report ({currentPeriod?.name})
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button icon={<RefreshCw size={16} />} onClick={fetchLedgerAccountData}>
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowHeaderPanel(!showHeaderPanel)}
              icon={showHeaderPanel ? <EyeOff size={16} /> : <Eye size={16} />}
              title={showHeaderPanel ? "Hide Details" : "Show Details"}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-sm mt-4">
          <div>
            <p className={theme.textMuted}>Account Code:</p>
            <p className={theme.textPrimary}>{ledgerDetails.account_code}</p>
          </div>
          <div>
            <p className={theme.textMuted}>Account Group:</p>
            <p className={theme.textPrimary}>{ledgerDetails.account_group}</p>
          </div>
          <div>
            <p className={theme.textMuted}>Account Type:</p>
            <p className={theme.textPrimary}>{ledgerDetails.account_type}</p>
          </div>
          <div>
            <p className={theme.textMuted}>Opening Balance:</p>
            <p className={theme.textPrimary}>₹{ledgerDetails.opening_balance?.toLocaleString()} ({ledgerDetails.balance_type})</p>
          </div>
          <div>
            <p className={theme.textMuted}>Period:</p>
            <p className={theme.textPrimary}>{currentPeriod?.startDate} to {currentPeriod?.endDate}</p>
          </div>
        </div>
      </Card>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-auto">Particulars</th> {/* Increased width */}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Voucher No.</th> {/* Reduced width */}
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Debit</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Credit</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No transactions found for this period.</td>
                  </tr>
                ) : (
                  transactions.map((transaction, index) => (
                    <tr key={transaction.id}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.posting_date}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{transaction.particulars}</td> {/* Allow text wrapping */}
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{transaction.entry_no}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">₹{transaction.debit_amount?.toLocaleString()}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">₹{transaction.credit_amount?.toLocaleString()}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {/* Running balance calculation would be here if needed per row */}
                        {/* For simplicity, this column will show the final closing balance for now */}
                        {index === transactions.length - 1 ? `₹${closingBalance.toLocaleString()}` : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Footer Section */}
      <Card className={`p-4 mt-2 flex-shrink-0 transition-all duration-300 ${showFooterPanel ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-base font-semibold">
          <div>
            <p className={theme.textMuted}>Total Debit:</p>
            <p className="text-emerald-600">₹{totalDebit.toLocaleString()}</p>
          </div>
          <div>
            <p className={theme.textMuted}>Total Credit:</p>
            <p className="text-red-600">₹{totalCredit.toLocaleString()}</p>
          </div>
          <div>
            <p className={theme.textMuted}>Closing Balance:</p>
            <p className="text-blue-600">₹{closingBalance.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <Button
            variant="outline"
            onClick={() => setShowFooterPanel(!showFooterPanel)}
            icon={showFooterPanel ? <EyeOff size={16} /> : <Eye size={16} />}
            title={showFooterPanel ? "Hide Totals" : "Show Totals"}
          />
        </div>
      </Card>
    </div>
  );
}

export default LedgerAccountPage;
