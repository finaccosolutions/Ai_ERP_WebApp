// src/components/Modals/StockJournalFilterModal.tsx
import React from 'react';
import { X, Filter, Search, Calendar, MapPin, Check, ClipboardList } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import AIButton from '../UI/AIButton';
import MasterSelectField from '../UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

interface StockJournalFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    entryNo: string;
    entryType: string; // 'stock_adjustment'
    startDate: string;
    endDate: string;
    warehouseId: string;
    status: string;
  };
  onApplyFilters: (filters: StockJournalFilterModalProps['filters']) => void;
  onFilterChange: (key: keyof StockJournalFilterModalProps['filters'], value: string) => void;
}

function StockJournalFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onFilterChange,
}: StockJournalFilterModalProps) {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();

  const [availableWarehouses, setAvailableWarehouses] = React.useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    if (currentCompany?.id) {
      fetchAvailableWarehouses(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const fetchAvailableWarehouses = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      setAvailableWarehouses(data || []);
    } catch (err) {
      console.error('Error fetching available warehouses for filter:', err);
    }
  };

  if (!isOpen) return null;

  const handleClearFilters = () => {
    onApplyFilters({
      entryNo: '',
      entryType: 'stock_adjustment',
      startDate: '',
      endDate: '',
      warehouseId: '',
      status: 'all',
    });
  };

  const handleAISuggestFilter = async () => {
    try {
      const aiPrompt = `Suggest relevant filters for stock journal entries (adjustments) based on common inventory needs. Consider entry number, date range, warehouse, and status. Provide suggestions in a structured format.`;
      const aiResponse = await suggestWithAI({ query: aiPrompt, context: 'stock_journal_filters' });

      if (aiResponse && aiResponse.suggestions && aiResponse.suggestions.length > 0 && aiResponse.suggestions.data?.filterData) {
        const suggestedFilters = aiResponse.suggestions.data.filterData; // Assuming AI returns filterData
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
    <div className="fixed inset-0 z- flex items-center justify-center p-4 bg-black bg-opacity-50">
      <Card className={`w-full max-w-4xl ${theme.cardBg}`}>
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
                  Filter Stock Adjustments
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <FormField
              label="Entry Number"
              value={filters.entryNo}
              onChange={(val) => onFilterChange('entryNo', val)}
              placeholder="e.g., ADJ-001"
              icon={<ClipboardList size={18} />}
            />
            <FormField
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(val) => onFilterChange('startDate', val)}
              icon={<Calendar size={18} />}
            />
            <FormField
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(val) => onFilterChange('endDate', val)}
              icon={<Calendar size={18} />}
            />
            <MasterSelectField
              label="Warehouse"
              value={availableWarehouses.find(wh => wh.id === filters.warehouseId)?.name || ''}
              onValueChange={(val) => onFilterChange('warehouseId', val)}
              onSelect={(id) => onFilterChange('warehouseId', id)}
              options={availableWarehouses}
              placeholder="Select Warehouse"
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
                <option value="submitted">Submitted</option>
                <option value="cancelled">Cancelled</option>
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

export default StockJournalFilterModal;
