// src/pages/Project/ProjectDocumentsPage.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Edit, Trash2, RefreshCw, ArrowLeft, Upload, Download } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import DocumentTypeDistributionChart from '../../components/Project/DocumentTypeDistributionChart'; // Assuming you have this chart

interface DocumentAttachment {
  id: string;
  company_id: string;
  reference_type: string;
  reference_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
  // Joined data
  uploaded_by_user?: { full_name: string } | null;
  projects?: { project_name: string } | null; // If reference_type is 'project'
}

function ProjectDocumentsPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation to get state

  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalDocumentsCount, setTotalDocumentsCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDeleteId, setDocumentToDeleteId] = useState<string | null>(null);

  const [documentTypeDistributionData, setDocumentTypeDistributionData] = useState<any[]>([]);

  // NEW: State for dynamic page title
  const [pageTitle, setPageTitle] = useState("Project Documents");

  useEffect(() => {
    if (currentCompany?.id) {
      fetchDocuments();
    }

    // Set dynamic page title from Link state or default
    if (location.state?.pageTitle) {
      setPageTitle(location.state.pageTitle);
    } else {
      setPageTitle("Project Documents"); // Default title
    }
  }, [currentCompany?.id, location.state]);

  const fetchDocuments = async () => {
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
        .from('document_attachments')
        .select(`
          *,
          uploaded_by_user:user_profiles ( full_name ),
          projects ( project_name )
        `, { count: 'exact' })
        .in('reference_id', projectIds) // Filter by project IDs
        .eq('company_id', currentCompany.id)
        .eq('reference_type', 'project'); // Filter for project documents

      if (searchTerm) {
        query = query.ilike('file_name', `%${searchTerm}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
      setTotalDocumentsCount(count || 0);

      // Prepare data for chart
      const typeCounts: { [key: string]: number } = {};
      data.forEach(doc => {
        const fileExtension = doc.file_name.split('.').pop()?.toUpperCase() || 'OTHER';
        typeCounts[fileExtension] = (typeCounts[fileExtension] || 0) + 1;
      });
      setDocumentTypeDistributionData(Object.keys(typeCounts).map(type => ({
        name: type,
        count: typeCounts[type],
      })));

    } catch (err: any) {
      showNotification(`Error fetching documents: ${err.message}`, 'error');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocumentToDeleteId(documentId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDeleteId) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      // First, delete the file from Supabase Storage
      const { data: docData, error: fetchError } = await supabase
        .from('document_attachments')
        .select('file_path')
        .eq('id', documentToDeleteId)
        .single();

      if (fetchError) throw fetchError;

      if (docData?.file_path) {
        const { error: storageError } = await supabase.storage
          .from('project_documents') // Assuming a bucket named 'project_documents'
          .remove([docData.file_path]);

        if (storageError) {
          console.warn('Error deleting file from storage:', storageError);
          // Don't throw error here, proceed to delete DB record even if file delete fails
        }
      }

      // Then, delete the record from the database
      const { error } = await supabase
        .from('document_attachments')
        .delete()
        .eq('id', documentToDeleteId);

      if (error) throw error;
      showNotification('Document deleted successfully!', 'success');
      fetchDocuments();
    } catch (err: any) {
      showNotification(`Error deleting document: ${err.message}`, 'error');
      console.error('Error deleting document:', err);
    } finally {
      setLoading(false);
      setDocumentToDeleteId(null);
    }
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('project_documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showNotification(`Error downloading document: ${err.message}`, 'error');
      console.error('Error downloading document:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>{pageTitle}</h1>
          <p className={theme.textSecondary}>Manage all documents related to your projects.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/project')} icon={<ArrowLeft size={16} />}>
            Back to Project Dashboard
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Document Suggestions')} />
          <Button icon={<Upload size={16} />}>Upload New Document</Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Documents</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchDocuments()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          <Button onClick={fetchDocuments} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
                  <p>No documents found. Upload a new document to get started.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.file_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.projects?.project_name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.mime_type?.split('/')[1].toUpperCase() || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.uploaded_by_user?.full_name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)} title="Download">
                            <Download size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id)} className="text-red-600 hover:text-red-800" title="Delete">
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <DocumentTypeDistributionChart data={documentTypeDistributionData} />
          </div>
        </div>
      </Card>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteDocument}
        title="Confirm Document Deletion"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Yes, Delete Document"
      />
    </div>
  );
}

export default ProjectDocumentsPage;
