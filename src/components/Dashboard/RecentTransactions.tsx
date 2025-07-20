import React from 'react';
import { ArrowUpRight, ArrowDownLeft, EyeOff, ExternalLink } from 'lucide-react';
import Card from '../UI/Card';
import { useTheme } from '../../contexts/ThemeContext';

interface Transaction {
  id: string | number;
  type: 'sale' | 'purchase' | 'payment' | 'receipt';
  description: string;
  amount: number;
  date: string;
  status: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  onToggle: () => void;
}

function RecentTransactions({ transactions, onToggle }: RecentTransactionsProps) {
  const { theme } = useTheme();

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) {
      return <ArrowUpRight size={16} className="text-green-500" />;
    } else {
      return <ArrowDownLeft size={16} className="text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Math.abs(amount));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-semibold ${theme.textPrimary}`}>
          Recent Transactions
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600"
          >
            <EyeOff size={16} />
          </button>
          <button className="text-[${theme.hoverAccent}] hover:text-emerald-600">
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {transactions.map((transaction) => (
          <div 
            key={transaction.id}
            className={`
              flex items-center justify-between p-4 rounded-xl border transition-all duration-300
              ${theme.borderColor} hover:border-[${theme.hoverAccent}] hover:bg-[${theme.hoverAccent}]/5
              cursor-pointer group
            `}
          >
            <div className="flex items-center space-x-3">
              <div className={`
                p-2 rounded-lg transition-all duration-300
                ${transaction.amount > 0 
                  ? 'bg-green-100 group-hover:bg-green-200' 
                  : 'bg-red-100 group-hover:bg-red-200'
                }
              `}>
                {getTransactionIcon(transaction.type, transaction.amount)}
              </div>
              <div>
                <p className={`font-medium ${theme.textPrimary} group-hover:text-[${theme.hoverAccent}]`}>
                  {transaction.description}
                </p>
                <p className={`text-sm ${theme.textMuted}`}>
                  {new Date(transaction.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className={`font-bold ${
                transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
              </p>
              <span className={`
                px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}
              `}>
                {transaction.status}
              </span>
            </div>
          </div>
        ))}
        
        {transactions.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowUpRight size={24} className="text-gray-400" />
            </div>
            <p className={theme.textMuted}>No recent transactions</p>
          </div>
        )}
      </div>
      
      {transactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full text-center text-[${theme.hoverAccent}] hover:text-emerald-600 font-medium transition-colors">
            View All Transactions →
          </button>
        </div>
      )}
    </Card>
  );
}

export default RecentTransactions;