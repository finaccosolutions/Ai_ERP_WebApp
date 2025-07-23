// src/pages/Inventory/masters/ItemGroupFormPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Tag, Edit, Trash2, RefreshCw, Save, ArrowLeft, Filter, Info } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import MasterSelectField from '../../../components/UI/MasterSelectField';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmationModal from '../../../components/UI/ConfirmationModal';

interface ItemGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

function ItemGroupFormPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
  });

  const isEditMode = !!id;

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true); // Start loading
      try {
        if (isEditMode) {
          await fetchItemGroupData(id as string); // This function already handles setLoading(false) in its finally
        } else {
          resetForm(); // Resets form data
          setLoading(false); // Explicitly set loading to false for create mode after setup
        }
      } catch (error) {
        console.error("Error during form initialization:", error);
        showNotification("Failed to initialize form data.", "error");
        setLoading(false); // Ensure loading is false on error
      }
    };

    if (currentCompany?.id) {
      initializeForm();
    }
  }, [currentCompany?.id, id, isEditMode]);

  const fetchItemGroupData = async (groupId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('item_groups')
        .select('*')
        .eq('id', groupId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          name: data.name,
          description: data.description || '',
        });
      }
    } catch (err: any) {
      showNotification(`Error loading item group: ${err.message}`, 'error');
      console.error('Error loading item group:', err);
      navigate('/inventory/masters/item-groups');
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
      description: '',
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showNotification('Group Name is required.', 'error');
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
      const groupToSave = {
        company_id: currentCompany.id,
        name: formData.name,
        description: formData.description,
      };

      if (formData.id) {
        const { error } = await supabase
          .from('item_groups')
          .update(groupToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Item group updated successfully!', 'success');
      } else {
        const { data, error } = await supabase
          .from('item_groups')
          .insert(groupToSave);
        if (error) throw error;
        showNotification('Item group created successfully!', 'success');
      }
      navigate('/inventory/masters/item-groups');
      resetForm();
    } catch (err: any) {
      showNotification(`Failed to save item group: ${err.message}`, 'error');
      console.error('Save item group error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {isEditMode ? 'Edit Item Group' : 'Create New Item Group'}
          </h1>
          <p className={theme.textSecondary}>
            {isEditMode ? 'Update item group details.' : 'Define a new way to classify your items.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/inventory/masters/item-groups')} icon={<ArrowLeft size={16} />}>
          Back to List
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <Info size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              Group Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Name"
                value={formData.name}
                onChange={(val) => handleInputChange('name', val)}
                placeholder="e.g., Raw Materials, Finished Goods"
                required
              />
              <FormField
                label="Description"
                value={formData.description}
                onChange={(val) => handleInputChange('description', val)}
                placeholder="Brief description of the group"
                className="md:col-span-2"
              />
            </div>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/inventory/masters/item-groups')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} icon={<Save size={16} />}>
              {loading ? 'Saving...' : 'Save Group'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ItemGroupFormPage;
