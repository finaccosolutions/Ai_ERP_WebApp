// src/components/Modals/ItemCategoryFilterModal.tsx
import React from 'react';
import { X, Filter, Search, Layers, Users, Check } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import AIButton from '../UI/AIButton';
import MasterSelectField from '../UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

interface ItemCategoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    name: string;
    description: string;
    parentCategoryId: string;
    isActive: string;
  };
  onApplyFilters: (filters: ItemCategoryFilterModalProps['filters']) => void;
  onFilterChange: (key: keyof ItemCategoryFilterModalProps['filters'], value: string) => void;
}

function ItemCategoryFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onFilterChange,
}: ItemCategoryFilterModalProps) {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();

  const [availableCategories, setAvailableCategories] = React.useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    if (currentCompany?.id) {
      fetchAvailableCategories(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const fetchAvailableCategories = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('item_categories')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name', { ascending: true });
      if (error) throw error;
      setAvailableCategories(data || []);
    } catch (err) {
      console.error('Error fetching available categories for filter:', err);
    }
  };

  if (!isOpen) return null;

  const handleClearFilters = () => {
    onApplyFilters({
      name: '',
      description: '',
      parentCategoryId: '',
      isActive: 'all',
    });
  };

  const handleAISuggestFilter = async () => {
    try {
      const aiPrompt = `Suggest relevant filters for item categories based on common inventory needs. Consider category name, description, parent category, and active status. Provide suggestions in a structured format.`;
      const aiResponse = await suggestWithAI({ query: aiPrompt, context: 'item_category_filters' });

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
                  Filter Item Categories / Groups
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
              label="Category Name"
              value={filters.name}
              onChange={(val) => onFilterChange('name', val)}
              placeholder="e.g., Raw Materials"
              icon={<Layers size={18} />}
            />
            <FormField
              label="Description"
              value={filters.description}
              onChange={(val) => onFilterChange('description', val)}
              placeholder="e.g., electronic components"
              icon={<Search size={18} />}
            />
            <MasterSelectField
              label="Parent Category"
              value={availableCategories.find(cat => cat.id === filters.parentCategoryId)?.name || ''}
              onValueChange={(val) => onFilterChange('parentCategoryId', val)} // Allow typing for search
              onSelect={(id) => onFilterChange('parentCategoryId', id)}
              options={availableCategories}
              placeholder="Select Parent Category"
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

export default ItemCategoryFilterModal;
