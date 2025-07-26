// src/pages/Accounting/reports/LedgerAccountPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, FileText, DollarSign, RefreshCw, Maximize, Minimize } from 'lucide-react';
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

  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false); // State for header expansion

  useEffect(() => {
    if (ledgerId && currentCompany?.id && currentPeriod?.id) {
      fetchLedgerAccountData();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && ledgerId && currentCompany?.id && currentPeriod?.id) {
        console.log('LedgerAccountPage: Document became visible, re-fetching ledger account data.');
        fetchLedgerAccountData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
    <div className="flex flex-col h-[calc(100vh-5.5rem)]"> {/* Adjusted height to account for TopNavbar (4rem) and Layout's p-6 (1.5rem) */}
      {/* Header Section */}
      <Card className={`p-4 flex-shrink-0 relative transition-all duration-300 ${isDetailsExpanded ? 'h-auto' : 'h-28 overflow-hidden'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
              {isDetailsExpanded ? ledgerDetails.account_name : `Ledger Account Report (${currentPeriod?.name})`}
            </h1>
            {!isDetailsExpanded && (
              <p className={theme.textSecondary}>
                {ledgerDetails.account_name}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button icon={<RefreshCw size={16} />} onClick={fetchLedgerAccountData}>
              Refresh
            </Button>
          </div>
        </div>
        {isDetailsExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-sm mt-4">
            <div>
              <p className={theme.textMuted}><b>Account Code:</b></p>
              <p className={theme.textPrimary}>{ledgerDetails.account_code}</p>
            </div>
            <div>
              <p className={theme.textMuted}><b>Account Group:</b></p>
              <p className={theme.textPrimary}>{ledgerDetails.account_group}</p>
            </div>
            <div>
              <p className={theme.textMuted}><b>Account Type:</b></p>
              <p className={theme.textPrimary}>{ledgerDetails.account_type}</p>
            </div>
            <div>
              <p className={theme.textMuted}><b>Opening Balance:</b></p>
              <p className={theme.textPrimary}>₹{ledgerDetails.opening_balance?.toLocaleString()} ({ledgerDetails.balance_type})</p>
            </div>
            <div>
              <p className={theme.textMuted}><b>Period:</b></p>
              <p className={theme.textPrimary}>{currentPeriod?.startDate} to {currentPeriod?.endDate}</p>
            </div>
          </div>
        )}
        {/* Expand/Reduce Icon */}
        <button
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          className={`
            absolute bottom-2 right-2 p-2 rounded-full transition-all duration-300
            ${theme.isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'}
            hover:bg-[${theme.hoverAccent}] hover:text-white
          `}
          title={isDetailsExpanded ? "Collapse Details" : "Expand Details"}
        >
          {isDetailsExpanded ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </Card>

      {/* Scrollable Transaction Section */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
        <Card className="p-6 h-full flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-auto">Particulars</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Voucher No.</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Debit</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Credit</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Balance</th>
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
                      <td className="px-3 py-2 text-sm text-gray-500">{transaction.particulars}</td>
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

      {/* Footer Section (Total Amounts Panel) */}
      <Card className={`p-2 flex-shrink-0 w-full`}>
        <div className="flex justify-around items-center text-base font-semibold">
          <div className="text-center">
            <p className={theme.textMuted}>Total Debit:</p>
            <p className="text-emerald-600">₹{totalDebit.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className={theme.textMuted}>Total Credit:</p>
            <p className="text-red-600">₹{totalCredit.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className={theme.textMuted}>Closing Balance:</p>
            <p className="text-blue-600">₹{closingBalance.toLocaleString()}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default LedgerAccountPage;
