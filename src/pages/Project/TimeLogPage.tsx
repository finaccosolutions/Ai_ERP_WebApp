// src/pages/Project/TimeLogPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Clock,
  Edit,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Filter,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle, // NEW: Import XCircle
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
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import TimeLogFilterModal from '../../components/Modals/TimeLogFilterModal';

import ProjectMetricsCard from '../../components/Project/ProjectMetricsCard';
import TimeLoggedByEmployeeChart from '../../components/Project/TimeLoggedByEmployeeChart';


interface TimeLog {
  id: string;
  task_id: string;
  employee_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  employees?: { first_name: string; last_name: string; hourly_rate: number | null } | null;
  tasks?: { task_name: string } | null;
}

interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
}

interface TaskOption {
  id: string;
  task_name: string;
}

function TimeLogPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const location = useLocation(); // Use useLocation to get state

  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalTimeLogsCount, setTotalTimeLogsCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [timeLogToDeleteId, setTimeLogToDeleteId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [formData, setFormData] = useState({
    id: '',
    employeeId: '',
    employeeName: '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: '',
    durationMinutes: 0,
    notes: '',
  });

  const [availableEmployees, setAvailableEmployees] = useState<EmployeeOption[]>(
    []
  );
  const [taskDetails, setTaskDetails] = useState<any>(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    employee: '',
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10');

  const [timeLogMetrics, setTimeLogMetrics] = useState({ totalMinutes: 0, billableMinutes: 0, nonBillableMinutes: 0, employeeTimeDistribution: [] });

  // NEW: State for dynamic page title
  const [pageTitle, setPageTitle] = useState("Time Logs");


  const isEditMode = !!formData.id;

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      await fetchTaskDetails(taskId as string);
      await fetchEmployees(currentCompany?.id as string);
      if (viewMode === 'list') {
        await fetchTimeLogs(taskId as string);
      }
      setLoading(false);
    };

    if (currentCompany?.id) {
      initializePage();
    }

    // Set dynamic page title from Link state or default
    if (location.state?.pageTitle) {
      setPageTitle(location.state.pageTitle);
    } else {
      setPageTitle("Time Logs"); // Default title
    }
  }, [currentCompany?.id, taskId, viewMode, filterCriteria, numResultsToShow, location.state]);

  const fetchTaskDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('task_name')
        .eq('id', id)
        .eq('project_id', projectId)
        .single();
      if (error) throw error;
      setTaskDetails(data);
    } catch (err: any) {
      showNotification(`Error fetching task details: ${err.message}`, 'error');
      console.error('Error fetching task details:', err);
      navigate(`/project/${projectId}/tasks`);
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
      setAvailableEmployees(
        employeesData.map((emp) => ({
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          first_name: emp.first_name,
          last_name: emp.last_name,
        })) || []
      );
    } catch (error) {
      console.error('Error fetching employees:', error);
      showNotification('Failed to load employees.', 'error');
    }
  };

  const fetchTimeLogs = async (id: string) => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('time_logs')
        .select(
          `
          id, task_id, employee_id, start_time, end_time, duration_minutes, notes, created_at,
          employees ( first_name, last_name, hourly_rate )
        `,
          { count: 'exact' }
        )
        .eq('task_id', id);

      if (searchTerm) {
        query = query.ilike('notes', `%${searchTerm}%`);
      }

      if (filterCriteria.employee && filterCriteria.employee !== 'all') {
        query = query.eq('employee_id', filterCriteria.employee);
      }
      if (filterCriteria.startDate) {
        query = query.gte('start_time', filterCriteria.startDate);
      }
      if (filterCriteria.endDate) {
        query = query.lte('end_time', filterCriteria.endDate);
      }
      if (filterCriteria.notes) {
        query = query.ilike('notes', `%${filterCriteria.notes}%`);
      }

      query = query.order('start_time', { ascending: false });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setTimeLogs(data || []);
      setTotalTimeLogsCount(count || 0);

      const totalMinutes = data?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;
      const billableMinutes = totalMinutes; // Placeholder
      const nonBillableMinutes = 0; // Placeholder
      setTimeLogMetrics({ totalMinutes, billableMinutes, nonBillableMinutes });

      const employeeTime: { [key: string]: number } = {};
      data?.forEach(log => {
        const employeeName = log.employees ? `${log.employees.first_name} ${log.employees.last_name}` : 'Unassigned';
        employeeTime[employeeName] = (employeeTime[employeeName] || 0) + (log.duration_minutes || 0);
      });
      setTimeLogMetrics(prev => ({ ...prev, employeeTimeDistribution: Object.entries(employeeTime).map(([name, duration]) => ({ name, duration })) }));


    } catch (err: any) {
      showNotification(`Error fetching time logs: ${err.message}`, 'error');
      console.error('Error fetching time logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'startTime' || field === 'endTime') {
      calculateDuration(
        field === 'startTime' ? value : formData.startTime,
        field === 'endTime' ? value : formData.endTime
      );
    }
  };

  const calculateDuration = (start: string, end: string) => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      setFormData((prev) => ({ ...prev, durationMinutes: diffMinutes > 0 ? diffMinutes : 0 }));
    } else {
      setFormData((prev) => ({ ...prev, durationMinutes: 0 }));
    }
  };

  const handleEmployeeSelect = (id: string, name: string) => {
    setFormData((prev) => ({ ...prev, employeeId: id, employeeName: name }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      employeeId: '',
      employeeName: '',
      startTime: new Date().toISOString().slice(0, 16),
      endTime: '',
      durationMinutes: 0,
      notes: '',
    });
  };

  const validateForm = () => {
    if (!formData.employeeId) {
      showNotification('Employee is required.', 'error');
      return false;
    }
    if (!formData.startTime) {
      showNotification('Start Time is required.', 'error');
      return false;
    }
    if (!formData.endTime) {
      showNotification('End Time is required.', 'error');
      return false;
    }
    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      showNotification('End Time must be after Start Time.', 'error');
      return false;
    }
    if (formData.durationMinutes <= 0) {
      showNotification('Duration must be greater than 0.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!taskId) {
      showNotification('Task ID is missing.', 'error');
      return;
    }

    setLoading(true);
    try {
      const timeLogToSave = {
        task_id: taskId,
        employee_id: formData.employeeId,
        start_time: formData.startTime,
        end_time: formData.endTime,
        duration_minutes: formData.durationMinutes,
        notes: formData.notes || null,
      };

      if (formData.id) {
        const { error } = await supabase
          .from('time_logs')
          .update(timeLogToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Time log updated successfully!', 'success');
      } else {
        const { data, error } = await supabase
          .from('time_logs')
          .insert(timeLogToSave);
        if (error) throw error;
        showNotification('Time log created successfully!', 'success');
      }
      setViewMode('list');
      resetForm();
      fetchTimeLogs(taskId as string);
    } catch (err: any) {
      showNotification(`Failed to save time log: ${err.message}`, 'error');
      console.error('Save time log error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTimeLog = async (log: TimeLog) => {
    setFormData({
      id: log.id,
      employeeId: log.employee_id || '',
      employeeName: log.employees
        ? `${log.employees.first_name} ${log.employees.last_name}`
        : '',
      startTime: log.start_time.slice(0, 16),
      endTime: log.end_time?.slice(0, 16) || '',
      durationMinutes: log.duration_minutes || 0,
      notes: log.notes || '',
    });
    setViewMode('create');
  };

  const handleDeleteTimeLog = (logId: string) => {
    setTimeLogToDeleteId(logId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTimeLog = async () => {
    if (!timeLogToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('time_logs')
        .delete()
        .eq('id', timeLogToDeleteId);

      if (error) throw error;
      showNotification('Time log deleted successfully!', 'success');
      fetchTimeLogs(taskId as string);
    } catch (err: any) {
      showNotification(`Error deleting time log: ${err.message}`, 'error');
      console.error('Error deleting time log:', err);
    } finally {
      setLoading(false);
      setTimeLogToDeleteId(null);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    setShowFilterModal(false);
  };

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalTimeLogsCount})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {pageTitle} for {taskDetails?.task_name || 'Task'}
          </h1>
          <p className={theme.textSecondary}>
            Log and track time spent on this task.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/project/${projectId}/tasks`)}
            icon={<ArrowLeft size={16} />}
          >
            Back to Tasks
          </Button>
          <AIButton
            variant="suggest"
            onSuggest={() => console.log('AI Time Log Suggestions')}
          />
          <Button
            icon={<Plus size={16} />}
            onClick={() => {
              setViewMode('create');
              resetForm();
            }}
          >
            Log New Time
          </Button>
        </div>
      </div>

      {/* Key Time Log Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProjectMetricsCard
          title="Total Time Logged"
          value={`${(timeLogMetrics.totalMinutes / 60).toFixed(1)} hrs`}
          description="Overall time spent on task"
          icon={Clock}
          colorClass="bg-blue-500"
          onClick={() => { /* No specific filter, just refresh */ }}
        />
        <ProjectMetricsCard
          title="Billable Hours"
          value={`${(timeLogMetrics.billableMinutes / 60).toFixed(1)} hrs`}
          description="Hours that can be invoiced"
          icon={DollarSign}
          colorClass="bg-green-500"
          onClick={() => { /* Filter time logs by billable status */ }}
        />
        <ProjectMetricsCard
          title="Non-Billable Hours"
          value={`${(timeLogMetrics.nonBillableMinutes / 60).toFixed(1)} hrs`}
          description="Internal or non-chargeable time"
          icon={XCircle}
          colorClass="bg-red-500"
          onClick={() => { /* Filter time logs by non-billable status */ }}
        />
      </div>

      {/* Time Logged by Employee Chart */}
      {timeLogMetrics.employeeTimeDistribution && timeLogMetrics.employeeTimeDistribution.length > 0 && (
        <TimeLoggedByEmployeeChart data={timeLogMetrics.employeeTimeDistribution} />
      )}

      {viewMode === 'create' || viewMode === 'edit' ? (
        <Card className="p-6">
          <h3
            className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center`}
          >
            <Clock size={20} className={`mr-2 text-[${theme.hoverAccent}]`} />
            {isEditMode ? 'Edit Time Log' : 'Log New Time'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MasterSelectField
                label="Employee"
                value={formData.employeeName}
                onValueChange={(val) => handleInputChange('employeeName', val)}
                onSelect={(id) => handleEmployeeSelect(id, availableEmployees.find(emp => emp.id === id)?.name || '')}
                options={availableEmployees}
                placeholder="Select Employee"
                required
              />
              <FormField
                label="Start Time"
                type="datetime-local"
                value={formData.startTime}
                onChange={(val) => handleInputChange('startTime', val)}
                required
              />
              <FormField
                label="End Time"
                type="datetime-local"
                value={formData.endTime}
                onChange={(val) => handleInputChange('endTime', val)}
                required
              />
              <FormField
                label="Duration (Minutes)"
                type="number"
                value={formData.durationMinutes.toString()}
                onChange={(val) =>
                  handleInputChange('durationMinutes', parseFloat(val) || 0)
                }
                readOnly
              />
              <FormField
                label="Notes"
                value={formData.notes}
                onChange={(val) => handleInputChange('notes', val)}
                placeholder="What did you work on?"
                className="md:col-span-2"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewMode('list')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : 'Save Time Log'}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            All Time Logs
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="relative flex-grow">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search time logs by notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && fetchTimeLogs(taskId as string)
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
              value={
                numResultsOptions.find((opt) => opt.id === numResultsToShow)?.name || ''
              }
              onValueChange={() => {}}
              onSelect={(id) => setNumResultsToShow(id)}
              options={numResultsOptions}
              placeholder="Show"
              className="w-32"
            />
            <Button
              onClick={() => fetchTimeLogs(taskId as string)}
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
            ) : timeLogs.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
                <p>No time logs found for this task. Log new time to get started.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Time
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration (Mins)
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-3 py-2 whitespace-normal text-sm font-medium text-gray-900 max-w-[120px] overflow-hidden text-ellipsis">
                        {log.employees
                          ? `${log.employees.first_name} ${log.employees.last_name}`
                          : 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.start_time).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {log.end_time ? new Date(log.end_time).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {log.duration_minutes || 0}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        ₹
                        {((log.duration_minutes || 0) *
                          (log.employees?.hourly_rate || 0)) /
                          60}
                      </td>
                      <td className="px-3 py-2 whitespace-normal text-sm text-gray-500 max-w-[200px] overflow-hidden text-ellipsis">
                        {log.notes || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTimeLog(log)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTimeLog(log.id)}
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
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteTimeLog}
        title="Confirm Time Log Deletion"
        message="Are you sure you want to delete this time log? This action cannot be undone."
        confirmText="Yes, Delete Time Log"
      />

      <TimeLogFilterModal
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

export default TimeLogPage;
