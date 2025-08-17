// src/pages/Project/reports/BillingReportPage.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, RefreshCw, Filter, Calendar, Users, FileText } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { useNotification } from '../../../contexts/NotificationContext';
import BillingStatusChart from '../../../components/Project/BillingStatusChart';
import ProjectProgressChart from '../../../components/Project/ProjectProgressChart';

function BillingReportPage() {
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
    billingStatus: 'all',
  });

  // Placeholder for chart data
  const [billingStatusChartData, setBillingStatusChartData] = useState<any[]>([]);
  const [projectProgressChartData, setProjectProgressChartData] = useState(0);

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
          id, project_name, expected_value, total_billed_amount, billing_status,
          start_date, actual_due_date, status, progress_percentage
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
      if (filters.billingStatus !== 'all') {
        query = query.eq('billing_status', filters.billingStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReportData(data || []);

      // Calculate data for charts
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
          billingStatusTotals['not_billed'] += project.expected_value || 0;
        }
      });
      setBillingStatusChartData(Object.entries(billingStatusTotals).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })));

      const totalProjects = data.length;
      const completedProjects = data.filter(p => p.status === 'completed').length;
      setProjectProgressChartData(totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0);

    } catch (err: any) {
      showNotification(`Error fetching report data: ${err.message}`, 'error');
      console.error('Error fetching billing report:', err);
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
    { id: 'billed', name: 'Billed' },
    { id: 'closed', name: 'Closed' },
  ];

  const billingStatuses = [
    { id: 'all', name: 'All Billing Statuses' },
    { id: 'not_billed', name: 'Not Billed' },
    { id: 'partially_billed', name: 'Partially Billed' },
    { id: 'billed', name: 'Billed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Project Billing Report</h1>
          <p className={theme.textSecondary}>Review project billing status and financial performance.</p>
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
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${theme.textPrimary}`}>Billing Status</label>
            <select
              value={filters.billingStatus}
              onChange={(e) => handleFilterChange('billingStatus', e.target.value)}
              className={`w-full px-3 py-2 border ${theme.inputBorder} rounded-lg ${theme.inputBg} ${theme.textPrimary} focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent`}
            >
              {billingStatuses.map(status => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={fetchReportData} icon={<Filter size={16} />}>Apply Filters</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BillingStatusChart data={billingStatusChartData} />
        <ProjectProgressChart completedPercentage={projectProgressChartData} />
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Billing Details</h3>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
          </div>
        ) : reportData.length === 0 ? (
          <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
            <p>No billing data found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billed Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.project_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{project.expected_value?.toLocaleString() || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{project.total_billed_amount?.toLocaleString() || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.billing_status.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.status.replace(/_/g, ' ')}</td>
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

export default BillingReportPage;