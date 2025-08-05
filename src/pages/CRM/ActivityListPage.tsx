// src/pages/CRM/ActivityListPage.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Plus, Search, RefreshCw, Edit, Trash2, Calendar, Users, Mail, Phone } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';

interface Activity {
  id: string;
  activity_type: string;
  subject: string;
  description: string | null;
  activity_date: string;
  activity_time: string | null;
  duration_minutes: number | null;
  status: string;
  priority: string | null;
  assigned_to_id: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  // Joined data
  assigned_to?: { first_name: string; last_name: string } | null;
}

function ActivityListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalActivitiesCount, setTotalActivitiesCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activityToDeleteId, setActivityToDeleteId] = useState<string | null>(null);

  const [filterCriteria, setFilterCriteria] = useState({
    type: 'all',
    status: 'all',
    assignedTo: '',
    startDate: '',
    endDate: '',
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10');

  useEffect(() => {
    if (currentCompany?.id) {
      fetchActivities();
    }
  }, [currentCompany?.id, filterCriteria, numResultsToShow, searchTerm]);

  const fetchActivities = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('activities')
        .select(`
          *,
          assigned_to:employees ( first_name, last_name )
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id);

      if (searchTerm) {
        query = query.ilike('subject', `%${searchTerm}%`);
      }

      if (filterCriteria.type !== 'all') {
        query = query.eq('activity_type', filterCriteria.type);
      }
      if (filterCriteria.status !== 'all') {
        query = query.eq('status', filterCriteria.status);
      }
      if (filterCriteria.assignedTo) {
        query = query.eq('assigned_to_id', filterCriteria.assignedTo);
      }
      if (filterCriteria.startDate) {
        query = query.gte('activity_date', filterCriteria.startDate);
      }
      if (filterCriteria.endDate) {
        query = query.lte('activity_date', filterCriteria.endDate);
      }

      query = query.order('activity_date', { ascending: false });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setActivities(data || []);
      setTotalActivitiesCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching activities: ${err.message}`, 'error');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = (activityId: string) => {
    setActivityToDeleteId(activityId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteActivity = async () => {
    if (!activityToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityToDeleteId);

      if (error) throw error;
      showNotification('Activity deleted successfully!', 'success');
      fetchActivities();
    } catch (err: any) {
      showNotification(`Error deleting activity: ${err.message}`, 'error');
      console.error('Error deleting activity:', err);
    } finally {
      setLoading(false);
      setActivityToDeleteId(null);
    }
  };

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalActivitiesCount})` },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Activities</h1>
          <p className={theme.textSecondary}>Log and manage all customer interactions.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/crm')} icon={<ArrowLeft size={16} />}>
            Back to CRM Dashboard
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Activity Suggestions')} />
          {/* Assuming a form page for activities exists, or a modal */}
          <Link to="/crm/activities/new">
            <Button icon={<Plus size={16} />}>Log New Activity</Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Activities</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities by subject or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchActivities()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          {/* Filter options */}
          <div className="flex items-center space-x-2">
            <select
              value={filterCriteria.type}
              onChange={(e) => setFilterCriteria(prev => ({ ...prev, type: e.target.value }))}
              className={`
                px-3 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            >
              <option value="all">All Types</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="task">Task</option>
              <option value="note">Note</option>
            </select>
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
              <option value="open">Open</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
            <Button onClick={fetchActivities} disabled={loading} icon={<RefreshCw size={16} />}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No activities found. Log a new activity to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{activity.activity_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.activity_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.assigned_to ? `${activity.assigned_to.first_name} ${activity.assigned_to.last_name}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* Assuming an ActivityFormPage exists for editing */}
                      <Link to={`/crm/activities/edit/${activity.id}`}>
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteActivity(activity.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        onConfirm={confirmDeleteActivity}
        title="Confirm Activity Deletion"
        message="Are you sure you want to delete this activity? This action cannot be undone."
        confirmText="Yes, Delete Activity"
      />
    </div>
  );
}

export default ActivityListPage;
