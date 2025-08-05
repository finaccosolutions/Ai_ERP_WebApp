// src/pages/Project/ProjectDetailPage.tsx
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ClipboardCheck, Users, Calendar, DollarSign, FileText,
  Clock, MessageSquare, CheckCircle, XCircle, TrendingUp,
  Download, Edit, Trash2, Plus, Shield,
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Import Link

interface Project {
  id: string;
  project_name: string;
  customer_id: string | null;
  start_date: string;
  due_date: string;
  billing_type: string;
  assigned_staff_id: string | null;
  status: string;
  description: string | null;
  is_recurring: boolean;
  recurrence_frequency: string | null;
  recurrence_due_date: string | null;
  created_at: string;
  reference_no: string | null;
  category_type: string | null;
  expected_value: number | null;
  project_owner_id: string | null;
  progress_percentage: number | null;
  last_recurrence_created_at: string | null;
  customers?: { name: string } | null;
  project_owner?: { first_name: string; last_name: string } | null;
  assigned_staff?: { first_name: string; last_name: string } | null;
}

interface ProjectActivity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  user_id: string | null;
  users?: { full_name: string } | null; // Assuming user_profiles join
}

function ProjectDetailPage() {
  const { theme } = useTheme();
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();

  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (projectId && currentCompany?.id) {
      fetchProjectDetails();
      fetchProjectActivities();
    }
  }, [projectId, currentCompany?.id]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customers ( name ),
          project_owner:employees!projects_project_owner_id_fkey ( first_name, last_name ),
          assigned_staff:employees!projects_assigned_staff_id_fkey ( first_name, last_name )
        `)
        .eq('id', projectId)
        .eq('company_id', currentCompany?.id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (err: any) {
      showNotification(`Error loading project details: ${err.message}`, 'error');
      console.error('Error loading project details:', err);
      navigate('/project/list');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('project_activity_log')
        .select(`
          *,
          users:user_profiles ( full_name )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10); // Fetch recent activities

      if (error) throw error;
      setActivities(data || []);
    } catch (err: any) {
      console.error('Error fetching project activities:', err);
    }
  };

  const handleDeleteProject = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProject = async () => {
    if (!project?.id) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;
      showNotification('Project deleted successfully!', 'success');
      navigate('/project/list');
    } catch (err: any) {
      showNotification(`Error deleting project: ${err.message}`, 'error');
      console.error('Error deleting project:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Add getStatusColor function here
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'waiting_for_client': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'billed': return 'bg-purple-100 text-purple-800';
      case 'closed': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDaysLeft = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    return `${diffDays} days left`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>Project Not Found</h2>
        <p className={theme.textSecondary}>The requested project could not be loaded.</p>
        <Button onClick={() => navigate('/project/list')} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>{project.project_name}</h1>
          <p className={theme.textSecondary}>Detailed view and management for this project.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/project/list')} icon={<ArrowLeft size={16} />}>
            Back to Projects List
          </Button>
          <Link to={`/project/edit/${project.id}`}>
            <Button icon={<Edit size={16} />}>Edit Project</Button>
          </Link>
          <Button onClick={handleDeleteProject} className="text-red-600 hover:text-red-800" icon={<Trash2 size={16} />}>
            Delete Project
          </Button>
        </div>
      </div>

      {/* Project Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium text-gray-900">{project.customers?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
              {project.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-medium text-gray-900">{project.due_date} ({calculateDaysLeft(project.due_date)})</p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
          <div className={`${getProgressBarColor(project.progress_percentage || 0)} h-4 rounded-full text-xs flex items-center justify-center text-white`} style={{ width: `${project.progress_percentage || 0}%` }}>
            {project.progress_percentage || 0}% Complete
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'tasks' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'timesheet' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('timesheet')}
        >
          Timesheet
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'files' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('files')}
        >
          Files
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'billing' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('billing')}
        >
          Billing & Accounts
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'comments' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('comments')}
        >
          Comments & Notes
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Project Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Reference No / Contract No</p>
                <p className="font-medium text-gray-900">{project.reference_no || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category / Type</p>
                <p className="font-medium text-gray-900">{project.category_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Project Owner</p>
                <p className="font-medium text-gray-900">{project.project_owner ? `${project.project_owner.first_name} ${project.project_owner.last_name}` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned Staff</p>
                <p className="font-medium text-gray-900">{project.assigned_staff ? `${project.assigned_staff.first_name} ${project.assigned_staff.last_name}` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900">{project.start_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium text-gray-900">{project.due_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expected Value</p>
                <p className="font-medium text-gray-900">₹{project.expected_value?.toLocaleString() || '0.00'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Billing Type</p>
                <p className="font-medium text-gray-900">{project.billing_type.replace(/_/g, ' ')}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Description / Scope of Work</p>
                <p className="font-medium text-gray-900">{project.description || 'N/A'}</p>
              </div>
            </div>

            {project.is_recurring && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className={`text-md font-semibold ${theme.textPrimary} mb-2`}>Recurrence Details</h4>
                <p className="text-sm text-gray-500">Frequency: <span className="font-medium text-gray-900">{project.recurrence_frequency}</span></p>
                <p className="text-sm text-gray-500">Next Due: <span className="font-medium text-gray-900">{project.recurrence_due_date}</span></p>
                <p className="text-sm text-gray-500">Last Auto-Created: <span className="font-medium text-gray-900">{project.last_recurrence_created_at ? new Date(project.last_recurrence_created_at).toLocaleDateString() : 'N/A'}</span></p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-2`}>Recent Activity</h4>
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity for this project.</p>
              ) : (
                <ul className="space-y-2">
                  {activities.map(activity => (
                    <li key={activity.id} className="flex items-start space-x-2 text-sm text-gray-700">
                      <Clock size={16} className="flex-shrink-0 text-gray-400 mt-1" />
                      <div>
                        <p>
                          <span className="font-medium">{activity.users?.full_name || 'System'}</span> {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'tasks' && (
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Tasks</h3>
            <p className="text-sm text-gray-500">Tasks for this project will be displayed here.</p>
            <Link to={`/project/${project.id}/tasks`}>
              <Button className="mt-4" icon={<ClipboardCheck size={16} />}>View All Tasks</Button>
            </Link>
            <Link to={`/project/${project.id}/tasks/new`}>
              <Button className="mt-4 ml-2" icon={<Plus size={16} />}>Add New Task</Button>
            </Link>
          </Card>
        )}

        {activeTab === 'timesheet' && (
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Timesheet</h3>
            <p className="text-sm text-gray-500">Time logs for tasks will be summarized here.</p>
            <Button className="mt-4" icon={<Clock size={16} />}>View Time Logs</Button>
          </Card>
        )}

        {activeTab === 'files' && (
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Files</h3>
            <p className="text-sm text-gray-500">Project documents and attachments will be managed here.</p>
            <Button className="mt-4" icon={<Download size={16} />}>Upload File</Button>
          </Card>
        )}

        {activeTab === 'billing' && (
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Billing & Accounts</h3>
            <p className="text-sm text-gray-500">Financial overview and invoicing for this project.</p>
            <Button className="mt-4" icon={<FileText size={16} />}>Create Sales Invoice</Button>
          </Card>
        )}

        {activeTab === 'comments' && (
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Comments & Notes</h3>
            <p className="text-sm text-gray-500">Collaborators can leave comments and notes here.</p>
            <Button className="mt-4" icon={<MessageSquare size={16} />}>Add Comment</Button>
          </Card>
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteProject}
        title="Confirm Project Deletion"
        message="Are you sure you want to delete this project? This action cannot be undone and will also delete all associated tasks, time logs, and comments."
        confirmText="Yes, Delete Project"
      />
    </div>
  );
}

export default ProjectDetailPage;