// src/pages/Project/ProjectCategoryListPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Layers, Edit, Trash2, RefreshCw, Save, ArrowLeft, Filter } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import MasterSelectField from '../../components/UI/MasterSelectField';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link, useNavigate } from 'react-router-dom'; // Import Link
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import ItemCategoryFilterModal from '../../components/Modals/ItemCategoryFilterModal'; // Import the new filter modal

interface ItemCategory {
  id: string;
  name: string;
  description: string | null;
  parent_category_id: string | null;
  is_active: boolean;
  created_at: string;
  // Joined data (resolved client-side)
  parent_category_name?: string;
}

function ProjectCategoryListPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCategoriesCount, setTotalCategoriesCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    parentCategoryId: '',
    isActive: true,
  });

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    name: '',
    description: '',
    parentCategoryId: '',
    isActive: 'all',
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
      // Fetch all categories first to build the parent name map
      const { data: allCategories, error: allCategoriesError } = await supabase
        .from('project_categories')
        .select('id, name')
        .eq('company_id', currentCompany.id);

      if (allCategoriesError) throw allCategoriesError;

      const categoryNameMap = new Map(allCategories.map(cat => [cat.id, cat.name]));

      let query = supabase
        .from('project_categories')
        .select(`
          id, name, description, parent_category_id, is_active, created_at, updated_at
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id);

      // Apply search term
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      // Apply filters
      if (filterCriteria.name) {
        query = query.ilike('name', `%${filterCriteria.name}%`);
      }
      if (filterCriteria.description) {
        query = query.ilike('description', `%${filterCriteria.description}%`);
      }
      if (filterCriteria.parentCategoryId) {
        query = query.eq('parent_category_id', filterCriteria.parentCategoryId);
      }
      if (filterCriteria.isActive !== 'all') {
        query = query.eq('is_active', filterCriteria.isActive === 'true');
      }

      query = query.order('name', { ascending: true });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Resolve parent category names client-side
      const resolvedCategories: ItemCategory[] = data.map(cat => ({
        ...cat,
        parent_category_name: cat.parent_category_id ? categoryNameMap.get(cat.parent_category_id) : undefined,
      }));

      setCategories(resolvedCategories);
      setTotalCategoriesCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching project categories: ${err.message}`, 'error');
      console.error('Error fetching project categories:', err);
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
      name: '',
      description: '',
      parentCategoryId: '',
      isActive: true,
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showNotification('Category Name is required.', 'error');
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
      const categoryToSave = {
        company_id: currentCompany.id,
        name: formData.name,
        description: formData.description,
        parent_category_id: formData.parentCategoryId || null,
        is_active: formData.isActive,
      };

      if (formData.id) {
        const { error } = await supabase
          .from('project_categories')
          .update(categoryToSave)
          .eq('id', formData.id);
        if (error) throw error;
        showNotification('Item category updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('project_categories')
          .insert(categoryToSave);
        if (error) throw error;
        showNotification('Item category created successfully!', 'success');
      }
      setViewMode('list');
      resetForm();
      fetchCategories();
    } catch (err: any) {
      showNotification(`Failed to save item category: ${err.message}`, 'error');
      console.error('Save item category error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: ItemCategory) => {
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description || '',
      parentCategoryId: category.parent_category_id || '',
      isActive: category.is_active,
    });
    setViewMode('edit');
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
      // Check if any items are linked to this category
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

      // Check if any other categories use this as a parent
      const { count: childCategoriesCount, error: childCountError } = await supabase
        .from('project_categories')
        .select('count', { count: 'exact', head: true })
        .eq('parent_category_id', categoryToDeleteId);

      if (childCountError) throw childCountError;

      if (childCategoriesCount && childCategoriesCount > 0) {
        showNotification(`Cannot delete category: ${childCategoriesCount} sub-category(s) are linked to it. Please reassign them first.`, 'error');
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
      showNotification(`Error deleting item category: ${err.message}`, 'error');
      console.error('Error deleting item category:', err);
    } finally {
      setLoading(false);
      setCategoryToDeleteId(null);
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    setShowFilterModal(false);
  };

  const numCategoriesOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalCategoriesCount})` },
  ];

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
              {viewMode === 'create' ? 'Create New Category/Group' : 'Edit Category/Group'}
            </h1>
            <p className={theme.textSecondary}>
              {viewMode === 'create' ? 'Define a new way to organize your items.' : 'Update item category or group details.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setViewMode('list')} icon={<ArrowLeft size={16} />}>
            Back to List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Category/Group Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Name"
                value={formData.name}
                onChange={(val) => handleInputChange('name', val)}
                placeholder="e.g., Raw Materials, Electronics"
                required
              />
              <FormField
                label="Description"
                value={formData.description}
                onChange={(val) => handleInputChange('description', val)}
                placeholder="Brief description of the category/group"
              />
              <MasterSelectField
                label="Parent Category/Group"
                value={categories.find(cat => cat.id === formData.parentCategoryId)?.name || ''}
                onValueChange={(val) => {}}
                onSelect={(id) => handleInputChange('parentCategoryId', id)}
                options={categories.filter(cat => cat.id !== formData.id).map(cat => ({ id: cat.id, name: cat.name }))} // Cannot be its own parent
                placeholder="Select Parent (Optional)"
              />
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                <label htmlFor="isActive" className={`text-sm font-medium ${theme.textPrimary}`}>Is Active</label>
              </div>
            </div>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => setViewMode('list')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} icon={<Save size={16} />}>
              {loading ? 'Saving...' : 'Save Category/Group'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Project Categories</h1>
          <p className={theme.textSecondary}>Organize your inventory items for better management and reporting.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/project')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Category Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); }}>
            Create New
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Categories / Groups</h3>
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
          <Button onClick={() => setShowFilterModal(true)} icon={<Filter size={16} />}>
            Filter
          </Button>
          <MasterSelectField
            label="" // No label needed for this dropdown
            value={numCategoriesOptions.find(opt => opt.id === numResultsToShow)?.name || ''}
            onValueChange={() => {}} // Not used for typing
            onSelect={(id) => setNumResultsToShow(id)}
            options={numCategoriesOptions}
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
              <p>No project categories or groups found. Create a new one to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.description || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.parent_category_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)} title="Edit">
                        <Edit size={16} />
                      </Button>
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
        message="Are you sure you want to delete this item category/group? This action cannot be undone. Items or sub-categories linked to this will need to be reassigned."
        confirmText="Yes, Delete Category"
      />

      <ItemCategoryFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filterCriteria}
        onApplyFilters={handleApplyFilters}
        onFilterChange={(key, value) => setFilterCriteria(prev => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}

export default ProjectCategoryListPage;
