// src/components/Modals/ItemMasterFilterModal.tsx
import React from 'react';
import { X, Filter, Search, Package, Users, DollarSign, Calendar, Tag } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import AIButton from '../UI/AIButton';
import MasterSelectField from '../UI/MasterSelectField'; // NEW: Import MasterSelectField
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase'; // NEW: Import supabase
import { useCompany } from '../../contexts/CompanyContext'; // NEW: Import useCompany

interface ItemMasterFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    itemName: string;
    itemCode: string;
    itemType: string;
    categoryId: string;
    itemGroupId: string; // NEW: Added itemGroupId to filters
    minSalesPrice: string;
    maxSalesPrice: string;
    isActive: string;
  };
  onApplyFilters: (filters: ItemMasterFilterModalProps['filters']) => void;
  onFilterChange: (key: keyof ItemMasterFilterModalProps['filters'], value: string) => void;
}

function ItemMasterFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onFilterChange,
}: ItemMasterFilterModalProps) {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany(); // NEW: Use currentCompany

  const [availableCategories, setAvailableCategories] = React.useState<{ id: string; name: string }[]>([]); // NEW: State for categories
  const [availableItemGroups, setAvailableItemGroups] = React.useState<{ id: string; name: string }[]>([]); // NEW: State for item groups

  // NEW: Fetch categories and item groups on mount
  React.useEffect(() => {
    if (currentCompany?.id) {
      fetchMasterData(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const fetchMasterData = async (companyId: string) => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('item_categories')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name', { ascending: true });
      if (categoriesError) throw categoriesError;
      setAvailableCategories(categoriesData || []);

      const { data: itemGroupsData, error: itemGroupsError } = await supabase
        .from('item_groups')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name', { ascending: true });
      if (itemGroupsError) throw itemGroupsError;
      setAvailableItemGroups(itemGroupsData || []);
    } catch (err) {
      console.error('Error fetching master data for filter:', err);
    }
  };

  if (!isOpen) return null;

  const handleClearFilters = () => {
    onApplyFilters({
      itemName: '',
      itemCode: '',
      itemType: 'all',
      categoryId: '',
      itemGroupId: '', // NEW: Clear itemGroupId
      minSalesPrice: '',
      maxSalesPrice: '',
      isActive: 'all',
    });
  };

  const handleAISuggestFilter = async () => {
    try {
      const aiPrompt = `Suggest relevant filters for item master data based on common inventory needs. Consider item name, code, type, category, item group, price range, and active status. Provide suggestions in a structured format.`;
      const aiResponse = await suggestWithAI({ query: aiPrompt, context: 'item_master_filters' });

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
                  Filter Item Master
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
              label="Item Name"
              value={filters.itemName}
              onChange={(val) => onFilterChange('itemName', val)}
              placeholder="e.g., Product A"
              icon={<Package size={18} />}
            />
            <FormField
              label="Item Code"
              value={filters.itemCode}
              onChange={(val) => onFilterChange('itemCode', val)}
              placeholder="e.g., PROD-001"
              icon={<Tag size={18} />}
            />
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Item Type
              </label>
              <select
                value={filters.itemType}
                onChange={(e) => onFilterChange('itemType', e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                <option value="all">All Types</option>
                <option value="stock">Stock Item</option>
                <option value="non_stock">Non-Stock Item</option>
                <option value="service">Service Item</option>
              </select>
            </div>
            <MasterSelectField // NEW: MasterSelectField for Category
              label="Category"
              value={availableCategories.find(cat => cat.id === filters.categoryId)?.name || ''}
              onValueChange={(val) => onFilterChange('categoryId', val)}
              onSelect={(id) => onFilterChange('categoryId', id)}
              options={availableCategories}
              placeholder="Select Category"
            />
            <MasterSelectField // NEW: MasterSelectField for Item Group
              label="Item Group"
              value={availableItemGroups.find(group => group.id === filters.itemGroupId)?.name || ''}
              onValueChange={(val) => onFilterChange('itemGroupId', val)}
              onSelect={(id) => onFilterChange('itemGroupId', id)}
              options={availableItemGroups}
              placeholder="Select Item Group"
            />
            <FormField
              label="Min Sales Price"
              type="number"
              value={filters.minSalesPrice}
              onChange={(val) => onFilterChange('minSalesPrice', val)}
              placeholder="e.g., 100"
              icon={<DollarSign size={18} />}
            />
            <FormField
              label="Max Sales Price"
              type="number"
              value={filters.maxSalesPrice}
              onChange={(val) => onFilterChange('maxSalesPrice', val)}
              placeholder="e.g., 1000"
              icon={<DollarSign size={18} />}
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

export default ItemMasterFilterModal;
