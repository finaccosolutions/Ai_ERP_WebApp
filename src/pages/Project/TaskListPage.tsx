// src/pages/Project/TaskListPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, ClipboardCheck, Edit, Trash2, RefreshCw, ArrowLeft, Filter, Users, Calendar, Clock } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';

interface Task {
  id: string;
  project_id: string;
  task_name: string;
  assigned_to_id: string | null;
  status: string;
  start_date: string | null; // NEW
  due_date: string | null;
  priority: string | null; // NEW
  description: string | null;
  created_at: string;
  // Joined data
  employees?: { first_name: string; last_name: string } | null;
  projects?: { project_name: string } | null;
}

function TaskListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>(); // Get projectId from URL

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalTasksCount, setTotalTasksCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  const [filterCriteria, setFilterCriteria] = useState({
    name: '',
    status: 'all',
    assignedTo: '',
    dueDateBefore: '',
    dueDateAfter: '',
    priority: 'all', // NEW
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10');

  const [projectDetails, setProjectDetails] = useState<any>(null); // To display project name
  const [availableEmployees, setAvailableEmployees] = useState<{ id: string; name: string }[]>([]); // For assigned staff filter

  useEffect(() => {
    if (currentCompany?.id && projectId) {
      fetchProjectDetails(projectId);
      fetchEmployees(currentCompany.id); // Fetch employees for filter
      fetchTasks(projectId);
    }
  }, [currentCompany?.id, projectId, filterCriteria, numResultsToShow, searchTerm]);

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
      navigate('/project/list'); // Redirect if project not found
    }
  };

  const fetchEmployees = async (companyId: string) => {
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .eq('status', 'active');
      if (employeesError) throw employeesError;
      setAvailableEmployees(employeesData.map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}` })) || []);

    } catch (error) {
      console.error('Error fetching employees:', error);
      showNotification('Failed to load employees for filter.', 'error');
    }
  };

  const fetchTasks = async (id: string) => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select(`
          id, project_id, task_name, assigned_to_id, status, start_date, due_date, priority, description, created_at,
          employees ( first_name, last_name )
        `, { count: 'exact' })
        .eq('project_id', id); // Filter by project_id

      if (searchTerm) {
        query = query.ilike('task_name', `%${searchTerm}%`);
      }

      if (filterCriteria.name) {
        query = query.ilike('task_name', `%${filterCriteria.name}%`);
      }
      if (filterCriteria.status !== 'all') {
        query = query.eq('status', filterCriteria.status);
      }
      if (filterCriteria.assignedTo) {
        query = query.eq('assigned_to_id', filterCriteria.assignedTo);
      }
      if (filterCriteria.dueDateBefore) {
        query = query.lte('due_date', filterCriteria.dueDateBefore);
      }
      if (filterCriteria.dueDateAfter) {
        query = query.gte('due_date', filterCriteria.dueDateAfter);
      }
      if (filterCriteria.priority !== 'all') { // NEW: Apply priority filter
        query = query.eq('priority', filterCriteria.priority);
      }

      query = query.order('created_at', { ascending: false });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setTasks(data || []);
      setTotalTasksCount(count || 0);

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
      fetchTasks(projectId as string);
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
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const taskStatuses = [
    { id: 'all', name: 'All Statuses' },
    { id: 'open', name: 'To-Do' },
    { id: 'in_progress', name: 'Working' },
    { id: 'on_hold', name: 'On Hold' },
    { id: 'completed', name: 'Done' },
  ];

  const taskPriorities = [
    { id: 'all', name: 'All Priorities' },
    { id: 'low', name: 'Low' },
    { id: 'medium', name: 'Medium' },
    { id: 'high', name: 'High' },
    { id: 'critical', name: 'Critical' },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilterCriteria(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            Tasks for {projectDetails?.project_name || 'Project'}
          </h1>
          <p className={theme.textSecondary}>Manage tasks and track progress for this project.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/project/list')} icon={<ArrowLeft size={16} />}>
            Back to Projects
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Task Suggestions')} />
          <Link to={`/project/${projectId}/tasks/new`}>
            <Button icon={<Plus size={16} />}>Create New Task</Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Tasks</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchTasks(projectId as string)}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          {/* Filter options */}
          <MasterSelectField
            label=""
            value={taskStatuses.find(status => status.id === filterCriteria.status)?.name || ''}
            onValueChange={(val) => handleFilterChange('status', val)}
            onSelect={(id) => handleFilterChange('status', id)}
            options={taskStatuses}
            placeholder="Filter by Status"
            className="w-40"
          />
          <MasterSelectField
            label=""
            value={availableEmployees.find(emp => emp.id === filterCriteria.assignedTo)?.name || ''}
            onValueChange={(val) => handleFilterChange('assignedTo', val)}
            onSelect={(id) => handleFilterChange('assignedTo', id)}
            options={[{ id: 'all', name: 'All Staff' }, ...availableEmployees]}
            placeholder="Filter by Assigned To"
            className="w-40"
          />
          <MasterSelectField
            label=""
            value={taskPriorities.find(priority => priority.id === filterCriteria.priority)?.name || ''}
            onValueChange={(val) => handleFilterChange('priority', val)}
            onSelect={(id) => handleFilterChange('priority', id)}
            options={taskPriorities}
            placeholder="Filter by Priority"
            className="w-40"
          />
          <FormField
            label=""
            type="date"
            value={filterCriteria.dueDateAfter}
            onChange={(val) => handleFilterChange('dueDateAfter', val)}
            placeholder="Due After"
            icon={<Calendar size={16} />}
            className="w-36"
          />
          <FormField
            label=""
            type="date"
            value={filterCriteria.dueDateBefore}
            onChange={(val) => handleFilterChange('dueDateBefore', val)}
            placeholder="Due Before"
            icon={<Calendar size={16} />}
            className="w-36"
          />
          <MasterSelectField
            label=""
            value={numResultsOptions.find(opt => opt.id === numResultsToShow)?.name || ''}
            onValueChange={() => {}}
            onSelect={(id) => setNumResultsToShow(id)}
            options={numResultsOptions}
            placeholder="Show"
            className="w-32"
          />
          <Button onClick={() => fetchTasks(projectId as string)} disabled={loading} icon={<RefreshCw size={16} />}>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.task_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.employees ? `${task.employees.first_name} ${task.employees.last_name}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.start_date} - {task.due_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getPriorityColor(task.priority || 'medium')}`}>
                        {task.priority || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
    </div>
  );
}

export default TaskListPage;
