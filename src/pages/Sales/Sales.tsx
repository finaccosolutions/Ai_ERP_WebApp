import React, { useState } from 'react';
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
  Upload
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import CreateInvoice from './CreateInvoice';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';

function Sales() {
  const location = useLocation();
  const { theme } = useTheme();
  const { smartSearch, voiceCommand } = useAI();
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const salesModules = [
    { name: 'Customers', icon: Users, path: '/sales/customers', color: 'bg-blue-500', count: '1,247' },
    { name: 'Quotations', icon: FileText, path: '/sales/quotations', color: 'bg-green-500', count: '89' },
    { name: 'Orders', icon: ShoppingCart, path: '/sales/orders', color: 'bg-purple-500', count: '156' },
    { name: 'Invoices', icon: FileText, path: '/sales/invoices', color: 'bg-orange-500', count: '342' },
    { name: 'Payments', icon: CreditCard, path: '/sales/payments', color: 'bg-teal-500', count: '298' },
    { name: 'Reports', icon: BarChart3, path: '/sales/reports', color: 'bg-red-500', count: '25' },
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
        <Route path="/customers" element={<div>Customers Module</div>} />
        <Route path="/quotations" element={<div>Quotations Module</div>} />
        <Route path="/orders" element={<div>Orders Module</div>} />
        <Route path="/invoices" element={<CreateInvoice />} />
        <Route path="/invoices/create" element={<CreateInvoice />} />
        <Route path="/payments" element={<div>Payments Module</div>} />
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

      {/* Sales Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {salesModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.name} to={module.path}>
              <Card hover className="p-6 cursor-pointer group relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-semibold ${theme.textPrimary} group-hover:text-[#6AC8A3] transition-colors`}>
                      {module.name}
                    </h3>
                    <p className={`text-sm ${theme.textMuted}`}>Manage {module.name.toLowerCase()}</p>
                    <p className={`text-2xl font-bold ${theme.textPrimary} mt-2`}>{module.count}</p>
                  </div>
                  <div className={`
                    p-3 ${module.color} ${theme.borderRadius} 
                    group-hover:scale-110 transition-transform duration-300
                    relative z-10
                  `}>
                    <Icon size={24} className="text-white" />
                  </div>
                </div>
                
                {/* AI Enhancement Indicator */}
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-[#5DBF99] rounded-full animate-pulse" title="AI Enhanced" />
                </div>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#5DBF99]/5 to-transparent 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Dashboard Content */}
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
                    `}>
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
                  `}>
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