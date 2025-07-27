// src/pages/Accounting/Accounting.tsx
import React, { useState, useEffect } from 'react';
import { Link, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import {
  Calculator, FileText, TrendingUp, DollarSign, Plus, Calendar,
  BookOpen, // Ledger icon
  Users, // Groups icon
  CreditCard, // Payments icon
  Receipt, // Receipts icon
  ArrowLeftRight, // Contra icon
  ClipboardList, // Journal icon
  ShoppingCart, // Sales voucher icon
  ArrowDownLeft, // Sales Return icon
  Package, // Purchase voucher icon
  ArrowUpRight, // Purchase Return icon
  FileBadge, // Credit Note icon
  FileMinus, // Debit Note icon
  Banknote, // Bank Reconciliation icon
  Scale, // Ledger Reconciliation icon
  Building, // Asset Register icon
  Percent, // Depreciation icon
  LayoutGrid, // Cost Centers icon
  FolderOpen, // Cost Categories icon
  BarChart3, // Reports icon
  Settings, // Settings icon
  Bot, // AI icon
  ArrowLeft // Back button
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

// Import sub-pages for Masters
import LedgerListPage from './masters/LedgerListPage';
import LedgerFormPage from './masters/LedgerFormPage';
import AccountGroupsPage from './masters/AccountGroupsPage';
import LedgersUnderGroupPage from './masters/LedgersUnderGroupPage'; // NEW: Import LedgersUnderGroupPage

// Import Accounting-specific voucher pages (these are not reused from Sales/Purchase)
import PaymentsPage from './vouchers/PaymentsPage';
import ReceiptsPage from './vouchers/ReceiptsPage';
import ContraPage from './vouchers/ContraPage';
import JournalPage from './vouchers/JournalPage';
import LedgerAccountPage from './reports/LedgerAccountPage'; // NEW: Import LedgerAccountPage


function Accounting() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { hasPermission } = useAuth();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('masters'); // Default active tab
  const [accountingMetrics, setAccountingMetrics] = useState({
    ledgers: { count: '0' },
    groups: { count: '0' },
    payments: { count: '0', totalAmount: '0' },
    receipts: { count: '0', totalAmount: '0' },
    contra: { count: '0' },
    journal: { count: '0' },
    salesVouchers: { count: '0', totalAmount: '0' },
    salesReturns: { count: '0', totalAmount: '0' }, // Assuming sales_returns has total_amount
    purchaseVouchers: { count: '0', totalAmount: '0' },
    purchaseReturns: { count: '0', totalAmount: '0' }, // Assuming purchase_returns has total_amount
    creditNotes: { count: '0', totalAmount: '0' },
    debitNotes: { count: '0', totalAmount: '0' }, // Assuming debit_notes has total_amount
    assets: { count: '0', totalValue: '0' },
    costCenters: { count: '0' },
    costCategories: { count: '0' },
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchAccountingMetrics(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const fetchAccountingMetrics = async (companyId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Accounting.tsx: Supabase session at fetchAccountingMetrics start:', session);

    setLoadingMetrics(true);
    try {
      // Fetch counts for Ledgers and Groups
      const { count: ledgersCount, error: ledgersCountError } = await supabase.from('chart_of_accounts').select('count', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_group', false);
      if (ledgersCountError) console.error('Accounting.tsx: Error fetching ledgers count:', ledgersCountError);

      const { count: groupsCount, error: groupsCountError } = await supabase.from('chart_of_accounts').select('count', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_group', true);
      if (groupsCountError) console.error('Accounting.tsx: Error fetching groups count:', groupsCountError);

      // Fetch counts for Customers and Vendors
      const { count: customersCount, error: customersCountError } = await supabase.from('customers').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      if (customersCountError) console.error('Accounting.tsx: Error fetching customers count:', customersCountError);

      const { count: vendorsCount, error: vendorsCountError } = await supabase.from('vendors').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      if (vendorsCountError) console.error('Accounting.tsx: Error fetching vendors count:', vendorsCountError);

      const { count: customerGroupsCount, error: customerGroupsCountError } = await supabase.from('customer_groups').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      if (customerGroupsCountError) console.error('Accounting.tsx: Error fetching customer groups count:', customerGroupsCountError);


      // Fetch counts and amounts for Vouchers
      const { count: paymentsCount, data: paymentsData, error: paymentsError } = await supabase.from('payments').select('amount', { count: 'exact' }).eq('company_id', companyId);
      if (paymentsError) console.error('Accounting.tsx: Error fetching payments data:', paymentsError);
      const totalPaymentsAmount = paymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const { count: receiptsCount, data: receiptsData, error: receiptsError } = await supabase.from('receipts').select('amount', { count: 'exact' }).eq('company_id', companyId);
      if (receiptsError) console.error('Accounting.tsx: Error fetching receipts data:', receiptsError);
      const totalReceiptsAmount = receiptsData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      
      const { count: journalCount, error: journalCountError } = await supabase.from('journal_entries').select('count', { count: 'exact', head: true }).eq('company_id', companyId).eq('entry_type', 'journal');
      if (journalCountError) console.error('Accounting.tsx: Error fetching journal count:', journalCountError);
      
      const { count: salesVouchersCount, data: salesVouchersData, error: salesVouchersError } = await supabase.from('sales_invoices').select('total_amount', { count: 'exact' }).eq('company_id', companyId).neq('status', 'credit_note');
      if (salesVouchersError) console.error('Accounting.tsx: Error fetching sales vouchers data:', salesVouchersError);
      const totalSalesVouchersAmount = salesVouchersData?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      const { count: salesReturnsCount, data: salesReturnsData, error: salesReturnsError } = await supabase.from('sales_returns').select('total_amount', { count: 'exact' }).eq('company_id', companyId);
      if (salesReturnsError) console.error('Accounting.tsx: Error fetching sales returns data:', salesReturnsError);
      const totalSalesReturnsAmount = salesReturnsData?.reduce((sum, sr) => sum + (sr.total_amount || 0), 0) || 0;

      const { count: purchaseVouchersCount, data: purchaseVouchersData, error: purchaseVouchersError } = await supabase.from('purchase_invoices').select('total_amount', { count: 'exact' }).eq('company_id', companyId);
      if (purchaseVouchersError) console.error('Accounting.tsx: Error fetching purchase vouchers data:', purchaseVouchersError);
      const totalPurchaseVouchersAmount = purchaseVouchersData?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      const { count: creditNotesCount, data: creditNotesData, error: creditNotesError } = await supabase.from('sales_invoices').select('total_amount', { count: 'exact' }).eq('company_id', companyId).eq('status', 'credit_note');
      if (creditNotesError) console.error('Accounting.tsx: Error fetching credit notes data:', creditNotesError);
      const totalCreditNotesAmount = creditNotesData?.reduce((sum, cn) => sum + (cn.total_amount || 0), 0) || 0;
      
      // Debit notes table is not in schema, so placeholder
      const debitNotesCount = 0; // Placeholder
      const totalDebitNotesAmount = 0; // Placeholder

      // Fixed Assets
      const { count: assetsCount, data: assetsData, error: assetsError } = await supabase.from('fixed_assets').select('purchase_amount', { count: 'exact' }).eq('company_id', companyId);
      if (assetsError) console.error('Accounting.tsx: Error fetching assets data:', assetsError);
      const totalAssetsValue = assetsData?.reduce((sum, asset) => sum + (asset.purchase_amount || 0), 0) || 0;

      // Cost Centers
      const { count: costCentersCount, error: costCentersCountError } = await supabase.from('cost_centers').select('count', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_group', false);
      if (costCentersCountError) console.error('Accounting.tsx: Error fetching cost centers count:', costCentersCountError);

      const { count: costCategoriesCount, error: costCategoriesCountError } = await supabase.from('cost_centers').select('count', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_group', true);
      if (costCategoriesCountError) console.error('Accounting.tsx: Error fetching cost categories count:', costCategoriesCountError);


      setAccountingMetrics({
        ledgers: { count: (ledgersCount + customersCount + vendorsCount)?.toString() || '0' }, // Combined count
        groups: { count: (groupsCount + customerGroupsCount)?.toString() || '0' }, // Combined count
        payments: { count: paymentsCount?.toString() || '0', totalAmount: totalPaymentsAmount.toLocaleString() },
        receipts: { count: receiptsCount?.toString() || '0', totalAmount: totalReceiptsAmount.toLocaleString() },
        contra: { count: '0' }, // Placeholder
        journal: { count: journalCount?.toString() || '0' },
        salesVouchers: { count: salesVouchersCount?.toString() || '0', totalAmount: totalSalesVouchersAmount.toLocaleString() },
        salesReturns: { count: salesReturnsCount?.toString() || '0', totalAmount: totalSalesReturnsAmount.toLocaleString() },
        purchaseVouchers: { count: purchaseVouchersCount?.toString() || '0', totalAmount: totalPurchaseVouchersAmount.toLocaleString() },
        purchaseReturns: { count: '0', totalAmount: '0' }, // Placeholder
        creditNotes: { count: creditNotesCount?.toString() || '0', totalAmount: totalCreditNotesAmount.toLocaleString() },
        debitNotes: { count: debitNotesCount?.toString() || '0', totalAmount: totalDebitNotesAmount.toLocaleString() },
        assets: { count: assetsCount?.toString() || '0', totalValue: totalAssetsValue.toLocaleString() },
        costCenters: { count: costCentersCount?.toString() || '0' },
        costCategories: { count: costCategoriesCount?.toString() || '0' },
      });
    } catch (error) {
      console.error('Accounting.tsx: Error fetching accounting metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const accountingTabs = [
    { id: 'masters', name: 'Masters', icon: BookOpen, modules: [
      { name: 'Ledgers', icon: BookOpen, count: accountingMetrics.ledgers.count, description: 'Manage all ledger accounts, including customers and vendors.', path: 'masters/ledgers' },
      { name: 'Groups', icon: Users, count: accountingMetrics.groups.count, description: 'Categorize ledger accounts and customer groups.', path: 'masters/groups' },
    ]},
    { id: 'vouchers', name: 'Vouchers', icon: FileText, modules: [
      { name: 'Payments', icon: CreditCard, count: accountingMetrics.payments.count, totalAmount: accountingMetrics.payments.totalAmount, description: 'Record all outgoing payments', path: 'vouchers/payments' },
      { name: 'Receipts', icon: Receipt, count: accountingMetrics.receipts.count, totalAmount: accountingMetrics.receipts.totalAmount, description: 'Record all incoming payments', path: 'vouchers/receipts' },
      { name: 'Contra', icon: ArrowLeftRight, count: accountingMetrics.contra.count, description: 'Transfer funds between cash & bank', path: 'vouchers/contra' },
      { name: 'Journal', icon: ClipboardList, count: accountingMetrics.journal.count, description: 'Record non-cash transactions', path: 'vouchers/journal' },
      { name: 'Sales', icon: ShoppingCart, count: accountingMetrics.salesVouchers.count, totalAmount: accountingMetrics.salesVouchers.totalAmount, description: 'Record sales invoices', path: '/sales/invoices' }, // Linked to existing Sales Invoices page
      { name: 'Sales Return', icon: ArrowDownLeft, count: accountingMetrics.salesReturns.count, totalAmount: accountingMetrics.salesReturns.totalAmount, description: 'Process customer returns', path: '/sales/returns' }, // Linked to existing Sales Returns page
      { name: 'Purchase', icon: Package, count: accountingMetrics.purchaseVouchers.count, totalAmount: accountingMetrics.purchaseVouchers.totalAmount, description: 'Record purchase bills', path: '/purchase/invoices' }, // Linked to existing Purchase Invoices page (assuming path)
      { name: 'Purchase Return', icon: ArrowUpRight, count: accountingMetrics.purchaseReturns.count, totalAmount: accountingMetrics.purchaseReturns.totalAmount, description: 'Process vendor returns', path: '/purchase/returns' }, // Linked to existing Purchase Returns page (assuming path)
      { name: 'Credit Note', icon: FileBadge, count: accountingMetrics.creditNotes.count, totalAmount: accountingMetrics.creditNotes.totalAmount, description: 'Issue credit to customers', path: '/sales/credit-notes' }, // Linked to existing Sales Credit Notes page
      { name: 'Debit Note', icon: FileMinus, count: accountingMetrics.debitNotes.count, totalAmount: accountingMetrics.debitNotes.totalAmount, description: 'Issue debit to vendors', path: 'vouchers/debit-note' },
    ]},
    { id: 'reconciliation', name: 'Reconciliation', icon: Scale, modules: [
      { name: 'Bank Reconciliation', icon: Banknote, count: '0', description: 'Match bank statements with ledger', path: 'reconciliation/bank' },
      { name: 'Ledger Reconciliation', icon: Scale, count: '0', description: 'Match ledger balances', path: 'reconciliation/ledger' },
    ]},
    { id: 'fixed-assets', name: 'Fixed Assets', icon: Building, modules: [
      { name: 'Asset Register', icon: Building, count: accountingMetrics.assets.count, totalAmount: accountingMetrics.assets.totalValue, description: 'Manage all company assets', path: 'fixed-assets/register' },
      { name: 'Depreciation', icon: Percent, count: '0', description: 'Process asset depreciation', path: 'fixed-assets/depreciation' },
    ]},
    { id: 'cost-centers', name: 'Cost Centers', icon: LayoutGrid, modules: [
      { name: 'Cost Centers', icon: LayoutGrid, count: accountingMetrics.costCenters.count, description: 'Track expenses by cost center', path: 'cost-centers/centers' },
      { name: 'Cost Categories', icon: FolderOpen, count: accountingMetrics.costCategories.count, description: 'Categorize cost centers', path: 'cost-centers/categories' },
    ]},
    { id: 'reports', name: 'Reports', icon: BarChart3, modules: [
      { name: 'Ledger-wise Report', icon: BookOpen, count: '0', description: 'Detailed ledger transactions', path: 'reports/ledger-wise' },
      { name: 'Day Book', icon: Calendar, count: '0', description: 'Daily transaction summary', path: 'reports/day-book' },
      { name: 'Cash Book', icon: Banknote, count: '0', description: 'Cash transactions summary', path: 'reports/cash-book' },
      { name: 'Journal Register', icon: ClipboardList, count: '0', description: 'All journal entries', path: 'reports/journal-register' },
      { name: 'Voucher Summary', icon: FileText, count: '0', description: 'Summary of all vouchers', path: 'reports/voucher-summary' },
    ]},
    { id: 'settings', name: 'Settings', icon: Settings, modules: [
      { name: 'Voucher Numbering', icon: Settings, count: '0', description: 'Configure voucher numbering series', path: 'settings/voucher-numbering' },
      { name: 'Approval Workflows', icon: Users, count: '0', description: 'Manage approval processes', path: 'settings/approval-workflows' },
      { name: 'Tax Configuration', icon: Percent, count: '0', description: 'Setup tax rates and rules', path: 'settings/tax-config' },
      { name: 'Multi-currency Settings', icon: DollarSign, count: '0', description: 'Manage multiple currencies', path: 'settings/multi-currency' },
    ]},
  ];

  const isMainAccountingPage = location.pathname === '/accounting' || location.pathname === '/accounting/';

  const moduleColors = [
    { cardBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', textColor: 'text-emerald-800', iconBg: 'bg-emerald-500' },
    { cardBg: 'bg-gradient-to-br from-sky-50 to-sky-100', textColor: 'text-sky-800', iconBg: 'bg-sky-500' },
    { cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100', textColor: 'text-purple-800', iconBg: 'bg-purple-500' },
    { cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100', textColor: 'text-orange-800', iconBg: 'bg-orange-500' },
    { cardBg: 'bg-gradient-to-br from-teal-50 to-teal-100', textColor: 'text-teal-800', iconBg: 'bg-teal-500' },
    { cardBg: 'bg-gradient-to-br from-indigo-50 to-indigo-100', textColor: 'text-indigo-800', iconBg: 'bg-indigo-500' },
    { cardBg: 'bg-gradient-to-br from-pink-50 to-pink-100', textColor: 'text-pink-800', iconBg: 'bg-pink-500' },
    { cardBg: 'bg-gradient-to-br from-red-50 to-red-100', textColor: 'text-red-800', iconBg: 'bg-red-500' },
    { cardBg: 'bg-gradient-to-br from-yellow-50 to-yellow-100', textColor: 'text-yellow-800', iconBg: 'bg-yellow-500' },
    { cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100', textColor: 'text-blue-800', iconBg: 'bg-blue-500' },
    { cardBg: 'bg-gradient-to-br from-green-50 to-green-100', textColor: 'text-green-800', iconBg: 'bg-green-500' },
    { cardBg: 'bg-gradient-to-br from-lime-50 to-lime-100', textColor: 'text-lime-800', iconBg: 'bg-lime-500' },
    { cardBg: 'bg-gradient-to-br from-cyan-50 to-cyan-100', textColor: 'text-cyan-800', iconBg: 'bg-cyan-500' },
    { cardBg: 'bg-gradient-to-br from-fuchsia-50 to-fuchsia-100', textColor: 'text-fuchsia-800', iconBg: 'bg-fuchsia-500' },
  ];

  if (!isMainAccountingPage) {
    return (
      <Routes>
        {/* Masters Routes */}
        <Route path="masters/ledgers" element={<LedgerListPage />} />
        <Route path="masters/ledgers/new" element={<LedgerFormPage />} />
        <Route path="masters/ledgers/edit/:id" element={<LedgerFormPage />} />
        <Route path="masters/groups" element={<AccountGroupsPage />} />
        <Route path="groups/:id/ledgers" element={<LedgersUnderGroupPage />} /> {/* NEW ROUTE */}
        {/* Accounting-specific Vouchers Routes */}
        <Route path="vouchers/payments" element={<PaymentsPage />} />
        <Route path="vouchers/receipts" element={<ReceiptsPage />} />
        <Route path="vouchers/contra" element={<ContraPage />} />
        <Route path="vouchers/journal" element={<div>Journal Page</div>} />
        {/* Sales/Purchase related vouchers now link to their respective modules */}
        {/* <Route path="vouchers/sales" element={<SalesVoucherPage />} /> */}
        {/* <Route path="vouchers/sales-return" element={<SalesReturnVoucherPage />} /> */}
        {/* <Route path="vouchers/purchase" element={<PurchaseVoucherPage />} /> */}
        {/* <Route path="vouchers/purchase-return" element={<PurchaseReturnVoucherPage />} /> */}
        {/* <Route path="vouchers/credit-note" element={<CreditNotePage />} /> */}
        <Route path="vouchers/debit-note" element={<div>Debit Note Page</div>} /> {/* Placeholder for Debit Note */}
        {/* Reconciliation Routes */}
        <Route path="reconciliation/bank" element={<div>Bank Reconciliation Page</div>} />
        <Route path="reconciliation/ledger" element={<div>Ledger Reconciliation Page</div>} />
        {/* Fixed Assets Routes */}
        <Route path="fixed-assets/register" element={<div>Asset Register Page</div>} />
        <Route path="fixed-assets/depreciation" element={<div>Depreciation Page</div>} />
        {/* Cost Centers Routes */}
        <Route path="cost-centers/centers" element={<div>Cost Centers Page</div>} />
        <Route path="cost-centers/categories" element={<div>Cost Categories Page</div>} />
        {/* Reports Routes */}
        <Route path="reports/ledger-wise" element={<div>Ledger-wise Report Page</div>} />
        <Route path="reports/day-book" element={<div>Day Book Page</div>} />
        <Route path="reports/cash-book" element={<div>Cash Book Page</div>} />
        <Route path="reports/journal-register" element={<div>Journal Register Page</div>} />
        <Route path="reports/voucher-summary" element={<div>Voucher Summary Page</div>} />
        <Route path="ledgers/:id/report" element={<LedgerAccountPage />} /> {/* NEW ROUTE */}
        {/* Settings Routes */}
        <Route path="settings/voucher-numbering" element={<div>Voucher Numbering Page</div>} />
        <Route path="settings/approval-workflows" element={<div>Approval Workflows Page</div>} />
        <Route path="settings/tax-config" element={<div>Tax Configuration Page</div>} />
        <Route path="settings/multi-currency" element={<div>Multi-currency Settings Page</div>} />
      </Routes>
    );
  }

  if (!currentCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Company Selected</h2>
          <p className="text-gray-600 mb-6">Please create or select a company to manage accounting data.</p>
          <Button onClick={() => navigate('/company/manage')}>Manage Companies</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-transparent bg-clip-text drop-shadow-lg`}>
            Accounting & Finance
          </h1>
          <p className={theme.textSecondary}>
            Manage all financial transactions, ledgers, and reports
          </p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="analyze" onSuggest={() => console.log('AI Accounting Analysis')} />
          <Button icon={<Plus size={16} />}>New Transaction</Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center md:justify-start gap-2">
        {accountingTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 px-6 py-3 text-sm font-semibold transition-all duration-300 ease-in-out
              ${
                activeTab === tab.id
                  ? `bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transform scale-105 border border-emerald-700 rounded-t-lg rounded-b-none`
                  : `bg-gray-100 text-gray-700 hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300 hover:shadow-md border border-gray-200 rounded-lg`
              }
            `}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {accountingTabs.map((tab) => (
        <div
          key={tab.id}
          className={`${activeTab === tab.id ? 'block' : 'hidden'}`}
        >
          <Card
            className={`
            p-6 space-y-4 rounded-t-none rounded-b-lg
            border-t-4 border-emerald-500
            bg-white shadow-lg
          `}
          >
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
              {tab.name}
            </h2>
            <p className={theme.textSecondary}>Explore {tab.name.toLowerCase()} modules.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tab.modules.map((module, moduleIndex) => {
                const Icon = module.icon;
                const colors = moduleColors[moduleIndex % moduleColors.length];
                return (
                  <Link key={module.name} to={module.path} className="flex"> {/* Removed /accounting/ prefix */}
                    <Card
                      hover
                      className={`
                      p-4 cursor-pointer group relative overflow-hidden flex-1 flex flex-col justify-between
                      ${colors.cardBg}
                      transform transition-all duration-300 ease-in-out
                      hover:translate-y-[-6px] hover:shadow-2xl hover:ring-2 hover:ring-[${theme.hoverAccent}] hover:ring-opacity-75
                    `}
                    >
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
                      <div className="relative z-10">
                        <h3
                          className={`text-xl font-bold ${colors.textColor} group-hover:text-[${theme.hoverAccent}] transition-colors`}
                        >
                          {module.name}
                        </h3>
                        <p className={`text-sm ${theme.textMuted}`}>
                          {module.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3 relative z-10">
                        <p className={`text-xl font-bold ${colors.textColor}`}>
                          {loadingMetrics ? '...' : module.count}
                        </p>
                        {module.totalAmount && (
                          <p className={`text-md font-semibold ${colors.textColor}`}>
                            ₹{module.totalAmount}
                          </p>
                        )}
                        <div
                          className={`
                          p-3 rounded-2xl shadow-md
                          ${colors.iconBg} text-white
                          group-hover:scale-125 transition-transform duration-300
                        `}
                        >
                          <Icon size={24} className="text-white" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

export default Accounting;

