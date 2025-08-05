// src/pages/Project/Project.tsx
import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck, Plus, Search, Filter, Users, Calendar, Clock, DollarSign, FileText, BarChart3, CheckCircle,
  TrendingUp, AlertTriangle, Lightbulb, LayoutGrid, List, ChevronDown,
  ArrowLeft, Edit, Trash2, Download, MessageSquare, Bot, Zap, Brain, PlusSquare, // Using PlusSquare for FAB icon
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';

// NEW: Import Project sub-pages
import ProjectListPage from './ProjectListPage';
import ProjectFormPage from './ProjectFormPage';
import TaskListPage from './TaskListPage';
import TaskFormPage from './TaskFormPage';
import TimeLogPage from './TimeLogPage';
import ProjectDetailPage from './ProjectDetailPage';

interface ProjectData {
  id: string;
  project_name: string;
  customer_id: string | null;
  start_date: string;
  due_date: string;
  status: string;
  progress_percentage: number | null;
  is_recurring: boolean | null;
  recurrence_frequency: string | null;
  recurrence_due_date: string | null;
  customers?: { name: string } | null;
  project_owner?: { first_name: string; last_name: string } | null;
  assigned_staff?: { first_name: string; last_name: string } | null;
}

function Project() {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();

  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    recurringJobs: 0,
    upcomingDue: 0,
  });
  const [kanbanProjects, setKanbanProjects] = useState<Record<string, ProjectData[]>>({});
  const [upcomingRecurringJobs, setUpcomingRecurringJobs] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [refreshingInsights, setRefreshingInsights] = useState(false);

  // FAB state
  const [showFabMenu, setShowFabMenu] = useState(false);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchProjectData(currentCompany.id);
      fetchUpcomingRecurringJobs(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const fetchProjectData = async (companyId: string) => {
    setLoading(true);
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          *,
          customers ( name ),
          project_owner:employees!projects_project_owner_id_fkey ( first_name, last_name )
        `)
        .eq('company_id', companyId);

      if (error) throw error;

      const today = new Date();
      const next7Days = new Date();
      next7Days.setDate(today.getDate() + 7);

      let totalProjects = 0;
      let inProgress = 0;
      let completed = 0;
      let overdue = 0;
      let recurringJobs = 0;
      let upcomingDue = 0;

      const kanbanCols: Record<string, ProjectData[]> = {
        not_started: [],
        in_progress: [],
        waiting_for_client: [],
        completed: [],
        billed: [],
        closed: [],
      };

      projects.forEach(project => {
        totalProjects++;

        if (project.status === 'in_progress') inProgress++;
        if (project.status === 'completed' || project.status === 'billed' || project.status === 'closed') completed++;

        const dueDate = project.due_date ? new Date(project.due_date) : null;
        if (dueDate && dueDate < today && project.status !== 'completed' && project.status !== 'billed' && project.status !== 'closed') {
          overdue++;
        }
        if (dueDate && dueDate >= today && dueDate <= next7Days && project.status !== 'completed' && project.status !== 'billed' && project.status !== 'closed') {
          upcomingDue++;
        }

        if (project.is_recurring) recurringJobs++;

        if (kanbanCols[project.status]) {
          kanbanCols[project.status].push(project);
        }
      });

      setProjectStats({
        totalProjects,
        inProgress,
        completed,
        overdue,
        recurringJobs,
        upcomingDue,
      });
      setKanbanProjects(kanbanCols);

    } catch (err: any) {
      showNotification(`Error fetching project data: ${err.message}`, 'error');
      console.error('Error fetching project data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingRecurringJobs = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customers ( name )
        `)
        .eq('company_id', companyId)
        .eq('is_recurring', true)
        .order('recurrence_due_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setUpcomingRecurringJobs(data || []);
    } catch (err: any) {
      console.error('Error fetching upcoming recurring jobs:', err);
    }
  };

  const generateAIInsights = async (companyId: string) => {
    setRefreshingInsights(true);
    try {
      // Mock AI insights for project management
      const insights = {
        predictions: [
          { type: 'alert', title: 'Projects Nearing Deadline', message: `${projectStats.upcomingDue} projects are due in the next 7 days. Review their progress.`, confidence: 'high', impact: 'high', actionable: true, action: 'View Upcoming Projects' },
          { type: 'suggestion', title: 'Overdue Project Follow-up', message: `You have ${projectStats.overdue} overdue projects. Consider sending automated reminders to customers or re-assigning tasks.`, confidence: 'high', impact: 'high', actionable: true, action: 'View Overdue Projects' },
          { type: 'trend', title: 'Project Completion Rate', message: 'Your project completion rate has improved by 15% this quarter. Keep up the good work!', confidence: 'medium', impact: 'low', actionable: false },
        ]
      };

      setAiInsights(insights.predictions);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      setAiInsights([
        {
          type: 'error',
          title: 'AI Service Error',
          message: 'Could not fetch AI insights. Please try again.',
          confidence: 'low',
          impact: 'high',
          actionable: false
        }
      ]);
    } finally {
      setRefreshingInsights(false);
    }
  };

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

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
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

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return <TrendingUp size={16} className="text-sky-500" />;
      case 'alert':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'suggestion':
        return <Lightbulb size={16} className="text-yellow-500" />;
      case 'trend':
        return <Zap size={16} className="text-emerald-500" />;
      default:
        return <Bot size={16} className="text-purple-500" />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-emerald-500 bg-emerald-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Check if we are on the main Project dashboard page
  const isMainProjectPage = location.pathname === '/project' || location.pathname === '/project/';

  // Conditional rendering for routing
  if (!isMainProjectPage) {
    return (
      <Routes>
        <Route path="/list" element={<ProjectListPage />} />
        <Route path="/new" element={<ProjectFormPage />} />
        <Route path="/edit/:id" element={<ProjectFormPage />} />
        <Route path="/:projectId/details" element={<ProjectDetailPage />} />
        <Route path="/:projectId/tasks" element={<TaskListPage />} />
        <Route path="/:projectId/tasks/new" element={<TaskFormPage />} />
        <Route path="/:projectId/tasks/edit/:taskId" element={<TaskFormPage />} />
        <Route path="/:projectId/tasks/:taskId/time-logs" element={<TimeLogPage />} />
      </Routes>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
      </div>
    );
  }

  const projectKanbanStatuses = [
    { id: 'not_started', name: 'Not Started' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'waiting_for_client', name: 'Waiting for Client' },
    { id: 'completed', name: 'Completed' },
    { id: 'billed', name: 'Billed' },
    { id: 'closed', name: 'Closed' },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-transparent bg-clip-text drop-shadow-lg`}>
            Project Management
          </h1>
          <p className={theme.textSecondary}>
            Manage your projects, tasks, and time tracking
          </p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Project Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => navigate('/project/new')}>
            New Project
          </Button>
          <Button variant="outline" icon={<Plus size={16} />}>
            Quick Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          <Button variant="outline" icon={<Filter size={16} />} onClick={() => navigate('/project/list?filter=true')}>
            More Filters
          </Button>
        </div>
      </Card>

      {/* AI Insights Banner */}
      {aiInsights.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 border-l-4 border-l-[${theme.hoverAccent}]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot size={24} className="text-[${theme.hoverAccent}]" />
              <div>
                <h3 className="font-semibold text-gray-900">AI Project Insights</h3>
                <p className="text-sm text-gray-600">
                  {aiInsights.length} new insights available based on your data
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => { /* Navigate to detailed AI insights */ }}>View All Insights</Button>
          </div>
        </Card>
      )}

      {/* Summary Tiles Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"> {/* MODIFIED: xl:grid-cols-6 */}
        {[
          { name: 'Total Projects', value: projectStats.totalProjects, icon: ClipboardCheck, cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100', textColor: 'text-blue-800', iconBg: 'bg-blue-500', filter: 'all' },
          { name: 'Ongoing Projects', value: projectStats.inProgress, icon: Clock, cardBg: 'bg-gradient-to-br from-green-50 to-green-100', textColor: 'text-green-800', iconBg: 'bg-green-500', filter: 'in_progress' },
          { name: 'Completed', value: projectStats.completed, icon: CheckCircle, cardBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', textColor: 'text-emerald-800', iconBg: 'bg-emerald-500', filter: 'completed' },
          { name: 'Overdue', value: projectStats.overdue, icon: AlertTriangle, cardBg: 'bg-gradient-to-br from-red-50 to-red-100', textColor: 'text-red-800', iconBg: 'bg-red-500', filter: 'overdue' },
          { name: 'Recurring Jobs', value: projectStats.recurringJobs, icon: Zap, cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100', textColor: 'text-purple-800', iconBg: 'bg-purple-500', filter: 'recurring' },
          { name: 'Upcoming Due (7 days)', value: projectStats.upcomingDue, icon: Calendar, cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100', textColor: 'text-orange-800', iconBg: 'bg-orange-500', filter: 'upcoming_due' },
        ].map((tile, index) => {
          const Icon = tile.icon;
          return (
            <Card
              key={index}
              hover
              className={`
                p-4 cursor-pointer group relative overflow-hidden flex-1 flex flex-col justify-between
                ${tile.cardBg}
                transform transition-all duration-300 ease-in-out
                hover:translate-y-[-6px] hover:shadow-2xl hover:ring-2 hover:ring-[${theme.hoverAccent}] hover:ring-opacity-75
              `}
              onClick={() => navigate(`/project/list?status=${tile.filter}`)}
              backgroundIcon={<Icon size={120} className={`text-gray-300 opacity-20`} />}
            >
              <div className="relative z-10">
                <h3 className={`text-lg font-bold ${tile.textColor}`}>{tile.name}</h3>
                <p className={`text-3xl font-extrabold mt-1 ${tile.textColor}`}>{tile.value}</p>
              </div>
              <div className="flex items-center justify-end mt-3 relative z-10">
                <div className={`
                  p-3 rounded-2xl shadow-md
                  ${tile.iconBg} text-white
                  group-hover:scale-125 transition-transform duration-300
                `}>
                  <Icon size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Visual Project Pipeline (Kanban) */}
      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Project Pipeline</h3>
        {/* Note: For a true Kanban experience, horizontal scrolling is often necessary if there are many columns.
            This layout ensures the overall page does not force a horizontal scrollbar,
            while allowing the Kanban section itself to scroll if its content exceeds its container. */}
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-4 min-w-max">
            {projectKanbanStatuses.map(statusCol => (
              <div key={statusCol.id} className="w-72 flex-shrink-0 bg-gray-100 p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-lg mb-3 flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(statusCol.id).split(' ')[0].replace('bg-', 'bg-')}`} />
                  {statusCol.name} ({kanbanProjects[statusCol.id]?.length || 0})
                </h4>
                <div className="space-y-3 min-h-[100px]">
                  {kanbanProjects[statusCol.id]?.map(project => (
                    <Card key={project.id} className="p-3 cursor-grab" hover>
                      <Link to={`/project/${project.id}/details`}>
                        <p className="font-medium text-gray-900">{project.project_name}</p>
                        <p className="text-sm text-gray-600">{project.customers?.name || 'N/A'}</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div className={`${getProgressBarColor(project.progress_percentage || 0)} h-1.5 rounded-full`} style={{ width: `${project.progress_percentage || 0}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block">{project.progress_percentage || 0}% Complete</span>
                        {project.due_date && (
                          <p className="text-xs text-gray-500 mt-1">Due: {project.due_date} ({calculateDaysLeft(project.due_date)})</p>
                        )}
                      </Link>
                    </Card>
                  ))}
                  {kanbanProjects[statusCol.id]?.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">No projects</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          * Drag-and-drop functionality is a placeholder.
        </p>
      </Card>

      {/* Quick Panels Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Schedule */}
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
            <Zap size={20} className="mr-2 text-[${theme.hoverAccent}]" />
            Upcoming Recurring Jobs
          </h3>
          <div className="space-y-3">
            {upcomingRecurringJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No upcoming recurring jobs.
              </div>
            ) : (
              upcomingRecurringJobs.map((job, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{job.project_name}</p>
                    <p className="text-sm text-gray-600">
                      {job.customers?.name || 'N/A'} • Due: {job.recurrence_due_date} ({job.recurrence_frequency})
                    </p>
                  </div>
                  <Button size="sm" variant="outline">View</Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Time Tracking Today */}
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
            <Clock size={20} className="mr-2 text-[${theme.hoverAccent}]" />
            Time Tracking Today
          </h3>
          <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
            <p>Timesheet summary for today will appear here.</p>
          </div>
        </Card>

        {/* Projects by Type Chart */}
        <Card className="p-6 lg:col-span-2">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
            <BarChart3 size={20} className="mr-2 text-[${theme.hoverAccent}]" />
            Projects by Type
          </h3>
          <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
            <p>Bar/Donut chart showing project distribution by type will appear here.</p>
          </div>
        </Card>
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`
            w-16 h-16 rounded-full shadow-lg transition-all duration-300
            bg-gradient-to-r from-emerald-500 to-emerald-600 text-white
            hover:scale-110 hover:shadow-xl
          `}
          icon={<PlusSquare size={24} />}
        />
        {showFabMenu && (
          <div className="absolute bottom-20 right-0 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              icon={<ClipboardCheck size={16} />}
              onClick={() => { navigate('/project/new'); setShowFabMenu(false); }}
            >
              Add Project
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              icon={<Plus size={16} />}
              onClick={() => { /* Logic to add quick task */ showNotification('Quick Task functionality is a placeholder.', 'info'); setShowFabMenu(false); }}
            >
              Add Task
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              icon={<Clock size={16} />}
              onClick={() => { /* Logic to add time log */ showNotification('Add Time Log functionality is a placeholder.', 'info'); setShowFabMenu(false); }}
            >
              Add Time Log
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Project;
