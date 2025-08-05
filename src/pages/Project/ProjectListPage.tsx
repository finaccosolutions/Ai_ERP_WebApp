// src/pages/Project/ProjectListPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, ClipboardCheck, Edit, Trash2, RefreshCw, ArrowLeft, Filter, Users, Calendar } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';

interface Project {
  id: string;
  project_name: string;
  customer_id: string | null;
  start_date: string;
  due_date: string;
  status: string;
  assigned_staff_id: string | null;
  created_at: string;
  // Joined data
  customers?: { name: string } | null;
  employees?: { first_name: string; last_name: string } | null;
}

function ProjectListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);

  const [filterCriteria, setFilterCriteria] = useState({
    name: '',
    status: 'all',
    customer: '',
    assignedTo: '',
    startDate: '',
    endDate: '',
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10');

  useEffect(() => {
    if (currentCompany?.id) {
      fetchProjects();
    }
  }, [currentCompany?.id, filterCriteria, numResultsToShow, searchTerm]);

  const fetchProjects = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select(`
          id, project_name, customer_id, start_date, due_date, status, assigned_staff_id, created_at,
          customers ( name ),
          employees ( first_name, last_name )
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id);

      if (searchTerm) {
        query = query.ilike('project_name', `%${searchTerm}%`);
      }

      if (filterCriteria.name) {
        query = query.ilike('project_name', `%${filterCriteria.name}%`);
      }
      if (filterCriteria.status !== 'all') {
        query = query.eq('status', filterCriteria.status);
      }
      if (filterCriteria.customer) {
        query = query.ilike('customers.name', `%${filterCriteria.customer}%`);
      }
      if (filterCriteria.assignedTo) {
        query = query.eq('assigned_staff_id', filterCriteria.assignedTo);
      }
      if (filterCriteria.startDate) {
        query = query.gte('start_date', filterCriteria.startDate);
      }
      if (filterCriteria.endDate) {
        query = query.lte('due_date', filterCriteria.endDate);
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
      fetchProjects();
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
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'waiting_for_client': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'billed': return 'bg-purple-100 text-purple-800';
      case 'closed': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Projects</h1>
          <p className={theme.textSecondary}>Manage all your projects, tasks, and time logs.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/project')} icon={<ArrowLeft size={16} />}>
            Back to Project Dashboard
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Project Suggestions')} />
          <Link to="/project/new">
            <Button icon={<Plus size={16} />}>Create New Project</Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Projects</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchProjects()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          {/* Filter options can be expanded into a modal or dropdown */}
          <div className="flex items-center space-x-2">
            <select
              value={filterCriteria.status}
              onChange={(e) => setFilterCriteria(prev => ({ ...prev, status: e.target.value }))}
              className={`
                px-3 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            >
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_for_client">Waiting for Client</option>
              <option value="completed">Completed</option>
              <option value="billed">Billed</option>
              <option value="closed">Closed</option>
            </select>
            <MasterSelectField
              label=""
              value={numResultsOptions.find(opt => opt.id === numResultsToShow)?.name || ''}
              onValueChange={() => {}}
              onSelect={(id) => setNumResultsToShow(id)}
              options={numResultsOptions}
              placeholder="Show"
              className="w-32"
            />
            <Button onClick={fetchProjects} disabled={loading} icon={<RefreshCw size={16} />}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.project_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.customers?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.start_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.due_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.employees ? `${project.employees.first_name} ${project.employees.last_name}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {project.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/project/edit/${project.id}`}>
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Link to={`/project/${project.id}/tasks`}>
                        <Button variant="ghost" size="sm" title="View Tasks">
                          <ClipboardCheck size={16} />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProject(project.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        message="Are you sure you want to delete this project? This action cannot be undone and will also delete all associated tasks and time logs."
        confirmText="Yes, Delete Project"
      />
    </div>
  );
}

export default ProjectListPage;