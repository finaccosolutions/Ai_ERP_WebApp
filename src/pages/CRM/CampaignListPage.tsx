// src/pages/CRM/CampaignListPage.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Megaphone, Plus, Search, RefreshCw, Edit, Trash2 } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; // Import supabase
import { useCompany } from '../../contexts/CompanyContext'; // Import useCompany
import { useNotification } from '../../contexts/NotificationContext'; // Import useNotification
import ConfirmationModal from '../../components/UI/ConfirmationModal'; // Import ConfirmationModal

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  status: string;
  budget: number | null;
  expected_leads: number | null;
  actual_leads: number | null;
  expected_revenue: number | null;
  actual_revenue: number | null;
  start_date: string;
  end_date: string;
  created_at: string;
}

function CampaignListPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { currentCompany } = useCompany(); // Use currentCompany
  const { showNotification } = useNotification(); // Use showNotification

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCampaignsCount, setTotalCampaignsCount] = useState(0); // New state for total count

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // State for confirmation modal
  const [campaignToDeleteId, setCampaignToDeleteId] = useState<string | null>(null); // State to store ID of campaign to delete

  useEffect(() => {
    if (currentCompany?.id) {
      fetchCampaigns();
    }
  }, [currentCompany?.id, searchTerm]); // Add searchTerm to dependencies

  const fetchCampaigns = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('campaigns')
        .select('*', { count: 'exact' })
        .eq('company_id', currentCompany.id);

      if (searchTerm) {
        query = query.ilike('campaign_name', `%${searchTerm}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;
      setCampaigns(data || []);
      setTotalCampaignsCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching campaigns: ${err.message}`, 'error');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaignToDeleteId(campaignId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDeleteId) return;

    setShowDeleteConfirm(false); // Close modal immediately
    setLoading(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignToDeleteId);

      if (error) throw error;
      showNotification('Campaign deleted successfully!', 'success');
      fetchCampaigns(); // Refresh list
    } catch (err: any) {
      showNotification(`Error deleting campaign: ${err.message}`, 'error');
      console.error('Error deleting campaign:', err);
    } finally {
      setLoading(false);
      setCampaignToDeleteId(null); // Clear campaign to delete ID
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Campaigns</h1>
          <p className={theme.textSecondary}>Manage your marketing campaigns and track their performance.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/crm')} icon={<ArrowLeft size={16} />}>
            Back to CRM Dashboard
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Campaign Suggestions')} />
          <Link to="/crm/campaigns/new">
            <Button icon={<Plus size={16} />}>Create New Campaign</Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>All Campaigns</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchCampaigns()}
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          <Button onClick={fetchCampaigns} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
              <p>No campaigns found. Create a new campaign to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.campaign_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.campaign_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{campaign.budget?.toLocaleString() || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.expected_leads} / {campaign.actual_leads}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{campaign.actual_revenue?.toLocaleString() || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/crm/campaigns/edit/${campaign.id}`}>
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCampaign(campaign.id)} className="text-red-600 hover:text-red-800" title="Delete">
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
        onConfirm={confirmDeleteCampaign}
        title="Confirm Campaign Deletion"
        message="Are you sure you want to delete this campaign? This action cannot be undone."
        confirmText="Yes, Delete Campaign"
      />
    </div>
  );
}

export default CampaignListPage;

