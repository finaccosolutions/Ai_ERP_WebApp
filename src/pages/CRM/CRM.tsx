import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Phone, Mail, Plus, Calendar, Clock, Target, FileText, Activity, ChevronRight } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, Routes, Route, useLocation } from 'react-router-dom'; // Import Routes, Route, useLocation
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

// Import CRM sub-pages
import LeadListPage from './LeadListPage'; // NEW
import LeadFormPage from './LeadFormPage'; // NEW

function CRM() {
  const { theme } = useTheme();
  const { currentCompany, currentPeriod } = useCompany();
  const location = useLocation();

  const [crmMetrics, setCrmMetrics] = useState({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,
    totalCustomers: 0,
    totalOpportunities: 0,
    pendingFollowUps: 0,
    overdueFollowUps: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    if (currentCompany?.id && currentPeriod?.id) {
      fetchCrmMetrics(currentCompany.id, currentPeriod.startDate, currentPeriod.endDate);
      fetchRecentActivities(currentCompany.id);
    }
  }, [currentCompany?.id, currentPeriod?.id]);

  const fetchCrmMetrics = async (companyId: string, periodStartDate: string, periodEndDate: string) => {
    setLoadingMetrics(true);
    try {
      // Fetch Lead Counts by Status
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('status', { count: 'exact' })
        .eq('company_id', companyId);

      if (leadsError) throw leadsError;

      const totalLeads = leadsData.length;
      const newLeads = leadsData.filter((lead: any) => lead.status === 'open').length;
      const contactedLeads = leadsData.filter((lead: any) => lead.status === 'contacted').length;
      const qualifiedLeads = leadsData.filter((lead: any) => lead.status === 'qualified').length;
      const convertedLeads = leadsData.filter((lead: any) => lead.status === 'converted').length;
      const lostLeads = leadsData.filter((lead: any) => lead.status === 'lost').length;

      // Fetch Total Customers
      const { count: totalCustomers, error: customersError } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId);
      if (customersError) throw customersError;

      // Fetch Total Opportunities
      const { count: totalOpportunities, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId);
      if (opportunitiesError) throw opportunitiesError;

      // Fetch Follow-up Activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('activity_date, status', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('activity_type', 'task') // Assuming follow-ups are tasks
        .eq('status', 'open') // Only open tasks
        .gte('activity_date', periodStartDate)
        .lte('activity_date', periodEndDate);

      if (activitiesError) throw activitiesError;

      const today = new Date().toISOString().split('T')[0];
      const pendingFollowUps = activitiesData.filter((activity: any) => activity.activity_date >= today).length;
      const overdueFollowUps = activitiesData.filter((activity: any) => activity.activity_date < today).length;

      setCrmMetrics({
        totalLeads,
        newLeads,
        contactedLeads,
        qualifiedLeads,
        convertedLeads,
        lostLeads,
        totalCustomers: totalCustomers || 0,
        totalOpportunities: totalOpportunities || 0,
        pendingFollowUps,
        overdueFollowUps,
      });

    } catch (error) {
      console.error('Error fetching CRM metrics:', error);
      showNotification('Failed to load CRM metrics.', 'error');
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchRecentActivities = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          id, activity_type, subject, description, activity_date, status,
          assigned_to:employees ( first_name, last_name )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const crmStats = [
    { name: 'Total Leads', value: crmMetrics.totalLeads, icon: Users, color: 'bg-blue-500' },
    { name: 'New Leads', value: crmMetrics.newLeads, icon: Plus, color: 'bg-sky-500' },
    { name: 'Converted Leads', value: crmMetrics.convertedLeads, icon: TrendingUp, color: 'bg-green-500' },
    { name: 'Total Customers', value: crmMetrics.totalCustomers, icon: Users, color: 'bg-purple-500' },
    { name: 'Total Opportunities', value: crmMetrics.totalOpportunities, icon: Target, color: 'bg-orange-500' },
    { name: 'Pending Follow-ups', value: crmMetrics.pendingFollowUps, icon: Calendar, color: 'bg-yellow-500' },
    { name: 'Overdue Follow-ups', value: crmMetrics.overdueFollowUps, icon: Clock, color: 'bg-red-500' },
  ];

  const leadStatusPipeline = [
    { status: 'open', label: 'New', count: crmMetrics.newLeads, color: 'bg-blue-100 text-blue-800' },
    { status: 'contacted', label: 'Contacted', count: crmMetrics.contactedLeads, color: 'bg-sky-100 text-sky-800' },
    { status: 'qualified', label: 'Qualified', count: crmMetrics.qualifiedLeads, color: 'bg-emerald-100 text-emerald-800' },
    { status: 'converted', label: 'Converted', count: crmMetrics.convertedLeads, color: 'bg-green-100 text-green-800' },
    { status: 'lost', label: 'Lost', count: crmMetrics.lostLeads, color: 'bg-red-100 text-red-800' },
  ];

  // Check if we are on the main CRM dashboard page
  const isMainCrmPage = location.pathname === '/crm' || location.pathname === '/crm/';

  if (!isMainCrmPage) {
    return (
      <Routes>
        <Route path="/leads" element={<LeadListPage />} />
        <Route path="/leads/new" element={<LeadFormPage />} />
        <Route path="/leads/edit/:id" element={<LeadFormPage />} />
        {/* Add other CRM sub-routes here (e.g., opportunities, campaigns) */}
        <Route path="/customers/*" element={<div>CRM Customers Page</div>} /> {/* Link to Sales Customers for now */}
        <Route path="/opportunities/*" element={<div>CRM Opportunities Page</div>} />
        <Route path="/activities/*" element={<div>CRM Activities Page</div>} />
      </Routes>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-transparent bg-clip-text drop-shadow-lg`}>
            Customer Relationship Management
          </h1>
          <p className={theme.textSecondary}>
            Manage leads, customers, opportunities, and communication
          </p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI CRM Suggestions')} />
          <Link to="/crm/leads/new">
            <Button icon={<Plus size={16} />}>Add New Lead</Button>
          </Link>
        </div>
      </div>

      {/* CRM Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
        {crmStats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = [
            'bg-gradient-to-br from-blue-50 to-blue-100',
            'bg-gradient-to-br from-sky-50 to-sky-100',
            'bg-gradient-to-br from-green-50 to-green-100',
            'bg-gradient-to-br from-purple-50 to-purple-100',
            'bg-gradient-to-br from-orange-50 to-orange-100',
            'bg-gradient-to-br from-yellow-50 to-yellow-100',
            'bg-gradient-to-br from-red-50 to-red-100',
          ];
          const textColors = [
            'text-blue-800',
            'text-sky-800',
            'text-green-800',
            'text-purple-800',
            'text-orange-800',
            'text-yellow-800',
            'text-red-800',
          ];
          const iconBgs = [
            'bg-blue-500',
            'bg-sky-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-orange-500',
            'bg-yellow-500',
            'bg-red-500',
          ];

          return (
            <Card key={stat.name} hover className={`p-6 ${colors[index % colors.length]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${textColors[index % textColors.length]}`}>{stat.name}</p>
                  <p className={`text-2xl font-bold ${textColors[index % textColors.length]}`}>{loadingMetrics ? '...' : stat.value}</p>
                </div>
                <div className={`p-3 ${iconBgs[index % iconBgs.length]} ${theme.borderRadius}`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Leads Pipeline & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>Leads Pipeline</h3>
            <Link to="/crm/leads" className="text-sm text-cyan-600 hover:text-cyan-800 flex items-center">
              View All Leads <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-3">
            {leadStatusPipeline.map((stage, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{stage.label}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${stage.color}`}>
                  {loadingMetrics ? '...' : stage.count} Leads
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activities / Follow-ups */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>Recent Activities</h3>
            <Link to="/crm/activities" className="text-sm text-cyan-600 hover:text-cyan-800 flex items-center">
              View All Activities <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-3">
            {loadingMetrics ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No recent activities.
              </div>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{activity.subject}</p>
                    <p className="text-sm text-gray-600">
                      {activity.activity_type} with {activity.assigned_to?.first_name} {activity.assigned_to?.last_name} on {activity.activity_date}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${activity.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {activity.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Access Buttons */}
      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Quick Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/crm/leads/new">
            <Button className="w-full justify-start" icon={<Plus size={16} />}>
              Add New Lead
            </Button>
          </Link>
          <Link to="/sales/customers/new"> {/* Link to Sales module's customer form */}
            <Button variant="outline" className="w-full justify-start" icon={<Users size={16} />}>
              Add New Customer
            </Button>
          </Link>
          <Link to="/project/new"> {/* Link to Project module's project form */}
            <Button variant="outline" className="w-full justify-start" icon={<FileText size={16} />}>
              Create New Project
            </Button>
          </Link>
          <Link to="/crm/activities/new">
            <Button variant="outline" className="w-full justify-start" icon={<Activity size={16} />}>
              Log New Activity
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default CRM;
