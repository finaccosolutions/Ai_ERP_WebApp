// src/pages/Project/MilestoneListPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Flag, Edit, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import MilestoneForm from '../../components/Project/MilestoneForm'; // Assuming you have this component

interface Milestone {
  id: string;
  project_id: string;
  milestone_name: string;
  due_date: string;
  status: string;
  completed_date: string | null;
  notes: string | null;
  created_at: string;
  projects?: { project_name: string } | null;
}

function MilestoneListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalMilestonesCount, setTotalMilestonesCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [milestoneToDeleteId, setMilestoneToDeleteId] = useState<string | null>(null);

  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchMilestones();
    }
  }, [currentCompany?.id]);

  const fetchMilestones = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('milestones')
        .select(`
          *,
          projects ( project_name )
        `, { count: 'exact' })
        .in('project_id', supabase.from('projects').select('id').eq('company_id', currentCompany.id)); // Filter by company projects

      if (searchTerm) {
        query = query.ilike('milestone_name', `%${searchTerm}%`);
      }

      query = query.order('due_date', { ascending: true });

      const { data, error, count } = await query;

      if (error) throw error;
      setMilestones(data || []);
      setTotalMilestonesCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching milestones: ${err.message}`, 'error');
      console.error('Error fetching milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    setMilestoneToDeleteId(milestoneId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMilestone = async () => {
    if (!milestoneToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestoneToDeleteId);

      if (error) throw error;
      showNotification('Milestone deleted successfully!', 'success');
      fetchMilestones();
    } catch (err: any) {
      showNotification(`Error deleting milestone: ${err.message}`, 'error');
      console.error('Error deleting milestone:', err);
    } finally {
      setLoading(false);
      setMilestoneToDeleteId(null);
    }
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setShowMilestoneForm(true);
  };

  const handleNewMilestone = () => {
    setEditingMilestone(null);
    setShowMilestoneForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'achieved': return 'bg-green-100 text-green-800';
      case 'delayed': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Milestones</h1>
          <p className={theme.textSecondary}>Track key project milestones and their progress.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/project')} icon={<ArrowLeft size={16} />}>
            Back to Project Dashboard
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Milestone Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={handleNewMilestone}>
            Add New Milestone
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Milestones</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search milestones by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchMilestones()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          <Button onClick={fetchMilestones} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : milestones.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No milestones found. Add a new milestone to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milestone Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {milestones.map((milestone) => (
                  <tr key={milestone.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{milestone.milestone_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{milestone.projects?.project_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{milestone.due_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(milestone.status)}`}>
                        {milestone.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{milestone.completed_date || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => handleEditMilestone(milestone)} title="Edit">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteMilestone(milestone.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        onConfirm={confirmDeleteMilestone}
        title="Confirm Milestone Deletion"
        message="Are you sure you want to delete this milestone? This action cannot be undone."
        confirmText="Yes, Delete Milestone"
      />

      {showMilestoneForm && (
        <MilestoneForm
          isOpen={showMilestoneForm}
          onClose={() => setShowMilestoneForm(false)}
          projectId={editingMilestone?.project_id || ''} // Pass project ID if creating new
          milestone={editingMilestone}
          onSuccess={() => {
            setShowMilestoneForm(false);
            fetchMilestones();
            showNotification('Milestone saved successfully!', 'success');
          }}
        />
      )}
    </div>
  );
}

export default MilestoneListPage;