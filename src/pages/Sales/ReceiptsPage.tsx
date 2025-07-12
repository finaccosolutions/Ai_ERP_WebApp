import React, { useState, useEffect } from 'react';
import { Plus, Receipt, Search, Calendar, Users, DollarSign, CreditCard, List, Save, Trash2 } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

function ReceiptsPage() {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'create' | 'list'>('list');
  // Receipts typically don't have an 'item_mode' toggle
  const receiptMode = 'voucher_mode'; 

  const [receiptData, setReceiptData] = useState({
    id: '',
    receiptNo: '',
    customerId: '',
    customerName: '',
    receiptDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'bank', // cash, bank, card, upi, cheque
    referenceNo: '',
    notes: '',
    status: 'received', // received, cleared, bounced
  });

  const [receiptsList, setReceiptsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchReceipts();
    }
  }, [viewMode, currentCompany?.id]);

  const fetchReceipts = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('receipt_date', { ascending: false });

      if (error) throw error;
      setReceiptsList(data);
    } catch (err: any) {
      setError(`Error fetching receipts: ${err.message}`);
      console.error('Error fetching receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReceiptData({
      id: '',
      receiptNo: '',
      customerId: '',
      customerName: '',
      receiptDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'bank',
      referenceNo: '',
      notes: '',
      status: 'received',
    });
    setError(null);
    setSuccessMessage(null);
  };

  const handleInputChange = (field: keyof typeof receiptData, value: any) => {
    setReceiptData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id || !user?.id) {
      setError('Company or user information is missing. Please log in and select a company.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const receiptToSave = {
        ...receiptData,
        company_id: currentCompany.id,
        created_by: user.id,
        receipt_no: receiptData.receiptNo,
        customer_id: receiptData.customerId,
        receipt_date: receiptData.receiptDate,
        payment_method: receiptData.paymentMethod,
        reference_no: receiptData.referenceNo,
      };

      if (receiptData.id) {
        const { data, error } = await supabase
          .from('receipts')
          .update(receiptToSave)
          .eq('id', receiptData.id)
          .select();
        if (error) throw error;
        setSuccessMessage('Receipt updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('receipts')
          .insert(receiptToSave)
          .select();
        if (error) throw error;
        setSuccessMessage('Receipt created successfully!');
      }

      resetForm();
      setViewMode('list');
      fetchReceipts();
    } catch (err: any) {
      setError(`Failed to save receipt: ${err.message}`);
      console.error('Save receipt error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditReceipt = (rec: any) => {
    setReceiptData({
      id: rec.id,
      receiptNo: rec.receipt_no,
      customerId: rec.customer_id,
      customerName: rec.customer_name || 'N/A',
      receiptDate: rec.receipt_date,
      amount: rec.amount,
      paymentMethod: rec.payment_method,
      referenceNo: rec.reference_no || '',
      notes: rec.notes || '',
      status: rec.status,
    });
    setViewMode('create');
  };

  const handleDeleteReceipt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.from('receipts').delete().eq('id', id);
      if (error) throw error;
      setSuccessMessage('Receipt deleted successfully!');
      fetchReceipts();
    } catch (err: any) {
      setError(`Failed to delete receipt: ${err.message}`);
      console.error('Delete receipt error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Receipts</h1>
          <p className={theme.textSecondary}>Record and manage customer payments and receipts.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Receipt Suggestions')} />
          {viewMode === 'list' ? (
            <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); }}>Record New Receipt</Button>
          ) : (
            <Button icon={<List size={16} />} onClick={() => setViewMode('list')}>View Receipts List</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {successMessage}</span>
        </div>
      )}

      {viewMode === 'create' ? (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
              {receiptData.id ? 'Edit Receipt' : 'Record New Receipt'}
            </h3>
            {/* Receipts are typically always in voucher mode */}
            <span className={`px-3 py-1 text-sm font-medium ${theme.textPrimary} bg-gray-100 rounded-lg`}>
              Voucher Mode
            </span>
          </div>

          <form onSubmit={handleSaveReceipt} className="space-y-6">
            {/* Receipt Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Receipt Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Receipt Number"
                  value={receiptData.receiptNo}
                  onChange={(val) => handleInputChange('receiptNo', val)}
                  placeholder="Auto-generated or manual"
                  required
                />
                <FormField
                  label="Receipt Date"
                  type="date"
                  value={receiptData.receiptDate}
                  onChange={(val) => handleInputChange('receiptDate', val)}
                  required
                />
                <FormField
                  label="Amount"
                  type="number"
                  value={receiptData.amount.toString()}
                  onChange={(val) => handleInputChange('amount', parseFloat(val) || 0)}
                  required
                  icon={<DollarSign size={18} />}
                />
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Payment Method
                  </label>
                  <select
                    value={receiptData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className={`
                      w-full px-3 py-2 border ${theme.inputBorder} rounded-lg
                      ${theme.inputBg} ${theme.textPrimary}
                      focus:ring-2 focus:ring-[#6AC8A3] focus:border-transparent
                    `}
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <FormField
                  label="Reference No."
                  value={receiptData.referenceNo}
                  onChange={(val) => handleInputChange('referenceNo', val)}
                  placeholder="Transaction ID, Cheque No., etc."
                />
              </div>
            </Card>

            {/* Customer Details & Notes */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Customer & Notes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Customer Name"
                  value={receiptData.customerName}
                  onChange={(val) => handleInputChange('customerName', val)}
                  placeholder="Start typing customer name..."
                  required
                  aiHelper={true}
                  context="customer_selection"
                />
                <FormField
                  label="Notes"
                  value={receiptData.notes}
                  onChange={(val) => handleInputChange('notes', val)}
                  placeholder="Any additional notes"
                />
              </div>
            </Card>

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : (receiptData.id ? 'Update Receipt' : 'Save Receipt')}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Receipts List</h3>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6AC8A3]"></div>
              </div>
            ) : receiptsList.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
                <p>No receipts found. Record a new receipt to get started.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receiptsList.map((rec) => (
                    <tr key={rec.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rec.receipt_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rec.customer_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rec.receipt_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{rec.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{rec.payment_method}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{rec.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleEditReceipt(rec)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteReceipt(rec.id)} className="text-red-600 hover:text-red-800">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <AIButton variant="predict" onSuggest={() => console.log('AI Delayed Payment Prediction')} className="w-full" />
          </div>
        </Card>
      )}
    </div>
  );
}

export default ReceiptsPage;
