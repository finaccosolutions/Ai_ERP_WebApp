// src/pages/Project/ProjectSummaryPage.tsx
import React from 'react';
import {
  ClipboardCheck, Users, Calendar, DollarSign, Clock,
  TrendingUp, // For AI Insights
  AlertTriangle, // For AI Insights
  Lightbulb, // For AI Insights
  Bot, // For AI
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';
import ProjectMetricsCard from '../../components/Project/ProjectMetricsCard';
import ProjectProgressChart from '../../components/Project/ProjectProgressChart';
import MilestoneStatusChart from '../../components/Project/MilestoneStatusChart';
import TaskStatusChart from '../../components/Project/TaskStatusChart';

function ProjectSummaryPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();

  const [projectMetrics, setProjectMetrics] = React.useState({
    totalProjects: '0',
    projectsNotStarted: '0',
    projectsInProgress: '0',
    projectsCompleted: '0',
    totalTasks: '0',
    openTasks: '0',
    completedTasks: '0',
    totalTimeLoggedMinutes: '0',
    totalRecurringProjects: '0',
    totalOneTimeProjects: '0',
    totalFixedPriceValue: '0',
    totalTimeBasedValue: '0',
    totalBilledAmount: '0',
    totalBilledProjects: '0',
    totalPartiallyBilledProjects: '0',
    totalUnbilledProjects: '0',
    totalBillableTasks: '0',
    totalBilledTasksAmount: '0',
    totalTimeLoggedCost: '0',
  });
  const [loadingMetrics, setLoadingMetrics] = React.useState(true);
  const [projectStatusChartData, setProjectStatusChartData] = React.useState<any[]>([]);
  const [taskStatusChartData, setTaskStatusChartData] = React.useState<any[]>([]);
  const [milestoneStatusChartData, setMilestoneStatusChartData] = React.useState<any[]>([]);
  const [projectProgressChartData, setProjectProgressChartData] = React.useState(0);

  React.useEffect(() => {
    if (currentCompany?.id) {
      fetchProjectMetrics(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const fetchProjectMetrics = async (companyId: string) => {
    setLoadingMetrics(true);
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
        console.error('ProjectSummaryPage: Error fetching KPIs from materialized view:', kpisError);
        showNotification('Failed to load project metrics.', 'error');
        setProjectMetrics({
          totalProjects: '0', projectsNotStarted: '0', projectsInProgress: '0', projectsCompleted: '0',
          totalTasks: '0', openTasks: '0', completedTasks: '0', totalTimeLoggedMinutes: '0',
          totalRecurringProjects: '0', totalOneTimeProjects: '0', totalFixedPriceValue: '0',
          totalTimeBasedValue: '0', totalBilledAmount: '0', totalBilledProjects: '0',
          totalPartiallyBilledProjects: '0', totalUnbilledProjects: '0', totalBillableTasks: '0',
          totalBilledTasksAmount: '0', totalTimeLoggedCost: '0',
        });
      } else {
        setProjectMetrics({
          totalProjects: kpis?.total_projects?.toString() || '0',
          projectsNotStarted: kpis?.projects_not_started?.toString() || '0',
          projectsInProgress: kpis?.projects_in_progress?.toString() || '0',
          projectsCompleted: kpis?.projects_completed?.toString() || '0',
          totalTasks: kpis?.total_tasks?.toString() || '0',
          openTasks: kpis?.open_tasks?.toString() || '0',
          completedTasks: kpis?.completed_tasks?.toString() || '0',
          totalTimeLoggedMinutes: kpis?.total_time_logged_minutes?.toLocaleString() || '0',
          totalRecurringProjects: kpis?.total_recurring_projects?.toString() || '0',
          totalOneTimeProjects: kpis?.total_one_time_projects?.toString() || '0',
          totalFixedPriceValue: kpis?.total_fixed_price_value?.toLocaleString() || '0',
          totalTimeBasedValue: kpis?.total_time_based_value?.toLocaleString() || '0',
          totalBilledAmount: kpis?.total_billed_amount?.toLocaleString() || '0',
          totalBilledProjects: kpis?.total_billed_projects?.toString() || '0',
          totalPartiallyBilledProjects: kpis?.total_partially_billed_projects?.toString() || '0',
          totalUnbilledProjects: kpis?.total_unbilled_projects?.toString() || '0',
          totalBillableTasks: kpis?.total_billable_tasks?.toString() || '0',
          totalBilledTasksAmount: kpis?.total_billed_tasks_amount?.toLocaleString() || '0',
          totalTimeLoggedCost: kpis?.total_time_logged_cost?.toLocaleString() || '0',
        });

        // Populate chart data (mock/derived for now, ideally from more specific KPIs or direct queries)
        setProjectStatusChartData([
          { name: 'Not Started', count: kpis?.projects_not_started || 0 },
          { name: 'In Progress', count: kpis?.projects_in_progress || 0 },
          { name: 'Completed', count: kpis?.projects_completed || 0 },
        ]);

        setTaskStatusChartData([
          { name: 'Open', count: kpis?.open_tasks || 0 },
          { name: 'Completed', count: kpis?.completed_tasks || 0 },
        ]);

        // Mock milestone data for chart
        setMilestoneStatusChartData([
          { name: 'Planned', count: Math.floor((kpis?.total_projects || 0) * 0.6) },
          { name: 'Achieved', count: Math.floor((kpis?.total_projects || 0) * 0.3) },
          { name: 'Delayed', count: Math.floor((kpis?.total_projects || 0) * 0.1) },
        ]);

        setProjectProgressChartData(
          (kpis?.total_projects || 0) > 0
            ? ((kpis?.projects_completed || 0) / (kpis?.total_projects || 0)) * 100
            : 0
        );
      }
    } catch (error) {
      console.error('Error fetching project metrics:', error);
      showNotification('Failed to load project metrics.', 'error');
    } finally {
      setLoadingMetrics(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProjectMetricsCard
          title="Total Projects"
          value={projectMetrics.totalProjects}
          description="Overall projects managed"
          icon={ClipboardCheck}
          colorClass="bg-blue-500"
          path="/project/list"
        />
        <ProjectMetricsCard
          title="Projects In Progress"
          value={projectMetrics.projectsInProgress}
          description="Projects currently active"
          icon={ClipboardCheck}
          colorClass="bg-yellow-500"
          path="/project/list?status=in_progress"
        />
        <ProjectMetricsCard
          title="Projects Completed"
          value={projectMetrics.projectsCompleted}
          description="Projects successfully finished"
          icon={ClipboardCheck}
          colorClass="bg-green-500"
          path="/project/list?status=completed"
        />
        <ProjectMetricsCard
          title="Total Billed Amount"
          value={`₹${projectMetrics.totalBilledAmount}`}
          description="Total revenue from billed projects"
          icon={DollarSign}
          colorClass="bg-purple-500"
          path="/project/reports/billing"
        />
        <ProjectMetricsCard
          title="Total Tasks"
          value={projectMetrics.totalTasks}
          description="All tasks across projects"
          icon={ClipboardCheck}
          path="/project/tasks-list"
        />
        <ProjectMetricsCard
          title="Open Tasks"
          value={projectMetrics.openTasks}
          description="Tasks awaiting completion"
          icon={ClipboardCheck}
          colorClass="bg-red-500"
          path="/project/tasks-list?status=open"
        />
        <ProjectMetricsCard
          title="Total Time Logged"
          value={`${(parseFloat(projectMetrics.totalTimeLoggedMinutes) / 60).toFixed(1)} hrs`}
          description="Total hours spent on projects"
          icon={Clock}
          colorClass="bg-teal-500"
          path="/project/time-logs-list"
        />
        <ProjectMetricsCard
          title="Unbilled Projects Value"
          value={`₹${projectMetrics.totalUnbilledProjects}`}
          description="Value of projects not yet billed"
          icon={DollarSign}
          colorClass="bg-orange-500"
          path="/project/list?billingStatus=not_billed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskStatusChart data={taskStatusChartData} />
        <ProjectProgressChart completedPercentage={projectProgressChartData} />
        <MilestoneStatusChart data={milestoneStatusChartData} />
        {/* Add more charts here as needed */}
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Recent Project Activity</h3>
        <div className="space-y-3">
          {/* Placeholder for recent activity */}
          <div className="flex items-center justify-center h-32 text-gray-500">
            No recent project activity.
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ProjectSummaryPage;
