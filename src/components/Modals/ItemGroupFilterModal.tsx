// src/components/Modals/ItemGroupFilterModal.tsx
import React from 'react';
import { X, Filter, Search, Tag } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import AIButton from '../UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';

interface ItemGroupFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    name: string;
    description: string;
  };
  onApplyFilters: (filters: ItemGroupFilterModalProps['filters']) => void;
  onFilterChange: (key: keyof ItemGroupFilterModalProps['filters'], value: string) => void;
}

function ItemGroupFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onFilterChange,
}: ItemGroupFilterModalProps) {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();

  if (!isOpen) return null;

  const handleClearFilters = () => {
    onApplyFilters({
      name: '',
      description: '',
    });
  };

  const handleAISuggestFilter = async () => {
    try {
      const aiPrompt = `Suggest relevant filters for item groups based on common inventory needs. Consider group name and description. Provide suggestions in a structured format.`;
      const aiResponse = await suggestWithAI({ query: aiPrompt, context: 'item_group_filters' });

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
                  Filter Item Groups
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <FormField
              label="Group Name"
              value={filters.name}
              onChange={(val) => onFilterChange('name', val)}
              placeholder="e.g., Raw Materials"
              icon={<Tag size={18} />}
            />
            <FormField
              label="Description"
              value={filters.description}
              onChange={(val) => onFilterChange('description', val)}
              placeholder="e.g., electronic components"
              icon={<Search size={18} />}
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

export default ItemGroupFilterModal;