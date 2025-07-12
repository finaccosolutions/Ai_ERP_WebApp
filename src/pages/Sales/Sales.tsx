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
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import CreateInvoice from './CreateInvoice';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase'; // Import supabase
import { useCompany } from '../../contexts/CompanyContext'; // Import useCompany

// Import new submodule pages
import CustomersPage from './CustomersPage';
import SalesPriceListPage from './SalesPriceListPage';
import SalesQuotationsPage from './SalesQuotationsPage';
import SalesOrdersPage from './SalesOrdersPage';
import DeliveryChallansPage from './DeliveryChallansPage';
import SalesInvoicesListPage from './SalesInvoicesListPage'; // Renamed for clarity
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
  const { smartSearch, voiceCommand } = useAI();
  const { currentCompany } = useCompany(); // Use currentCompany for data fetching
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [salesMetrics, setSalesMetrics] = useState({
    customers: '0',
    quotations: '0',
    salesOrders: '0',
    salesInvoices: '0',
    receipts: '0',
    creditNotes: '0',
    salesReturns: '0', // Changed to '0' as table does not exist
    priceLists: '0',
    customerOutstanding: '0',
    customerAgingReport: '0',
    salesAnalysis: '0',
    salesRegister: '0',
    customerWiseSalesSummary: '0',
    deliveryChallans: '0',
  });

  useEffect(() => {
    if (currentCompany?.id) {
      fetchSalesMetrics(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const fetchSalesMetrics = async (companyId: string) => {
    try {
      const { count: customersCount } = await supabase.from('customers').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: quotationsCount } = await supabase.from('quotations').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: salesOrdersCount } = await supabase.from('sales_orders').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: salesInvoicesCount } = await supabase.from('sales_invoices').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: receiptsCount } = await supabase.from('receipts').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: creditNotesCount } = await supabase.from('sales_invoices').select('count', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'credit_note'); // Assuming credit notes are a type of sales invoice
      // Removed sales_returns query as the table does not exist
      // const { count: salesReturnsCount } = await supabase.from('sales_returns').select('count', { count: 'exact', head: true }).eq('company_id', companyId); 
      const { count: priceListsCount } = await supabase.from('price_lists').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: deliveryChallansCount } = await supabase.from('sales_orders').select('count', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'partially_delivered'); // Assuming delivery challans are linked to sales orders

      // For outstanding and aging, you'd typically aggregate data, here we'll use a placeholder count
      const { count: customerOutstandingCount } = await supabase.from('sales_invoices').select('count', { count: 'exact', head: true }).eq('company_id', companyId).gt('outstanding_amount', 0);
      const { count: salesAnalysisCount } = await supabase.from('sales_invoices').select('count', { count: 'exact', head: true }).eq('company_id', companyId); // Placeholder for analysis
      const { count: salesRegisterCount } = await supabase.from('sales_invoices').select('count', { count: 'exact', head: true }).eq('company_id', companyId); // Placeholder for register
      const { count: customerWiseSalesSummaryCount } = await supabase.from('customers').select('count', { count: 'exact', head: true }).eq('company_id', companyId); // Placeholder for summary

      setSalesMetrics({
        customers: customersCount?.toString() || '0',
        quotations: quotationsCount?.toString() || '0',
        salesOrders: salesOrdersCount?.toString() || '0',
        salesInvoices: salesInvoicesCount?.toString() || '0',
        receipts: receiptsCount?.toString() || '0',
        creditNotes: creditNotesCount?.toString() || '0',
        salesReturns: '0', // Explicitly set to '0' or 'N/A'
        priceLists: priceListsCount?.toString() || '0',
        customerOutstanding: customerOutstandingCount?.toString() || '0',
        customerAgingReport: customerOutstandingCount?.toString() || '0', // Reusing outstanding count for aging report
        salesAnalysis: salesAnalysisCount?.toString() || '0',
        salesRegister: salesRegisterCount?.toString() || '0',
        customerWiseSalesSummary: customerWiseSalesSummaryCount?.toString() || '0',
        deliveryChallans: deliveryChallansCount?.toString() || '0',
      });
    } catch (error) {
      console.error('Error fetching sales metrics:', error);
      // Optionally set all counts to 'N/A' or 'Error'
    }
  };

  // Consolidated and categorized sales modules
  const salesCategories = [
    {
      title: 'Core Sales Operations',
      description: 'Manage your daily sales activities from quotations to invoices and payments.',
      modules: [
        { name: 'Sales Quotations', description: 'Create and track sales quotes', icon: FileText, path: '/sales/quotations', count: salesMetrics.quotations },
        { name: 'Sales Orders', description: 'Process customer orders', icon: ShoppingCart, path: '/sales/orders', count: salesMetrics.salesOrders },
        { name: 'Delivery Challans', description: 'Manage goods delivery', icon: PackageOpen, path: '/sales/delivery-challans', count: salesMetrics.deliveryChallans },
        { name: 'Sales Invoices', description: 'Generate and manage invoices', icon: FileText, path: '/sales/invoices', count: salesMetrics.salesInvoices },
        { name: 'Receipts', description: 'Record customer payments', icon: CreditCard, path: '/sales/receipts', count: salesMetrics.receipts },
        { name: 'Credit Notes', description: 'Issue credit for returns/adjustments', icon: FileBadge, path: '/sales/credit-notes', count: salesMetrics.creditNotes },
        { name: 'Sales Returns', description: 'Process customer returns', icon: ArrowLeftRight, path: '/sales/returns', count: salesMetrics.salesReturns },
      ]
    },
    {
      title: 'Customer & Pricing Management',
      description: 'Maintain customer profiles and define pricing strategies.',
      modules: [
        { name: 'Customer Master', description: 'Manage customer profiles', icon: Users, path: '/sales/customers', count: salesMetrics.customers },
        { name: 'Sales Price List / Discount Rules', description: 'Define pricing and discounts', icon: Tag, path: '/sales/price-list', count: salesMetrics.priceLists },
      ]
    },
    {
      title: 'Sales Analytics & Reporting',
      description: 'Gain insights into sales performance and financial outstanding.',
      modules: [
        { name: 'Customer Outstanding', description: 'Track pending customer payments', icon: UserCheck, path: '/sales/outstanding', count: salesMetrics.customerOutstanding },
        { name: 'Customer Aging Report', description: 'Analyze overdue receivables', icon: CalendarCheck, path: '/sales/aging-report', count: salesMetrics.customerAgingReport },
        { name: 'Sales Analysis', description: 'Detailed sales performance insights', icon: PieChart, path: '/sales/analysis', count: salesMetrics.salesAnalysis },
        { name: 'Sales Register', description: 'View all sales transactions', icon: BookOpenText, path: '/sales/register', count: salesMetrics.salesRegister },
        { name: 'Customer-wise Sales Summary', description: 'Summarize sales by customer', icon: BarChart3, path: '/sales/customer-summary', count: salesMetrics.customerWiseSalesSummary },
      ]
    }
  ];

  const recentSales = [
    { id: 'INV-001', customer: 'ABC Corp', amount: 52500, date: '2024-01-15', status: 'Paid', confidence: 'high' },
    { id: 'INV-002', customer: 'XYZ Ltd', amount: 38000, date: '2024-01-14', status: 'Pending', confidence: 'medium' },
    { id: 'INV-003', customer: 'Demo Inc', amount: 75000, date: '2024-01-13', status: 'Overdue', confidence: 'high' },
  ];

  const aiInsights = [
    {
      type: 'prediction',
      title: 'Revenue Forecast',
      message: 'Expected 18% growth in Q2 based on current trends',
      confidence: 'high',
      action: 'View Details'
    },
    {
      type: 'alert',
      title: 'Payment Delay Risk',
      message: '3 customers showing delayed payment patterns',
      confidence: 'medium',
      action: 'Review Customers'
    },
    {
      type: 'suggestion',
      title: 'Discount Opportunity',
      message: 'ABC Corp eligible for early payment discount',
      confidence: 'high',
      action: 'Apply Discount'
    }
  ];

  const isMainSalesPage = location.pathname === '/sales';

  const handleVoiceSearch = async () => {
    setIsVoiceActive(true);
    try {
      // Mock voice command
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
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/price-list" element={<SalesPriceListPage />} />
        <Route path="/quotations" element={<SalesQuotationsPage />} />
        <Route path="/orders" element={<SalesOrdersPage />} />
        <Route path="/delivery-challans" element={<DeliveryChallansPage />} />
        <Route path="/invoices" element={<SalesInvoicesListPage />} /> {/* Point to list page */}
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
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
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
                  : 'text-gray-400 hover:text-[#5DBF99]'
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

      {/* AI Insights Banner */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-l-[#5DBF99]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot size={24} className="text-[#5DBF99]" />
            <div>
              <h3 className="font-semibold text-gray-900">AI Sales Insights</h3>
              <p className="text-sm text-gray-600">3 new insights available based on recent activity</p>
            </div>
          </div>
          <Button size="sm" variant="outline">View All Insights</Button>
        </div>
      </Card>

      {/* Categorized Sales Modules */}
      {salesCategories.map((category, catIndex) => (
        <div key={catIndex} className="space-y-4">
          <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>{category.title}</h2>
          <p className={theme.textSecondary}>{category.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link key={module.name} to={module.path} className="flex"> {/* Added flex to make cards equal height */}
                  <Card hover className="p-6 cursor-pointer group relative overflow-hidden flex-1 flex flex-col justify-between"> {/* Added flex-1 and flex-col */}
                    <div>
                      <h3 className={`text-lg font-semibold ${theme.textPrimary} group-hover:text-[#6AC8A3] transition-colors`}>
                        {module.name}
                      </h3>
                      <p className={`text-sm ${theme.textMuted}`}>{module.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4"> {/* Moved count and icon to bottom */}
                      <p className={`text-2xl font-bold ${theme.textPrimary}`}>{module.count}</p>
                      <div className={`
                        p-3 rounded-xl shadow-lg
                        bg-gradient-to-r from-[#5DBF99] via-[#6AC8A3] to-[#7AD4B0]
                        group-hover:scale-110 transition-transform duration-300
                        relative z-10
                      `}>
                        <Icon size={24} className="text-white" />
                      </div>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#5DBF99]/5 to-transparent
                                   opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Recent Sales and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>Recent Sales</h3>
            <div className="flex items-center space-x-2">
              <AIButton variant="analyze" size="sm" onSuggest={() => console.log('Analyze Sales')} />
              <Link to="/sales/invoices" className="text-sm text-blue-600 hover:text-blue-800">
                View All
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className={`
                flex items-center justify-between p-3 ${theme.inputBg} rounded-lg
                border ${theme.borderColor} hover:border-[#6AC8A3] transition-all duration-300
              `}>
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className={`font-medium ${theme.textPrimary}`}>{sale.id}</p>
                      <p className={`text-sm ${theme.textMuted}`}>{sale.customer}</p>
                    </div>
                    <div className={`
                      px-2 py-1 text-xs rounded-full
                      ${sale.confidence === 'high' ? 'bg-green-100 text-green-800' :
                        sale.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}
                    `}> {/* Corrected closing backtick */}
                      AI: {sale.confidence}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${theme.textPrimary}`}>₹{sale.amount.toLocaleString()}</p>
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${sale.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'}
                  `}>
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
            <Bot size={20} className="mr-2 text-[#5DBF99]" />
            AI Insights
          </h3>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className={`
                p-3 rounded-lg border-l-4
                ${insight.type === 'prediction' ? 'border-l-blue-500 bg-blue-50' :
                  insight.type === 'alert' ? 'border-l-red-500 bg-red-50' :
                  'border-l-green-500 bg-green-50'}
              `}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`font-medium ${theme.textPrimary} text-sm`}>{insight.title}</h4>
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${insight.confidence === 'high' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'}
                  `}> {/* Corrected closing backtick */}
                    {insight.confidence}
                  </span>
                </div>
                <p className={`text-sm ${theme.textMuted} mb-3`}>{insight.message}</p>
                <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  {insight.action} →
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <AIButton
              variant="predict"
              onSuggest={() => console.log('Generate Predictions')}
              className="w-full"
            />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/sales/invoices/create">
            <Button className="w-full justify-start" icon={<FileText size={16} />}>
              Create Invoice
            </Button>
          </Link>
          <Button variant="outline" className="w-full justify-start" icon={<Users size={16} />}>
            Add Customer
          </Button>
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
