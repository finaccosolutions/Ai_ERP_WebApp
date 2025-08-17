// src/pages/Project/ProjectBillingEntriesPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Edit, Trash2, RefreshCw, ArrowLeft, DollarSign } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';

interface ProjectBillingEntry {
  id: string;
  company_id: string;
  project_id: string;
  task_id: string | null;
  sales_invoice_id: string | null;
  billed_amount: number;
  billed_date: string;
  created_at: string;
  projects?: { project_name: string } | null;
  tasks?: { task_name: string } | null;
  sales_invoices?: { invoice_no: string } | null;
}

function ProjectBillingEntriesPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation to get state

  const [billingEntries, setBillingEntries] = useState<ProjectBillingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalEntriesCount, setTotalEntriesCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDeleteId, setEntryToDeleteId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProjectBillingEntry | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    projectId: '',
    taskId: '',
    salesInvoiceId: '',
    billedAmount: 0,
    billedDate: new Date().toISOString().split('T')[0],
  });

  const [availableProjects, setAvailableProjects] = useState<{ id: string; name: string }[]>([]);
  const [availableTasks, setAvailableTasks] = useState<{ id: string; name: string }[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<{ id: string; name: string }[]>([]);

  // NEW: State for dynamic page title
  const [pageTitle, setPageTitle] = useState("Project Billing Entries");

  useEffect(() => {
    if (currentCompany?.id) {
      fetchBillingEntries();
      fetchMasterData(currentCompany.id);
    }

    // Set dynamic page title from Link state or default
    if (location.state?.pageTitle) {
      setPageTitle(location.state.pageTitle);
    } else {
      setPageTitle("Project Billing Entries"); // Default title
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

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, task_name')
        .in('project_id', supabase.from('projects').select('id').eq('company_id', companyId));
      if (tasksError) throw tasksError;
      setAvailableTasks(tasksData.map(t => ({ id: t.id, name: t.task_name })));

      const { data: invoicesData, error: invoicesError } = await supabase
        .from('sales_invoices')
        .select('id, invoice_no')
        .eq('company_id', companyId);
      if (invoicesError) throw invoicesError;
      setAvailableInvoices(invoicesData.map(i => ({ id: i.id, name: i.invoice_no })));
    } catch (error) {
      console.error('Error fetching master data:', error);
      showNotification('Failed to load projects, tasks, or invoices.', 'error');
    }
  };

  const fetchBillingEntries = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('project_billing_entries')
        .select(`
          *,
          projects ( project_name ),
          tasks ( task_name ),
          sales_invoices ( invoice_no )
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id);

      if (searchTerm) {
        query = query.ilike('projects.project_name', `%${searchTerm}%`);
      }

      query = query.order('billed_date', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;
      setBillingEntries(data || []);
      setTotalEntriesCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching billing entries: ${err.message}`, 'error');
      console.error('Error fetching billing entries:', err);
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
      taskId: '',
      salesInvoiceId: '',
      billedAmount: 0,
      billedDate: new Date().toISOString().split('T')[0],
    });
  };

  const validateForm = () => {
    if (!formData.projectId) {
      showNotification('Project is required.', 'error');
      return false;
    }
    if (formData.billedAmount <= 0) {
      showNotification('Billed Amount must be greater than 0.', 'error');
      return false;
    }
    if (!formData.billedDate) {
      showNotification('Billed Date is required.', 'error');
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
      const entryToSave = {
        company_id: currentCompany.id,
        project_id: formData.projectId,
        task_id: formData.taskId || null,
        sales_invoice_id: formData.salesInvoiceId || null,
        billed_amount: formData.billedAmount,
        billed_date: formData.billedDate,
      };

      if (formData.id) {
        const { error } = await supabase
          .from('project_billing_entries')
          .update(entryToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Billing entry updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('project_billing_entries')
          .insert(entryToSave);
        if (error) throw error;
        showNotification('Billing entry created successfully!', 'success');
      }
      setShowForm(false);
      resetForm();
      fetchBillingEntries();
    } catch (err: any) {
      showNotification(`Failed to save billing entry: ${err.message}`, 'error');
      console.error('Save billing entry error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (entry: ProjectBillingEntry) => {
    setEditingEntry(entry);
    setFormData({
      id: entry.id,
      projectId: entry.project_id,
      taskId: entry.task_id || '',
      salesInvoiceId: entry.sales_invoice_id || '',
      billedAmount: entry.billed_amount,
      billedDate: entry.billed_date,
    });
    setShowForm(true);
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntryToDeleteId(entryId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEntry = async () => {
    if (!entryToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_billing_entries')
        .delete()
        .eq('id', entryToDeleteId);

      if (error) throw error;
      showNotification('Billing entry deleted successfully!', 'success');
      fetchBillingEntries();
    } catch (err: any) {
      showNotification(`Error deleting billing entry: ${err.message}`, 'error');
      console.error('Error deleting billing entry:', err);
    } finally {
      setLoading(false);
      setEntryToDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>{pageTitle}</h1>
          <p className={theme.textSecondary}>Record and manage billing events for projects and tasks.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/project')} icon={<ArrowLeft size={16} />}>
            Back to Project Dashboard
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Billing Entry Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => { setShowForm(true); resetForm(); }}>
            Add New Entry
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            {editingEntry ? 'Edit Billing Entry' : 'Add New Billing Entry'}
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
            />
            <MasterSelectField
              label="Task (Optional)"
              value={availableTasks.find(t => t.id === formData.taskId)?.name || ''}
              onValueChange={(val) => {}}
              onSelect={(id) => handleInputChange('taskId', id)}
              options={availableTasks}
              placeholder="Select Task"
            />
            <MasterSelectField
              label="Sales Invoice (Optional)"
              value={availableInvoices.find(i => i.id === formData.salesInvoiceId)?.name || ''}
              onValueChange={(val) => {}}
              onSelect={(id) => handleInputChange('salesInvoiceId', id)}
              options={availableInvoices}
              placeholder="Link to Sales Invoice"
            />
            <FormField
              label="Billed Amount"
              type="number"
              value={formData.billedAmount.toString()}
              onChange={(val) => handleInputChange('billedAmount', parseFloat(val) || 0)}
              icon={<DollarSign size={18} />}
              required
            />
            <FormField
              label="Billed Date"
              type="date"
              value={formData.billedDate}
              onChange={(val) => handleInputChange('billedDate', val)}
              required
            />
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Billing Entries</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by project name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchBillingEntries()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          <Button onClick={fetchBillingEntries} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : billingEntries.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No billing entries found. Add a new entry to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billed Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billed Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billingEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.projects?.project_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.tasks?.task_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.sales_invoices?.invoice_no || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{entry.billed_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.billed_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => handleEditEntry(entry)} title="Edit">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        onConfirm={confirmDeleteEntry}
        title="Confirm Billing Entry Deletion"
        message="Are you sure you want to delete this billing entry? This action cannot be undone."
        confirmText="Yes, Delete Entry"
      />
    </div>
  );
}

export default ProjectBillingEntriesPage;
