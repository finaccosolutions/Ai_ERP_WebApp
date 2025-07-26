// src/pages/Inventory/masters/UnitsOfMeasurePage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Ruler, Edit, Trash2, RefreshCw, Save, ArrowLeft, Filter } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import MasterSelectField from '../../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../../components/UI/ConfirmationModal';
import UnitOfMeasureFilterModal from '../../../components/Modals/UnitOfMeasureFilterModal'; // Import the new filter modal

interface UnitOfMeasure {
  id: string;
  name: string;
  symbol: string | null;
  is_base_unit: boolean;
  conversion_factor: number;
  base_unit_id: string | null;
  is_system_defined: boolean; // NEW: Add this field
  created_at: string;
  // Joined data
  base_unit?: { name: string } | null;
}

function UnitsOfMeasurePage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUnitsCount, setTotalUnitsCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [unitToDeleteId, setUnitToDeleteId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    symbol: '',
    isBaseUnit: false,
    conversionFactor: 1,
    baseUnitId: '',
  });

  // NEW: State for the search term of the Base Unit dropdown
  const [baseUnitSearchTerm, setBaseUnitSearchTerm] = useState('');

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    name: '',
    symbol: '',
    isBaseUnit: 'all', // 'all', 'true', 'false'
    baseUnitId: '',
  });
  const [numUnitsToShow, setNumUnitsToShow] = useState<string>('10'); // Default to 10

  useEffect(() => {
    if (currentCompany?.id) {
      fetchUnits();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentCompany?.id) {
        console.log('UnitsOfMeasurePage: Document became visible, re-fetching units.');
        fetchUnits();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentCompany?.id, filterCriteria, numUnitsToShow]); // Added filterCriteria and numUnitsToShow to dependencies

  const fetchUnits = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('units_of_measure')
        .select(`
          *,
          base_unit:units_of_measure ( name )
        `, { count: 'exact' })
        .or(`company_id.eq.${currentCompany.id},is_system_defined.eq.true`); // Fetch both company-specific and global units

      // Apply search term
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      // Apply filters
      if (filterCriteria.name) {
        query = query.ilike('name', `%${filterCriteria.name}%`);
      }
      if (filterCriteria.symbol) {
        query = query.ilike('symbol', `%${filterCriteria.symbol}%`);
      }
      if (filterCriteria.isBaseUnit !== 'all') {
        query = query.eq('is_base_unit', filterCriteria.isBaseUnit === 'true');
      }
      if (filterCriteria.baseUnitId) {
        query = query.eq('base_unit_id', filterCriteria.baseUnitId);
      }

      query = query.order('name', { ascending: true });

      if (numUnitsToShow !== 'all') {
        query = query.limit(parseInt(numUnitsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setUnits(data || []);
      setTotalUnitsCount(count || 0);

      // --- ADD THIS CONSOLE LOG ---
      console.log('UnitsOfMeasurePage: Fetched units (including global):', data);
      // --- END ADD ---

    } catch (err: any) {
      showNotification(`Error fetching units of measure: ${err.message}`, 'error');
      console.error('Error fetching units of measure:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      symbol: '',
      isBaseUnit: false,
      conversionFactor: 1,
      baseUnitId: '',
    });
    // NEW: Reset baseUnitSearchTerm
    setBaseUnitSearchTerm('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showNotification('Unit Name is required.', 'error');
      return false;
    }
    if (!formData.isBaseUnit && (!formData.baseUnitId || formData.conversionFactor <= 0)) {
      showNotification('Conversion factor and base unit are required for non-base units.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!currentCompany?.id) {
      showNotification('Company information is missing.', 'error');
      return;
    }

    setLoading(true);
    try {
      const unitToSave = {
        company_id: formData.isBaseUnit ? null : currentCompany.id, // company_id is NULL for system-defined base units
        name: formData.name,
        symbol: formData.symbol,
        is_base_unit: formData.isBaseUnit,
        conversion_factor: formData.isBaseUnit ? 1 : formData.conversionFactor,
        base_unit_id: formData.isBaseUnit ? null : formData.baseUnitId,
        is_system_defined: formData.isBaseUnit ? true : false, // NEW: Mark base units as system-defined
      };

      if (formData.id) {
        const { error } = await supabase
          .from('units_of_measure')
          .update(unitToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Unit of measure updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('units_of_measure')
          .insert(unitToSave);
        if (error) throw error;
        showNotification('Unit of measure created successfully!', 'success');
      }
      setViewMode('list');
      resetForm();
      fetchUnits();
    } catch (err: any) {
      showNotification(`Failed to save unit of measure: ${err.message}`, 'error');
      console.error('Save unit of measure error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUnit = (unit: UnitOfMeasure) => {
    if (unit.is_system_defined) {
      showNotification('System-defined units cannot be edited.', 'info');
      return;
    }
    setFormData({
      id: unit.id,
      name: unit.name,
      symbol: unit.symbol || '',
      isBaseUnit: unit.is_base_unit,
      conversionFactor: unit.conversion_factor,
      baseUnitId: unit.base_unit_id || '',
    });
    // NEW: Initialize baseUnitSearchTerm when editing
    const baseUnit = availableBaseUnitsForDropdown.find(b => b.id === unit.base_unit_id);
    setBaseUnitSearchTerm(baseUnit?.name || '');
    setViewMode('edit');
  };

  const handleDeleteUnit = (unitId: string, isSystemDefined: boolean) => {
    if (isSystemDefined) {
      showNotification('System-defined units cannot be deleted.', 'info');
      return;
    }
    setUnitToDeleteId(unitId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUnit = async () => {
    if (!unitToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      // Check if any items are linked to this unit
      const { count: linkedItemsCount, error: itemsCountError } = await supabase
        .from('items')
        .select('count', { count: 'exact', head: true })
        .eq('unit_id', unitToDeleteId);

      if (itemsCountError) throw itemsCountError;

      if (linkedItemsCount && linkedItemsCount > 0) {
        showNotification(`Cannot delete unit: ${linkedItemsCount} item(s) are linked to it. Please reassign them first.`, 'error');
        setLoading(false);
        return;
      }

      // Check if any other units use this as a base unit
      const { count: childUnitsCount, error: childCountError } = await supabase
        .from('units_of_measure')
        .select('count', { count: 'exact', head: true })
        .eq('base_unit_id', unitToDeleteId);

      if (childCountError) throw childCountError;

      if (childUnitsCount && childUnitsCount > 0) {
        showNotification(`Cannot delete unit: ${childUnitsCount} other unit(s) use this as a base unit. Please reassign them first.`, 'error');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('units_of_measure')
        .delete()
        .eq('id', unitToDeleteId);

      if (error) throw error;
      showNotification('Unit of measure deleted successfully!', 'success');
      fetchUnits();
    } catch (err: any) {
      showNotification(`Error deleting unit of measure: ${err.message}`, 'error');
      console.error('Error deleting unit of measure:', err);
    } finally {
      setLoading(false);
      setUnitToDeleteId(null);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    setShowFilterModal(false);
  };

  const numUnitsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalUnitsCount})` },
  ];

  // Filter available base units for the dropdown
  const availableBaseUnitsForDropdown = units.filter(unit => unit.is_base_unit);

  // --- ADD THIS CONSOLE LOG ---
  console.log('UnitsOfMeasurePage: Options for Base Unit dropdown:', availableBaseUnitsForDropdown);
  // --- END ADD ---

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
              {viewMode === 'create' ? 'Create New Unit of Measure' : 'Edit Unit of Measure'}
            </h1>
            <p className={theme.textSecondary}>
              {viewMode === 'create' ? 'Define a new unit for your inventory items.' : 'Update unit of measure details.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setViewMode('list')} icon={<ArrowLeft size={16} />}>
            Back to List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Unit Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Name"
                value={formData.name}
                onChange={(val) => handleInputChange('name', val)}
                placeholder="e.g., Pieces, Kilograms"
                required
              />
              <FormField
                label="Symbol"
                value={formData.symbol}
                onChange={(val) => handleInputChange('symbol', val)}
                placeholder="e.g., pcs, kg"
              />
              <div className="flex items-center space-x-3 md:col-span-2">
                <input type="checkbox" id="isBaseUnit" checked={formData.isBaseUnit} onChange={(e) => handleInputChange('isBaseUnit', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                <label htmlFor="isBaseUnit" className={`text-sm font-medium ${theme.textPrimary}`}>Is Base Unit (e.g., pcs, kg)</label>
              </div>
              {!formData.isBaseUnit && (
                <>
                  <FormField
                    label="Conversion Factor"
                    type="number"
                    value={formData.conversionFactor.toString()}
                    onChange={(val) => handleInputChange('conversionFactor', parseFloat(val) || 0)}
                    placeholder="e.g., 12 (for 1 Box = 12 pcs)"
                    required
                  />
                  <MasterSelectField
                    label="Base Unit"
                    value={baseUnitSearchTerm} // NEW: Use baseUnitSearchTerm for display
                    onValueChange={setBaseUnitSearchTerm} // NEW: Update baseUnitSearchTerm on type
                    onSelect={(id, name) => { // NEW: Update baseUnitId and baseUnitSearchTerm on select
                      handleInputChange('baseUnitId', id);
                      setBaseUnitSearchTerm(name);
                    }}
                    options={availableBaseUnitsForDropdown} // Use filtered list
                    placeholder="Select Base Unit"
                    required
                  />
                </>
              )}
            </div>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => setViewMode('list')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} icon={<Save size={16} />}>
              {loading ? 'Saving...' : 'Save Unit'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Units of Measure</h1>
          <p className={theme.textSecondary}>Define and manage units for your inventory items.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/inventory')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Unit Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); }}>
            Create New
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Units</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search units by name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchUnits()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          <Button onClick={() => setShowFilterModal(true)} icon={<Filter size={16} />}>
            Filter
          </Button>
          <MasterSelectField
            label="" // No label needed for this dropdown
            value={numUnitsOptions.find(opt => opt.id === numUnitsToShow)?.name || ''}
            onValueChange={() => {}} // Not used for typing
            onSelect={(id) => setNumUnitsToShow(id)}
            options={numUnitsOptions}
            placeholder="Show"
            className="w-32"
          />
          <Button onClick={fetchUnits} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : units.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No units of measure found. Create a new one to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Factor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th> {/* NEW: Type column */}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unit.symbol || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unit.is_base_unit ? 'Self' : unit.base_unit?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unit.conversion_factor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {unit.is_system_defined ? 'System' : 'Company'}
                    </td> {/* NEW: Display Type */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => handleEditUnit(unit)} title="Edit" disabled={unit.is_system_defined}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteUnit(unit.id, unit.is_system_defined)} className="text-red-600 hover:text-red-800" title="Delete" disabled={unit.is_system_defined}>
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteUnit}
        title="Confirm Unit Deletion"
        message="Are you sure you want to delete this unit of measure? This action cannot be undone. Items or other units linked to this will need to be reassigned."
        confirmText="Yes, Delete Unit"
      />

      <UnitOfMeasureFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filterCriteria}
        onApplyFilters={handleApplyFilters}
        onFilterChange={(key, value) => setFilterCriteria(prev => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}

export default UnitsOfMeasurePage;
