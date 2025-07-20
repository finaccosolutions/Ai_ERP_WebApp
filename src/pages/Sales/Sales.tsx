// src/pages/Sales/Sales.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Users,
  ShoppingCart,
  FileText,
  CreditCard,
  BarChart3,
  Plus,
  Search,
  Bot,
  Mic,
  Upload,
  DollarSign,
  ClipboardList,
  Truck,
  Receipt,
  ArrowLeftRight,
  Clock,
  ListFilter,
  LineChart,
  BookOpen,
  Percent,
  ClipboardCheck,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Tag, // For Price List
  BookOpenText, // For Sales Register
  PieChart, // For Sales Analysis
  UserCheck, // For Customer Outstanding
  CalendarCheck, // For Customer Aging Report
  FileBadge, // For Credit Notes
  PackageOpen, // For Delivery Challans
  UserRoundCog, // For Customer Groups
  TrendingUp, // For AI Insights
  AlertTriangle, // For AI Insights
  Lightbulb, // For AI Insights
  Target, // For AI Insights
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import CreateInvoice from './CreateInvoice'; // This will be removed later if CreateInvoice is integrated into SalesInvoicesPage
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase'; // Import supabase
import { useCompany } from '../../contexts/CompanyContext'; // Import useCompany

// Import new submodule pages
import CustomersListPage from './CustomersListPage'; // Renamed
import CustomerFormPage from './CustomerFormPage'; // New
import CustomerGroupsPage from './CustomerGroupsPage'; // New
import SalesPriceListPage from './SalesPriceListPage';
import SalesQuotationsPage from './SalesQuotationsPage';
import SalesOrdersPage from './SalesOrdersPage';
import DeliveryChallansPage from './DeliveryChallansPage';
import SalesInvoicesPage from './SalesInvoicesPage'; // Renamed for clarity
import CreditNotesPage from './CreditNotesPage';
import ReceiptsPage from './ReceiptsPage';
import SalesReturnsPage from './SalesReturnsPage';
import CustomerOutstandingPage from './CustomerOutstandingPage';
import CustomerAgingReportPage from './CustomerAgingReportPage';
import SalesAnalysisPage from './SalesAnalysisPage';
import SalesRegisterPage from './SalesRegisterPage';
import CustomerWiseSalesSummaryPage from './CustomerWiseSalesSummaryPage';


function Sales() {
  const location = useLocation();
  const { theme } = useTheme();
  const { smartSearch, voiceCommand, predictiveAnalysis } = useAI();
  const { currentCompany } = useCompany(); // Use currentCompany for data fetching
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [salesMetrics, setSalesMetrics] = useState({
    customers: { count: '0' },
    quotations: { count: '0', totalAmount: '0' },
    salesOrders: { count: '0', totalAmount: '0' },
    salesInvoices: { count: '0', totalAmount: '0' },
    receipts: { count: '0', totalAmount: '0' },
    creditNotes: { count: '0', totalAmount: '0' },
    salesReturns: { count: '0', totalAmount: '0' },
    priceLists: { count: '0' },
    customerOutstanding: { count: '0', totalAmount: '0' },
    customerAgingReport: { count: '0' },
    salesAnalysis: { count: '0' },
    salesRegister: { count: '0' },
    customerWiseSalesSummary: { count: '0' },
    deliveryChallans: { count: '0' },
    customerGroups: { count: '0' },
  });
  const [recentSalesData, setRecentSalesData] = useState<any[]>([]);
  const [salesAiInsights, setSalesAiInsights] = useState<any[]>([]);
  const [refreshingInsights, setRefreshingInsights] = useState(false);
  const [isLoadingSalesData, setIsLoadingSalesData] = useState(false); // New state for local loading
  const [activeSalesTab, setActiveSalesTab] = useState('Core Sales Operations'); // New state for active tab


  useEffect(() => {
    if (currentCompany?.id) {
      fetchSalesData(currentCompany.id);
    }

    // Add visibility change listener to re-fetch data when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentCompany?.id) {
        console.log('Sales.tsx: Document became visible, re-fetching sales data.');
        fetchSalesData(currentCompany.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentCompany?.id]); // Depend on currentCompany.id to re-attach listener if company changes

  const fetchSalesData = async (companyId: string) => {
    setIsLoadingSalesData(true); // Set local loading true
    try {
      // Fetch Counts
      const { count: customersCount } = await supabase.from('customers').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: priceListsCount } = await supabase.from('price_lists').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: customerGroupsCount } = await supabase.from('customer_groups').select('count', { count: 'exact', head: true }).eq('company_id', companyId);

      // Fetch Counts and Sums for transactional modules
      const { count: quotationsCount, data: quotationsData } = await supabase.from('quotations').select('total_amount', { count: 'exact' }).eq('company_id', companyId);
      const { count: salesOrdersCount, data: salesOrdersData } = await supabase.from('sales_orders').select('total_amount', { count: 'exact' }).eq('company_id', companyId);
      const { count: salesInvoicesCount, data: salesInvoicesData } = await supabase.from('sales_invoices').select('total_amount, outstanding_amount', { count: 'exact' }).eq('company_id', companyId);
      const { count: receiptsCount, data: receiptsData } = await supabase.from('receipts').select('amount', { count: 'exact' }).eq('company_id', companyId);
      
      // Credit Notes (assuming they are sales_invoices with status 'credit_note')
      const { count: creditNotesCount, data: creditNotesData } = await supabase.from('sales_invoices').select('total_amount', { count: 'exact' }).eq('company_id', companyId).eq('status', 'credit_note');
      
      // Sales Returns (if sales_returns table exists)
      const { count: salesReturnsCount, data: salesReturnsData } = await supabase.from('sales_returns').select('total_amount', { count: 'exact' }).eq('company_id', companyId);
      
      // Delivery Challans (no total amount column in schema)
      const { count: deliveryChallansCount } = await supabase.from('delivery_challans').select('count', { count: 'exact', head: true }).eq('company_id', companyId);

      // Calculate total amounts
      const totalQuotationsAmount = quotationsData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
      const totalSalesOrdersAmount = salesOrdersData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
      const totalSalesInvoicesAmount = salesInvoicesData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
      const totalReceiptsAmount = receiptsData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const totalCreditNotesAmount = creditNotesData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
      const totalSalesReturnsAmount = salesReturnsData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
      const totalCustomerOutstandingAmount = salesInvoicesData?.reduce((sum, item) => sum + (item.outstanding_amount || 0), 0) || 0;


      setSalesMetrics({
        customers: { count: customersCount?.toString() || '0' },
        quotations: { count: quotationsCount?.toString() || '0', totalAmount: totalQuotationsAmount.toLocaleString() },
        salesOrders: { count: salesOrdersCount?.toString() || '0', totalAmount: totalSalesOrdersAmount.toLocaleString() },
        salesInvoices: { count: salesInvoicesCount?.toString() || '0', totalAmount: totalSalesInvoicesAmount.toLocaleString() },
        receipts: { count: receiptsCount?.toString() || '0', totalAmount: totalReceiptsAmount.toLocaleString() },
        creditNotes: { count: creditNotesCount?.toString() || '0', totalAmount: totalCreditNotesAmount.toLocaleString() },
        salesReturns: { count: salesReturnsCount?.toString() || '0', totalAmount: totalSalesReturnsAmount.toLocaleString() },
        priceLists: { count: priceListsCount?.toString() || '0' },
        customerOutstanding: { count: salesInvoicesCount?.toString() || '0', totalAmount: totalCustomerOutstandingAmount.toLocaleString() }, // Reusing invoice count for outstanding
        customerAgingReport: { count: salesInvoicesCount?.toString() || '0' }, // Reusing invoice count for aging report
        salesAnalysis: { count: salesInvoicesCount?.toString() || '0' }, // Placeholder for analysis
        salesRegister: { count: salesInvoicesCount?.toString() || '0' }, // Placeholder for register
        customerWiseSalesSummary: { count: customersCount?.toString() || '0' }, // Placeholder for summary
        deliveryChallans: { count: deliveryChallansCount?.toString() || '0' },
        customerGroups: { count: customerGroupsCount?.toString() || '0' },
      });

      // Fetch Recent Sales Data
      const { data: recentInvoices, error: recentInvoicesError } = await supabase
        .from('sales_invoices')
        .select('id, customer_id, total_amount, invoice_date, status, customers(name)')
        .eq('company_id', companyId)
        .order('invoice_date', { ascending: false })
        .limit(5); // Get top 5 recent invoices

      if (recentInvoicesError) throw recentInvoicesError;
      setRecentSalesData(recentInvoices.map(inv => ({
        id: inv.id,
        customer: inv.customers?.name || 'N/A',
        amount: inv.total_amount,
        date: inv.invoice_date,
        status: inv.status,
        confidence: 'high' // Placeholder for AI confidence
      })));

      // Removed automatic AI Insights generation here
      // await generateSalesAIInsights(companyId, recentInvoices);

    } catch (error) {
      console.error('Error fetching sales data:', error);
      // Optionally set all counts to 'N/A' or 'Error'
    } finally {
      setIsLoadingSalesData(false); // Set local loading false
    }
  };

  const generateSalesAIInsights = async (companyId: string, salesData: any[] = recentSalesData) => {
    setRefreshingInsights(true);
    try {
      const insights = await predictiveAnalysis({
        module: 'sales',
        companyId: companyId,
        salesData: salesData,
        currentMetrics: salesMetrics,
        context: 'sales_overview_analysis'
      });

      if (insights && insights.predictions) {
        setSalesAiInsights(insights.predictions);
      } else {
        setSalesAiInsights([
          {
            type: 'info',
            title: 'No New Insights',
            message: 'No specific AI insights generated at this moment. Try again later.',
            confidence: 'medium',
            impact: 'low',
            actionable: false
          }
        ]);
      }
    } catch (error) {
      console.error('Error generating sales AI insights:', error);
      setSalesAiInsights([
        {
          type: 'error',
          title: 'AI Service Error',
          message: 'Could not fetch AI insights. Please try again.',
          confidence: 'low',
          impact: 'high',
          actionable: false
        }
      ]);
    } finally {
      setRefreshingInsights(false);
    }
  };

  // Define a set of light color palettes for the cards
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
  ];


  // Consolidated and categorized sales modules
  const salesCategories = [
    {
      title: 'Core Sales Operations',
      description: 'Manage your daily sales activities from quotations to invoices and payments.',
      modules: [
        { name: 'Sales Invoices', description: 'Generate and manage invoices', icon: FileText, path: '/sales/invoices', count: salesMetrics.salesInvoices.count, totalAmount: salesMetrics.salesInvoices.totalAmount },
        { name: 'Sales Returns', description: 'Process customer returns', icon: ArrowLeftRight, path: '/sales/returns', count: salesMetrics.salesReturns.count, totalAmount: salesMetrics.salesReturns.totalAmount },
        { name: 'Credit Notes', description: 'Issue credit for returns/adjustments', icon: FileBadge, path: '/sales/credit-notes', count: salesMetrics.creditNotes.count, totalAmount: salesMetrics.creditNotes.totalAmount },
        { name: 'Receipts', description: 'Record customer payments', icon: CreditCard, path: '/sales/receipts', count: salesMetrics.receipts.count, totalAmount: salesMetrics.receipts.totalAmount },
        { name: 'Sales Quotations', description: 'Create and track sales quotes', icon: FileText, path: '/sales/quotations', count: salesMetrics.quotations.count, totalAmount: salesMetrics.quotations.totalAmount },
        { name: 'Sales Orders', description: 'Process customer orders', icon: ShoppingCart, path: '/sales/orders', count: salesMetrics.salesOrders.count, totalAmount: salesMetrics.salesOrders.totalAmount },
        { name: 'Delivery Challans', description: 'Manage goods delivery', icon: PackageOpen, path: '/sales/delivery-challans', count: salesMetrics.deliveryChallans.count, totalAmount: null },
      ]
    },
    {
      title: 'Customer & Pricing Management',
      description: 'Maintain customer profiles and define pricing strategies.',
      modules: [
        { name: 'Customer Master', description: 'Manage customer profiles', icon: Users, path: '/sales/customers', count: salesMetrics.customers.count, totalAmount: null },
        { name: 'Customer Groups', description: 'Categorize customers into groups', icon: UserRoundCog, path: '/sales/customer-groups', count: salesMetrics.customerGroups.count, totalAmount: null }, // New module
        { name: 'Sales Price List / Discount Rules', description: 'Define pricing and discounts', icon: Tag, path: '/sales/price-list', count: salesMetrics.priceLists.count, totalAmount: null },
      ]
    },
    {
      title: 'Sales Analytics & Reporting',
      description: 'Gain insights into sales performance and financial outstanding.',
      modules: [
        { name: 'Customer Outstanding', description: 'Track pending customer payments', icon: UserCheck, path: '/sales/outstanding', count: salesMetrics.customerOutstanding.count, totalAmount: salesMetrics.customerOutstanding.totalAmount },
        { name: 'Customer Aging Report', description: 'Analyze overdue receivables', icon: CalendarCheck, path: '/sales/aging-report', count: salesMetrics.customerAgingReport.count, totalAmount: null },
        { name: 'Sales Analysis', description: 'Detailed sales performance insights', icon: PieChart, path: '/sales/analysis', count: salesMetrics.salesAnalysis.count, totalAmount: null },
        { name: 'Sales Register', description: 'View all sales transactions', icon: BookOpenText, path: '/sales/register', count: salesMetrics.salesRegister.count, totalAmount: null },
        { name: 'Customer-wise Sales Summary', description: 'Summarize sales by customer', icon: BarChart3, path: '/sales/customer-summary', count: salesMetrics.customerWiseSalesSummary.count, totalAmount: null },
      ]
    }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return <TrendingUp size={16} className="text-sky-500" />;
      case 'alert':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'suggestion':
        return <Lightbulb size={16} className="text-yellow-500" />;
      case 'trend':
        return <Target size={16} className="text-emerald-500" />;
      default:
        return <Bot size={16} className="text-purple-500" />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-emerald-500 bg-emerald-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const isMainSalesPage = location.pathname === '/sales';

  const handleVoiceSearch = async () => {
    setIsVoiceActive(true);
    try {
      // Mock voice recognition
      setTimeout(async () => {
        const mockCommand = "Show me top 5 customers by revenue this quarter";
        const result = await voiceCommand(mockCommand);
        console.log('Voice search result:', result);
        setIsVoiceActive(false);
      }, 2000);
    } catch (error) {
      setIsVoiceActive(false);
    }
  };

  const handleSmartSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const result = await smartSearch(searchTerm);
      console.log('Smart search result:', result);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  if (!isMainSalesPage) {
    return (
      <Routes>
        <Route path="/customers" element={<CustomersListPage />} /> {/* Renamed */}
        <Route path="/customers/new" element={<CustomerFormPage />} /> {/* New route for creating customer */}
        <Route path="/customers/edit/:id" element={<CustomerFormPage />} /> {/* New route for editing customer */}
        <Route path="/customer-groups" element={<CustomerGroupsPage />} /> {/* New route for customer groups */}
        <Route path="/price-list" element={<SalesPriceListPage />} />
        <Route path="/quotations" element={<SalesQuotationsPage />} />
        <Route path="/orders" element={<SalesOrdersPage />} />
        <Route path="/delivery-challans" element={<DeliveryChallansPage />} />
        <Route path="/invoices" element={<SalesInvoicesPage />} /> {/* Point to list page */}
        <Route path="/invoices/create" element={<CreateInvoice />} /> {/* Keep create page separate */}
        <Route path="/credit-notes" element={<CreditNotesPage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
        <Route path="/returns" element={<SalesReturnsPage />} />
        <Route path="/outstanding" element={<CustomerOutstandingPage />} />
        <Route path="/aging-report" element={<CustomerAgingReportPage />} />
        <Route path="/analysis" element={<SalesAnalysisPage />} />
        <Route path="/register" element={<SalesRegisterPage />} />
        <Route path="/customer-summary" element={<CustomerWiseSalesSummaryPage />} />
        <Route path="/reports" element={<div>Sales Reports Module</div>} />
      </Routes>
    );
  }

  // Render a local loader if isLoadingSalesData is true and no data is yet available
  if (isLoadingSalesData && recentSalesData.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Management</h1>
          <p className={theme.textSecondary}>AI-powered sales operations and customer management</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="voice" onSuggest={handleVoiceSearch} />
          <AIButton variant="suggest" onSuggest={() => console.log('AI Sales Suggestions')} />
          <Link to="/sales/invoices/create">
            <Button icon={<Plus size={16} />}>Create Invoice</Button>
          </Link>
        </div>
      </div>

      {/* AI-Enhanced Search */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="AI Search: 'Show overdue invoices', 'Top customers this month'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSmartSearch()}
              className={`
                w-full pl-10 pr-12 py-2 border ${theme.inputBorder} rounded-lg
                focus:ring-2 focus:ring-sky-500 focus:border-transparent
                ${theme.inputBg} ${theme.textPrimary}
                placeholder:text-gray-400
              `}
            />
            <button
              onClick={handleVoiceSearch}
              className={`
                absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors
                ${isVoiceActive
                  ? 'text-red-500 animate-pulse'
                  : `text-gray-400 hover:text-[${theme.hoverAccent}]`
                }
              `}
            >
              <Mic size={16} />
            </button>
          </div>
          <Button onClick={handleSmartSearch}>Search</Button>
          <Button variant="outline">Filter</Button>
          <Button variant="outline">Export</Button>
        </div>
      </Card>

      {/* Tab Navigation */}
      <Card className="p-4">
        <nav className="flex flex-wrap justify-center md:justify-start gap-2">
          {salesCategories.map((category) => (
            <button
              key={category.title}
              onClick={() => setActiveSalesTab(category.title)}
              className={`
                px-5 py-2 text-sm font-medium rounded-2xl transition-all duration-300
                ${activeSalesTab === category.title
                  ? `bg-sky-600 text-white shadow-md border-b-2 border-sky-600` // Selected tab style
                  : `bg-sky-50 text-sky-800 hover:bg-sky-100 hover:shadow-sm border-b-2 border-transparent` // Unselected tab style
                }
              `}
            >
              {category.title}
            </button>
          ))}
        </nav>
      </Card>

      {/* Tab Content */}
      {salesCategories.map((category) => (
        <div
          key={category.title}
          className={`${activeSalesTab === category.title ? 'block' : 'hidden'} space-y-4`}
        >
          <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>{category.title}</h2>
          <p className={theme.textSecondary}>{category.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.modules.map((module, moduleIndex) => {
              const Icon = module.icon;
              const colors = moduleColors[moduleIndex % moduleColors.length]; // Get colors for this module
              return (
                <Link key={module.name} to={module.path} className="flex">
                  <Card hover className={`p-4 cursor-pointer group relative overflow-hidden flex-1 flex flex-col justify-between ${colors.cardBg}`}>
                    <div>
                      <h3 className={`text-lg font-semibold ${colors.textColor} group-hover:text-[${theme.hoverAccent}] transition-colors`}>
                        {module.name}
                      </h3>
                      <p className={`text-sm ${theme.textMuted}`}>{module.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className={`text-xl font-bold ${colors.textColor}`}>{module.count}</p>
                      {module.totalAmount && (
                        <p className={`text-md font-semibold ${colors.textColor}`}>₹{module.totalAmount}</p>
                      )}
                      <div className={`
                        p-3 rounded-2xl shadow-md
                        ${colors.iconBg} text-white
                        group-hover:scale-110 transition-transform duration-300
                      `}>
                        <Icon size={24} className="text-white" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Recent Sales and AI Insights (Always Visible) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 pt-4 border-t border-gray-200">
        {/* Recent Sales */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>Recent Sales</h3>
            <div className="flex items-center space-x-2">
              <Link to="/sales/invoices" className="text-sm text-sky-600 hover:text-sky-800">
                View All
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            {recentSalesData.length > 0 ? (
              recentSalesData.map((sale) => (
                <div key={sale.id} className={`
                  flex items-center justify-between p-3 ${theme.inputBg} rounded-2xl
                  border ${theme.borderColor} hover:border-[${theme.hoverAccent}] transition-all duration-300
                `}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className={`font-medium ${theme.textPrimary}`}>{sale.customer}</p>
                        <p className={`text-sm ${theme.textMuted}`}>Invoice: {sale.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${theme.textPrimary}`}>₹{sale.amount?.toLocaleString()}</p>
                    <span className={`
                      px-2 py-1 text-xs rounded-full
                      ${sale.status === 'paid' ? 'bg-green-100 text-green-800' :
                        sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}
                    `}>
                      {sale.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent sales data available.
              </div>
            )}
          </div>
        </Card>

        {/* AI Sales Insights */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}>
              <Bot size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              AI Sales Insights
              <div className="ml-2 w-2 h-2 bg-[${theme.hoverAccent}] rounded-full animate-pulse" />
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => currentCompany?.id && generateSalesAIInsights(currentCompany.id)}
              disabled={refreshingInsights}
              icon={<RefreshCw size={16} className={refreshingInsights ? 'animate-spin' : ''} />}
            >
              {refreshingInsights ? 'Refreshing...' : 'Refresh Insights'}
            </Button>
          </div>
          <div className="space-y-4">
            {salesAiInsights.length > 0 ? (
              salesAiInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`
                    p-3 rounded-2xl border-l-4
                    ${getImpactColor(insight.impact)}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <h4 className={`font-medium ${theme.textPrimary} text-sm`}>{insight.title}</h4>
                    </div>
                    <span className={`
                      px-2 py-1 text-xs rounded-full ${getConfidenceColor(insight.confidence)}
                    `}>
                      {insight.confidence}
                    </span>
                  </div>
                  <p className={`text-sm ${theme.textMuted} mb-3`}>{insight.message}</p>
                  {insight.actionable && (
                    <button className="text-xs text-sky-600 hover:text-sky-800 font-medium">
                      {insight.action || 'View Details'} →
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No AI insights available. Click "Refresh Insights" to generate.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions (Always Visible) */}
      <Card className="p-6 mt-8 pt-4 border-t border-gray-200">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/sales/invoices/create">
            <Button className="w-full justify-start" icon={<FileText size={16} />}>
              Create Invoice
            </Button>
          </Link>
          <Link to="/sales/customers/new">
            <Button variant="outline" className="w-full justify-start" icon={<Users size={16} />}>
              Add Customer
            </Button>
          </Link>
          <Button variant="outline" className="w-full justify-start" icon={<BarChart3 size={16} />}>
            Sales Report
          </Button>
          <Button variant="outline" className="w-full justify-start" icon={<Upload size={16} />}>
            Import Data
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Sales;