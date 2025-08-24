// src/pages/Project/TaskListPage.tsx
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
  Clock,
  Tag,
  CheckCircle, // NEW
  XCircle, // NEW
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
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import TaskListFilterModal from '../../components/Modals/TaskListFilterModal';

// NEW IMPORTS FOR CHARTS AND METRICS CARD
import ProjectMetricsCard from '../../components/Project/ProjectMetricsCard';
import TaskStatusChart from '../../components/Project/TaskStatusChart';


interface Task {
  id: string;
  project_id: string;
  task_name: string;
  assigned_to_id: string | null;
  status: string;
  start_date: string | null;
  due_date: string | null;
  priority: string | null;
  description: string | null;
  created_at: string;
  estimated_duration_minutes: number | null;
  is_billable: boolean;
  billed_amount: number;
  billing_status: string;
  // Joined data
  employees?: { first_name: string; last_name: string } | null;
  projects?: { project_name: string } | null;
}

function TaskListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>(); // Get projectId directly
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalTasksCount, setTotalTasksCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    name: searchParams.get('name') || '',
    status: searchParams.get('status') || 'all',
    assignedTo: searchParams.get('assignedTo') || '',
    dueDateBefore: searchParams.get('dueDateBefore') || '',
    dueDateAfter: searchParams.get('dueDateAfter') || '',
    priority: searchParams.get('priority') || 'all',
    isBillable: searchParams.get('isBillable') || 'all',
    billingStatus: searchParams.get('billingStatus') || 'all',
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10');

  const [projectDetails, setProjectDetails] = useState<any>(null);

  // NEW STATES FOR METRICS AND CHART DATA
  const [taskMetrics, setTaskMetrics] = useState({ total: 0, completed: 0, open: 0, statusDistribution: [] });

  // NEW: State for dynamic page title
  const [pageTitle, setPageTitle] = useState("Tasks");


  useEffect(() => {
    // Update filterCriteria from URL search params on component mount/update
    const newFilterCriteria = {
      name: searchParams.get('name') || '',
      status: searchParams.get('status') || 'all',
      assignedTo: searchParams.get('assignedTo') || '',
      dueDateBefore: searchParams.get('dueDateBefore') || '',
      dueDateAfter: searchParams.get('dueDateAfter') || '',
      priority: searchParams.get('priority') || 'all',
      isBillable: searchParams.get('isBillable') || 'all',
      billingStatus: searchParams.get('billingStatus') || 'all',
    };
    setFilterCriteria(newFilterCriteria);

    // Set dynamic page title from Link state or default
    if (location.state?.pageTitle) {
      setPageTitle(location.state.pageTitle);
    } else {
      setPageTitle("Tasks"); // Default title
    }

    if (currentCompany?.id && projectId) {
      fetchProjectDetails(projectId);
      fetchTasks(projectId, newFilterCriteria); // Pass the updated filters
    }
  }, [currentCompany?.id, projectId, searchParams, numResultsToShow, searchTerm, location.state]);

  const fetchProjectDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('project_name')
        .eq('id', id)
        .eq('company_id', currentCompany?.id)
        .single();
      if (error) throw error;
      setProjectDetails(data);
    } catch (err: any) {
      showNotification(`Error fetching project details: ${err.message}`, 'error');
      console.error('Error fetching project details:', err);
      navigate('/project/list');
    }
  };

  const fetchTasks = async (id: string, currentFilters: typeof filterCriteria) => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      // Directly query tasks for the given projectId
      let query = supabase
        .from('tasks')
        .select(
          `
          *,
          employees ( first_name, last_name )
        `, { count: 'exact' })
        .eq('project_id', id); // Use the projectId directly

      if (searchTerm) {
        query = query.ilike('task_name', `%${searchTerm}%`);
      }

      if (currentFilters.name) {
        query = query.ilike('task_name', `%${currentFilters.name}%`);
      }
      if (currentFilters.status !== 'all') {
        query = query.eq('status', currentFilters.status);
      }
      if (currentFilters.assignedTo && currentFilters.assignedTo !== 'all') {
        query = query.eq('assigned_to_id', currentFilters.assignedTo);
      }
      if (currentFilters.dueDateBefore) {
        query = query.lte('due_date', currentFilters.dueDateBefore);
      }
      if (currentFilters.dueDateAfter) {
        query = query.gte('due_date', currentFilters.dueDateAfter);
      }
      if (currentFilters.priority !== 'all') {
        query = query.eq('priority', currentFilters.priority);
      }
      if (currentFilters.isBillable !== 'all') {
        query = query.eq('is_billable', currentFilters.isBillable === 'true');
      }
      if (currentFilters.billingStatus !== 'all') {
        query = query.eq('billing_status', currentFilters.billingStatus);
      }

      query = query.order('created_at', { ascending: false });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setTasks(data || []);
      setTotalTasksCount(count || 0);

      // Calculate task metrics for charts
      const total = data?.length || 0;
      const completed = data?.filter(t => t.status === 'completed').length || 0;
      const open = data?.filter(t => t.status === 'open' || t.status === 'in_progress' || t.status === 'on_hold').length || 0;
      setTaskMetrics({ total, completed, open });

      const statusCounts: { [key: string]: number } = {};
      data?.forEach(t => {
        const statusName = t.status.replace(/_/g, ' '); // Convert 'in_progress' to 'in progress'
        statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
      });
      setTaskMetrics(prev => ({ ...prev, statusDistribution: Object.entries(statusCounts).map(([name, count]) => ({ name, count })) }));


    } catch (err: any) {
      showNotification(`Error fetching tasks: ${err.message}`, 'error');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDeleteId(taskId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDeleteId);

      if (error) throw error;
      showNotification('Task deleted successfully!', 'success');
      fetchTasks(projectId as string, filterCriteria);
    } catch (err: any) {
      showNotification(`Error deleting task: ${err.message}`, 'error');
      console.error('Error deleting task:', err);
    } finally {
      setLoading(false);
      setTaskToDeleteId(null);
    }
  };

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalTasksCount})` },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBillingStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'not_billed':
        return 'bg-gray-100 text-gray-800';
      case 'partially_billed':
        return 'bg-yellow-100 text-yellow-800';
      case 'billed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    setShowFilterModal(false);
    setSearchParams((prev) => {
      for (const key in newFilters) {
        const value = newFilters[key as keyof typeof newFilters];
        if (Array.isArray(value)) {
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
            Tasks for {projectDetails?.project_name || 'Task'}
          </h1>
          <p className={theme.textSecondary}>
            Manage tasks and track progress for this project.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/project/${projectId}/details`)}
            icon={<ArrowLeft size={16} />}
          >
            Back to Project Details
          </Button>
          <AIButton
            variant="suggest"
            onSuggest={() => console.log('AI Task Suggestions')}
          />
          <Link to={`/project/${projectId}/tasks/new`}>
            <Button icon={<Plus size={16} />}>Create New Task</Button>
          </Link>
        </div>
      </div>

      {/* Key Task Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProjectMetricsCard
          title="Total Tasks"
          value={taskMetrics.total}
          description="All tasks in this project"
          icon={ClipboardCheck}
          colorClass="bg-blue-500"
          onClick={() => handleApplyFilters({ ...filterCriteria, status: 'all' })}
        />
        <ProjectMetricsCard
          title="Open Tasks"
          value={taskMetrics.open}
          description="Tasks not yet completed"
          icon={XCircle}
          colorClass="bg-red-500"
          onClick={() => handleApplyFilters({ ...filterCriteria, status: 'open' })}
        />
        <ProjectMetricsCard
          title="Completed Tasks"
          value={taskMetrics.completed}
          description="Tasks marked as done"
          icon={CheckCircle}
          colorClass="bg-green-500"
          onClick={() => handleApplyFilters({ ...filterCriteria, status: 'completed' })}
        />
      </div>

      {/* Task Status Breakdown Chart */}
      {taskMetrics.statusDistribution && taskMetrics.statusDistribution.length > 0 && (
        <TaskStatusChart data={taskMetrics.statusDistribution} />
      )}

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
          All Tasks
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search tasks by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' && fetchTasks(projectId as string, filterCriteria)
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
            label=""
            value={numResultsOptions.find((opt) => opt.id === numResultsToShow)?.name || ''}
            onValueChange={() => {}}
            onSelect={(id) => setNumResultsToShow(id)}
            options={numResultsOptions}
            placeholder="Show"
            className="w-32"
          />
          <Button
            onClick={() => fetchTasks(projectId as string, filterCriteria)}
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
          ) : tasks.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No tasks found for this project. Create a new task to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Duration (Mins)
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Billable
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Billed Amount
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Billing Status
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-3 py-2 whitespace-normal text-sm font-medium text-gray-900 max-w-[150px] overflow-hidden text-ellipsis">
                      <Link
                        to={`/project/${projectId}/tasks/${task.id}/time-logs`}
                        state={{ pageTitle: `Time Logs for ${task.task_name}` }}
                        className="text-blue-600 hover:underline"
                      >
                        {task.task_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 whitespace-normal text-sm text-gray-500 max-w-[100px] overflow-hidden text-ellipsis">
                      {task.employees
                        ? `${task.employees.first_name} ${task.employees.last_name}`
                        : 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {task.start_date} - {task.due_date}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span
                        className={`font-medium ${getPriorityColor(
                          task.priority || 'medium'
                        )}`}
                      >
                        {task.priority || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {task.estimated_duration_minutes || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {task.is_billable ? 'Yes' : 'No'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      ₹{task.billed_amount?.toLocaleString() || '0.00'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getBillingStatusColor(
                          task.billing_status
                        )}`}
                      >
                        {task.billing_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/project/${projectId}/tasks/edit/${task.id}`}>
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Link to={`/project/${projectId}/tasks/${task.id}/time-logs`}>
                        <Button variant="ghost" size="sm" title="View Time Logs">
                          <Clock size={16} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
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
        onConfirm={confirmDeleteTask}
        title="Confirm Task Deletion"
        message="Are you sure you want to delete this task? This action cannot be undone and will also delete all associated time logs."
        confirmText="Yes, Delete Task"
      />

      <TaskListFilterModal
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

export default TaskListPage;
