// src/pages/Inventory/transactions/BatchExpiryPage.tsx
import React, { useState, useEffect } from 'react';
import { Search, CalendarCheck, RefreshCw, ArrowLeft, Plus, Filter } from 'lucide-react';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import AIButton from '../../../components/UI/AIButton';
import FormField from '../../../components/UI/FormField';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext'; // Corrected import path
import { useNotification } from '../../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import BatchExpiryFilterModal from '../../../components/Modals/BatchExpiryFilterModal'; // Import the new filter modal
import MasterSelectField from '../../../components/UI/MasterSelectField'; // Import MasterSelectField for num results

interface BatchMaster {
  id: string;
  batch_no: string;
  item_id: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  batch_qty: number;
  remaining_qty: number;
  is_active: boolean;
  created_at: string;
  // Joined data
  items?: { item_name: string; item_code: string; } | null;
}

interface SerialNumber {
  id: string;
  serial_no: string;
  item_id: string;
  warehouse_id: string | null;
  status: string;
  purchase_date: string | null;
  warranty_expiry: string | null;
  created_at: string;
  // Joined data
  items?: { item_name: string; item_code: string; } | null;
  warehouses?: { name: string } | null;
}

function BatchExpiryPage() {
  const { theme } = useTheme();
  const { currentCompany } = useCompany();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [batches, setBatches] = useState<BatchMaster[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'batches' | 'serials'>('batches');
  const [totalCount, setTotalCount] = useState(0); // To store total count for current tab

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    batchNo: '',
    itemCode: '', // For both batches and serials
    expiryDateBefore: '',
    expiryDateAfter: '',
    serialNo: '',
    warehouseId: '',
    serialStatus: 'all',
  });
  const [numResultsToShow, setNumResultsToShow] = useState<string>('10'); // Default to 10

  useEffect(() => {
    if (currentCompany?.id) {
      if (activeTab === 'batches') {
        fetchBatches();
      } else {
        fetchSerialNumbers();
      }
    }
  }, [currentCompany?.id, activeTab, filterCriteria, numResultsToShow]);

  const fetchBatches = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('batch_master')
        .select(`
          *,
          items ( item_name, item_code )
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id);

      // Apply search term
      if (searchTerm) {
        query = query.ilike('batch_no', `%${searchTerm}%`);
      }

      // Apply filters
      if (filterCriteria.batchNo) {
        query = query.ilike('batch_no', `%${filterCriteria.batchNo}%`);
      }
      if (filterCriteria.itemCode) {
        query = query.eq('item_id', filterCriteria.itemCode);
      }
      if (filterCriteria.expiryDateBefore) {
        query = query.lte('expiry_date', filterCriteria.expiryDateBefore);
      }
      if (filterCriteria.expiryDateAfter) {
        query = query.gte('expiry_date', filterCriteria.expiryDateAfter);
      }

      query = query.order('expiry_date', { ascending: true });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setBatches(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching batches: ${err.message}`, 'error');
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSerialNumbers = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('serial_numbers')
        .select(`
          *,
          items ( item_name, item_code ),
          warehouses ( name )
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id);

      // Apply search term
      if (searchTerm) {
        query = query.ilike('serial_no', `%${searchTerm}%`);
      }

      // Apply filters
      if (filterCriteria.serialNo) {
        query = query.ilike('serial_no', `%${filterCriteria.serialNo}%`);
      }
      if (filterCriteria.itemCode) {
        query = query.eq('item_id', filterCriteria.itemCode);
      }
      if (filterCriteria.warehouseId) {
        query = query.eq('warehouse_id', filterCriteria.warehouseId);
      }
      if (filterCriteria.serialStatus !== 'all') {
        query = query.eq('status', filterCriteria.serialStatus);
      }

      query = query.order('created_at', { ascending: false });

      if (numResultsToShow !== 'all') {
        query = query.limit(parseInt(numResultsToShow));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setSerialNumbers(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      showNotification(`Error fetching serial numbers: ${err.message}`, 'error');
      console.error('Error fetching serial numbers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return 'N/A';
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays <= 30) return 'Expiring Soon';
    return 'Good';
  };

  const getExpiryStatusColor = (status: string) => {
    switch (status) {
      case 'Expired': return 'bg-red-100 text-red-800';
      case 'Expiring Soon': return 'bg-yellow-100 text-yellow-800';
      case 'Good': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApplyFilters = (newFilters: typeof filterCriteria) => {
    setFilterCriteria(newFilters);
    setShowFilterModal(false);
  };

  const numResultsOptions = [
    { id: '10', name: 'Show 10' },
    { id: '25', name: 'Show 25' },
    { id: '50', name: 'Show 50' },
    { id: 'all', name: `Show All (${totalCount})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Batch / Expiry Management</h1>
          <p className={theme.textSecondary}>Track inventory by batch numbers, serial numbers, and expiry dates.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/inventory')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Batch/Expiry Suggestions')} />
          <Button icon={<Plus size={16} />}>Add New Batch/Serial</Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'batches' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('batches')}
          >
            Batches
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'serials' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('serials')}
          >
            Serial Numbers
          </button>
        </div>

        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
          {activeTab === 'batches' ? 'All Batches' : 'All Serial Numbers'}
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search by ${activeTab === 'batches' ? 'batch number' : 'serial number'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (activeTab === 'batches' ? fetchBatches() : fetchSerialNumbers())}
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
            value={numResultsOptions.find(opt => opt.id === numResultsToShow)?.name || ''}
            onValueChange={() => {}} // Not used for typing
            onSelect={(id) => setNumResultsToShow(id)}
            options={numResultsOptions}
            placeholder="Show"
            className="w-32"
          />
          <Button onClick={() => (activeTab === 'batches' ? fetchBatches() : fetchSerialNumbers())} disabled={loading} icon={<RefreshCw size={16} />}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
            </div>
          ) : activeTab === 'batches' ? (
            batches.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
                <p>No batches found.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mfg. Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batches.map((batch) => (
                    <tr key={batch.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{batch.batch_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.items?.item_name || 'N/A'} ({batch.items?.item_code || 'N/A'})</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.manufacturing_date || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.expiry_date || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.batch_qty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.remaining_qty}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getExpiryStatusColor(getExpiryStatus(batch.expiry_date))}`}>
                          {getExpiryStatus(batch.expiry_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" title="Edit">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800" title="Delete">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : ( // Serial Numbers Tab
            serialNumbers.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
                <p>No serial numbers found.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty Expiry</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {serialNumbers.map((serial) => (
                    <tr key={serial.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{serial.serial_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{serial.items?.item_name || 'N/A'} ({serial.items?.item_code || 'N/A'})</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{serial.warehouses?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{serial.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{serial.purchase_date || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{serial.warranty_expiry || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" title="Edit">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800" title="Delete">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </Card>
      <BatchExpiryFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        activeTab={activeTab}
        filters={filterCriteria}
        onApplyFilters={handleApplyFilters}
        onFilterChange={(key, value) => setFilterCriteria(prev => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}

export default BatchExpiryPage;
