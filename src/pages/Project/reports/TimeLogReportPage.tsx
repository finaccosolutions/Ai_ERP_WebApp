// src/pages/Project/reports/TimeLogReportPage.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, RefreshCw, Filter, Calendar, Users, DollarSign } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { useNotification } from '../../../contexts/NotificationContext';
import TimeLoggedByEmployeeChart from '../../../components/Project/TimeLoggedByEmployeeChart';

function TimeLogReportPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();

  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    employee: '',
    project: '',
  });

  // Placeholder for chart data
  const [timeLoggedByEmployeeChartData, setTimeLoggedByEmployeeChartData] = useState<any[]>([]);

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
        .from('time_logs')
        .select(`
          id, start_time, end_time, duration_minutes, notes,
          employees ( first_name, last_name ),
          tasks ( task_name, projects ( project_name ) )
        `);

      if (filters.startDate) {
        query = query.gte('start_time', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('end_time', filters.endDate);
      }
      if (filters.employee) {
        query = query.eq('employee_id', filters.employee);
      }
      if (filters.project) {
        query = query.eq('tasks.projects.id', filters.project);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReportData(data || []);

      // Calculate data for charts
      const employeeTime: { [key: string]: number } = {};
      data.forEach(log => {
        const employeeName = log.employees ? `${log.employees.first_name} ${log.employees.last_name}` : 'Unassigned';
        employeeTime[employeeName] = (employeeTime[employeeName] || 0) + (log.duration_minutes || 0);
      });
      setTimeLoggedByEmployeeChartData(Object.entries(employeeTime).map(([name, duration]) => ({ name, duration })));

    } catch (err: any) {
      showNotification(`Error fetching report data: ${err.message}`, 'error');
      console.error('Error fetching time log report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Time Log Report</h1>
          <p className={theme.textSecondary}>Summarize time spent on projects and tasks.</p>
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
          <FormField label="Employee" value={filters.employee} onChange={(val) => handleFilterChange('employee', val)} icon={<Users size={18} />} />
          <FormField label="Project" value={filters.project} onChange={(val) => handleFilterChange('project', val)} icon={<FileText size={18} />} />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={fetchReportData} icon={<Filter size={16} />}>Apply Filters</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeLoggedByEmployeeChart data={timeLoggedByEmployeeChartData} />
        {/* Add other relevant charts for Time Log Reports here, e.g., Time by Project */}
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Time Log Details</h3>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
          </div>
        ) : reportData.length === 0 ? (
          <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
            <p>No time log data found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration (Mins)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{new Date(log.start_time).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.employees?.first_name} {log.employees?.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.tasks?.projects?.project_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.tasks?.task_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.duration_minutes}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">{log.notes || 'N/A'}</td>
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

export default TimeLogReportPage;
