import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Card from '../../components/UI/Card';
import AIButton from '../../components/UI/AIButton';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';

function Dashboard() {
  const { currentCompany, currentPeriod } = useCompany();
  const { theme } = useTheme();

  const kpiData = [
    { title: 'Total Revenue', value: '$2,847,390', change: '+12.5%', icon: DollarSign, color: 'text-green-600' },
    { title: 'Active Orders', value: '1,247', change: '+8.3%', icon: ShoppingCart, color: 'text-blue-600' },
    { title: 'Inventory Items', value: '8,945', change: '-2.1%', icon: Package, color: 'text-orange-600' },
    { title: 'Active Customers', value: '3,542', change: '+15.7%', icon: Users, color: 'text-purple-600' },
  ];

  const recentActivities = [
    { id: 1, type: 'sale', message: 'New sales invoice created for ABC Corp', time: '2 hours ago' },
    { id: 2, type: 'purchase', message: 'Purchase order approved for XYZ Supplies', time: '4 hours ago' },
    { id: 3, type: 'payment', message: 'Payment received from John Doe', time: '6 hours ago' },
    { id: 4, type: 'inventory', message: 'Low stock alert for Product A', time: '8 hours ago' },
  ];

  const aiInsights = [
    { title: 'Revenue Prediction', insight: 'Expected 18% growth in Q2 based on current trends', confidence: 'high' },
    { title: 'Inventory Alert', insight: '15 items need reordering within next week', confidence: 'medium' },
    { title: 'Customer Behavior', insight: 'Premium customers show 25% increase in order frequency', confidence: 'high' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
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
          return (
            <Card key={kpi.title} hover className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <p className={`text-sm ${kpi.color}`}>{kpi.change}</p>
                </div>
                <div className={`p-3 ${theme.borderRadius} bg-gray-100`}>
                  <Icon size={24} className={kpi.color} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp size={48} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Interactive Chart Coming Soon</p>
            </div>
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Powered by AI</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${insight.confidence === 'high' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  `}>
                    {insight.confidence} confidence
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{insight.insight}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className={`
              w-full p-3 text-left bg-gradient-to-r ${theme.primaryGradient} 
              text-white ${theme.borderRadius} hover:opacity-90 transition-opacity
            `}>
              <div className="flex items-center space-x-2">
                <ShoppingCart size={16} />
                <span>Create Sales Invoice</span>
              </div>
            </button>
            <button className="w-full p-3 text-left bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <div className="flex items-center space-x-2">
                <Package size={16} />
                <span>Add Purchase Order</span>
              </div>
            </button>
            <button className="w-full p-3 text-left bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <div className="flex items-center space-x-2">
                <DollarSign size={16} />
                <span>Record Payment</span>
              </div>
            </button>
            <button className="w-full p-3 text-left bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
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