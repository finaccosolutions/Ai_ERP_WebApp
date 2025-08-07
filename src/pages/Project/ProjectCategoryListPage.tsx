// src/pages/Project/ProjectCategoryListPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Layers, Edit, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';

interface ProjectCategory {
  id: string;
  name: string;
  description: string | null;
  is_recurring_category: boolean;
  recurrence_frequency: string | null;
  recurrence_due_day: number | null;
  recurrence_due_month: number | null;
  billing_type: string;
  created_at: string;
  updated_at: string;
}

function ProjectCategoryListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCategoriesCount, setTotalCategoriesCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);

  const [filterCriteria, setFilterCriteria] = useState({
    name: '',
    billingType: 'all',
    isRecurring: 'all',
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10');

  useEffect(() => {
    if (currentCompany?.id) {
      fetchCategories();
    }
  }, [currentCompany?.id, filterCriteria, numResultsToShow, searchTerm]);

  const fetchCategories = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('project_categories')
        .select('*', { count: 'exact' })
        .eq('company_id', currentCompany.id);

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (filterCriteria.name) {
        query = query.ilike('name', `%${filterCriteria.name}%`);
      }
      if (filterCriteria.billingType !== 'all') {
        query = query.eq('billing_type', filterCriteria.billingType);
      }
      if (filterCriteria.isRecurring !== 'all') {
        query = query.eq('is_recurring_category', filterCriteria.isRecurring === 'true');
      }

      query = query.order('name', { ascending: true });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setCategories(data || []);
      setTotalCategoriesCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching project categories: ${err.message}`, 'error');
      console.error('Error fetching project categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDeleteId(categoryId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      // Check if any projects are linked to this category
      const { count: linkedProjectsCount, error: projectsCountError } = await supabase
        .from('projects')
        .select('count', { count: 'exact', head: true })
        .eq('project_category_id', categoryToDeleteId);

      if (projectsCountError) throw projectsCountError;

      if (linkedProjectsCount && linkedProjectsCount > 0) {
        showNotification(`Cannot delete category: ${linkedProjectsCount} project(s) are linked to it. Please reassign them first.`, 'error');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('project_categories')
        .delete()
        .eq('id', categoryToDeleteId);

      if (error) throw error;
      showNotification('Project category deleted successfully!', 'success');
      fetchCategories();
    } catch (err: any) {
      showNotification(`Error deleting project category: ${err.message}`, 'error');
      console.error('Error deleting project category:', err);
    } finally {
      setLoading(false);
      setCategoryToDeleteId(null);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    // If you had a filter modal, you'd close it here
  };

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalCategoriesCount})` },
  ];

  const billingTypes = [
    { id: 'all', name: 'All Billing Types' },
    { id: 'fixed_price', name: 'Fixed Price' },
    { id: 'time_based', name: 'Time & Material' },
    { id: 'recurring', name: 'Recurring' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Project Categories</h1>
          <p className={theme.textSecondary}>Define and manage different types of projects.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/project')} icon={<ArrowLeft size={16} />}>
            Back to Project Dashboard
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Category Suggestions')} />
          <Link to="/project/categories/new">
            <Button icon={<Plus size={16} />}>Create New Category</Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Project Categories</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchCategories()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          <MasterSelectField
            label=""
            value={billingTypes.find(type => type.id === filterCriteria.billingType)?.name || ''}
            onValueChange={(val) => setFilterCriteria(prev => ({ ...prev, billingType: val }))}
            onSelect={(id) => setFilterCriteria(prev => ({ ...prev, billingType: id }))}
            options={billingTypes}
            placeholder="Billing Type"
            className="w-40"
          />
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${theme.textPrimary}`}>
              Recurring
            </label>
            <select
              value={filterCriteria.isRecurring}
              onChange={(e) => setFilterCriteria(prev => ({ ...prev, isRecurring: e.target.value }))}
              className={`
                w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            >
              <option value="all">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <MasterSelectField
            label=""
            value={numResultsOptions.find(opt => opt.id === numResultsToShow)?.name || ''}
            onValueChange={() => {}}
            onSelect={(id) => setNumResultsToShow(id)}
            options={numResultsOptions}
            placeholder="Show"
            className="w-32"
          />
          <Button onClick={fetchCategories} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No project categories found. Create a new one to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurring</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurrence Details</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.description || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.billing_type.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.is_recurring_category ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.is_recurring_category ?
                        `${category.recurrence_frequency} (${category.recurrence_due_day}${category.recurrence_due_month ? `/${category.recurrence_due_month}` : ''})`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/project/categories/edit/${category.id}`}>
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        onConfirm={confirmDeleteCategory}
        title="Confirm Category Deletion"
        message="Are you sure you want to delete this project category? This action cannot be undone. Projects linked to this category will need to be reassigned."
        confirmText="Yes, Delete Category"
      />
    </div>
  );
}

export default ProjectCategoryListPage;
