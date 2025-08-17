// src/pages/Project/reports/ProjectPerformanceReportPage.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, RefreshCw, Filter, Calendar, Users, DollarSign } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { useNotification } from '../../../contexts/NotificationContext';
import ProjectProgressChart from '../../../components/Project/ProjectProgressChart';
import MilestoneStatusChart from '../../../components/Project/MilestoneStatusChart';

function ProjectPerformanceReportPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();

  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    projectStatus: 'all',
    projectOwner: '',
  });

  // Placeholder for chart data
  const [projectProgressData, setProjectProgressData] = useState(0);
  const [milestoneStatusChartData, setMilestoneStatusChartData] = useState<any[]>([]);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchReportData();
    }
  }, [currentCompany?.id, filters]);

  const fetchReportData = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select(`
          id, project_name, status, progress_percentage, start_date, actual_due_date,
          project_owner:employees!projects_project_owner_id_fkey ( first_name, last_name )
        `)
        .eq('company_id', currentCompany.id);

      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('actual_due_date', filters.endDate);
      }
      if (filters.projectStatus !== 'all') {
        query = query.eq('status', filters.projectStatus);
      }
      if (filters.projectOwner) {
        query = query.eq('project_owner_id', filters.projectOwner);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReportData(data || []);

      // Calculate data for charts
      const totalProjects = data.length;
      const completedProjects = data.filter(p => p.status === 'completed').length;
      setProjectProgressData(totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0);

      const milestoneCounts: { [key: string]: number } = {};
      // This would ideally fetch actual milestone data, but for a placeholder, we can mock or simplify
      // For now, let's just show a basic distribution if no real data is available
      milestoneCounts['Planned'] = data.filter(p => p.status === 'not_started' || p.status === 'in_progress').length;
      milestoneCounts['Achieved'] = data.filter(p => p.status === 'completed').length;
      milestoneCounts['Delayed'] = data.filter(p => p.status === 'overdue').length;
      milestoneCounts['Cancelled'] = data.filter(p => p.status === 'closed').length; // Using closed as cancelled for simplicity

      setMilestoneStatusChartData(Object.entries(milestoneCounts).map(([name, count]) => ({ name, count })));

    } catch (err: any) {
      showNotification(`Error fetching report data: ${err.message}`, 'error');
      console.error('Error fetching project performance report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const projectStatuses = [
    { id: 'all', name: 'All Statuses' },
    { id: 'not_started', name: 'Not Started' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'completed', name: 'Completed' },
    { id: 'overdue', name: 'Overdue' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Project Performance Report</h1>
          <p className={theme.textSecondary}>Analyze the performance and health of your projects.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/project')} icon={<ArrowLeft size={16} />}>
            Back to Project Dashboard
          </Button>
          <Button onClick={fetchReportData} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh Report'}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Start Date" type="date" value={filters.startDate} onChange={(val) => handleFilterChange('startDate', val)} icon={<Calendar size={18} />} />
          <FormField label="End Date" type="date" value={filters.endDate} onChange={(val) => handleFilterChange('endDate', val)} icon={<Calendar size={18} />} />
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${theme.textPrimary}`}>Project Status</label>
            <select
              value={filters.projectStatus}
              onChange={(e) => handleFilterChange('projectStatus', e.target.value)}
              className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
            >
              {projectStatuses.map(status => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>
          {/* Add filter for Project Owner if needed */}
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={fetchReportData} icon={<Filter size={16} />}>Apply Filters</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectProgressChart completedPercentage={projectProgressData} />
        <MilestoneStatusChart data={milestoneStatusChartData} />
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Project Details</h3>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
          </div>
        ) : reportData.length === 0 ? (
          <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
            <p>No project data found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.project_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.status.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.progress_percentage || 0}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.start_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.actual_due_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/project/${project.id}/details`)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ProjectPerformanceReportPage;