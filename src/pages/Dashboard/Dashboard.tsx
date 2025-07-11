import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Home,
  CreditCard,
  Building,
  Wallet,
  PieChart,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Mic,
  MessageSquare,
  Bot,
  Sparkles
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase';
import DashboardChart from '../../components/Dashboard/DashboardChart';
import RecentTransactions from '../../components/Dashboard/RecentTransactions';
import TopCustomers from '../../components/Dashboard/TopCustomers';
import AIInsightPanel from '../../components/Dashboard/AIInsightPanel';
import VoiceCommandPanel from '../../components/Dashboard/VoiceCommandPanel';

interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalReceivables: number;
  totalPayables: number;
  cashBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyData: any[];
  expenseBreakdown: any[];
  profitTrend: any[];
  recentTransactions: any[];
  topCustomers: any[];
  upcomingPayments: any[];
  auditAlerts: any[];
}

function Dashboard() {
  const { currentCompany, currentPeriod } = useCompany();
  const { theme } = useTheme();
  const { isAIEnabled, smartSearch, voiceCommand, predictiveAnalysis } = useAI();
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalReceivables: 0,
    totalPayables: 0,
    cashBalance: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    monthlyData: [],
    expenseBreakdown: [],
    profitTrend: [],
    recentTransactions: [],
    topCustomers: [],
    upcomingPayments: [],
    auditAlerts: []
  });

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('current_year');
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentCompany) {
      loadDashboardData();
      if (isAIEnabled) {
        generateAIInsights();
      }
    }
  }, [currentCompany, currentPeriod, dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      let startDate: Date, endDate: Date;
      
      switch (dateRange) {
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'current_quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          break;
        case 'current_year':
        default:
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
      }

      // Load Sales Data (Income)
      const { data: salesData } = await supabase
        .from('sales_invoices')
        .select('total_amount, invoice_date, status, paid_amount, outstanding_amount')
        .eq('company_id', currentCompany?.id)
        .gte('invoice_date', startDate.toISOString().split('T')[0])
        .lte('invoice_date', endDate.toISOString().split('T')[0]);

      // Load Purchase Data (Expenses)
      const { data: purchaseData } = await supabase
        .from('purchase_invoices')
        .select('total_amount, bill_date, status, paid_amount, outstanding_amount')
        .eq('company_id', currentCompany?.id)
        .gte('bill_date', startDate.toISOString().split('T')[0])
        .lte('bill_date', endDate.toISOString().split('T')[0]);

      // Load Customer Data
      const { data: customersData } = await supabase
        .from('customers')
        .select(`
          id, name, 
          sales_invoices!inner(total_amount, status)
        `)
        .eq('company_id', currentCompany?.id)
        .eq('is_active', true);

      // Load Payment Data
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, payment_date, status')
        .eq('company_id', currentCompany?.id)
        .gte('payment_date', startDate.toISOString().split('T')[0])
        .lte('payment_date', endDate.toISOString().split('T')[0]);

      // Load Receipt Data
      const { data: receiptsData } = await supabase
        .from('receipts')
        .select('amount, receipt_date, status')
        .eq('company_id', currentCompany?.id)
        .gte('receipt_date', startDate.toISOString().split('T')[0])
        .lte('receipt_date', endDate.toISOString().split('T')[0]);

      // Calculate KPIs
      const totalIncome = salesData?.reduce((sum, invoice) => 
        sum + (invoice.status === 'paid' ? invoice.total_amount || 0 : 0), 0) || 0;
      
      const totalExpenses = purchaseData?.reduce((sum, bill) => 
        sum + (bill.status === 'paid' ? bill.total_amount || 0 : 0), 0) || 0;
      
      const netProfit = totalIncome - totalExpenses;
      
      const totalReceivables = salesData?.reduce((sum, invoice) => 
        sum + (invoice.outstanding_amount || 0), 0) || 0;
      
      const totalPayables = purchaseData?.reduce((sum, bill) => 
        sum + (bill.outstanding_amount || 0), 0) || 0;

      const cashInflow = receiptsData?.reduce((sum, receipt) => 
        sum + (receipt.amount || 0), 0) || 0;
      
      const cashOutflow = paymentsData?.reduce((sum, payment) => 
        sum + (payment.amount || 0), 0) || 0;
      
      const cashBalance = cashInflow - cashOutflow;

      // Generate monthly data for charts
      const monthlyData = generateMonthlyData(salesData || [], purchaseData || []);
      const expenseBreakdown = generateExpenseBreakdown(purchaseData || []);
      const profitTrend = generateProfitTrend(salesData || [], purchaseData || []);

      // Process top customers
      const topCustomers = processTopCustomers(customersData || []);

      // Generate recent transactions
      const recentTransactions = generateRecentTransactions(
        salesData || [], 
        purchaseData || [], 
        paymentsData || [], 
        receiptsData || []
      );

      // Generate upcoming payments
      const upcomingPayments = generateUpcomingPayments(salesData || [], purchaseData || []);

      // Generate audit alerts
      const auditAlerts = generateAuditAlerts(salesData || [], purchaseData || []);

      setDashboardData({
        totalIncome,
        totalExpenses,
        netProfit,
        totalReceivables,
        totalPayables,
        cashBalance,
        totalAssets: totalIncome + cashBalance, // Simplified calculation
        totalLiabilities: totalPayables,
        monthlyData,
        expenseBreakdown,
        profitTrend,
        recentTransactions,
        topCustomers,
        upcomingPayments,
        auditAlerts
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (salesData: any[], purchaseData: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthSales = salesData.filter(sale => 
        new Date(sale.invoice_date).getMonth() === index &&
        new Date(sale.invoice_date).getFullYear() === currentYear
      ).reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

      const monthPurchases = purchaseData.filter(purchase => 
        new Date(purchase.bill_date).getMonth() === index &&
        new Date(purchase.bill_date).getFullYear() === currentYear
      ).reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0);

      return {
        month,
        income: monthSales,
        expenses: monthPurchases,
        profit: monthSales - monthPurchases
      };
    });
  };

  const generateExpenseBreakdown = (purchaseData: any[]) => {
    // Simplified expense categorization
    const categories = {
      'Office Expenses': 0,
      'Travel': 0,
      'Utilities': 0,
      'Supplies': 0,
      'Others': 0
    };

    purchaseData.forEach(purchase => {
      // Simple categorization based on amount ranges (in real app, use vendor categories)
      const amount = purchase.total_amount || 0;
      if (amount < 1000) categories['Office Expenses'] += amount;
      else if (amount < 5000) categories['Supplies'] += amount;
      else if (amount < 10000) categories['Travel'] += amount;
      else if (amount < 20000) categories['Utilities'] += amount;
      else categories['Others'] += amount;
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const generateProfitTrend = (salesData: any[], purchaseData: any[]) => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthSales = salesData.filter(sale => {
        const saleDate = new Date(sale.invoice_date);
        return saleDate.getMonth() === date.getMonth() && 
               saleDate.getFullYear() === date.getFullYear();
      }).reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

      const monthPurchases = purchaseData.filter(purchase => {
        const purchaseDate = new Date(purchase.bill_date);
        return purchaseDate.getMonth() === date.getMonth() && 
               purchaseDate.getFullYear() === date.getFullYear();
      }).reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0);

      last6Months.push({
        month: monthName,
        profit: monthSales - monthPurchases
      });
    }
    
    return last6Months;
  };

  const processTopCustomers = (customersData: any[]) => {
    return customersData
      .map(customer => ({
        name: customer.name,
        totalSales: customer.sales_invoices?.reduce((sum: number, invoice: any) => 
          sum + (invoice.total_amount || 0), 0) || 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);
  };

  const generateRecentTransactions = (salesData: any[], purchaseData: any[], paymentsData: any[], receiptsData: any[]) => {
    const transactions = [
      ...salesData.map(sale => ({
        id: sale.id || Math.random(),
        type: 'sale',
        description: `Sales Invoice`,
        amount: sale.total_amount || 0,
        date: sale.invoice_date,
        status: sale.status
      })),
      ...purchaseData.map(purchase => ({
        id: purchase.id || Math.random(),
        type: 'purchase',
        description: `Purchase Bill`,
        amount: -(purchase.total_amount || 0),
        date: purchase.bill_date,
        status: purchase.status
      })),
      ...paymentsData.map(payment => ({
        id: payment.id || Math.random(),
        type: 'payment',
        description: `Payment Made`,
        amount: -(payment.amount || 0),
        date: payment.payment_date,
        status: payment.status
      })),
      ...receiptsData.map(receipt => ({
        id: receipt.id || Math.random(),
        type: 'receipt',
        description: `Payment Received`,
        amount: receipt.amount || 0,
        date: receipt.receipt_date,
        status: receipt.status
      }))
    ];

    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  const generateUpcomingPayments = (salesData: any[], purchaseData: any[]) => {
    const upcoming = [];
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Overdue receivables
    salesData.forEach(sale => {
      if (sale.outstanding_amount > 0) {
        const dueDate = new Date(sale.invoice_date);
        dueDate.setDate(dueDate.getDate() + 30); // Assume 30 days credit
        
        if (dueDate <= next30Days) {
          upcoming.push({
            type: 'receivable',
            description: `Invoice payment due`,
            amount: sale.outstanding_amount,
            dueDate: dueDate.toISOString().split('T')[0],
            overdue: dueDate < now
          });
        }
      }
    });

    // Upcoming payables
    purchaseData.forEach(purchase => {
      if (purchase.outstanding_amount > 0) {
        const dueDate = new Date(purchase.bill_date);
        dueDate.setDate(dueDate.getDate() + 30); // Assume 30 days credit
        
        if (dueDate <= next30Days) {
          upcoming.push({
            type: 'payable',
            description: `Bill payment due`,
            amount: purchase.outstanding_amount,
            dueDate: dueDate.toISOString().split('T')[0],
            overdue: dueDate < now
          });
        }
      }
    });

    return upcoming.slice(0, 5);
  };

  const generateAuditAlerts = (salesData: any[], purchaseData: any[]) => {
    const alerts = [];

    // Check for large transactions
    const largeTransactions = [...salesData, ...purchaseData].filter(
      transaction => (transaction.total_amount || 0) > 100000
    );

    if (largeTransactions.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${largeTransactions.length} large transactions (>₹1L) require review`,
        priority: 'medium'
      });
    }

    // Check for overdue payments
    const overdueReceivables = salesData.filter(sale => {
      if (sale.outstanding_amount > 0) {
        const dueDate = new Date(sale.invoice_date);
        dueDate.setDate(dueDate.getDate() + 30);
        return dueDate < new Date();
      }
      return false;
    });

    if (overdueReceivables.length > 0) {
      alerts.push({
        type: 'error',
        message: `${overdueReceivables.length} overdue receivables need attention`,
        priority: 'high'
      });
    }

    // Check for data consistency
    const inconsistentData = salesData.filter(sale => 
      sale.total_amount !== (sale.paid_amount + sale.outstanding_amount)
    );

    if (inconsistentData.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${inconsistentData.length} invoices have amount mismatches`,
        priority: 'high'
      });
    }

    return alerts.slice(0, 3);
  };

  const generateAIInsights = async () => {
    if (!isAIEnabled) return;

    try {
      const insights = await predictiveAnalysis({
        totalIncome: dashboardData.totalIncome,
        totalExpenses: dashboardData.totalExpenses,
        monthlyData: dashboardData.monthlyData,
        context: 'dashboard_overview'
      });

      if (insights) {
        setAiInsights(insights.predictions || []);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    if (isAIEnabled) {
      await generateAIInsights();
    }
    setRefreshing(false);
  };

  const handleVoiceCommand = async (command: string) => {
    try {
      const result = await voiceCommand(command);
      if (result) {
        // Handle voice command result
        console.log('Voice command result:', result);
      }
    } catch (error) {
      console.error('Voice command error:', error);
    }
  };

  const toggleWidget = (widgetId: string) => {
    setHiddenWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currentCompany?.currency || 'INR'
    }).format(amount);
  };

  const kpiCards = [
    { 
      id: 'income',
      title: 'Total Income', 
      value: formatCurrency(dashboardData.totalIncome), 
      change: '+12.5%', 
      icon: TrendingUp, 
      color: 'from-green-500 to-green-600',
      trend: 'up'
    },
    { 
      id: 'expenses',
      title: 'Total Expenses', 
      value: formatCurrency(dashboardData.totalExpenses), 
      change: '+8.3%', 
      icon: DollarSign, 
      color: 'from-red-500 to-red-600',
      trend: 'up'
    },
    { 
      id: 'profit',
      title: 'Net Profit', 
      value: formatCurrency(dashboardData.netProfit), 
      change: dashboardData.netProfit > 0 ? '+15.7%' : '-5.2%', 
      icon: BarChart3, 
      color: dashboardData.netProfit > 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600',
      trend: dashboardData.netProfit > 0 ? 'up' : 'down'
    },
    { 
      id: 'receivables',
      title: 'Total Receivables', 
      value: formatCurrency(dashboardData.totalReceivables), 
      change: '-2.1%', 
      icon: CreditCard, 
      color: 'from-purple-500 to-purple-600',
      trend: 'down'
    },
    { 
      id: 'payables',
      title: 'Total Payables', 
      value: formatCurrency(dashboardData.totalPayables), 
      change: '+5.8%', 
      icon: ShoppingCart, 
      color: 'from-orange-500 to-orange-600',
      trend: 'up'
    },
    { 
      id: 'cash',
      title: 'Cash & Bank', 
      value: formatCurrency(dashboardData.cashBalance), 
      change: '+18.2%', 
      icon: Wallet, 
      color: 'from-teal-500 to-teal-600',
      trend: 'up'
    },
    { 
      id: 'assets',
      title: 'Total Assets', 
      value: formatCurrency(dashboardData.totalAssets), 
      change: '+7.9%', 
      icon: Building, 
      color: 'from-indigo-500 to-indigo-600',
      trend: 'up'
    },
    { 
      id: 'liabilities',
      title: 'Total Liabilities', 
      value: formatCurrency(dashboardData.totalLiabilities), 
      change: '+3.4%', 
      icon: Package, 
      color: 'from-pink-500 to-pink-600',
      trend: 'up'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6AC8A3]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className={`text-4xl font-bold ${theme.textPrimary} flex items-center`}>
            <Home size={32} className="mr-3 text-[#6AC8A3]" />
            Business Dashboard
          </h1>
          <p className={`${theme.textSecondary} text-lg mt-1`}>
            Real-time insights for {currentCompany?.name} • {currentPeriod?.name}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={`
              px-4 py-2 border ${theme.borderColor} rounded-xl ${theme.inputBg} 
              ${theme.textPrimary} focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
            `}
          >
            <option value="current_month">This Month</option>
            <option value="current_quarter">This Quarter</option>
            <option value="current_year">This Year</option>
          </select>

          {/* Action Buttons */}
          <Button
            variant="outline"
            icon={<Filter size={16} />}
            onClick={() => {/* Open filter modal */}}
          >
            Filter
          </Button>
          
          <Button
            variant="outline"
            icon={<Download size={16} />}
            onClick={() => {/* Export dashboard */}}
          >
            Export
          </Button>

          <Button
            variant="outline"
            icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>

          {/* AI Buttons */}
          {isAIEnabled && (
            <>
              <AIButton 
                variant="voice" 
                onSuggest={() => setShowVoicePanel(true)} 
              />
              <AIButton 
                variant="analyze" 
                onSuggest={generateAIInsights} 
              />
            </>
          )}
        </div>
      </div>

      {/* AI Insights Banner */}
      {isAIEnabled && aiInsights.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 border-l-4 border-l-[#6AC8A3]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot size={24} className="text-[#6AC8A3]" />
              <div>
                <h3 className="font-semibold text-gray-900">AI Business Insights</h3>
                <p className="text-sm text-gray-600">
                  {aiInsights.length} new insights available based on your data
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline">View All Insights</Button>
          </div>
        </Card>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.filter(card => !hiddenWidgets.includes(card.id)).map((kpi) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend === 'up';
          
          return (
            <Card key={kpi.id} hover className="p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm font-medium ${theme.textMuted}`}>
                      {kpi.title}
                    </p>
                    <button
                      onClick={() => toggleWidget(kpi.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <EyeOff size={14} className="text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                  <p className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                    {kpi.value}
                  </p>
                  <div className="flex items-center">
                    {isPositive ? (
                      <ArrowUp size={16} className="text-green-500 mr-1" />
                    ) : (
                      <ArrowDown size={16} className="text-red-500 mr-1" />
                    )}
                    <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change}
                    </p>
                  </div>
                </div>
                <div className={`
                  p-4 bg-gradient-to-r ${kpi.color} rounded-2xl shadow-xl
                  transform group-hover:scale-110 transition-transform duration-300
                `}>
                  <Icon size={28} className="text-white" />
                </div>
              </div>
              
              {/* Background Gradient */}
              <div className={`
                absolute top-0 right-0 w-32 h-32 bg-gradient-to-r ${kpi.color} 
                opacity-5 transform rotate-12 translate-x-8 -translate-y-8 rounded-2xl
              `} />
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#6AC8A3]/5 to-transparent 
                             opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            </Card>
          );
        })}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income vs Expenses */}
        {!hiddenWidgets.includes('monthly-chart') && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${theme.textPrimary}`}>
                Monthly Income vs Expenses
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleWidget('monthly-chart')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <EyeOff size={16} />
                </button>
                <BarChart3 className="text-[#6AC8A3]" size={20} />
              </div>
            </div>
            <DashboardChart 
              data={dashboardData.monthlyData} 
              type="bar" 
              height={300}
            />
          </Card>
        )}

        {/* Expense Breakdown */}
        {!hiddenWidgets.includes('expense-pie') && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${theme.textPrimary}`}>
                Expense Breakdown
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleWidget('expense-pie')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <EyeOff size={16} />
                </button>
                <PieChart className="text-[#6AC8A3]" size={20} />
              </div>
            </div>
            <DashboardChart 
              data={dashboardData.expenseBreakdown} 
              type="pie" 
              height={300}
            />
          </Card>
        )}

        {/* Profit Trend */}
        {!hiddenWidgets.includes('profit-trend') && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${theme.textPrimary}`}>
                Profit Trend (6 Months)
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleWidget('profit-trend')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <EyeOff size={16} />
                </button>
                <TrendingUp className="text-[#6AC8A3]" size={20} />
              </div>
            </div>
            <DashboardChart 
              data={dashboardData.profitTrend} 
              type="line" 
              height={300}
            />
          </Card>
        )}

        {/* Cash Flow */}
        {!hiddenWidgets.includes('cashflow') && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${theme.textPrimary}`}>
                Cash Flow Analysis
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleWidget('cashflow')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <EyeOff size={16} />
                </button>
                <Wallet className="text-[#6AC8A3]" size={20} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(dashboardData.totalIncome)}
                </p>
                <p className="text-sm text-green-700">Cash Inflow</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(dashboardData.totalExpenses)}
                </p>
                <p className="text-sm text-red-700">Cash Outflow</p>
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(dashboardData.cashBalance)}
              </p>
              <p className="text-sm text-blue-700">Net Cash Flow</p>
            </div>
          </Card>
        )}
      </div>

      {/* Data Tables and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        {!hiddenWidgets.includes('recent-transactions') && (
          <RecentTransactions 
            transactions={dashboardData.recentTransactions}
            onToggle={() => toggleWidget('recent-transactions')}
          />
        )}

        {/* Top Customers */}
        {!hiddenWidgets.includes('top-customers') && (
          <TopCustomers 
            customers={dashboardData.topCustomers}
            onToggle={() => toggleWidget('top-customers')}
          />
        )}

        {/* AI Insights Panel */}
        {isAIEnabled && !hiddenWidgets.includes('ai-insights') && (
          <AIInsightPanel 
            insights={aiInsights}
            onToggle={() => toggleWidget('ai-insights')}
            onRefresh={generateAIInsights}
          />
        )}
      </div>

      {/* Upcoming Payments & Audit Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Payments */}
        {!hiddenWidgets.includes('upcoming-payments') && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${theme.textPrimary}`}>
                Upcoming Due Payments
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleWidget('upcoming-payments')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <EyeOff size={16} />
                </button>
                <Calendar className="text-[#6AC8A3]" size={20} />
              </div>
            </div>
            <div className="space-y-3">
              {dashboardData.upcomingPayments.map((payment, index) => (
                <div 
                  key={index} 
                  className={`
                    p-4 rounded-xl border-l-4 transition-all duration-300
                    ${payment.overdue 
                      ? 'border-l-red-500 bg-red-50 hover:bg-red-100' 
                      : payment.type === 'receivable'
                        ? 'border-l-green-500 bg-green-50 hover:bg-green-100'
                        : 'border-l-orange-500 bg-orange-50 hover:bg-orange-100'
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-medium ${theme.textPrimary}`}>
                        {payment.description}
                      </p>
                      <p className={`text-sm ${theme.textMuted}`}>
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                        {payment.overdue && (
                          <span className="text-red-600 font-medium ml-2">
                            (Overdue)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        payment.type === 'receivable' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {payment.type === 'receivable' ? '+' : '-'}{formatCurrency(Math.abs(payment.amount))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {dashboardData.upcomingPayments.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="mx-auto text-green-500 mb-2" />
                  <p className={theme.textMuted}>No upcoming payments</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Audit Alerts */}
        {!hiddenWidgets.includes('audit-alerts') && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${theme.textPrimary}`}>
                Audit Alerts & Notifications
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleWidget('audit-alerts')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <EyeOff size={16} />
                </button>
                <AlertCircle className="text-[#6AC8A3]" size={20} />
              </div>
            </div>
            <div className="space-y-3">
              {dashboardData.auditAlerts.map((alert, index) => (
                <div 
                  key={index} 
                  className={`
                    p-4 rounded-xl border-l-4 transition-all duration-300
                    ${alert.type === 'error' 
                      ? 'border-l-red-500 bg-red-50 hover:bg-red-100' 
                      : 'border-l-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    {alert.type === 'error' ? (
                      <AlertCircle size={20} className="text-red-500 mt-0.5" />
                    ) : (
                      <AlertTriangle size={20} className="text-yellow-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${theme.textPrimary}`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`
                          px-2 py-1 text-xs rounded-full
                          ${alert.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                          }
                        `}>
                          {alert.priority} priority
                        </span>
                        <button className="text-xs text-blue-600 hover:text-blue-800">
                          Review →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {dashboardData.auditAlerts.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="mx-auto text-green-500 mb-2" />
                  <p className={theme.textMuted}>No audit alerts</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Hidden Widgets Panel */}
      {hiddenWidgets.length > 0 && (
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${theme.textPrimary}`}>
              Hidden Widgets ({hiddenWidgets.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {hiddenWidgets.map(widgetId => (
                <button
                  key={widgetId}
                  onClick={() => toggleWidget(widgetId)}
                  className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye size={14} />
                  <span className="text-sm capitalize">{widgetId.replace('-', ' ')}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Voice Command Panel */}
      {showVoicePanel && (
        <VoiceCommandPanel
          isOpen={showVoicePanel}
          onClose={() => setShowVoicePanel(false)}
          onCommand={handleVoiceCommand}
        />
      )}
    </div>
  );
}

export default Dashboard;