import React from 'react';
import { Users, EyeOff, ExternalLink, TrendingUp } from 'lucide-react';
import Card from '../UI/Card';
import { useTheme } from '../../contexts/ThemeContext';

interface Customer {
  name: string;
  totalSales: number;
}

interface TopCustomersProps {
  customers: Customer[];
  onToggle: () => void;
}

function TopCustomers({ customers, onToggle }: TopCustomersProps) {
  const { theme } = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getCustomerInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-semibold ${theme.textPrimary} flex items-center`}>
          <Users size={20} className="mr-2 text-[#6AC8A3]" />
          Top Customers
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600"
          >
            <EyeOff size={16} />
          </button>
          <button className="text-[#6AC8A3] hover:text-[#5DBF99]">
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {customers.map((customer, index) => (
          <div 
            key={customer.name}
            className={`
              flex items-center justify-between p-4 rounded-xl border transition-all duration-300
              ${theme.borderColor} hover:border-[#6AC8A3] hover:bg-[#6AC8A3]/5
              cursor-pointer group
            `}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                  ${getAvatarColor(index)} group-hover:scale-110 transition-transform duration-300
                `}>
                  {getCustomerInitials(customer.name)}
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#6AC8A3] rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">#{index + 1}</span>
                </div>
              </div>
              <div>
                <p className={`font-medium ${theme.textPrimary} group-hover:text-[#5DBF99]`}>
                  {customer.name}
                </p>
                <p className={`text-sm ${theme.textMuted}`}>
                  Customer
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-green-600 flex items-center">
                <TrendingUp size={14} className="mr-1" />
                {formatCurrency(customer.totalSales)}
              </p>
              <p className={`text-xs ${theme.textMuted}`}>
                Total Sales
              </p>
            </div>
          </div>
        ))}
        
        {customers.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-gray-400" />
            </div>
            <p className={theme.textMuted}>No customer data available</p>
          </div>
        )}
      </div>
      
      {customers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="w-full text-center text-[#6AC8A3] hover:text-[#5DBF99] font-medium transition-colors">
            View All Customers →
          </button>
        </div>
      )}
    </Card>
  );
}

export default TopCustomers;