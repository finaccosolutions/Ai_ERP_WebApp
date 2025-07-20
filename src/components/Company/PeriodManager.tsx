import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosedPeriod: boolean;
  periodType: 'fiscal_year' | 'quarter' | 'month';
}

function PeriodManager() {
  const { currentCompany, periods, switchPeriod } = useCompany();
  const { theme } = useTheme();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    periodType: 'fiscal_year' as 'fiscal_year' | 'quarter' | 'month'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      periodType: 'fiscal_year'
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Period name is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start >= end) {
        newErrors.endDate = 'End date must be after start date';
      }

      // Check for overlapping periods
      const overlapping = periods.find(period => {
        if (editingPeriod && period.id === editingPeriod.id) return false;
        
        const periodStart = new Date(period.startDate);
        const periodEnd = new Date(period.endDate);
        
        return (start <= periodEnd && end >= periodStart);
      });

      if (overlapping) {
        newErrors.startDate = `Period overlaps with "${overlapping.name}"`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm() || !currentCompany) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('periods')
        .insert({
          company_id: currentCompany.id,
          name: formData.name,
          start_date: formData.startDate,
          end_date: formData.endDate,
          period_type: formData.periodType,
          is_active: false,
          is_closed: false
        });

      if (error) throw error;

      setShowCreateForm(false);
      resetForm();
      // Refresh periods list
      window.location.reload();
    } catch (error) {
      console.error('Error creating period:', error);
      setErrors({ submit: 'Failed to create period. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!validateForm() || !editingPeriod) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('periods')
        .update({
          name: formData.name,
          start_date: formData.startDate,
          end_date: formData.endDate,
          period_type: formData.periodType
        })
        .eq('id', editingPeriod.id);

      if (error) throw error;

      setEditingPeriod(null);
      resetForm();
      // Refresh periods list
      window.location.reload();
    } catch (error) {
      console.error('Error updating period:', error);
      setErrors({ submit: 'Failed to update period. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (periodId: string) => {
    if (!confirm('Are you sure you want to delete this period? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('periods')
        .delete()
        .eq('id', periodId);

      if (error) throw error;

      // Refresh periods list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting period:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (periodId: string) => {
    setLoading(true);
    try {
      // First, deactivate all periods
      await supabase
        .from('periods')
        .update({ is_active: false })
        .eq('company_id', currentCompany?.id);

      // Then activate the selected period
      const { error } = await supabase
        .from('periods')
        .update({ is_active: true })
        .eq('id', periodId);

      if (error) throw error;

      switchPeriod(periodId);
      // Refresh periods list
      window.location.reload();
    } catch (error) {
      console.error('Error setting active period:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (period: any) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      periodType: period.periodType || 'fiscal_year'
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingPeriod(null);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPeriodTypeColor = (type: string) => {
    switch (type) {
      case 'fiscal_year': return 'bg-sky-100 text-sky-800';
      case 'quarter': return 'bg-emerald-100 text-emerald-800';
      case 'month': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPeriodTypeLabel = (type: string) => {
    switch (type) {
      case 'fiscal_year': return 'Fiscal Year';
      case 'quarter': return 'Quarter';
      case 'month': return 'Month';
      default: return type;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${theme.textPrimary} flex items-center`}>
          <Calendar size={24} className="mr-3 text-[${theme.hoverAccent}]" />
          Period Management
        </h2>
        <Button
          onClick={() => {
            setShowCreateForm(true);
            setEditingPeriod(null);
            resetForm();
          }}
          icon={<Plus size={16} />}
          disabled={loading}
        >
          Create Period
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingPeriod) && (
        <Card className="p-4 mb-6 bg-sky-50 border-sky-200">
          <h3 className="font-medium text-sky-900 mb-4">
            {editingPeriod ? 'Edit Period' : 'Create New Period'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Period Name"
              value={formData.name}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              placeholder="e.g., FY 2024-25, Q1 2024"
              required
              error={errors.name}
            />

            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Period Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.periodType}
                onChange={(e) => setFormData(prev => ({ ...prev, periodType: e.target.value as any }))}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                <option value="fiscal_year">Fiscal Year</option>
                <option value="quarter">Quarter</option>
                <option value="month">Month</option>
              </select>
            </div>

            <FormField
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(value) => setFormData(prev => ({ ...prev, startDate: value }))}
              required
              error={errors.startDate}
            />

            <FormField
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(value) => setFormData(prev => ({ ...prev, endDate: value }))}
              required
              error={errors.endDate}
            />
          </div>

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateForm(false);
                cancelEdit();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingPeriod ? handleEdit : handleCreate}
              disabled={loading}
            >
              {loading ? 'Saving...' : editingPeriod ? 'Update Period' : 'Create Period'}
            </Button>
          </div>
        </Card>
      )}

      {/* Periods List */}
      <div className="space-y-3">
        {periods.map((period) => (
          <div
            key={period.id}
            className={`
              p-4 border rounded-xl transition-all duration-300
              ${period.isActive 
                ? 'border-[${theme.hoverAccent}] bg-[${theme.hoverAccent}]/5' 
                : `${theme.borderColor} hover:border-[${theme.hoverAccent}]/50`
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  ${period.isActive 
                    ? 'bg-[${theme.hoverAccent}] text-white' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  <Calendar size={20} />
                </div>
                
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className={`font-medium ${theme.textPrimary}`}>
                      {period.name}
                    </h3>
                    <span className={`
                      px-2 py-1 text-xs rounded-full
                      ${getPeriodTypeColor(period.periodType)}
                    `}>
                      {getPeriodTypeLabel(period.periodType)}
                    </span>
                    {period.isActive && (
                      <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full flex items-center">
                        <Check size={12} className="mr-1" />
                        Active
                      </span>
                    )}
                    {period.isClosedPeriod && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full flex items-center">
                        <X size={12} className="mr-1" />
                        Closed
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${theme.textMuted}`}>
                    {formatDate(period.startDate)} - {formatDate(period.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!period.isActive && !period.isClosedPeriod && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetActive(period.id)}
                    disabled={loading}
                  >
                    Set Active
                  </Button>
                )}
                
                {!period.isClosedPeriod && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(period)}
                    disabled={loading}
                    icon={<Edit size={14} />}
                  />
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(period.id)}
                  disabled={loading || period.isActive}
                  icon={<Trash2 size={14} />}
                  className="text-red-600 hover:text-red-800"
                />
              </div>
            </div>
          </div>
        ))}

        {periods.length === 0 && (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
              No Periods Found
            </h3>
            <p className={`${theme.textMuted} mb-4`}>
              Create your first period to start managing your financial data.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              icon={<Plus size={16} />}
            >
              Create First Period
            </Button>
          </div>
        )}
      </div>

      {/* Information Box */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Period Management Tips</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Only one period can be active at a time</li>
              <li>• Periods cannot overlap in dates</li>
              <li>• Closed periods cannot be edited or deleted</li>
              <li>• All financial data is scoped to the active period</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PeriodManager;