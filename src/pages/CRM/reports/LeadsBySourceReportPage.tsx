// src/pages/CRM/reports/LeadsBySourceReportPage.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart2, RefreshCw } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { useNotification } from '../../../contexts/NotificationContext';

function LeadsBySourceReportPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();

  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchLeadsBySource();
    }
  }, [currentCompany?.id]);

  const fetchLeadsBySource = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          lead_source_id,
          lead_sources ( name )
        `)
        .eq('company_id', currentCompany.id);

      if (error) throw error;

      // Aggregate data by source
      const aggregatedData: { [key: string]: number } = {};
      data.forEach(lead => {
        const sourceName = lead.lead_sources?.name || 'Unknown Source';
        aggregatedData[sourceName] = (aggregatedData[sourceName] || 0) + 1;
      });

      const formattedData = Object.entries(aggregatedData).map(([name, count]) => ({
        source: name,
        leads: count,
      }));

      setReportData(formattedData);
    } catch (err: any) {
      showNotification(`Error fetching report data: ${err.message}`, 'error');
      console.error('Error fetching leads by source report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Leads by Source Report</h1>
          <p className={theme.textSecondary}>Analyze the effectiveness of your lead generation channels.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/crm')} icon={<ArrowLeft size={16} />}>
            Back to CRM Dashboard
          </Button>
          <Button onClick={fetchLeadsBySource} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Leads Distribution</h3>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
          </div>
        ) : reportData.length === 0 ? (
          <div className="flex items-center justify-center h-64 border border-dashed rounded-lg text-gray-500">
            <p>No leads data available for this report.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number of Leads</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.leads}</td>
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

export default LeadsBySourceReportPage;

