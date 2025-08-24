// src/pages/Project/ProjectTeamMembersPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Edit, Trash2, RefreshCw, ArrowLeft, DollarSign } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField';

interface ProjectTeamMember {
  id: string;
  project_id: string;
  employee_id: string;
  role: string;
  hourly_rate_override: number | null;
  created_at: string;
  employees?: { first_name: string; last_name: string; email: string; hourly_rate: number | null } | null;
  projects?: { project_name: string } | null;
}

function ProjectTeamMembersPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation to get state

  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalMembersCount, setTotalMembersCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDeleteId, setMemberToDeleteId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectTeamMember | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    projectId: '',
    employeeId: '',
    role: 'member',
    hourlyRateOverride: 0,
  });

  const [availableProjects, setAvailableProjects] = useState<{ id: string; name: string }[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<{ id: string; name: string }[]>([]);

  // NEW: State for dynamic page title
  const [pageTitle, setPageTitle] = useState("Project Team Members");

  useEffect(() => {
    if (currentCompany?.id) {
      fetchTeamMembers();
      fetchMasterData(currentCompany.id);
    }

    // Set dynamic page title from Link state or default
    if (location.state?.pageTitle) {
      setPageTitle(location.state.pageTitle);
    } else {
      setPageTitle("Project Team Members"); // Default title
    }
  }, [currentCompany?.id, location.state]);

  const fetchMasterData = async (companyId: string) => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, project_name')
        .eq('company_id', companyId);
      if (projectsError) throw projectsError;
      setAvailableProjects(projectsData.map(p => ({ id: p.id, name: p.project_name })));

      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .eq('status', 'active');
      if (employeesError) throw employeesError;
      setAvailableEmployees(employeesData.map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}` })));
    } catch (error) {
      console.error('Error fetching master data:', error);
      showNotification('Failed to load projects or employees.', 'error');
    }
  };

  const fetchTeamMembers = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      // First, fetch project IDs for the current company
      const { data: companyProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('company_id', currentCompany.id);

      if (projectsError) throw projectsError;
      const projectIds = companyProjects.map(p => p.id);

      let query = supabase
        .from('project_team_members')
        .select(`
          *,
          employees ( first_name, last_name, email, hourly_rate ),
          projects ( project_name )
        `, { count: 'exact' })
        .in('project_id', projectIds); // Use the fetched project IDs

      if (searchTerm) {
        query = query.ilike('employees.first_name', `%${searchTerm}%`); // Search by employee name
      }

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;
      setTeamMembers(data || []);
      setTotalMembersCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching team members: ${err.message}`, 'error');
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      projectId: '',
      employeeId: '',
      role: 'member',
      hourlyRateOverride: 0,
    });
  };

  const validateForm = () => {
    if (!formData.projectId) {
      showNotification('Project is required.', 'error');
      return false;
    }
    if (!formData.employeeId) {
      showNotification('Employee is required.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!currentCompany?.id) {
      showNotification('Company information is missing.', 'error');
      return;
    }

    setLoading(true);
    try {
      const memberToSave = {
        project_id: formData.projectId,
        employee_id: formData.employeeId,
        role: formData.role,
        hourly_rate_override: formData.hourlyRateOverride || null,
      };

      if (formData.id) {
        const { error } = await supabase
          .from('project_team_members')
          .update(memberToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Team member updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('project_team_members')
          .insert(memberToSave);
        if (error) throw error;
        showNotification('Team member added successfully!', 'success');
      }
      setShowForm(false);
      resetForm();
      fetchTeamMembers();
    } catch (err: any) {
      showNotification(`Failed to save team member: ${err.message}`, 'error');
      console.error('Save team member error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = (member: ProjectTeamMember) => {
    setEditingMember(member);
    setFormData({
      id: member.id,
      projectId: member.project_id,
      employeeId: member.employee_id,
      role: member.role,
      hourlyRateOverride: member.hourly_rate_override || 0,
    });
    setShowForm(true);
  };

  const handleDeleteMember = (memberId: string) => {
    setMemberToDeleteId(memberId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_team_members')
        .delete()
        .eq('id', memberToDeleteId);

      if (error) throw error;
      showNotification('Team member deleted successfully!', 'success');
      fetchTeamMembers();
    } catch (err: any) {
      showNotification(`Error deleting team member: ${err.message}`, 'error');
      console.error('Error deleting team member:', err);
    } finally {
      setLoading(false);
      setMemberToDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>{pageTitle}</h1>
          <p className={theme.textSecondary}>Manage staff assigned to various projects.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/project')} icon={<ArrowLeft size={16} />}>
            Back to Project Dashboard
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Team Member Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => { setShowForm(true); resetForm(); }}>
            Add New Member
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <MasterSelectField
              label="Project"
              value={availableProjects.find(p => p.id === formData.projectId)?.name || ''}
              onValueChange={(val) => {}}
              onSelect={(id) => handleInputChange('projectId', id)}
              options={availableProjects}
              placeholder="Select Project"
              required
              disabled={!!editingMember} // Disable project selection when editing
            />
            <MasterSelectField
              label="Employee"
              value={availableEmployees.find(e => e.id === formData.employeeId)?.name || ''}
              onValueChange={(val) => {}}
              onSelect={(id) => handleInputChange('employeeId', id)}
              options={availableEmployees}
              placeholder="Select Employee"
              required
              disabled={!!editingMember} // Disable employee selection when editing
            />
            <FormField
              label="Role"
              value={formData.role}
              onChange={(val) => handleInputChange('role', val)}
              placeholder="e.g., Lead Developer, Designer"
            />
            <FormField
              label="Hourly Rate Override (Optional)"
              type="number"
              value={formData.hourlyRateOverride.toString()}
              onChange={(val) => handleInputChange('hourlyRateOverride', parseFloat(val) || 0)}
              icon={<DollarSign size={18} />}
            />
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : 'Save Member'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Team Members</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchTeamMembers()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          <Button onClick={fetchTeamMembers} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No team members found. Add a new member to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hourly Rate Override</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.employees?.first_name} {member.employees?.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.projects?.project_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.hourly_rate_override ? `₹${member.hourly_rate_override.toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => handleEditMember(member)} title="Edit">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteMember(member.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        onConfirm={confirmDeleteMember}
        title="Confirm Team Member Deletion"
        message="Are you sure you want to remove this team member from the project? This action cannot be undone."
        confirmText="Yes, Remove Member"
      />
    </div>
  );
}

export default ProjectTeamMembersPage;
