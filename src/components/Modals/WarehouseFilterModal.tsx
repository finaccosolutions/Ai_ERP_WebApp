// src/components/Modals/WarehouseFilterModal.tsx
import React from 'react';
import { X, Filter, Search, MapPin, Check } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import AIButton from '../UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';

interface WarehouseFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    name: string;
    code: string;
    city: string;
    isActive: string; // 'all', 'true', 'false'
    isDefault: string; // 'all', 'true', 'false'
  };
  onApplyFilters: (filters: WarehouseFilterModalProps['filters']) => void;
  onFilterChange: (key: keyof WarehouseFilterModalProps['filters'], value: string) => void;
}

function WarehouseFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onFilterChange,
}: WarehouseFilterModalProps) {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();

  if (!isOpen) return null;

  const handleClearFilters = () => {
    onApplyFilters({
      name: '',
      code: '',
      city: '',
      isActive: 'all',
      isDefault: 'all',
    });
  };

  const handleAISuggestFilter = async () => {
    try {
      const aiPrompt = `Suggest relevant filters for warehouses based on common inventory needs. Consider warehouse name, code, city, active status, and default status. Provide suggestions in a structured format.`;
      const aiResponse = await suggestWithAI({ query: aiPrompt, context: 'warehouse_filters' });

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
                  Filter Warehouses
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
              label="Warehouse Name"
              value={filters.name}
              onChange={(val) => onFilterChange('name', val)}
              placeholder="e.g., Main Warehouse"
              icon={<MapPin size={18} />}
            />
            <FormField
              label="Warehouse Code"
              value={filters.code}
              onChange={(val) => onFilterChange('code', val)}
              placeholder="e.g., WH001"
              icon={<Search size={18} />}
            />
            <FormField
              label="City"
              value={filters.city}
              onChange={(val) => onFilterChange('city', val)}
              placeholder="e.g., New Delhi"
              icon={<MapPin size={18} />}
            />
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Active Status
              </label>
              <select
                value={filters.isActive}
                onChange={(e) => onFilterChange('isActive', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                <option value="all">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Is Default
              </label>
              <select
                value={filters.isDefault}
                onChange={(e) => onFilterChange('isDefault', e.target.value)}
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

export default WarehouseFilterModal;
