import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  ShoppingCart, 
  FileText, 
  CreditCard, 
  BarChart3,
  Plus,
  Search
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';

function Sales() {
  const location = useLocation();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const salesModules = [
    { name: 'Customers', icon: Users, path: '/sales/customers', color: 'bg-blue-500' },
    { name: 'Quotations', icon: FileText, path: '/sales/quotations', color: 'bg-green-500' },
    { name: 'Orders', icon: ShoppingCart, path: '/sales/orders', color: 'bg-purple-500' },
    { name: 'Invoices', icon: FileText, path: '/sales/invoices', color: 'bg-orange-500' },
    { name: 'Payments', icon: CreditCard, path: '/sales/payments', color: 'bg-teal-500' },
    { name: 'Reports', icon: BarChart3, path: '/sales/reports', color: 'bg-red-500' },
  ];

  const recentSales = [
    { id: 'INV-001', customer: 'ABC Corp', amount: '$5,250', date: '2024-01-15', status: 'Paid' },
    { id: 'INV-002', customer: 'XYZ Ltd', amount: '$3,800', date: '2024-01-14', status: 'Pending' },
    { id: 'INV-003', customer: 'Demo Inc', amount: '$7,500', date: '2024-01-13', status: 'Overdue' },
  ];

  const isMainSalesPage = location.pathname === '/sales';

  if (!isMainSalesPage) {
    return (
      <Routes>
        <Route path="/customers" element={<div>Customers Module</div>} />
        <Route path="/quotations" element={<div>Quotations Module</div>} />
        <Route path="/orders" element={<div>Orders Module</div>} />
        <Route path="/invoices" element={<div>Invoices Module</div>} />
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
          <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600">Manage customers, orders, invoices, and sales analytics</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Sales Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => console.log('Quick Create')}>
            Quick Create
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers, invoices, orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline">Filter</Button>
          <Button variant="outline">Export</Button>
        </div>
      </Card>

      {/* Sales Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {salesModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.name} to={module.path}>
              <Card hover className="p-6 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 ${module.color} ${theme.borderRadius} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{module.name}</h3>
                    <p className="text-sm text-gray-600">Manage {module.name.toLowerCase()}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Sales and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
            <Link to="/sales/invoices" className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{sale.id}</p>
                  <p className="text-sm text-gray-600">{sale.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{sale.amount}</p>
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

        {/* Sales Statistics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Month</span>
              <span className="text-2xl font-bold text-green-600">$45,280</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Outstanding</span>
              <span className="text-2xl font-bold text-orange-600">$12,450</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Overdue</span>
              <span className="text-2xl font-bold text-red-600">$3,200</span>
            </div>
          </div>
          <div className="mt-6">
            <AIButton 
              variant="analyze" 
              onSuggest={() => console.log('Analyze Sales Performance')}
              className="w-full"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Sales;