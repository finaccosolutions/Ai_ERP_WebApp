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
  ArrowDown
} from 'lucide-react';
import Card from '../../components/UI/Card';
import AIButton from '../../components/UI/AIButton';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

function Dashboard() {
  const { currentCompany, currentPeriod } = useCompany();
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    activeOrders: 0,
    inventoryItems: 0,
    activeCustomers: 0,
    recentActivities: [],
    salesTrend: 12.5,
    ordersTrend: 8.3,
    inventoryTrend: -2.1,
    customersTrend: 15.7
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompany) {
      loadDashboardData();
    }
  }, [currentCompany]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load sales data
      const { data: salesData } = await supabase
        .from('sales_invoices')
        .select('total_amount')
        .eq('company_id', currentCompany?.id)
        .eq('status', 'paid');

      // Load orders data
      const { data: ordersData } = await supabase
        .from('sales_orders')
        .select('id')
        .eq('company_id', currentCompany?.id)
        .in('status', ['confirmed', 'partially_delivered']);

      // Load inventory data
      const { data: inventoryData } = await supabase
        .from('items')
        .select('id')
        .eq('company_id', currentCompany?.id)
        .eq('is_active', true);

      // Load customers data
      const { data: customersData } = await supabase
        .from('customers')
        .select('id')
        .eq('company_id', currentCompany?.id)
        .eq('is_active', true);

      // Calculate totals
      const totalRevenue = salesData?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;
      const activeOrders = ordersData?.length || 0;
      const inventoryItems = inventoryData?.length || 0;
      const activeCustomers = customersData?.length || 0;

      setDashboardData({
        totalRevenue,
        activeOrders,
        inventoryItems,
        activeCustomers,
        recentActivities: [
          { id: 1, type: 'sale', message: 'New sales invoice created for ABC Corp', time: '2 hours ago' },
          { id: 2, type: 'purchase', message: 'Purchase order approved for XYZ Supplies', time: '4 hours ago' },
          { id: 3, type: 'payment', message: 'Payment received from John Doe', time: '6 hours ago' },
          { id: 4, type: 'inventory', message: 'Low stock alert for Product A', time: '8 hours ago' },
        ],
        salesTrend: 12.5,
        ordersTrend: 8.3,
        inventoryTrend: -2.1,
        customersTrend: 15.7
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentCompany?.currency || 'USD'
    }).format(amount);
  };

  const kpiData = [
    { 
      title: 'Total Revenue', 
      value: formatCurrency(dashboardData.totalRevenue), 
      change: `${dashboardData.salesTrend > 0 ? '+' : ''}${dashboardData.salesTrend}%`, 
      icon: DollarSign, 
      color: 'text-green-600',
      bgColor: 'from-green-500 to-green-600',
      trend: dashboardData.salesTrend
    },
    { 
      title: 'Active Orders', 
      value: dashboardData.activeOrders.toLocaleString(), 
      change: `${dashboardData.ordersTrend > 0 ? '+' : ''}${dashboardData.ordersTrend}%`, 
      icon: ShoppingCart, 
      color: 'text-blue-600',
      bgColor: 'from-blue-500 to-blue-600',
      trend: dashboardData.ordersTrend
    },
    { 
      title: 'Inventory Items', 
      value: dashboardData.inventoryItems.toLocaleString(), 
      change: `${dashboardData.inventoryTrend > 0 ? '+' : ''}${dashboardData.inventoryTrend}%`, 
      icon: Package, 
      color: 'text-orange-600',
      bgColor: 'from-orange-500 to-orange-600',
      trend: dashboardData.inventoryTrend
    },
    { 
      title: 'Active Customers', 
      value: dashboardData.activeCustomers.toLocaleString(), 
      change: `${dashboardData.customersTrend > 0 ? '+' : ''}${dashboardData.customersTrend}%`, 
      icon: Users, 
      color: 'text-purple-600',
      bgColor: 'from-purple-500 to-purple-600',
      trend: dashboardData.customersTrend
    },
  ];

  const aiInsights = [
    { title: 'Revenue Prediction', insight: 'Expected 18% growth in Q2 based on current trends', confidence: 'high' },
    { title: 'Inventory Alert', insight: '15 items need reordering within next week', confidence: 'medium' },
    { title: 'Customer Behavior', insight: 'Premium customers show 25% increase in order frequency', confidence: 'high' },
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            Dashboard
          </h1>
          <p className={theme.textSecondary}>
            Welcome back! Here's what's happening with {currentCompany?.name} in {currentPeriod?.name}
          </p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="analyze" onSuggest={() => console.log('AI Analysis')} />
          <AIButton variant="suggest" onSuggest={() => console.log('AI Suggestions')} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend > 0;
          
          return (
            <Card key={kpi.title} hover className="p-6 relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className={`text-sm ${theme.textMuted}`}>
                    {kpi.title}
                  </p>
                  <p className={`text-2xl font-bold ${theme.textPrimary}`}>
                    {kpi.value}
                  </p>
                  <div className="flex items-center mt-1">
                    {isPositive ? (
                      <ArrowUp size={16} className="text-green-500 mr-1" />
                    ) : (
                      <ArrowDown size={16} className="text-red-500 mr-1" />
                    )}
                    <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change}
                    </p>
                  </div>
                </div>
                <div className={`
                  p-4 bg-gradient-to-r ${kpi.bgColor} ${theme.borderRadius} 
                  ${theme.shadowLevel} transform hover:scale-110 transition-transform duration-200
                `}>
                  <Icon size={28} className="text-white" />
                </div>
              </div>
              
              {/* Background Pattern */}
              <div className={`
                absolute top-0 right-0 w-32 h-32 bg-gradient-to-r ${kpi.bgColor} 
                opacity-5 transform rotate-12 translate-x-8 -translate-y-8
              `} />
            </Card>
          );
        })}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
              Revenue Trends
            </h3>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <div className={`
            h-64 bg-gradient-to-br from-[#6AC8A3]/10 via-[#76C0C8]/10 to-[#81CFEA]/10
            ${theme.borderRadius} flex items-center justify-center border ${theme.borderColor}
          `}>
            <div className="text-center">
              <TrendingUp size={48} className={`${theme.textMuted} mx-auto mb-2`} />
              <p className={theme.textMuted}>
                Interactive Chart Coming Soon
              </p>
            </div>
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
              AI Insights
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${theme.textMuted}`}>
                Powered by AI
              </span>
              <div className="w-2 h-2 bg-[#6AC8A3] rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className="border-l-4 border-[#6AC8A3] pl-4">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${theme.textPrimary}`}>
                    {insight.title}
                  </h4>
                  <span className={`
                    px-2 py-1 text-xs ${theme.borderRadius}
                    ${insight.confidence === 'high' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }
                  `}>
                    {insight.confidence} confidence
                  </span>
                </div>
                <p className={`text-sm ${theme.textMuted} mt-1`}>
                  {insight.insight}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="p-6 lg:col-span-2">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            Recent Activities
          </h3>
          <div className="space-y-3">
            {dashboardData.recentActivities.map((activity) => (
              <div key={activity.id} className={`
                flex items-center space-x-3 p-3 
                ${theme.inputBg} ${theme.borderRadius} 
                transition-all duration-300 hover:bg-[#5DBF99]/10 hover:border-[#5DBF99]
                border ${theme.borderColor}
              `}>
                <div className="flex-shrink-0">
                  <CheckCircle size={16} className="text-[#5DBF99]" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${theme.textPrimary}`}>
                    {activity.message}
                  </p>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className={`
              w-full p-3 text-left bg-gradient-to-r ${theme.primaryGradient}
              text-white ${theme.borderRadius} hover:bg-gradient-to-r hover:${theme.primaryGradientHover}
              transition-all duration-300 transform hover:scale-105 shadow-md
              hover:shadow-[#5DBF99]/25
            `}>
              <div className="flex items-center space-x-2">
                <ShoppingCart size={16} />
                <span>Create Sales Invoice</span>
              </div>
            </button>
            <button className={`
              w-full p-3 text-left ${theme.inputBg} ${theme.textPrimary}
              ${theme.borderRadius} transition-all duration-300 transform hover:scale-105
              hover:bg-[#5DBF99]/10 hover:border-[#5DBF99] border ${theme.borderColor}
            `}>
              <div className="flex items-center space-x-2">
                <Package size={16} />
                <span>Add Purchase Order</span>
              </div>
            </button>
            <button className={`
              w-full p-3 text-left ${theme.inputBg} ${theme.textPrimary}
              ${theme.borderRadius} transition-all duration-300 transform hover:scale-105
              hover:bg-[#5DBF99]/10 hover:border-[#5DBF99] border ${theme.borderColor}
            `}>
              <div className="flex items-center space-x-2">
                <DollarSign size={16} />
                <span>Record Payment</span>
              </div>
            </button>
            <button className={`
              w-full p-3 text-left ${theme.inputBg} ${theme.textPrimary}
              ${theme.borderRadius} transition-all duration-300 transform hover:scale-105
              hover:bg-[#5DBF99]/10 hover:border-[#5DBF99] border ${theme.borderColor}
            `}>
              <div className="flex items-center space-x-2">
                <Users size={16} />
                <span>Add New Customer</span>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;