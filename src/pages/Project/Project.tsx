// src/pages/Project/Project.tsx
import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck, Plus, Search, Filter, Users, Calendar, Clock, DollarSign, FileText, BarChart3, CheckCircle,
  TrendingUp, AlertTriangle, Lightbulb, LayoutGrid, List, ChevronDown, Layers, Flag,
  ArrowLeft, Edit, Trash2, Download, MessageSquare, Bot, Zap, Brain, PlusSquare, Mic, RefreshCw,
  Tag, // For Project Categories
  Scale, // For Billing
  BookOpen, // For Reports
  Settings // For Masters
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, Routes, Route, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'; // NEW: Import Recharts components

// Import Project sub-pages
import ProjectListPage from './ProjectListPage';
import ProjectFormPage from './ProjectFormPage';
import TaskListPage from './TaskListPage';
import TaskFormPage from './TaskFormPage';
import TimeLogPage from './TimeLogPage';
import ProjectDetailPage from './ProjectDetailPage';
import ProjectCategoryFormPage from './ProjectCategoryFormPage';
import ProjectCategoryListPage from './ProjectCategoryListPage';

// NEW: Import Project-specific components
import ProjectMetricsCard from '../../components/Project/ProjectMetricsCard';
import ProjectProgressChart from '../../components/Project/ProjectProgressChart';
import MilestoneStatusChart from '../../components/Project/MilestoneStatusChart';
import TimeLoggedByEmployeeChart from '../../components/Project/TimeLoggedByEmployeeChart';
import DocumentTypeDistributionChart from '../../components/Project/DocumentTypeDistributionChart';
import BillingStatusChart from '../../components/Project/BillingStatusChart';

// NEW: Import Report Pages
import ProjectPerformanceReportPage from './reports/ProjectPerformanceReportPage';
import TimeLogReportPage from './reports/TimeLogReportPage';
import BillingReportPage from './reports/BillingReportPage';

// NEW: Import Master Pages
import MilestoneListPage from './MilestoneListPage';
import ProjectTeamMembersPage from './ProjectTeamMembersPage';
import ProjectDocumentsPage from './ProjectDocumentsPage';
import ProjectBillingEntriesPage from './ProjectBillingEntriesPage';


interface ProjectData {
  id: string;
  project_name: string;
  customer_id: string | null;
  start_date: string;
  actual_due_date: string;
  status: string;
  progress_percentage: number | null;
  project_category_id: string | null;
  project_categories?: { name: string; is_recurring_category: boolean; recurrence_frequency: string | null; recurrence_due_day: number | null; recurrence_due_month: number | null; billing_type: string; } | null;
  customers?: { name: string } | null;
  project_owner?: { first_name: string; last_name: string } | null;
  assigned_staff?: { first_name: string; last_name: string } | null;
  priority: string | null;
  tags: string[] | null;
  expected_value: number | null;
  billing_status: string;
  total_billed_amount: number;
}

function Project() {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCompany, currentPeriod } = useCompany();
  const { showNotification } = useNotification();

  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    recurringJobs: 0,
    upcomingDue: 0,
    customerWise: 0,
    categoryWise: 0,
    nonRecurring: 0,
    totalFixedPriceValue: 0,
    totalTimeBasedValue: 0,
    totalBilledAmount: 0,
    totalBillableTasks: 0,
    totalBilledTasksAmount: 0,
    totalTimeLoggedCost: 0,
    totalTasks: 0, // Added for Masters tab
    totalMilestones: 0, // Added for Masters tab
    totalTeamMembers: 0, // Added for Masters tab
    totalDocuments: 0, // Added for Masters tab
  });
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [refreshingInsights, setRefreshingInsights] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const [showFabMenu, setShowFabMenu] = useState(false);
  const [activeProjectTab, setActiveProjectTab] = useState('overview'); // NEW: State for active tab

  // NEW: Chart Data States
  const [projectsByTypeData, setProjectsByTypeData] = useState<any[]>([]);
  const [timeTrackingTodayData, setTimeTrackingTodayData] = useState<any[]>([]);
  const [milestoneStatusData, setMilestoneStatusData] = useState<any[]>([]); // NEW
  const [billingStatusData, setBillingStatusData] = useState<any[]>([]); // NEW
  const [documentTypeDistributionData, setDocumentTypeDistributionData] = useState<any[]>([]); // NEW

  const moduleColors = [
    { cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100', textColor: 'text-blue-800', iconBg: 'bg-blue-500' },
    { cardBg: 'bg-gradient-to-br from-green-50 to-green-100', textColor: 'text-green-800', iconBg: 'bg-green-500' },
    { cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100', textColor: 'text-purple-800', iconBg: 'bg-purple-500' },
    { cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100', textColor: 'text-orange-800', iconBg: 'bg-orange-500' },
    { cardBg: 'bg-gradient-to-br from-teal-50 to-teal-100', textColor: 'text-teal-800', iconBg: 'bg-teal-500' },
    { cardBg: 'bg-gradient-to-br from-pink-50 to-pink-100', textColor: 'text-pink-800', iconBg: 'bg-pink-500' },
    { cardBg: 'bg-gradient-to-br from-red-50 to-red-100', textColor: 'text-red-800', iconBg: 'bg-red-500' },
    { cardBg: 'bg-gradient-to-br from-yellow-50 to-yellow-100', textColor: 'text-yellow-800', iconBg: 'bg-yellow-500' },
    { cardBg: 'bg-gradient-to-br from-indigo-50 to-indigo-100', textColor: 'text-indigo-800', iconBg: 'bg-indigo-500' },
    { cardBg: 'bg-gradient-to-br from-cyan-50 to-cyan-100', textColor: 'text-cyan-800', iconBg: 'bg-cyan-500' },
  ];

  useEffect(() => {
    if (currentCompany?.id && currentPeriod?.id) {
      fetchProjectData(currentCompany.id, currentPeriod.startDate, currentPeriod.endDate);
      fetchUpcomingRecurringJobs(currentCompany.id);
      fetchProjectsByTypeData(currentCompany.id);
      fetchTimeTrackingTodayData(currentCompany.id);
      fetchMilestoneStatusData(currentCompany.id); // NEW
      fetchBillingStatusData(currentCompany.id); // NEW
      fetchDocumentTypeDistributionData(currentCompany.id); // NEW
    }
  }, [currentCompany?.id, currentPeriod?.id]);

  const fetchProjectData = async (companyId: string, periodStartDate: string, periodEndDate: string) => {
    setLoading(true);
    try {
      const { data: kpis, error: kpisError } = await supabase
        .from('company_project_kpis')
        .select('*')
        .eq('company_id', companyId)
        .single();

      // Fetch additional counts not in the KPI view
      const { count: totalMilestonesCount, error: milestonesCountError } = await supabase
        .from('milestones')
        .select('id', { count: 'exact', head: true })
        .in('project_id', supabase.from('projects').select('id').eq('company_id', companyId));
      if (milestonesCountError) console.error('Error fetching total milestones:', milestonesCountError);

      const { count: totalTeamMembersCount, error: teamMembersCountError } = await supabase
        .from('project_team_members')
        .select('id', { count: 'exact', head: true })
        .in('project_id', supabase.from('projects').select('id').eq('company_id', companyId));
      if (teamMembersCountError) console.error('Error fetching total team members:', teamMembersCountError);

      const { count: totalDocumentsCount, error: documentsCountError } = await supabase
        .from('document_attachments')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('reference_type', 'project');
      if (documentsCountError) console.error('Error fetching total documents:', documentsCountError);


      if (kpisError) {
        console.error('Project.tsx: Error fetching KPIs from materialized view:', kpisError);
        showNotification('Failed to load project metrics.', 'error');
        setProjectStats({
          totalProjects: 0, inProgress: 0, completed: 0, overdue: 0,
          recurringJobs: 0, upcomingDue: 0, customerWise: 0, categoryWise: 0,
          nonRecurring: 0, totalFixedPriceValue: 0, totalTimeBasedValue: 0,
          totalBilledAmount: 0, totalBillableTasks: 0, totalBilledTasksAmount: 0, totalTimeLoggedCost: 0,
          totalTasks: 0,
          totalMilestones: totalMilestonesCount || 0, // Use fetched count
          totalTeamMembers: totalTeamMembersCount || 0, // Use fetched count
          totalDocuments: totalDocumentsCount || 0, // Use fetched count
        });
      } else {
        setProjectStats({
          totalProjects: kpis?.total_projects || 0,
          inProgress: kpis?.projects_in_progress || 0,
          completed: kpis?.projects_completed || 0,
          overdue: 0, // Will be calculated below
          recurringJobs: kpis?.total_recurring_projects || 0,
          upcomingDue: 0, // Will be calculated below
          customerWise: 0, // Not directly from KPI view
          categoryWise: 0, // Not directly from KPI view
          nonRecurring: kpis?.total_one_time_projects || 0,
          totalFixedPriceValue: kpis?.total_fixed_price_value || 0,
          totalTimeBasedValue: kpis?.total_time_based_value || 0,
          totalBilledAmount: kpis?.total_billed_amount || 0,
          totalBillableTasks: kpis?.total_billable_tasks || 0,
          totalBilledTasksAmount: kpis?.total_billed_tasks_amount || 0,
          totalTimeLoggedCost: kpis?.total_time_logged_cost || 0,
          totalTasks: kpis?.total_tasks || 0,
          totalMilestones: totalMilestonesCount || 0, // Use fetched count
          totalTeamMembers: totalTeamMembersCount || 0, // Use fetched count
          totalDocuments: totalDocumentsCount || 0, // Use fetched count
        });
      }

      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          *,
          customers ( name ),
          project_owner:employees!projects_project_owner_id_fkey ( first_name, last_name ),
          project_categories ( name, is_recurring_category, recurrence_frequency, recurrence_due_day, recurrence_due_month, billing_type )
        `)
        .eq('company_id', companyId);

      if (error) throw error;

      const today = new Date();
      const next7Days = new Date();
      next7Days.setDate(today.getDate() + 7);

      let overdueCount = 0;
      let upcomingDueCount = 0;
      let customerWiseCount = 0;
      let categoryWiseCount = 0;

      const kanbanCols: Record<string, ProjectData[]> = {
        not_started: [],
        in_progress: [],
        waiting_for_client: [],
        completed: [],
        billed: [],
        closed: [],
      };

      projects.forEach(project => {
        const dueDate = project.actual_due_date ? new Date(project.actual_due_date) : null;
        if (dueDate && dueDate < today && project.status !== 'completed' && project.status !== 'billed' && project.status !== 'closed') {
          overdueCount++;
        }
        if (dueDate && dueDate >= today && dueDate <= next7Days && project.status !== 'completed' && project.status !== 'billed' && project.status !== 'closed') {
          upcomingDueCount++;
        }

        if (project.customer_id) customerWiseCount++;
        if (project.project_category_id) categoryWiseCount++;

        if (kanbanCols[project.status]) {
          kanbanCols[project.status].push(project);
        }
      });

      setProjectStats(prev => ({
        ...prev,
        overdue: overdueCount,
        upcomingDue: upcomingDueCount,
        customerWise: customerWiseCount,
        categoryWise: categoryWiseCount,
      }));
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
          customers ( name ),
          project_categories ( name, is_recurring_category, recurrence_frequency, recurrence_due_day, recurrence_due_month, billing_type )
        `)
        .eq('company_id', companyId)
        .eq('project_categories.is_recurring_category', true)
        .order('actual_due_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setUpcomingRecurringJobs(data || []);
    } catch (err: any) {
      console.error('Error fetching upcoming recurring jobs:', err);
    }
  };

  const fetchProjectsByTypeData = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          status,
          project_categories ( name )
        `)
        .eq('company_id', companyId);

      if (error) throw error;

      const statusCounts: { [key: string]: number } = {};
      const categoryCounts: { [key: string]: number } = {};

      data.forEach(project => {
        statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
        const categoryName = project.project_categories?.name || 'Uncategorized';
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });

      const formattedStatusData = Object.keys(statusCounts).map(status => ({
        name: status.replace(/_/g, ' '),
        value: statusCounts[status],
      }));

      const formattedCategoryData = Object.keys(categoryCounts).map(category => ({
        name: category,
        value: categoryCounts[category],
      }));

      setProjectsByTypeData(formattedCategoryData);
    } catch (err) {
      console.error('Error fetching projects by type data:', err);
    }
  };

  const fetchTimeTrackingTodayData = async (companyId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('time_logs')
        .select(`
          duration_minutes,
          employees ( first_name, last_name )
        `)
        .gte('start_time', today)
        .lte('start_time', `${today}T23:59:59.999Z`); // End of today

      if (error) throw error;

      const employeeTime: { [key: string]: number } = {};
      data.forEach(log => {
        const employeeName = log.employees ? `${log.employees.first_name} ${log.employees.last_name}` : 'Unassigned';
        employeeTime[employeeName] = (employeeTime[employeeName] || 0) + (log.duration_minutes || 0);
      });

      const formattedTimeData = Object.keys(employeeTime).map(name => ({
        name: name,
        hours: parseFloat((employeeTime[name] / 60).toFixed(1)), // Convert minutes to hours
      }));

      setTimeTrackingTodayData(formattedTimeData);
    } catch (err) {
      console.error('Error fetching time tracking today data:', err);
    }
  };

  // NEW: Fetch Milestone Status Data
  const fetchMilestoneStatusData = async (companyId: string) => {
    try {
      // First, get all project IDs for the company
      const { data: projectIdsData, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('company_id', companyId);

      if (projectsError) throw projectsError;
      const projectIds = projectIdsData.map(p => p.id);

      if (projectIds.length === 0) {
        setMilestoneStatusData([]); // No projects, no milestones
        return;
      }

      const { data, error } = await supabase
        .from('milestones')
        .select('status')
        .in('project_id', projectIds); // Use the array of IDs

      if (error) throw error;

      const statusCounts: { [key: string]: number } = {};
      data.forEach(milestone => {
        const statusName = milestone.status.replace(/_/g, ' ');
        statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
      });

      const formattedData = Object.keys(statusCounts).map(status => ({
        name: status,
        count: statusCounts[status],
      }));
      setMilestoneStatusData(formattedData);
    } catch (err) {
      console.error('Error fetching milestone status data:', err);
    }
  };

  // NEW: Fetch Billing Status Data
  const fetchBillingStatusData = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('billing_status, total_billed_amount, expected_value')
        .eq('company_id', companyId);

      if (error) throw error;

      const billingStatusTotals: { [key: string]: number } = {
        'not_billed': 0,
        'partially_billed': 0,
        'billed': 0,
      };

      data.forEach(project => {
        if (project.billing_status === 'billed') {
          billingStatusTotals['billed'] += project.total_billed_amount || 0;
        } else if (project.billing_status === 'partially_billed') {
          billingStatusTotals['partially_billed'] += project.total_billed_amount || 0;
        } else {
          billingStatusTotals['not_billed'] += project.expected_value || 0; // For not billed, use expected value
        }
      });

      const formattedData = Object.keys(billingStatusTotals).map(status => ({
        name: status.replace(/_/g, ' '),
        value: billingStatusTotals[status],
      }));
      setBillingStatusData(formattedData);
    } catch (err) {
      console.error('Error fetching billing status data:', err);
    }
  };

  // NEW: Fetch Document Type Distribution Data
  const fetchDocumentTypeDistributionData = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('document_attachments')
        .select('reference_type')
        .eq('company_id', companyId);

      if (error) throw error;

      const typeCounts: { [key: string]: number } = {};
      data.forEach(doc => {
        const typeName = doc.reference_type || 'Other';
        typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
      });

      const formattedData = Object.keys(typeCounts).map(type => ({
        name: type.replace(/_/g, ' '),
        count: typeCounts[type],
      }));
      setDocumentTypeDistributionData(formattedData);
    } catch (err) {
      console.error('Error fetching document type distribution data:', err);
    }
  };

  const generateAIInsights = async (companyId: string) => {
    setRefreshingInsights(true);
    try {
      const insights = {
        predictions: [
          { type: 'alert', title: 'Projects Nearing Deadline', message: `${projectStats.upcomingDue} projects are due in the next 7 days. Review their progress.`, confidence: 'high', impact: 'high', actionable: true, action: 'View Upcoming Projects' },
          { type: 'suggestion', title: 'Overdue Project Follow-up', message: `You have ${projectStats.overdue} overdue projects. Consider sending automated reminders to customers or re-assigning tasks.`, confidence: 'high', impact: 'high', actionable: true, action: 'View Overdue Projects' },
          { type: 'trend', title: 'Project Completion Rate', message: 'Your project completion rate has improved by 15% this quarter. Keep up the good work!', confidence: 'medium', impact: 'low', actionable: false },
          { type: 'info', title: 'Fixed Price Project Value', message: `Total expected value from fixed-price projects: ₹${projectStats.totalFixedPriceValue.toLocaleString()}`, confidence: 'high', impact: 'low', actionable: false },
          { type: 'info', title: 'Time-Based Project Value', message: `Total expected value from time-based projects: ₹${projectStats.totalTimeBasedValue.toLocaleString()}`, confidence: 'high', impact: 'low', actionable: false },
          { type: 'info', title: 'Total Billed Amount', message: `Total amount billed across all projects: ₹${projectStats.totalBilledAmount.toLocaleString()}`, confidence: 'high', impact: 'low', actionable: false },
          { type: 'info', title: 'Billable Tasks', message: `You have ${projectStats.totalBillableTasks} billable tasks. Total billed amount from tasks: ₹${projectStats.totalBilledTasksAmount.toLocaleString()}`, confidence: 'high', impact: 'low', actionable: false },
          { type: 'info', title: 'Time Logged Cost', message: `Total cost of time logged across all projects: ₹${projectStats.totalTimeLoggedCost.toLocaleString()}`, confidence: 'high', impact: 'low', actionable: false },
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
        <Route path="/" element={<ProjectSummaryPage />} /> {/* Default to summary page */}
        <Route path="/list" element={<ProjectListPage />} />
        <Route path="/new" element={<ProjectFormPage />} />
        <Route path="/edit/:id" element={<ProjectFormPage />} />
        <Route path="/:projectId/details" element={<ProjectDetailPage />} />
        <Route path="/:projectId/tasks" element={<TaskListPage />} />
        <Route path="/:projectId/tasks/new" element={<TaskFormPage />} />
        <Route path="/:projectId/tasks/edit/:taskId" element={<TaskFormPage />} />
        <Route path="/:projectId/tasks/:taskId/time-logs" element={<TimeLogPage />} />
        <Route path="/categories" element={<ProjectCategoryListPage />} />
        <Route path="/categories/new" element={<ProjectCategoryFormPage />} />
        <Route path="/categories/edit/:id" element={<ProjectCategoryFormPage />} />
        {/* NEW: Master Pages Routes */}
        <Route path="/milestones" element={<MilestoneListPage />} />
        <Route path="/team-members" element={<ProjectTeamMembersPage />} />
        <Route path="/documents" element={<ProjectDocumentsPage />} />
        <Route path="/billing/entries" element={<ProjectBillingEntriesPage />} />
        {/* NEW: Report Routes */}
        <Route path="/reports/performance" element={<ProjectPerformanceReportPage />} />
        <Route path="/reports/time-logs" element={<TimeLogReportPage />} />
        <Route path="/reports/billing" element={<BillingReportPage />} />
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

  // NEW: Project Categories for tab navigation
  const projectCategories = [
    {
      id: 'overview',
      name: 'Overview',
      icon: LayoutGrid,
      modules: [
        { name: 'Total Projects', value: projectStats.totalProjects, icon: ClipboardCheck, path: '/project/list', filter: { title: 'All Projects' } },
        { name: 'Not Started', value: projectStats.projectsNotStarted, icon: Clock, path: '/project/list', filter: { status: 'not_started', title: 'Not Started Projects' } },
        { name: 'Ongoing', value: projectStats.projectsInProgress, icon: Clock, path: '/project/list', filter: { status: 'in_progress', title: 'Ongoing Projects' } },
        { name: 'Completed', value: projectStats.projectsCompleted, icon: CheckCircle, path: '/project/list', filter: { status: 'completed', title: 'Completed Projects' } },
        { name: 'Upcoming Due', value: projectStats.upcomingDue, icon: Calendar, path: '/project/list', filter: { upcoming_due: 'true', title: 'Upcoming Due Projects' } },
        { name: 'Overdue', value: projectStats.overdue, icon: AlertTriangle, path: '/project/list', filter: { overdue: 'true', title: 'Overdue Projects' } },
        { name: 'Fixed Price Value', value: `₹${projectStats.totalFixedPriceValue.toLocaleString()}`, icon: DollarSign, path: '/project/list', filter: { billingType: 'fixed_price', title: 'Fixed Price Projects' } },
        { name: 'Time Based Value', value: `₹${projectStats.totalTimeBasedValue.toLocaleString()}`, icon: Clock, path: '/project/list', filter: { billingType: 'time_based', title: 'Time Based Projects' } },
        { name: 'Total Billed', value: `₹${projectStats.totalBilledAmount.toLocaleString()}`, icon: DollarSign, path: '/project/list', filter: { billing_status: 'billed', title: 'Billed Projects' } },
        { name: 'Billable Tasks', value: projectStats.totalBillableTasks, icon: ClipboardCheck, path: '/project/list', filter: { is_billable: 'true', title: 'Billable Tasks' } },
        { name: 'Time Logged Cost', value: `₹${projectStats.totalTimeLoggedCost.toLocaleString()}`, icon: Clock, path: '/project/reports/time-logs', filter: { title: 'Time Logged Cost Report' } },
        { name: 'Recurring Projects', value: projectStats.recurringJobs, icon: Zap, path: '/project/list', filter: { isRecurring: 'true', title: 'Recurring Projects' } },
        { name: 'One-Time Projects', value: projectStats.nonRecurring, icon: Calendar, path: '/project/list', filter: { isRecurring: 'false', title: 'One-Time Projects' } },
      ]
    },
    {
      id: 'masters',
      name: 'Masters',
      icon: Settings,
      modules: [
        { name: 'Project List', description: 'Manage all your projects.', icon: ClipboardCheck, path: '/project/list', count: projectStats.totalProjects },
        { name: 'Project Categories', description: 'Define and manage project types.', icon: Layers, path: '/project/categories', count: projectStats.categoryWise },
        { name: 'Tasks', description: 'Manage all tasks across projects.', icon: FileText, path: '/project/tasks-list', count: projectStats.totalTasks },
        { name: 'Milestones', description: 'Track key project milestones.', icon: Flag, path: '/project/milestones', count: projectStats.totalMilestones },
        { name: 'Team Members', description: 'Manage project team members.', icon: Users, path: '/project/team-members', count: projectStats.totalTeamMembers },
        { name: 'Documents', description: 'Manage project documents.', icon: FileText, path: '/project/documents', count: projectStats.totalDocuments },
      ]
    },
    {
      id: 'reports',
      name: 'Reports',
      icon: BookOpen,
      modules: [
        { name: 'Project Performance', description: 'Analyze project health and progress.', icon: BarChart3, path: '/project/reports/performance' },
        { name: 'Time Log Reports', description: 'Summarize time spent on projects/tasks.', icon: Clock, path: '/project/reports/time-logs' },
        { name: 'Billing Reports', description: 'Review project billing and revenue.', icon: DollarSign, path: '/project/reports/billing' },
      ]
    },
    {
      id: 'billing',
      name: 'Billing',
      icon: Scale,
      modules: [
        { name: 'Project Billing Entries', description: 'Record project-specific billing.', icon: FileText, path: '/project/billing/entries' },
        { name: 'Generate Invoices', description: 'Create invoices from projects/tasks.', icon: FileText, path: '/sales/invoices/create' }, // Links to Sales Invoice creation
        { name: 'View Invoices', description: 'View all project-related invoices.', icon: FileText, path: '/sales/invoices' }, // Links to Sales Invoices list
      ]
    }
  ];

  const getActiveTabBorderColor = (tabId: string) => {
    switch (tabId) {
      case 'overview': return 'border-pink-500';
      case 'masters': return 'border-purple-500';
      case 'reports': return 'border-blue-500';
      case 'billing': return 'border-emerald-500';
      default: return theme.borderColor;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-transparent bg-clip-clip drop-shadow-lg`}>
            Project Management
          </h1>
          <p className={theme.textSecondary}>
            Plan, track, and manage all your business projects
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="AI Search: 'Overdue projects', 'Tasks for John'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && console.log('AI Search:', searchTerm)}
              className={`
                w-full pl-10 pr-14 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                placeholder:text-gray-400
              `}
            />
            <button
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`
                absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors
                ${
                  isVoiceActive
                    ? 'text-red-500 animate-pulse'
                    : `text-gray-400 hover:text-[${theme.hoverAccent}]`
                }
              `}
            >
              <Mic size={16} />
            </button>
          </div>
          <Button onClick={() => console.log('AI Search:', searchTerm)}>Search</Button>
          <Button
            variant="outline"
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            onClick={() => fetchProjectData(currentCompany?.id || '', currentPeriod?.startDate || '', currentPeriod?.endDate || '')}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {aiInsights.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 border-l-4 border-l-[${theme.hoverAccent}]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot size={24} className="mr-2 text-[${theme.hoverAccent}]" />
              <div>
                <h3 className="font-semibold text-gray-900">AI Project Insights</h3>
                <p className="text-sm text-gray-600">
                  {aiInsights.length} new insights available based on your data
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline">View All Insights</Button>
          </div>
        </Card>
      )}

      {/* NEW: Tab Navigation */}
      <div className="flex flex-wrap justify-center md:justify-start gap-2">
        {projectCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveProjectTab(category.id)}
            className={`
              flex-1 px-6 py-3 text-sm font-semibold transition-all duration-300 ease-in-out
              ${
                activeProjectTab === category.id
                  ? `bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg transform scale-105 border border-pink-700 rounded-t-lg rounded-b-none`
                  : `bg-gray-100 text-gray-700 hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300 hover:shadow-md border border-gray-200 rounded-lg`
              }
            `}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* NEW: Tab Content */}
      {projectCategories.map((category) => (
        <div
          key={category.id}
          className={`${activeProjectTab === category.id ? 'block' : 'hidden'}`}
        >
          <Card
            className={`
            p-6 space-y-4 rounded-t-none rounded-b-lg
            border-t-4 ${getActiveTabBorderColor(category.id)}
            bg-white shadow-lg
          `}
          >
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
              {category.name}
            </h2>
            <p className={theme.textSecondary}>Explore {category.name.toLowerCase()} modules.</p>

            {category.id === 'overview' && (
              <>
                {/* Project Summary Section */}
                <Card className="p-6 mb-6">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Project Summary</h3>
                  <p className={theme.textSecondary}>Key metrics for your projects.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-4">
                    {/* Total Projects */}
                    <Link to="/project/list" state={{ pageTitle: "All Projects" }} className="flex">
                      <ProjectMetricsCard
                        title="Total Projects"
                        value={projectStats.totalProjects}
                        description="All projects"
                        icon={ClipboardCheck}
                        colorClass="bg-blue-500"
                      />
                    </Link>
                    {/* Not Started */}
                    <Link to="/project/list?status=not_started" state={{ pageTitle: "Not Started Projects" }} className="flex">
                      <ProjectMetricsCard
                        title="Not Started"
                        value={projectStats.projectsNotStarted}
                        description="Projects not yet started"
                        icon={Clock}
                        colorClass="bg-gray-500"
                      />
                    </Link>
                    {/* Ongoing */}
                    <Link to="/project/list?status=in_progress" state={{ pageTitle: "Ongoing Projects" }} className="flex">
                      <ProjectMetricsCard
                        title="Ongoing"
                        value={projectStats.projectsInProgress}
                        description="Projects in progress"
                        icon={Clock}
                        colorClass="bg-blue-500"
                      />
                    </Link>
                    {/* Completed */}
                    <Link to="/project/list?status=completed" state={{ pageTitle: "Completed Projects" }} className="flex">
                      <ProjectMetricsCard
                        title="Completed"
                        value={projectStats.projectsCompleted}
                        description="Projects marked as done"
                        icon={CheckCircle}
                        colorClass="bg-green-500"
                      />
                    </Link>
                    {/* Upcoming Due */}
                    <Link to="/project/list?upcoming_due=true" state={{ pageTitle: "Upcoming Due Projects" }} className="flex">
                      <ProjectMetricsCard
                        title="Upcoming Due"
                        value={projectStats.upcomingDue}
                        description="Projects due in 7 days"
                        icon={Calendar}
                        colorClass="bg-orange-500"
                      />
                    </Link>
                    {/* Overdue */}
                    <Link to="/project/list?overdue=true" state={{ pageTitle: "Overdue Projects" }} className="flex">
                      <ProjectMetricsCard
                        title="Overdue"
                        value={projectStats.overdue}
                        description="Projects past due date"
                        icon={AlertTriangle}
                        colorClass="bg-red-500"
                      />
                    </Link>
                    {/* Fixed Price Value */}
                    <Link to="/project/list?billingType=fixed_price" state={{ pageTitle: "Fixed Price Projects" }} className="flex">
                      <ProjectMetricsCard
                        title="Fixed Price Value"
                        value={`₹${projectStats.totalFixedPriceValue.toLocaleString()}`}
                        description="Total fixed price projects"
                        icon={DollarSign}
                        colorClass="bg-purple-500"
                      />
                    </Link>
                    {/* Time Based Value */}
                    <Link to="/project/list?billingType=time_based" state={{ pageTitle: "Time Based Projects" }} className="flex">
                      <ProjectMetricsCard
                        title="Time Based Value"
                        value={`₹${projectStats.totalTimeBasedValue.toLocaleString()}`}
                        description="Total time based projects"
                        icon={Clock}
                        colorClass="bg-teal-500"
                      />
                    </Link>
                    {/* Total Billed */}
                    <Link to="/project/list?billing_status=billed" state={{ pageTitle: "Billed Projects" }} className="flex">
                      <ProjectMetricsCard
                        title="Total Billed"
                        value={`₹${projectStats.totalBilledAmount.toLocaleString()}`}
                        description="Amount billed across projects"
                        icon={DollarSign}
                        colorClass="bg-emerald-500"
                      />
                    </Link>
                    {/* Billable Tasks */}
                    <Link to="/project/list?is_billable=true" state={{ pageTitle: "Billable Tasks" }} className="flex">
                      <ProjectMetricsCard
                        title="Billable Tasks"
                        value={projectStats.totalBillableTasks}
                        description="Total billable tasks"
                        icon={ClipboardCheck}
                        colorClass="bg-indigo-500"
                      />
                    </Link>
                    {/* Time Logged Cost */}
                    <Link to="/project/reports/time-logs" state={{ pageTitle: "Time Logged Cost Report" }} className="flex">
                      <ProjectMetricsCard
                        title="Time Logged Cost"
                        value={`₹${projectStats.totalTimeLoggedCost.toLocaleString()}`}
                        description="Cost of time logged"
                        icon={Clock}
                        colorClass="bg-cyan-500"
                      />
                    </Link>
                    {/* Recurring Projects */}
                    <Link to="/project/list?isRecurring=true" state={{ pageTitle: "Recurring Projects" }} className="flex">
                      <ProjectMetricsCard
                        title="Recurring Projects"
                        value={projectStats.recurringJobs}
                        description="Ongoing recurring projects"
                        icon={Zap}
                        colorClass="bg-pink-500"
                      />
                    </Link>
                    {/* One-Time Projects */}
                    <Link to="/project/list?isRecurring=false" state={{ pageTitle: "One-Time Projects" }} className="flex">
                      <ProjectMetricsCard
                        title="One-Time Projects"
                        value={projectStats.nonRecurring}
                        description="Non-recurring projects"
                        icon={Calendar}
                        colorClass="bg-yellow-500"
                      />
                    </Link>
                  </div>
                </Card>

                {/* Project Health & Progress Section */}
                <Card className="p-6 mb-6">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Project Health & Progress</h3>
                  <p className={theme.textSecondary}>Visual insights into project completion and milestone status.</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    <ProjectProgressChart completedPercentage={projectStats.totalProjects > 0 ? (projectStats.projectsCompleted / projectStats.totalProjects * 100) : 0} />
                    <MilestoneStatusChart data={milestoneStatusData} />
                  </div>
                </Card>

                {/* Resource & Financial Insights Section */}
                <Card className="p-6 mb-6">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Resource & Financial Insights</h3>
                  <p className={theme.textSecondary}>Detailed breakdown of time logging and billing status.</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    <TimeLoggedByEmployeeChart data={timeTrackingTodayData} />
                    <BillingStatusChart data={billingStatusData} />
                  </div>
                </Card>

                {/* Visual Project Pipeline */}
                <Card className="p-6 mb-6">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Project Pipeline</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {projectKanbanStatuses.map((statusCol, colIndex) => {
                      const colors = moduleColors[colIndex % moduleColors.length];
                      return (
                        <div key={statusCol.id} className={`flex-shrink-0 p-4 rounded-lg shadow-sm ${colors.cardBg}`}>
                          <h4 className={`font-semibold text-lg mb-3 flex items-center ${colors.textColor}`}>
                            <span className={`w-3 h-3 rounded-full mr-2 ${colors.iconBg.replace('bg-', 'bg-')}`} />
                            {statusCol.name} ({kanbanProjects[statusCol.id]?.length || 0})
                          </h4>
                          <div className="space-y-3 min-h-[100px]">
                            {kanbanProjects[statusCol.id]?.slice(0, 5).map(project => (
                              <Card key={project.id} className="p-3" hover>
                                <Link to={`/project/${project.id}/details`}>
                                  <p className="font-medium text-gray-900">{project.project_name}</p>
                                  <p className="text-sm text-gray-600">{project.customers?.name || 'N/A'}</p>
                                  <p className="text-xs text-gray-500">{project.project_categories?.name || 'N/A'}</p>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                    <div className={`${getProgressBarColor(project.progress_percentage || 0)} h-2.5 rounded-full`} style={{ width: `${project.progress_percentage || 0}%` }}></div>
                                  </div>
                                  <span className="text-xs text-gray-500 mt-1 block">{project.progress_percentage || 0}% Complete</span>
                                  {project.actual_due_date && (
                                    <p className="text-xs text-gray-500 mt-1">Due: {project.actual_due_date} ({calculateDaysLeft(project.actual_due_date)})</p>
                                  )}
                                </Link>
                              </Card>
                            ))}
                            {kanbanProjects[statusCol.id] && kanbanProjects[statusCol.id].length === 0 && (
                              <div className="text-center text-gray-400 text-sm py-8">No projects</div>
                            )}
                            {kanbanProjects[statusCol.id] && kanbanProjects[statusCol.id].length > 5 && (
                              <Link to={`/project/list?status=${statusCol.id}`} className="block text-center text-sm text-blue-600 hover:underline mt-2">
                                View All ({kanbanProjects[statusCol.id].length})
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Quick Panels Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  {/* Upcoming Recurring Jobs */}
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
                                {job.customers?.name || 'N/A'} • Due: {job.actual_due_date} ({job.project_categories?.recurrence_frequency})
                              </p>
                            </div>
                            <Link to={`/project/${job.id}/details`}>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  {/* AI Project Insights for Recurring Jobs */}
                  <Card className="p-6">
                    <h3
                      className={`text-lg font-semibold ${theme.textPrimary} flex items-center mb-4`}
                    >
                      <Bot size={20} className="mr-2 text-[${theme.hoverAccent}]" />
                      AI Project Insights
                      <div className="ml-2 w-2 h-2 bg-[${theme.hoverAccent}] rounded-full animate-pulse" />
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        currentCompany?.id && generateAIInsights(currentCompany.id)
                      }
                      icon={
                        <RefreshCw
                          size={16}
                          className={refreshingInsights ? 'animate-spin' : ''}
                        />
                      }
                    >
                      {refreshingInsights ? 'Refreshing...' : 'Refresh Insights'}
                    </Button>
                    <div className="space-y-4 mt-4">
                      {aiInsights.length > 0 ? (
                        aiInsights.map((insight, index) => (
                          <div
                            key={index}
                            className={`
                              p-3 rounded-2xl border-l-4
                              ${getImpactColor(insight.impact)}
                            `}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                {getInsightIcon(insight.type)}
                                <h4 className={`font-medium ${theme.textPrimary} text-sm`}>
                                  {insight.title}
                                </h4>
                              </div>
                              <span
                                className={`
                                  px-2 py-1 text-xs rounded-full ${getConfidenceColor(insight.confidence)}
                                `}
                              >
                                {insight.confidence}
                              </span>
                            </div>
                            <p className={`text-sm ${theme.textMuted} mb-3`}>{insight.message}</p>
                            {insight.actionable && (
                              <button className="text-xs text-sky-600 hover:text-sky-800 font-medium">
                                {insight.action || 'View Details'} →
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No AI insights available. Click "Refresh Insights" to generate.
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </>
            )}

            {category.id === 'masters' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.modules.map((module, moduleIndex) => {
                    const Icon = module.icon;
                    const colors = moduleColors[moduleIndex % moduleColors.length];
                    return (
                      <Link key={module.name} to={module.path} className="flex">
                        <Card
                          hover
                          className={`
                            p-4 cursor-pointer group relative overflow-hidden flex-1 flex flex-col justify-between
                            ${colors.cardBg}
                            transform transition-all duration-300 ease-in-out
                            hover:translate-y-[-6px] hover:shadow-2xl hover:ring-2 hover:ring-[${theme.hoverAccent}] hover:ring-opacity-75
                          `}
                        >
                          <div className="relative z-10">
                            <h3
                              className={`text-xl font-bold ${colors.textColor} group-hover:text-[${theme.hoverAccent}] transition-colors`}
                            >
                              {module.name}
                            </h3>
                            <p className={`text-sm ${theme.textMuted}`}>
                              {module.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-3 relative z-10">
                            <p className={`text-xl font-bold ${colors.textColor}`}>
                              {loading ? '...' : module.count}
                            </p>
                            <div
                              className={`
                                p-3 rounded-2xl shadow-md
                                ${colors.iconBg} text-white
                                group-hover:scale-125 transition-transform duration-300
                              `}
                            >
                              <Icon size={24} className="text-white" />
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
                {/* NEW: Masters Tab Charts - Different charts for this section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  <DocumentTypeDistributionChart data={documentTypeDistributionData} />
                  <MilestoneStatusChart data={milestoneStatusData} /> {/* Added Milestone Status Chart */}
                </div>
              </>
            )}

            {category.id === 'reports' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.modules.map((module, moduleIndex) => {
                    const Icon = module.icon;
                    const colors = moduleColors[moduleIndex % moduleColors.length];
                    return (
                      <Link key={module.name} to={module.path} className="flex">
                        <Card
                          hover
                          className={`
                            p-4 cursor-pointer group relative overflow-hidden flex-1 flex flex-col justify-between
                            ${colors.cardBg}
                            transform transition-all duration-300 ease-in-out
                            hover:translate-y-[-6px] hover:shadow-2xl hover:ring-2 hover:ring-[${theme.hoverAccent}] hover:ring-opacity-75
                          `}
                        >
                          <div className="relative z-10">
                            <h3
                              className={`text-xl font-bold ${colors.textColor} group-hover:text-[${theme.hoverAccent}] transition-colors`}
                            >
                              {module.name}
                            </h3>
                            <p className={`text-sm ${theme.textMuted}`}>
                              {module.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-3 relative z-10">
                            <div
                              className={`
                                p-3 rounded-2xl shadow-md
                                ${colors.iconBg} text-white
                                group-hover:scale-125 transition-transform duration-300
                              `}
                            >
                              <Icon size={24} className="text-white" />
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
                {/* NEW: Reports Tab Charts - Different charts for this section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  <ProjectProgressChart completedPercentage={projectStats.totalProjects > 0 ? (projectStats.projectsCompleted / projectStats.totalProjects * 100) : 0} />
                  <TimeLoggedByEmployeeChart data={timeTrackingTodayData} />
                </div>
              </>
            )}

            {category.id === 'billing' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.modules.map((module, moduleIndex) => {
                    const Icon = module.icon;
                    const colors = moduleColors[moduleIndex % moduleColors.length];
                    return (
                      <Link key={module.name} to={module.path} className="flex">
                        <Card
                          hover
                          className={`
                            p-4 cursor-pointer group relative overflow-hidden flex-1 flex flex-col justify-between
                            ${colors.cardBg}
                            transform transition-all duration-300 ease-in-out
                            hover:translate-y-[-6px] hover:shadow-2xl hover:ring-2 hover:ring-[${theme.hoverAccent}] hover:ring-opacity-75
                          `}
                        >
                          <div className="relative z-10">
                            <h3
                              className={`text-xl font-bold ${colors.textColor} group-hover:text-[${theme.hoverAccent}] transition-colors`}
                            >
                              {module.name}
                            </h3>
                            <p className={`text-sm ${theme.textMuted}`}>
                              {module.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-3 relative z-10">
                            <div
                              className={`
                                p-3 rounded-2xl shadow-md
                                ${colors.iconBg} text-white
                                group-hover:scale-125 transition-transform duration-300
                              `}
                            >
                              <Icon size={24} className="text-white" />
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
                {/* NEW: Billing Tab Charts - Different charts for this section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  <BillingStatusChart data={billingStatusData} />
                  <ProjectProgressChart completedPercentage={projectStats.totalProjects > 0 ? (projectStats.projectsCompleted / projectStats.totalProjects * 100) : 0} />
                </div>
              </>
            )}
          </Card>
        </div>
      ))}

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`
            w-14 h-14 rounded-full shadow-lg transition-all duration-300
            bg-gradient-to-r from-emerald-500 to-emerald-600 text-white
            hover:scale-110 hover:shadow-xl
          `}
          icon={<PlusSquare size={24} />}
        />
        {showFabMenu && (
          <div className="absolute bottom-16 right-0 space-y-2">
            <AIButton variant="suggest" onSuggest={() => console.log('AI Project Suggestions')} />
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
              icon={<Layers size={16} />}
              onClick={() => { navigate('/project/categories/new'); setShowFabMenu(false); }}
            >
              Add Category
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              icon={<Clock size={16} />}
              onClick={() => { showNotification('Add Time Log functionality is a placeholder.', 'info'); setShowFabMenu(false); }}
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
