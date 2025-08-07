// src/pages/Project/ProjectListPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ClipboardCheck,
  Edit,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Filter,
  Users,
  Calendar,
  Eye,
  LayoutGrid,
  List,
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import ProjectListFilterModal from '../../components/Modals/ProjectListFilterModal'; // NEW: Import the filter modal

interface Project {
  id: string;
  project_name: string;
  customer_id: string | null;
  start_date: string;
  actual_due_date: string; // Changed from due_date
  status: string;
  assigned_staff_id: string | null;
  created_at: string;
  reference_no: string | null;
  project_category_id: string | null; // Changed from category_type
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

function ProjectListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);

  const [showFilterModal, setShowFilterModal] = useState(false); // NEW: State for filter modal visibility
  const [filterCriteria, setFilterCriteria] = useState({
    customer: searchParams.get('customer') || '',
    assignedStaff: searchParams.get('assignedStaff') || '',
    status: searchParams.get('status') || 'all',
    projectCategory: searchParams.get('projectCategory') || '', // Changed from billingType
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    isRecurring: searchParams.get('isRecurring') || 'all',
    overdue: searchParams.get('overdue') || 'false',
    upcoming_due: searchParams.get('upcoming_due') || 'false',
    priority: searchParams.get('priority') || 'all', // ADDED: priority filter
    tags: searchParams.get('tags') ? searchParams.get('tags')?.split(',') : [], // ADDED: tags filter
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10'); // Default to 10

  useEffect(() => {
    // NEW: Update filterCriteria from URL search params on component mount/update
    const newFilterCriteria = {
      customer: searchParams.get('customer') || '',
      assignedStaff: searchParams.get('assignedStaff') || '',
      status: searchParams.get('status') || 'all',
      projectCategory: searchParams.get('projectCategory') || '', // Changed from billingType
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      isRecurring: searchParams.get('isRecurring') || 'all',
      overdue: searchParams.get('overdue') || 'false',
      upcoming_due: searchParams.get('upcoming_due') || 'false',
      priority: searchParams.get('priority') || 'all', // ADDED
      tags: searchParams.get('tags') ? searchParams.get('tags')?.split(',') : [], // ADDED
    };
    setFilterCriteria(newFilterCriteria);

    if (currentCompany?.id) {
      fetchProjects(newFilterCriteria); // Pass the updated filters
    }
  }, [currentCompany?.id, searchParams, numResultsToShow, searchTerm]);

  const fetchProjects = async (currentFilters: typeof filterCriteria) => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select(
          `
          *,
          customers ( name ),
          project_owner:employees!projects_project_owner_id_fkey ( first_name, last_name ),
          assigned_staff:employees!projects_assigned_staff_id_fkey ( first_name, last_name ),
          project_categories ( name, is_recurring_category, recurrence_frequency, recurrence_due_day, recurrence_due_month, billing_type )
        `,
          { count: 'exact' }
        )
        .eq('company_id', currentCompany.id);

      if (searchTerm) {
        query = query.ilike('project_name', `%${searchTerm}%`);
      }

      if (currentFilters.customer && currentFilters.customer !== 'all') {
        query = query.eq('customer_id', currentFilters.customer);
      }
      if (currentFilters.assignedStaff && currentFilters.assignedStaff !== 'all') {
        query = query.or(
          `project_owner_id.eq.${currentFilters.assignedStaff},assigned_staff_id.eq.${currentFilters.assignedStaff}`
        );
      }
      if (currentFilters.status !== 'all') {
        query = query.eq('status', currentFilters.status);
      }
      if (currentFilters.projectCategory && currentFilters.projectCategory !== 'all') {
        // Changed from billingType
        query = query.eq('project_category_id', currentFilters.projectCategory);
      }
      if (currentFilters.startDate) {
        query = query.gte('start_date', currentFilters.startDate);
      }
      if (currentFilters.endDate) {
        query = query.lte('actual_due_date', currentFilters.endDate); // Changed to actual_due_date
      }
      if (currentFilters.isRecurring !== 'all') {
        query = query.eq(
          'project_categories.is_recurring_category',
          currentFilters.isRecurring === 'true'
        ); // Filter by category recurrence
      }

      const today = new Date().toISOString().split('T');
      const next7Days = new Date();
      next7Days.setDate(next7Days.getDate() + 7);
      const next7DaysISO = next7Days.toISOString().split('T');

      if (currentFilters.overdue === 'true') {
        query = query
          .lte('actual_due_date', today) // Changed to actual_due_date
          .not('status', 'in', '("completed", "billed", "closed")');
      }
      if (currentFilters.upcoming_due === 'true') {
        query = query
          .gte('actual_due_date', today) // Changed to actual_due_date
          .lte('actual_due_date', next7DaysISO) // Changed to actual_due_date
          .not('status', 'in', '("completed", "billed", "closed")');
      }
      if (currentFilters.priority !== 'all') {
        // ADDED: priority filter
        query = query.eq('priority', currentFilters.priority);
      }
      if (currentFilters.tags && currentFilters.tags.length > 0) {
        // ADDED: tags filter
        query = query.overlaps('tags', currentFilters.tags);
      }

      query = query.order('created_at', { ascending: false });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setProjects(data || []);
      setTotalProjectsCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching projects: ${err.message}`, 'error');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjectToDeleteId(projectId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDeleteId);

      if (error) throw error;
      showNotification('Project deleted successfully!', 'success');
      fetchProjects(filterCriteria);
    } catch (err: any) {
      showNotification(`Error deleting project: ${err.message}`, 'error');
      console.error('Error deleting project:', err);
    } finally {
      setLoading(false);
      setProjectToDeleteId(null);
    }
  };

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalProjectsCount})` },
  ];

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

  const calculateProgress = (project: Project) => {
    return project.progress_percentage || 0;
  };

  // Add this function to ProjectListPage.tsx
  const getProgressBarColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    setShowFilterModal(false);
    // Update URL search params when filters change
    setSearchParams((prev) => {
      for (const key in newFilters) {
        const value = newFilters[key as keyof typeof newFilters];
        if (Array.isArray(value)) {
          // Handle array for tags
          if (value.length > 0) {
            prev.set(key, value.join(','));
          } else {
            prev.delete(key);
          }
        } else if (value === 'all' || value === '' || value === 'false') {
          prev.delete(key);
        } else {
          prev.set(key, value);
        }
      }
      return prev;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            Projects
          </h1>
          <p className={theme.textSecondary}>
            Manage all your projects, tasks, and time logs.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate('/project')}
            icon={<ArrowLeft size={16} />}
          >
            Back to Project Dashboard
          </Button>
          <AIButton
            variant="suggest"
            onSuggest={() => console.log('AI Project Suggestions')}
          />
          <Link to="/project/new">
            <Button icon={<Plus size={16} />}>Create New Project</Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
          All Projects
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search projects by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' && fetchProjects(filterCriteria)
              }
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
            value={
              numResultsOptions.find((opt) => opt.id === numResultsToShow)?.name || ''
            }
            onValueChange={() => {}} // Not used for typing
            onSelect={(id) => setNumResultsToShow(id)}
            options={numResultsOptions}
            placeholder="Show"
            className="w-32"
          />
          <Button
            onClick={() => fetchProjects(filterCriteria)}
            disabled={loading}
            icon={<RefreshCw size={16} />}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No projects found. Create a new project to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>{' '}
                  {/* Changed from Owner */}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Complete
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Billing Type
                  </th>{' '}
                  {/* NEW */}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>{' '}
                  {/* ADDED */}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>{' '}
                  {/* ADDED */}
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-3 py-2 whitespace-normal text-sm font-medium text-gray-900 max-w-[150px] overflow-hidden text-ellipsis">
                      <Link
                        to={`/project/${project.id}/details`}
                        className="text-blue-600 hover:underline"
                      >
                        {project.project_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 whitespace-normal text-sm text-gray-500 max-w-[120px] overflow-hidden text-ellipsis">
                      {project.customers?.name || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-normal text-sm text-gray-500 max-w-[100px] overflow-hidden text-ellipsis">
                      {project.project_categories?.name || 'N/A'}
                    </td>{' '}
                    {/* Changed from Owner */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {project.start_date} - {project.actual_due_date}{' '}
                      {/* Changed to actual_due_date */}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      <div className="w-20 bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`${getProgressBarColor(
                            calculateProgress(project)
                          )} h-2.5 rounded-full`}
                          style={{ width: `${calculateProgress(project)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs mt-1 block">
                        {calculateProgress(project)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {project.project_categories?.billing_type.replace(/_/g, ' ') ||
                        'N/A'}{' '}
                      {/* NEW */}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {' '}
                      {/* ADDED: Priority */}
                      {project.priority
                        ? project.priority.charAt(0).toUpperCase() +
                        project.priority.slice(1)
                        : 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-normal text-sm text-gray-500 max-w-[120px] overflow-hidden text-ellipsis">
                      {' '}
                      {/* ADDED: Tags */}
                      {project.tags && project.tags.length > 0
                        ? project.tags.join(', ')
                        : 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/project/edit/${project.id}`}>
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
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
        onConfirm={confirmDeleteProject}
        title="Confirm Project Deletion"
        message="Are you sure you want to delete this project? This action cannot be undone and will also delete all associated tasks, time logs, and comments."
        confirmText="Yes, Delete Project"
      />

      <ProjectListFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filterCriteria}
        onApplyFilters={handleApplyFilters}
        onFilterChange={(key, value) =>
          setFilterCriteria((prev) => ({ ...prev, [key]: value }))
        }
      />
    </div>
  );
}

export default ProjectListPage;
