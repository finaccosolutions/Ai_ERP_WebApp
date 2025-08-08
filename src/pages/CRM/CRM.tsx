// src/pages/CRM/CRM.tsx
import React, { useState, useEffect } from 'react';
import {
  Users, TrendingUp, Phone, Mail, Plus, Calendar, Clock, Target, FileText, Activity, ChevronRight,
  ClipboardList, // For Activities List
  Megaphone, // For Campaigns
  BarChart2, // For CRM Reports/Analytics
  Bot, // For AI
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext'; // Import useNotification

// Import CRM sub-pages
import LeadListPage from './LeadListPage';
import LeadFormPage from './LeadFormPage';
// NEW: Placeholder for Campaigns
import CampaignListPage from './CampaignListPage';
import CampaignFormPage from './CampaignFormPage';
// NEW: Placeholder for Activities List
import ActivityListPage from './ActivityListPage';

function CRM() {
  const { theme } = useTheme();
  const { currentCompany, currentPeriod } = useCompany();
  const { showNotification } = useNotification(); // Use showNotification
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
    totalCampaigns: 0, // NEW: Metric for campaigns
    totalActivities: 0, // NEW: Metric for activities
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
      // Query the materialized view for aggregated metrics
      const { data: kpis, error: kpisError } = await supabase
        .from('company_crm_kpis') // Query the materialized view
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (kpisError) {
        console.error('CRM.tsx: Error fetching KPIs from materialized view:', kpisError);
        // Fallback or show error to user
        setCrmMetrics({
          totalLeads: 0, newLeads: 0, contactedLeads: 0, qualifiedLeads: 0, convertedLeads: 0, lostLeads: 0,
          totalCustomers: 0, totalOpportunities: 0, pendingFollowUps: 0, overdueFollowUps: 0,
          totalCampaigns: 0, totalActivities: 0,
        });
      } else {
        setCrmMetrics({
          totalLeads: kpis?.total_leads || 0,
          newLeads: kpis?.open_leads || 0,
          contactedLeads: kpis?.contacted_leads || 0,
          qualifiedLeads: kpis?.qualified_leads || 0,
          convertedLeads: kpis?.converted_leads || 0,
          lostLeads: kpis?.lost_leads || 0,
          totalCustomers: kpis?.total_customers || 0,
          totalOpportunities: kpis?.total_opportunities || 0,
          totalCampaigns: kpis?.total_campaigns || 0,
          totalActivities: kpis?.total_activities || 0,
          // pendingFollowUps and overdueFollowUps might still need a separate query
          // if they are time-sensitive and not easily aggregated in a static MV.
          // For now, keeping the existing logic for these two.
          pendingFollowUps: 0, // Placeholder, will be updated by activitiesData filter
          overdueFollowUps: 0, // Placeholder, will be updated by activitiesData filter
        });
      }

      // Fetch Follow-up Activities (still needed for time-sensitive pending/overdue)
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

      // Update state with follow-up data
      setCrmMetrics(prev => ({
        ...prev,
        pendingFollowUps,
        overdueFollowUps,
      }));

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

  // NEW: Structured CRM Modules
  const crmModules = [
    {
      title: 'Core CRM',
      description: 'Manage your customer relationships from lead to opportunity.',
      modules: [
        { name: 'Leads', icon: Users, path: '/crm/leads', count: crmMetrics.totalLeads, description: 'Track and manage potential customers.' },
        // Pass state to indicate origin is CRM
        { name: 'Customers', icon: Users, path: '/sales/customers', state: { fromCrm: true }, count: crmMetrics.totalCustomers, description: 'Manage existing customer profiles.' }, // Links to Sales Customer Master
        { name: 'Opportunities', icon: Target, path: '/crm/opportunities/list', count: crmMetrics.totalOpportunities, description: 'Track sales opportunities and deals.' },
        { name: 'Activities', icon: Activity, path: '/crm/activities', count: crmMetrics.totalActivities, description: 'Log and manage all customer interactions.' },
      ]
    },
    {
      title: 'Marketing & Engagement',
      description: 'Plan and execute marketing campaigns.',
      modules: [
        { name: 'Campaigns', icon: Megaphone, path: '/crm/campaigns', count: crmMetrics.totalCampaigns, description: 'Create and manage marketing campaigns.' },
      ]
    },
    {
      title: 'Analytics & Reports',
      description: 'Gain insights into your CRM performance.',
      modules: [
        { name: 'CRM Reports', icon: BarChart2, path: '/crm/reports', count: 'N/A', description: 'Access various CRM performance reports.' },
        { name: 'Sales Analysis', icon: TrendingUp, path: '/sales/analysis', count: 'N/A', description: 'Detailed sales performance insights.' }, // Links to Sales Analysis
      ]
    }
  ];

  const moduleColors = [
    { cardBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', textColor: 'text-emerald-800', iconBg: 'bg-emerald-500' },
    { cardBg: 'bg-gradient-to-br from-sky-50 to-sky-100', textColor: 'text-sky-800', iconBg: 'bg-sky-500' },
    { cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100', textColor: 'text-purple-800', iconBg: 'bg-purple-500' },
    { cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100', textColor: 'text-orange-800', iconBg: 'bg-orange-500' },
    { cardBg: 'bg-gradient-to-br from-teal-50 to-teal-100', textColor: 'text-teal-800', iconBg: 'bg-teal-500' },
    { cardBg: 'bg-gradient-to-br from-indigo-50 to-indigo-100', textColor: 'text-indigo-800', iconBg: 'bg-indigo-500' },
    { cardBg: 'bg-gradient-to-br from-pink-50 to-pink-100', textColor: 'text-pink-800', iconBg: 'bg-pink-500' },
    { cardBg: 'bg-gradient-to-br from-red-50 to-red-100', textColor: 'text-red-800', iconBg: 'bg-red-500' },
    { cardBg: 'bg-gradient-to-br from-yellow-50 to-yellow-100', textColor: 'text-yellow-800', iconBg: 'bg-yellow-500' },
  ];

  // Check if we are on the main CRM dashboard page
  const isMainCrmPage = location.pathname === '/crm' || location.pathname === '/crm/';

  if (!isMainCrmPage) {
    return (
      <Routes>
        <Route path="/leads" element={<LeadListPage />} />
        <Route path="/leads/new" element={<LeadFormPage />} />
        <Route path="/leads/edit/:id" element={<LeadFormPage />} />
        <Route path="/campaigns" element={<CampaignListPage />} /> {/* NEW */}
        <Route path="/campaigns/new" element={<CampaignFormPage />} /> {/* NEW */}
        <Route path="/campaigns/edit/:id" element={<CampaignFormPage />} /> {/* NEW */}
        <Route path="/activities" element={<ActivityListPage />} /> {/* NEW */}
        {/* Add other CRM sub-routes here (e.g., opportunities, campaigns) */}
        <Route path="/customers/*" element={<div>CRM Customers Page</div>} /> {/* Link to Sales Customers for now */}
        <Route path="/opportunities/*" element={<div>CRM Opportunities Page</div>} />
        <Route path="/reports/*" element={<div>CRM Reports Page</div>} />
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
            AI-powered customer management and sales growth
          </p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI CRM Suggestions')} />
          <Link to="/crm/leads/new">
            <Button icon={<Plus size={16} />}>Add New Lead</Button>
          </Link>
        </div>
      </div>

      {/* CRM Metrics - Simplified and integrated into modules below */}

      {/* CRM Modules Section */}
      {/* CRM Modules Section */}
      {crmModules.map((category, catIndex) => (
        <div key={catIndex} className="space-y-4">
          <h2 className={`text-2xl font-bold ${theme.textPrimary} mt-8`}>{category.title}</h2>
          <p className={theme.textSecondary}>{category.description}</p>
          {/* MODIFIED: Change lg:grid-cols-3 to lg:grid-cols-4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {category.modules.map((module, moduleIndex) => {
              const Icon = module.icon;
              const colors = moduleColors[(catIndex * crmModules[catIndex].modules.length + moduleIndex) % moduleColors.length];
              return (
                <Link key={module.name} to={module.path} state={module.state} className="flex">
                  <Card
                    hover
                    className={`
                      p-6 cursor-pointer group relative overflow-hidden flex-1 flex flex-col justify-between
                      ${colors.cardBg}
                      transform transition-all duration-300 ease-in-out
                      hover:translate-y-[-6px] hover:shadow-2xl hover:ring-2 hover:ring-[${theme.hoverAccent}] hover:ring-opacity-75
                    `}
                    backgroundIcon={<Icon size={120} className={`text-gray-300 opacity-20`} />} // Watermarked icon
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
                      <p className={`text-2xl font-bold ${colors.textColor}`}>
                        {loadingMetrics ? '...' : module.count}
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
        </div>
      ))}

      {/* Recent Activities & Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Leads Pipeline */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>Leads Pipeline</h3>
            <Link to="/crm/leads" className="text-sm text-cyan-600 hover:text-cyan-800 flex items-center">
              View All Leads <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { status: 'open', label: 'New', count: crmMetrics.newLeads, color: 'bg-blue-100 text-blue-800' },
              { status: 'contacted', label: 'Contacted', count: crmMetrics.contactedLeads, color: 'bg-sky-100 text-sky-800' },
              { status: 'qualified', label: 'Qualified', count: crmMetrics.qualifiedLeads, color: 'bg-emerald-100 text-emerald-800' },
              { status: 'converted', label: 'Converted', count: crmMetrics.convertedLeads, color: 'bg-green-100 text-green-800' },
              { status: 'lost', label: 'Lost', count: crmMetrics.lostLeads, color: 'bg-red-100 text-red-800' },
            ].map((stage, index) => (
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
      </div>

      {/* Quick Access Buttons */}
      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/crm/leads/new">
            <Button className="w-full justify-start" icon={<Plus size={16} />}>
              Add New Lead
            </Button>
          </Link>
          <Link to="/sales/customers/new">
            <Button variant="outline" className="w-full justify-start" icon={<Users size={16} />}>
              Add New Customer
            </Button>
          </Link>
          <Link to="/crm/campaigns/new">
            <Button variant="outline" className="w-full justify-start" icon={<Megaphone size={16} />}>
              Create New Campaign
            </Button>
          </Link>
          <Link to="/crm/opportunities/new">
            <Button variant="outline" className="w-full justify-start" icon={<Target size={16} />}>
              Add New Opportunity
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
