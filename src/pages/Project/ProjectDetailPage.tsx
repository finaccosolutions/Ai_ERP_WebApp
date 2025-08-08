// src/pages/Project/ProjectDetailPage.tsx
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ClipboardCheck,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
  Edit,
  Trash2,
  Plus,
  Shield,
  Tag,
  Info, // ADDED Tag, Info
  Upload, // For file uploads
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
import MilestoneForm from '../../components/Project/MilestoneForm'; // NEW: Import MilestoneForm
import ProjectCommentForm from '../../components/Project/ProjectCommentForm'; // NEW: Import ProjectCommentForm
import { useAuth } from '../../contexts/AuthContext'; // NEW: Import useAuth

interface Project {
  id: string;
  project_name: string;
  customer_id: string | null;
  start_date: string;
  actual_due_date: string; // Changed from due_date
  status: string;
  assigned_staff_id: string | null;
  description: string | null;
  project_category_id: string | null; // Changed from is_recurring
  created_at: string;
  reference_no: string | null;
  expected_value: number | null;
  project_owner_id: string | null;
  progress_percentage: number | null;
  last_recurrence_created_at: string | null;
  priority: string | null; // ADDED: priority
  tags: string[] | null; // ADDED: tags
  customers?: { name: string } | null;
  project_owner?: { first_name: string; last_name: string } | null;
  assigned_staff?: { first_name: string; last_name: string } | null;
  project_categories?: {
    name: string;
    is_recurring_category: boolean;
    recurrence_frequency: string | null;
    recurrence_due_day: number | null;
    recurrence_due_month: number | null;
    billing_type: string;
  } | null; // NEW: Joined project_categories
}

interface ProjectActivity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  user_id: string | null;
  users?: { full_name: string } | null; // Assuming user_profiles join
}

interface Milestone {
  // ADDED: Milestone interface
  id: string;
  milestone_name: string;
  due_date: string;
  status: string;
  completed_date: string | null;
  notes: string | null;
}

interface DocumentAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  users: { full_name: string } | null;
}

interface SalesInvoice {
  id: string;
  invoice_no: string;
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: string;
}

function ProjectDetailPage() {
  const { theme } = useTheme();
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const { user } = useAuth(); // NEW: Get current user for comments/uploads

  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]); // ADDED: Milestones state
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]); // NEW: Documents state
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]); // NEW: Sales Invoices state
  const [comments, setComments] = useState<any[]>([]); // NEW: Comments state

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false); // NEW: State for Milestone Form modal
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null); // NEW: State for editing milestone

  useEffect(() => {
    if (projectId && currentCompany?.id) {
      fetchProjectDetails();
      fetchProjectActivities();
      fetchMilestones();
      fetchDocuments(); // NEW: Fetch documents
      fetchSalesInvoices(); // NEW: Fetch sales invoices
      fetchComments(); // NEW: Fetch comments
    }
  }, [projectId, currentCompany?.id]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(
          `
          *,
          customers ( name ),
          project_owner:employees!projects_project_owner_id_fkey ( first_name, last_name ),
          assigned_staff:employees!projects_assigned_staff_id_fkey ( first_name, last_name ),
          project_categories ( name, is_recurring_category, recurrence_frequency, recurrence_due_day, recurrence_due_month, billing_type )
        `
        )
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
        .select(
          `
          *,
          users:user_profiles ( full_name )
        `
        )
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10); // Fetch recent activities

      if (error) throw error;
      setActivities(data || []);
    } catch (err: any) {
      console.error('Error fetching project activities:', err);
    }
  };

  // ADDED: Fetch Milestones function
  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (err: any) {
      console.error('Error fetching milestones:', err);
    }
  };

  // NEW: Fetch Documents function
  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('document_attachments')
        .select(`
          *,
          users:user_profiles ( full_name )
        `)
        .eq('reference_id', projectId)
        .eq('reference_type', 'project')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
    }
  };

  // NEW: Fetch Sales Invoices function
  const fetchSalesInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .eq('project_id', projectId)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setSalesInvoices(data || []);
    } catch (err: any) {
      console.error('Error fetching sales invoices:', err);
    }
  };

  // NEW: Fetch Comments function
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('project_comments')
        .select(`
          *,
          users:user_profiles ( full_name )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
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
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'waiting_for_client':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'billed':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // ADDED: getMilestoneStatusColor
  const getMilestoneStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'achieved':
        return 'bg-green-100 text-green-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // NEW: Milestone CRUD Handlers
  const handleAddMilestone = () => {
    setEditingMilestone(null);
    setShowMilestoneForm(true);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setShowMilestoneForm(true);
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestoneId);
      if (error) throw error;
      showNotification('Milestone deleted successfully!', 'success');
      fetchMilestones();
    } catch (err: any) {
      showNotification(`Error deleting milestone: ${err.message}`, 'error');
      console.error('Error deleting milestone:', err);
    }
  };

  const handleMilestoneFormSuccess = () => {
    setShowMilestoneForm(false);
    fetchMilestones();
    showNotification('Milestone saved successfully!', 'success');
  };

  // NEW: Document Upload Handler
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !project?.id || !user?.id) return;

    setLoading(true);
    try {
      const filePath = `${project.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project_documents') // Ensure this bucket exists in Supabase Storage
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from('project_documents').getPublicUrl(filePath).data.publicUrl;

      const { error: insertError } = await supabase
        .from('document_attachments')
        .insert({
          company_id: currentCompany?.id,
          reference_type: 'project',
          reference_id: project.id,
          file_name: file.name,
          file_path: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        });

      if (insertError) throw insertError;
      showNotification('Document uploaded successfully!', 'success');
      fetchDocuments();
    } catch (err: any) {
      showNotification(`Error uploading document: ${err.message}`, 'error');
      console.error('Error uploading document:', err);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Document Delete Handler
  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    setLoading(true);
    try {
      // First, delete from storage
      const { error: storageError } = await supabase.storage
        .from('project_documents')
        .remove([filePath.split('/').slice(-2).join('/')]); // Extract path relative to bucket

      if (storageError) console.error('Error deleting file from storage:', storageError);

      // Then, delete from database
      const { error: dbError } = await supabase
        .from('document_attachments')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;
      showNotification('Document deleted successfully!', 'success');
      fetchDocuments();
    } catch (err: any) {
      showNotification(`Error deleting document: ${err.message}`, 'error');
      console.error('Error deleting document:', err);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Add Comment Handler
  const handleAddComment = async (commentText: string) => {
    if (!project?.id || !user?.id || !commentText.trim()) return;
    try {
      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: project.id,
          user_id: user.id,
          comment_text: commentText,
        });
      if (error) throw error;
      showNotification('Comment added successfully!', 'success');
      fetchComments();
    } catch (err: any) {
      showNotification(`Error adding comment: ${err.message}`, 'error');
      console.error('Error adding comment:', err);
    }
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
        <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
          Project Not Found
        </h2>
        <p className={theme.textSecondary}>
          The requested project could not be loaded.
        </p>
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
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {project.project_name}
          </h1>
          <p className={theme.textSecondary}>
            Detailed view and management for this project.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate('/project/list')}
            icon={<ArrowLeft size={16} />}
          >
            Back to Projects List
          </Button>
          <Link to={`/project/edit/${project.id}`}>
            <Button icon={<Edit size={16} />}>Edit Project</Button>
          </Link>
          <Button
            onClick={handleDeleteProject}
            className="text-red-600 hover:text-red-800"
            icon={<Trash2 size={16} />}
          >
            Delete Project
          </Button>
        </div>
      </div>

      {/* Project Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium text-gray-900">
              {project.customers?.name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                project.status
              )}`}
            >
              {project.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-medium text-gray-900">
              {project.actual_due_date} ({calculateDaysLeft(project.actual_due_date)})
            </p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
          <div
            className={`${getProgressBarColor(
              project.progress_percentage || 0
            )} h-4 rounded-full text-xs flex items-center justify-center text-white`}
            style={{ width: `${project.progress_percentage || 0}%` }}
          >
            {project.progress_percentage || 0}% Complete
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'overview'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'tasks'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'milestones'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`} // ADDED: Milestones Tab
          onClick={() => setActiveTab('milestones')}
        >
          Milestones
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'timesheet'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('timesheet')}
        >
          Timesheet
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'files'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('files')}
        >
          Files
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'billing'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('billing')}
        >
          Billing & Accounts
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'comments'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('comments')}
        >
          Comments & Notes
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <Card className="p-6">
            <h3
              className={`text-lg font-semibold ${theme.textPrimary} mb-4`}
            >
              Project Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Reference No / Contract No</p>
                <p className="font-medium text-gray-900">
                  {project.reference_no || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Project Category</p>
                <p className="font-medium text-gray-900">
                  {project.project_categories?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Project Owner</p>
                <p className="font-medium text-gray-900">
                  {project.project_owner
                    ? `${project.project_owner.first_name} ${project.project_owner.last_name}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned Staff</p>
                <p className="font-medium text-gray-900">
                  {project.assigned_staff
                    ? `${project.assigned_staff.first_name} ${project.assigned_staff.last_name}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900">{project.start_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium text-gray-900">
                  {project.actual_due_date}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expected Value</p>
                <p className="font-medium text-gray-900">
                  ₹{project.expected_value?.toLocaleString() || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Billing Type</p>
                <p className="font-medium text-gray-900">
                  {project.project_categories?.billing_type.replace(/_/g, ' ') ||
                    'N/A'}
                </p>
              </div>
              <div>
                {' '}
                {/* ADDED: Priority */}
                <p className="text-sm text-gray-500">Priority</p>
                <p className="font-medium text-gray-900">
                  {project.priority
                    ? project.priority.charAt(0).toUpperCase() +
                    project.priority.slice(1)
                    : 'N/A'}
                </p>
              </div>
              <div>
                {' '}
                {/* ADDED: Tags */}
                <p className="text-sm text-gray-500">Tags</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.tags && project.tags.length > 0 ? (
                    project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Description / Scope of Work</p>
                <p className="font-medium text-gray-900">
                  {project.description || 'N/A'}
                </p>
              </div>
            </div>

            {project.project_categories?.is_recurring_category && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4
                  className={`text-md font-semibold ${theme.textPrimary} mb-2`}
                >
                  Recurrence Details
                </h4>
                <p className="text-sm text-gray-500">
                  Frequency:{' '}
                  <span className="font-medium text-gray-900">
                    {project.project_categories.recurrence_frequency}
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  Due Day:{' '}
                  <span className="font-medium text-gray-900">
                    {project.project_categories.recurrence_due_day}
                  </span>
                </p>
                {project.project_categories.recurrence_due_month && (
                  <p className="text-sm text-gray-500">
                    Due Month:{' '}
                    <span className="font-medium text-gray-900">
                      {project.project_categories.recurrence_due_month}
                    </span>
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Last Auto-Created:{' '}
                  <span className="font-medium text-gray-900">
                    {project.last_recurrence_created_at
                      ? new Date(project.last_recurrence_created_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4
                className={`text-md font-semibold ${theme.textPrimary} mb-2`}
              >
                Recent Activity
              </h4>
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No recent activity for this project.
                </p>
              ) : (
                <ul className="space-y-2">
                  {activities.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex items-start space-x-2 text-sm text-gray-700"
                    >
                      <Clock
                        size={16}
                        className="flex-shrink-0 text-gray-400 mt-1"
                      />
                      <div>
                        <p>
                          <span className="font-medium">
                            {activity.users?.full_name || 'System'}
                          </span>{' '}
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
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
            <h3
              className={`text-lg font-semibold ${theme.textPrimary} mb-4`}
            >
              Tasks
            </h3>
            <p className="text-sm text-gray-500">
              Tasks for this project will be displayed here.
            </p>
            <Link to={`/project/${project.id}/tasks`}>
              <Button className="mt-4" icon={<ClipboardCheck size={16} />}>
                View All Tasks
              </Button>
            </Link>
            <Link to={`/project/${project.id}/tasks/new`}>
              <Button className="mt-4 ml-2" icon={<Plus size={16} />}>
                Add New Task
              </Button>
            </Link>
          </Card>
        )}

        {/* ADDED: Milestones Tab Content */}
        {activeTab === 'milestones' && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-lg font-semibold ${theme.textPrimary}`}
              >
                Milestones
              </h3>
              <Button icon={<Plus size={16} />} onClick={handleAddMilestone}>Add Milestone</Button>
            </div>
            {milestones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No milestones defined for this project.
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {milestone.milestone_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Due: {milestone.due_date}
                      </p>
                      {milestone.completed_date && (
                        <p className="text-xs text-gray-500">
                          Completed: {milestone.completed_date}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getMilestoneStatusColor(
                          milestone.status
                        )}`}
                      >
                        {milestone.status}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleEditMilestone(milestone)} title="Edit">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteMilestone(milestone.id)} className="text-red-600 hover:text-red-800" title="Delete">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'timesheet' && (
          <Card className="p-6">
            <h3
              className={`text-lg font-semibold ${theme.textPrimary} mb-4`}
            >
              Timesheet
            </h3>
            <p className="text-sm text-gray-500">
              This section summarizes time logged against tasks in this project.
            </p>
            <Link to={`/project/${project.id}/tasks`}> {/* Link to tasks list, where time logs are managed */}
              <Button className="mt-4" icon={<Clock size={16} />}>
                View Time Logs
              </Button>
            </Link>
          </Card>
        )}

        {activeTab === 'files' && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
                Project Documents
              </h3>
              <input
                type="file"
                multiple
                className="hidden"
                id="document-upload"
                onChange={handleDocumentUpload}
              />
              <label htmlFor="document-upload">
                <Button icon={<Upload size={16} />}>Upload Document</Button>
              </label>
            </div>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No documents uploaded for this project.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText size={20} className="text-gray-600" />
                      <div>
                        <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                          {doc.file_name}
                        </a>
                        <p className="text-sm text-gray-600">
                          {(doc.file_size / 1024).toFixed(2)} KB • Uploaded by {doc.users?.full_name || 'N/A'} on {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id, doc.file_path)} className="text-red-600 hover:text-red-800" title="Delete">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'billing' && (
          <Card className="p-6">
            <h3
              className={`text-lg font-semibold ${theme.textPrimary} mb-4`}
            >
              Billing & Accounts
            </h3>
            <p className="text-sm text-gray-500">
              This section provides an overview of the project's financial status and linked invoices.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Total Billed Amount</p>
                <p className="text-xl font-bold text-green-600">
                  ₹{project.total_billed_amount?.toLocaleString() || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Billing Status</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.billing_status)}`}>
                  {project.billing_status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <h4 className={`text-md font-semibold ${theme.textPrimary} mt-6 mb-4`}>Linked Sales Invoices</h4>
            {salesInvoices.length === 0 ? (
              <p className="text-sm text-gray-500">No sales invoices linked to this project.</p>
            ) : (
              <div className="space-y-3">
                {salesInvoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Invoice #{invoice.invoice_no}</p>
                      <p className="text-sm text-gray-600">
                        Date: {invoice.invoice_date} • Amount: ₹{invoice.total_amount?.toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link to={`/sales/invoices/create?projectId=${project.id}`}>
              <Button className="mt-4" icon={<Plus size={16} />}>
                Create New Invoice for Project
              </Button>
            </Link>
          </Card>
        )}

        {activeTab === 'comments' && (
          <Card className="p-6">
            <h3
              className={`text-lg font-semibold ${theme.textPrimary} mb-4`}
            >
              Comments & Notes
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500">No comments yet. Be the first to add one!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-800">{comment.comment_text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      By {comment.users?.full_name || 'Unknown User'} on {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
            <ProjectCommentForm projectId={project.id} onSuccess={fetchComments} />
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

      {showMilestoneForm && (
        <MilestoneForm
          isOpen={showMilestoneForm}
          onClose={() => setShowMilestoneForm(false)}
          projectId={project.id}
          milestone={editingMilestone}
          onSuccess={handleMilestoneFormSuccess}
        />
      )}
    </div>
  );
}

export default ProjectDetailPage;

