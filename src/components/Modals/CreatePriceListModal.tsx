// src/components/Modals/CreatePriceListModal.tsx
import React, { useState } from 'react';
import { Plus, Tag, Save, X } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface CreatePriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newList: { id: string; name: string }) => void;
  initialName?: string;
}

function CreatePriceListModal({ isOpen, onClose, onSuccess, initialName = '' }: CreatePriceListModalProps) {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [name, setName] = useState(initialName);
  const [currency, setCurrency] = useState(currentCompany?.currency || 'INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Price List Name is required.');
      return;
    }
    if (!currentCompany?.id || !user?.id) {
      setError('Company or user information is missing.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('price_lists')
        .insert({
          company_id: currentCompany.id,
          name: name.trim(),
          currency: currency,
          is_default: false, // New price lists are not default by creation
          is_active: true,
        })
        .select('id, name')
        .single();

      if (error) throw error;

      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Failed to create price list.');
      showNotification(err.message || 'Failed to create price list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z- flex items-center justify-center p-4 bg-black bg-opacity-50">
      <Card className={`w-full max-w-md ${theme.cardBg}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`
                w-10 h-10 rounded-lg bg-gradient-to-r ${theme.primaryGradient}
                flex items-center justify-center text-white
              `}>
                <Tag size={20} />
              </div>
              <div>
                <h3 className={`font-semibold ${theme.textPrimary}`}>
                  Create New Price List
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Price List Name"
              value={name}
              onChange={setName}
              placeholder="e.g., Wholesale Price List"
              required
              error={error}
            />
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={`
                  w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                  ${theme.isDark ? theme.inputBg : 'bg-white'} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                {/* You might want to fetch currencies from a global constant or DB */}
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                {/* Add more currencies as needed */}
              </select>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Creating...' : 'Create Price List'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default CreatePriceListModal;