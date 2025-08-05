// src/pages/Project/Project.tsx
import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; // Import supabase
import { useCompany } from '../../contexts/CompanyContext'; // Import useCompany

// NEW: Import Project sub-pages
import ProjectListPage from './ProjectListPage';
import ProjectFormPage from './ProjectFormPage';
import TaskListPage from './TaskListPage';
import TaskFormPage from './TaskFormPage';
import TimeLogPage from './TimeLogPage';

function Project() {
  const { theme } = useTheme();
  const location = useLocation();
  const { currentCompany } = useCompany(); // Use currentCompany

  const [projectStats, setProjectStats] = useState([
    { name: 'Total Projects', value: '0', icon: ClipboardCheck, color: 'bg-blue-500' },
    { name: 'In Progress', value: '0', icon: ClipboardCheck, color: 'bg-green-500' },
    { name: 'Due Soon', value: '0', icon: ClipboardCheck, color: 'bg-orange-500' },
    { name: 'Completed', value: '0', icon: ClipboardCheck, color: 'bg-purple-500' },
  ]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchProjectStats(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const fetchProjectStats = async (companyId: string) => {
    setLoadingStats(true);
    try {
      const { data: kpis, error: kpisError } = await supabase
        .from('company_project_kpis') // Query the materialized view
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (kpisError) {
        console.error('Project.tsx: Error fetching KPIs from materialized view:', kpisError);
        // Fallback or show error to user
        setProjectStats([
          { name: 'Total Projects', value: 'N/A', icon: ClipboardCheck, color: 'bg-blue-500' },
          { name: 'In Progress', value: 'N/A', icon: ClipboardCheck, color: 'bg-green-500' },
          { name: 'Due Soon', value: 'N/A', icon: ClipboardCheck, color: 'bg-orange-500' },
          { name: 'Completed', value: 'N/A', icon: ClipboardCheck, color: 'bg-purple-500' },
        ]);
      } else {
        setProjectStats([
          { name: 'Total Projects', value: kpis?.total_projects?.toString() || '0', icon: ClipboardCheck, color: 'bg-blue-500' },
          { name: 'In Progress', value: kpis?.projects_in_progress?.toString() || '0', icon: ClipboardCheck, color: 'bg-green-500' },
          { name: 'Due Soon', value: 'N/A', icon: ClipboardCheck, color: 'bg-orange-500' }, // Not directly in MV, needs specific query
          { name: 'Completed', value: kpis?.projects_completed?.toString() || '0', icon: ClipboardCheck, color: 'bg-purple-500' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching project stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // ADDED: Check if we are on the main Project dashboard page
  const isMainProjectPage = location.pathname === '/project' || location.pathname === '/project/';

  // ADDED: Conditional rendering for routing
  if (!isMainProjectPage) {
    return (
      <Routes>
        <Route path="/list" element={<ProjectListPage />} />
        <Route path="/new" element={<ProjectFormPage />} />
        <Route path="/edit/:id" element={<ProjectFormPage />} />
        <Route path="/:projectId/tasks" element={<TaskListPage />} />
        <Route path="/:projectId/tasks/new" element={<TaskFormPage />} />
        <Route path="/:projectId/tasks/edit/:taskId" element={<TaskFormPage />} />
        <Route path="/:projectId/tasks/:taskId/time-logs" element={<TimeLogPage />} />
        {/* Add other project sub-routes here */}
      </Routes>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600">Manage your projects, tasks, and time tracking</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Project Suggestions')} />
          <Link to="/project/new"> {/* MODIFIED: Link to new project form */}
            <Button icon={<Plus size={16} />}>Create New Project</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projectStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} hover className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{loadingStats ? '...' : stat.value}</p>
                </div>
                <div className={`p-3 ${stat.color} ${theme.borderRadius}`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4"> {/* ADDED: Flex container for header and link */}
          <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
          <Link to="/project/list" className="text-sm text-cyan-600 hover:text-cyan-800 flex items-center"> {/* ADDED: Link to project list */}
            View All Projects <Plus size={16} className="ml-1" />
          </Link>
        </div>
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
          <p>No recent projects found. Create a new project to get started.</p>
        </div>
      </Card>
    </div>
  );
}

export default Project;
