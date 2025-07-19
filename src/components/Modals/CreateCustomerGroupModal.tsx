// src/components/Modals/CreateCustomerGroupModal.tsx
import React, { useState } from 'react';
import { Plus, Users, Save, X } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface CreateCustomerGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newGroup: { id: string; name: string }) => void;
  initialName?: string;
}

function CreateCustomerGroupModal({ isOpen, onClose, onSuccess, initialName = '' }: CreateCustomerGroupModalProps) {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Group Name is required.');
      return;
    }
    if (!currentCompany?.id || !user?.id) {
      setError('Company or user information is missing.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_groups')
        .insert({
          company_id: currentCompany.id,
          name: name.trim(),
          description: description.trim(),
        })
        .select('id, name')
        .single();

      if (error) throw error;

      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Failed to create customer group.');
      showNotification(err.message || 'Failed to create customer group.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <Card className={`w-full max-w-md ${theme.cardBg}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`
                w-10 h-10 rounded-lg bg-gradient-to-r ${theme.primaryGradient}
                flex items-center justify-center text-white
              `}>
                <Users size={20} />
              </div>
              <div>
                <h3 className={`font-semibold ${theme.textPrimary}`}>
                  Create New Customer Group
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
              label="Group Name"
              value={name}
              onChange={setName}
              placeholder="e.g., Key Accounts"
              required
              error={error}
            />
            <FormField
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Brief description of the group"
            />

            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default CreateCustomerGroupModal;