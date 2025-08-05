// src/pages/CRM/CampaignListPage.tsx
import React from 'react';
import { ArrowLeft, Megaphone, Plus, Search, RefreshCw, Edit, Trash2 } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';

function CampaignListPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Mock data for campaigns
  const campaigns = [
    { id: '1', name: 'Summer Sale 2024', type: 'Email', status: 'Active', budget: 5000, leads: 150, revenue: 12000, startDate: '2024-06-01', endDate: '2024-06-30' },
    { id: '2', name: 'New Product Launch', type: 'Social Media', status: 'Planning', budget: 3000, leads: 0, revenue: 0, startDate: '2024-07-15', endDate: '2024-08-15' },
    { id: '3', name: 'Customer Loyalty Program', type: 'Event', status: 'Completed', budget: 10000, leads: 500, revenue: 25000, startDate: '2024-03-01', endDate: '2024-05-31' },
  ];

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
              className={`
                w-full pl-10 pr-4 py-2 border ${theme.inputBorder} rounded-lg
                ${theme.inputBg} ${theme.textPrimary}
                focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
              `}
            />
          </div>
          <Button icon={<RefreshCw size={16} />}>Refresh</Button>
        </div>

        <div className="overflow-x-auto">
          {campaigns.length === 0 ? (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{campaign.budget.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.leads}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{campaign.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/crm/campaigns/edit/${campaign.id}`}>
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800" title="Delete">
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
    </div>
  );
}

export default CampaignListPage;
