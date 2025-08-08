// src/components/Project/MilestoneForm.tsx
import React, { useState, useEffect } from 'react';
import { Save, X, Flag, Calendar, Info } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import FormField from '../UI/FormField';
import MasterSelectField from '../UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';

interface Milestone {
  id: string;
  milestone_name: string;
  due_date: string;
  status: string;
  completed_date: string | null;
  notes: string | null;
}

interface MilestoneFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  milestone?: Milestone | null; // Optional: for editing existing milestone
  onSuccess: () => void;
}

function MilestoneForm({ isOpen, onClose, projectId, milestone, onSuccess }: MilestoneFormProps) {
  const { theme } = useTheme();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    id: '',
    milestoneName: '',
    dueDate: '',
    status: 'planned',
    completedDate: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const isEditMode = !!milestone;

  useEffect(() => {
    if (isEditMode && milestone) {
      setFormData({
        id: milestone.id,
        milestoneName: milestone.milestone_name,
        dueDate: milestone.due_date,
        status: milestone.status,
        completedDate: milestone.completed_date || '',
        notes: milestone.notes || '',
      });
    } else {
      setFormData({
        id: '',
        milestoneName: '',
        dueDate: '',
        status: 'planned',
        completedDate: '',
        notes: '',
      });
    }
  }, [isOpen, milestone, isEditMode]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.milestoneName.trim()) {
      showNotification('Milestone Name is required.', 'error');
      return false;
    }
    if (!formData.dueDate) {
      showNotification('Due Date is required.', 'error');
      return false;
    }
    if (formData.status === 'achieved' && !formData.completedDate) {
      showNotification('Completed Date is required for achieved milestones.', 'error');
      return false;
    }
    if (formData.completedDate && new Date(formData.completedDate) > new Date()) {
      showNotification('Completed Date cannot be in the future.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const milestoneToSave = {
        project_id: projectId,
        milestone_name: formData.milestoneName,
        due_date: formData.dueDate,
        status: formData.status,
        completed_date: formData.completedDate || null,
        notes: formData.notes || null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('milestones')
          .update(milestoneToSave)
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('milestones')
          .insert(milestoneToSave);
        if (error) throw error;
      }
      onSuccess();
    } catch (err: any) {
      showNotification(`Failed to save milestone: ${err.message}`, 'error');
      console.error('Save milestone error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const milestoneStatuses = [
    { id: 'planned', name: 'Planned' },
    { id: 'achieved', name: 'Achieved' },
    { id: 'delayed', name: 'Delayed' },
    { id: 'cancelled', name: 'Cancelled' },
  ];

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
                <Flag size={20} />
              </div>
              <div>
                <h3 className={`font-semibold ${theme.textPrimary}`}>
                  {isEditMode ? 'Edit Milestone' : 'Add New Milestone'}
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
              label="Milestone Name"
              value={formData.milestoneName}
              onChange={(val) => handleInputChange('milestoneName', val)}
              placeholder="e.g., Phase 1 Completion, Client Approval"
              required
            />
            <FormField
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(val) => handleInputChange('dueDate', val)}
              required
            />
            <MasterSelectField
              label="Status"
              value={milestoneStatuses.find(s => s.id === formData.status)?.name || ''}
              onValueChange={(val) => handleInputChange('status', val)}
              onSelect={(id) => handleInputChange('status', id)}
              options={milestoneStatuses}
              placeholder="Select Status"
            />
            {formData.status === 'achieved' && (
              <FormField
                label="Completed Date"
                type="date"
                value={formData.completedDate}
                onChange={(val) => handleInputChange('completedDate', val)}
                required
              />
            )}
            <FormField
              label="Notes"
              value={formData.notes}
              onChange={(val) => handleInputChange('notes', val)}
              placeholder="Any additional notes about this milestone"
            />

            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : 'Save Milestone'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default MilestoneForm;
