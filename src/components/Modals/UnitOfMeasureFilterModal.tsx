// src/components/Modals/UnitOfMeasureFilterModal.tsx
import React from 'react';
import { X, Filter, Search, Ruler, Check } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import AIButton from '../UI/AIButton';
import MasterSelectField from '../UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

interface UnitOfMeasureFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    name: string;
    symbol: string;
    isBaseUnit: string; // 'all', 'true', 'false'
    baseUnitId: string;
  };
  onApplyFilters: (filters: UnitOfMeasureFilterModalProps['filters']) => void;
  onFilterChange: (key: keyof UnitOfMeasureFilterModalProps['filters'], value: string) => void;
}

function UnitOfMeasureFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onFilterChange,
}: UnitOfMeasureFilterModalModalProps) {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();

  const [availableBaseUnits, setAvailableBaseUnits] = React.useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    if (currentCompany?.id) {
      fetchAvailableBaseUnits(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const fetchAvailableBaseUnits = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('units_of_measure')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_base_unit', true)
        .order('name', { ascending: true });
      if (error) throw error;
      setAvailableBaseUnits(data || []);
    } catch (err) {
      console.error('Error fetching available base units for filter:', err);
    }
  };

  if (!isOpen) return null;

  const handleClearFilters = () => {
    onApplyFilters({
      name: '',
      symbol: '',
      isBaseUnit: 'all',
      baseUnitId: '',
    });
  };

  const handleAISuggestFilter = async () => {
    try {
      const aiPrompt = `Suggest relevant filters for units of measure based on common inventory needs. Consider unit name, symbol, whether it's a base unit, and its base unit. Provide suggestions in a structured format.`;
      const aiResponse = await suggestWithAI({ query: aiPrompt, context: 'unit_of_measure_filters' });

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
                  Filter Units of Measure
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
              label="Unit Name"
              value={filters.name}
              onChange={(val) => onFilterChange('name', val)}
              placeholder="e.g., Kilograms"
              icon={<Ruler size={18} />}
            />
            <FormField
              label="Symbol"
              value={filters.symbol}
              onChange={(val) => onFilterChange('symbol', val)}
              placeholder="e.g., kg"
              icon={<Search size={18} />}
            />
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Is Base Unit
              </label>
              <select
                value={filters.isBaseUnit}
                onChange={(e) => onFilterChange('isBaseUnit', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                <option value="all">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <MasterSelectField
              label="Base Unit"
              value={availableBaseUnits.find(unit => unit.id === filters.baseUnitId)?.name || ''}
              onValueChange={(val) => onFilterChange('baseUnitId', val)}
              onSelect={(id) => onFilterChange('baseUnitId', id)}
              options={availableBaseUnits}
              placeholder="Select Base Unit"
            />
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

export default UnitOfMeasureFilterModal;
