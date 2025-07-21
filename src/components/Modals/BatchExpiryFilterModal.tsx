// src/components/Modals/BatchExpiryFilterModal.tsx
import React from 'react';
import { X, Filter, Search, Calendar, Package, Tag, Check, Ruler, MapPin } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import AIButton from '../UI/AIButton';
import MasterSelectField from '../UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

interface BatchExpiryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'batches' | 'serials';
  filters: {
    batchNo: string;
    itemCode: string;
    expiryDateBefore: string;
    expiryDateAfter: string;
    serialNo: string;
    warehouseId: string;
    serialStatus: string;
  };
  onApplyFilters: (filters: BatchExpiryFilterModalProps['filters']) => void;
  onFilterChange: (key: keyof BatchExpiryFilterModalProps['filters'], value: string) => void;
}

function BatchExpiryFilterModal({
  isOpen,
  onClose,
  activeTab,
  filters,
  onApplyFilters,
  onFilterChange,
}: BatchExpiryFilterModalProps) {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();

  const [availableItems, setAvailableItems] = React.useState<{ id: string; name: string; item_code: string }[]>([]);
  const [availableWarehouses, setAvailableWarehouses] = React.useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    if (currentCompany?.id) {
      fetchMasterData(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const fetchMasterData = async (companyId: string) => {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('id, item_name, item_code')
        .eq('company_id', companyId)
        .order('item_name', { ascending: true });
      if (itemsError) throw itemsError;
      setAvailableItems(itemsData.map(item => ({ id: item.id, name: item.item_name, item_code: item.item_code })));

      const { data: warehousesData, error: warehousesError } = await supabase
        .from('warehouses')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name', { ascending: true });
      if (warehousesError) throw warehousesError;
      setAvailableWarehouses(warehousesData || []);
    } catch (err) {
      console.error('Error fetching master data for filter:', err);
    }
  };

  if (!isOpen) return null;

  const handleClearFilters = () => {
    onApplyFilters({
      batchNo: '',
      itemCode: '',
      expiryDateBefore: '',
      expiryDateAfter: '',
      serialNo: '',
      warehouseId: '',
      serialStatus: 'all',
    });
  };

  const handleAISuggestFilter = async () => {
    try {
      const aiPrompt = `Suggest relevant filters for ${activeTab === 'batches' ? 'batches' : 'serial numbers'} based on common inventory needs. Provide suggestions in a structured format.`;
      const aiResponse = await suggestWithAI({ query: aiPrompt, context: `${activeTab}_filters` });

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
                  Filter {activeTab === 'batches' ? 'Batches' : 'Serial Numbers'}
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
            {activeTab === 'batches' ? (
              <>
                <FormField
                  label="Batch No."
                  value={filters.batchNo}
                  onChange={(val) => onFilterChange('batchNo', val)}
                  placeholder="e.g., BATCH-XYZ"
                  icon={<Tag size={18} />}
                />
                <MasterSelectField
                  label="Item"
                  value={availableItems.find(item => item.id === filters.itemCode)?.name || ''}
                  onValueChange={(val) => onFilterChange('itemCode', val)}
                  onSelect={(id) => onFilterChange('itemCode', id)}
                  options={availableItems.map(item => ({ id: item.id, name: item.name }))}
                  placeholder="Select Item"
                />
                <FormField
                  label="Expiry Date Before"
                  type="date"
                  value={filters.expiryDateBefore}
                  onChange={(val) => onFilterChange('expiryDateBefore', val)}
                  icon={<Calendar size={18} />}
                />
                <FormField
                  label="Expiry Date After"
                  type="date"
                  value={filters.expiryDateAfter}
                  onChange={(val) => onFilterChange('expiryDateAfter', val)}
                  icon={<Calendar size={18} />}
                />
              </>
            ) : (
              <>
                <FormField
                  label="Serial No."
                  value={filters.serialNo}
                  onChange={(val) => onFilterChange('serialNo', val)}
                  placeholder="e.g., SN-12345"
                  icon={<Tag size={18} />}
                />
                <MasterSelectField
                  label="Item"
                  value={availableItems.find(item => item.id === filters.itemCode)?.name || ''}
                  onValueChange={(val) => onFilterChange('itemCode', val)}
                  onSelect={(id) => onFilterChange('itemCode', id)}
                  options={availableItems.map(item => ({ id: item.id, name: item.name }))}
                  placeholder="Select Item"
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
                    value={filters.serialStatus}
                    onChange={(e) => onFilterChange('serialStatus', e.target.value)}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                    `}
                  >
                    <option value="all">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="delivered">Delivered</option>
                    <option value="expired">Expired</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </>
            )}
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

export default BatchExpiryFilterModal;
