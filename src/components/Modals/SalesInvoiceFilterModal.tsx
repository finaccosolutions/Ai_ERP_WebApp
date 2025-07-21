// src/components/Modals/SalesInvoiceFilterModal.tsx
import React from 'react';
import { X, Filter, Search, Calendar, Users, DollarSign, FileText, Bot } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import AIButton from '../UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';

interface SalesInvoiceFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    customerName: string;
    minAmount: string;
    maxAmount: string;
    invoiceNo: string;
    status: string;
    startDate: string;
    endDate: string;
    numResults: string;
    sortBy: string;      // New filter option
    sortOrder: string;   // New filter option
    referenceNo: string; // New filter option
    createdBy: string;   // New filter option
  };
  onApplyFilters: (filters: SalesInvoiceFilterModalProps['filters']) => void;
  onFilterChange: (key: keyof SalesInvoiceFilterModalProps['filters'], value: string) => void;
}

function SalesInvoiceFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onFilterChange,
}: SalesInvoiceFilterModalProps) {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();

  if (!isOpen) return null;

  const handleClearFilters = () => {
    onApplyFilters({
      customerName: '',
      minAmount: '',
      maxAmount: '',
      invoiceNo: '',
      status: 'all',
      startDate: '',
      endDate: '',
      numResults: '10',
      sortBy: 'invoice_date', // Reset to default sort
      sortOrder: 'desc',     // Reset to default sort
      referenceNo: '',
      createdBy: '',
    });
  };

  const handleAISuggestFilter = async () => {
    try {
      const aiPrompt = `Suggest relevant filters for sales invoices based on common business needs. Consider date ranges, status, customer, and amount. Provide suggestions in a structured format.`;
      const aiResponse = await suggestWithAI({ query: aiPrompt, context: 'sales_invoice_filters' });

      if (aiResponse && aiResponse.suggestions && aiResponse.suggestions.length > 0) {
        const suggestedFilters = aiResponse.suggestions[0].filterData; // Assuming AI returns filterData
        if (suggestedFilters) {
          onApplyFilters({ ...filters, ...suggestedFilters });
        } else {
          console.warn('AI did not return specific filter data.');
        }
      }
    } catch (error) {
      console.error('AI filter suggestion error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <Card className={`w-full max-w-4xl ${theme.cardBg}`}> {/* Increased max-w to 4xl */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`
                w-10 h-10 rounded-lg bg-gradient-to-r ${theme.primaryGradient}
                flex items-center justify-center text-white
              `}>
                <Filter size={20} />
              </div>
              <div>
                <h3 className={`font-semibold ${theme.textPrimary}`}>
                  Filter Sales Invoices
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`${theme.textMuted} hover:${theme.textPrimary}`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"> {/* Added lg:grid-cols-3 */}
            <FormField
              label="Invoice Number"
              value={filters.invoiceNo}
              onChange={(val) => onFilterChange('invoiceNo', val)}
              placeholder="e.g., INV-001"
              icon={<FileText size={18} />}
              // Removed className="h-10"
            />
            <FormField
              label="Customer Name"
              value={filters.customerName}
              onChange={(val) => onFilterChange('customerName', val)}
              placeholder="e.g., ABC Corp"
              icon={<Users size={18} />}
              // Removed className="h-10"
            />
            <FormField
              label="Min Amount"
              type="number"
              value={filters.minAmount}
              onChange={(val) => onFilterChange('minAmount', val)}
              placeholder="e.g., 1000"
              icon={<DollarSign size={18} />}
              // Removed className="h-10"
            />
            <FormField
              label="Max Amount"
              type="number"
              value={filters.maxAmount}
              onChange={(val) => onFilterChange('maxAmount', val)}
              placeholder="e.g., 50000"
              icon={<DollarSign size={18} />}
              // Removed className="h-10"
            />
            <FormField
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(val) => onFilterChange('startDate', val)}
              icon={<Calendar size={18} />}
              // Removed className="h-10"
            />
            <FormField
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(val) => onFilterChange('endDate', val)}
              icon={<Calendar size={18} />}
              // Removed className="h-10"
            />
            <FormField
              label="Reference No."
              value={filters.referenceNo}
              onChange={(val) => onFilterChange('referenceNo', val)}
              placeholder="e.g., PO123"
              icon={<FileText size={18} />}
              // Removed className="h-10"
            />
            <FormField
              label="Created By"
              value={filters.createdBy}
              onChange={(val) => onFilterChange('createdBy', val)}
              placeholder="e.g., John Doe"
              icon={<Users size={18} />}
              // Removed className="h-10"
            />
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => onFilterChange('status', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
                <option value="credit_note">Credit Note</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Number of Results
              </label>
              <select
                value={filters.numResults}
                onChange={(e) => onFilterChange('numResults', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange('sortBy', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                <option value="invoice_date">Invoice Date</option>
                <option value="total_amount">Total Amount</option>
                <option value="invoice_no">Invoice Number</option>
                <option value="customers.name">Customer Name</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => onFilterChange('sortOrder', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <AIButton variant="suggest" onSuggest={handleAISuggestFilter} />
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button type="button" onClick={() => onApplyFilters(filters)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SalesInvoiceFilterModal;