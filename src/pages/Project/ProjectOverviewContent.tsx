// src/pages/Project/ProjectOverviewContent.tsx
import React from 'react';
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
import { useTheme } from '../../contexts/ThemeContext';
import { Link } from 'react-router-dom';

// NEW: Import Project-specific components
import ProjectMetricsCard from '../../components/Project/ProjectMetricsCard';
import ProjectProgressChart from '../../components/Project/ProjectProgressChart';
import MilestoneStatusChart from '../../components/Project/MilestoneStatusChart';
import TimeLoggedByEmployeeChart from '../../components/Project/TimeLoggedByEmployeeChart';
import DocumentTypeDistributionChart from '../../components/Project/DocumentTypeDistributionChart';
import BillingStatusChart from '../../components/Project/BillingStatusChart';

interface ProjectOverviewContentProps {
  projectStats: {
    totalProjects: number;
    inProgress: number;
    completed: number;
    overdue: number;
    recurringJobs: number;
    upcomingDue: number;
    customerWise: number;
    categoryWise: number;
    nonRecurring: number;
    totalFixedPriceValue: number;
    totalTimeBasedValue: number;
    totalBilledAmount: number;
    totalBillableTasks: number;
    totalBilledTasksAmount: number;
    totalTimeLoggedCost: number;
    totalTasks: number;
    totalMilestones: number;
    totalTeamMembers: number;
    totalDocuments: number;
  };
  loading: boolean;
  aiInsights: any[];
  refreshingInsights: boolean;
  onRefreshInsights: () => void; // Added as a prop
  kanbanProjects: Record<string, any[]>;
  upcomingRecurringJobs: any[];
  projectsByTypeData: any[];
  timeTrackingTodayData: any[];
  milestoneStatusData: any[];
  billingStatusData: any[];
  documentTypeDistributionData: any[];
  isAIEnabled: boolean;
}

function ProjectOverviewContent({
  projectStats,
  loading,
  aiInsights,
  refreshingInsights,
  onRefreshInsights, // Destructure the prop
  kanbanProjects,
  upcomingRecurringJobs,
  projectsByTypeData,
  timeTrackingTodayData,
  milestoneStatusData,
  billingStatusData,
  documentTypeDistributionData,
  isAIEnabled,
}: ProjectOverviewContentProps) {
  const { theme } = useTheme();

  const projectKanbanStatuses = [
    { id: 'not_started', name: 'Not Started' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'waiting_for_client', name: 'Waiting for Client' },
    { id: 'completed', name: 'Completed' },
    { id: 'billed', name: 'Billed' },
    { id: 'closed', name: 'Closed' },
  ];

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

  return (
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
              value={projectStats.inProgress} // Assuming inProgress includes not_started for this metric
              description="Projects not yet started"
              icon={Clock}
              colorClass="bg-gray-500"
            />
          </Link>
          {/* Ongoing */}
          <Link to="/project/list?status=in_progress" state={{ pageTitle: "Ongoing Projects" }} className="flex">
            <ProjectMetricsCard
              title="Ongoing"
              value={projectStats.inProgress}
              description="Projects in progress"
              icon={Clock}
              colorClass="bg-blue-500"
            />
          </Link>
          {/* Completed */}
          <Link to="/project/list?status=completed" state={{ pageTitle: "Completed Projects" }} className="flex">
            <ProjectMetricsCard
              title="Completed"
              value={projectStats.completed}
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
          <ProjectProgressChart completedPercentage={projectStats.totalProjects > 0 ? (projectStats.completed / projectStats.totalProjects * 100) : 0} />
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
            const colors = [
              { cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100', textColor: 'text-blue-800', iconBg: 'bg-blue-500' },
              { cardBg: 'bg-gradient-to-br from-green-50 to-green-100', textColor: 'text-green-800', iconBg: 'bg-green-500' },
              { cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100', textColor: 'text-purple-800', iconBg: 'bg-purple-500' },
              { cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100', textColor: 'text-orange-800', iconBg: 'bg-orange-500' },
              { cardBg: 'bg-gradient-to-br from-teal-50 to-teal-100', textColor: 'text-teal-800', iconBg: 'bg-teal-500' },
              { cardBg: 'bg-gradient-to-br from-pink-50 to-pink-100', textColor: 'text-pink-800', iconBg: 'bg-pink-500' },
            ]; // Re-define colors locally or pass from parent if needed

            return (
              <div key={statusCol.id} className={`flex-shrink-0 p-4 rounded-lg shadow-sm ${colors[colIndex % colors.length].cardBg}`}>
                <h4 className={`font-semibold text-lg mb-3 flex items-center ${colors[colIndex % colors.length].textColor}`}>
                  <span className={`w-3 h-3 rounded-full mr-2 ${colors[colIndex % colors.length].iconBg.replace('bg-', 'bg-')}`} />
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
            onClick={onRefreshInsights}
            disabled={refreshingInsights}
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
  );
}

export default ProjectOverviewContent;
