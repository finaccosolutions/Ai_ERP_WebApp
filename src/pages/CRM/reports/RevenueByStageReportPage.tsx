// src/pages/CRM/reports/RevenueByStageReportPage.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, RefreshCw } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { useNotification } from '../../../contexts/NotificationContext';

function RevenueByStageReportPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();

  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchRevenueByStage();
    }
  }, [currentCompany?.id]);

  const fetchRevenueByStage = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('stage, opportunity_amount')
        .eq('company_id', currentCompany.id);

      if (error) throw error;

      // Define stages in order
      const stagesOrder = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
      const aggregatedData: { [key: string]: number } = {};

      // Initialize sums for all stages
      stagesOrder.forEach(stage => {
        aggregatedData[stage] = 0;
      });

      // Aggregate data by stage
      data.forEach(opportunity => {
        aggregatedData[opportunity.stage] = (aggregatedData[opportunity.stage] || 0) + (opportunity.opportunity_amount || 0);
      });

      // Format data for display, maintaining order
      const formattedData = stagesOrder.map(stage => ({
        stage: stage.replace(/_/g, ' '),
        totalRevenue: aggregatedData[stage],
      }));

      setReportData(formattedData);
    } catch (err: any) {
      showNotification(`Error fetching report data: ${err.message}`, 'error');
      console.error('Error fetching revenue by stage report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Revenue by Stage Report</h1>
          <p className={theme.textSecondary}>Track the total revenue associated with each stage of your sales pipeline.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/crm')} icon={<ArrowLeft size={16} />}>
            Back to CRM Dashboard
          </Button>
          <Button onClick={fetchRevenueByStage} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Revenue Distribution</h3>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
          </div>
        ) : reportData.length === 0 ? (
          <div className="flex items-center justify-center h-64 border border-dashed rounded-lg text-gray-500">
            <p>No revenue data available for this report.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.stage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{row.totalRevenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default RevenueByStageReportPage;

