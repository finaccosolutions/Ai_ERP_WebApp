import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, Search, Calendar, Users, DollarSign, Truck, List, Save, Send, Trash2, Calculator } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface SalesOrderItem {
  id: string;
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  deliveredQty: number;
  unit: string;
  rate: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

function SalesOrdersPage() {
  const { theme } = useTheme();
  const { suggestWithAI } = useAI();
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'create' | 'list'>('list');
  const [orderMode, setOrderMode] = useState<'item_mode' | 'voucher_mode'>('item_mode');

  const [salesOrder, setSalesOrder] = useState({
    id: '',
    orderNo: '',
    customerId: '',
    customerName: '',
    quotationId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    referenceNo: '',
    termsAndConditions: '',
    notes: '',
    status: 'draft', // draft, confirmed, partially_delivered, delivered, cancelled
    subtotal: 0,
    totalTax: 0,
    totalAmount: 0,
  });

  const [items, setItems] = useState<SalesOrderItem[]>([
    {
      id: '1',
      itemCode: '',
      itemName: '',
      description: '',
      quantity: 1,
      deliveredQty: 0,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      taxRate: 18,
      taxAmount: 0,
      lineTotal: 0,
    }
  ]);

  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchSalesOrders();
    }
  }, [viewMode, currentCompany?.id]);

  const fetchSalesOrders = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setSalesOrders(data);
    } catch (err: any) {
      setError(`Error fetching sales orders: ${err.message}`);
      console.error('Error fetching sales orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSalesOrder({
      id: '',
      orderNo: '',
      customerId: '',
      customerName: '',
      quotationId: '',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      referenceNo: '',
      termsAndConditions: '',
      notes: '',
      status: 'draft',
      subtotal: 0,
      totalTax: 0,
      totalAmount: 0,
    });
    setItems([
      {
        id: '1',
        itemCode: '',
        itemName: '',
        description: '',
        quantity: 1,
        deliveredQty: 0,
        unit: 'Nos',
        rate: 0,
        amount: 0,
        taxRate: 18,
        taxAmount: 0,
        lineTotal: 0,
      }
    ]);
    setOrderMode('item_mode');
    setError(null);
    setSuccessMessage(null);
  };

  const calculateItemTotals = (item: SalesOrderItem) => {
    const amount = item.quantity * item.rate;
    const taxAmount = (amount * item.taxRate) / 100;
    const lineTotal = amount + taxAmount;
    
    return {
      ...item,
      amount,
      taxAmount,
      lineTotal
    };
  };

  const updateItem = (index: number, field: keyof SalesOrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    newItems[index] = calculateItemTotals(newItems[index]);
    
    setItems(newItems);
    calculateSalesOrderTotals(newItems);
  };

  const addItem = () => {
    const newItem: SalesOrderItem = {
      id: Date.now().toString(),
      itemCode: '',
      itemName: '',
      description: '',
      quantity: 1,
      deliveredQty: 0,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      taxRate: 18,
      taxAmount: 0,
      lineTotal: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      calculateSalesOrderTotals(newItems);
    }
  };

  const calculateSalesOrderTotals = (itemList: SalesOrderItem[]) => {
    const subtotal = itemList.reduce((sum, item) => sum + item.amount, 0);
    const totalTax = itemList.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + totalTax;
    
    setSalesOrder(prev => ({
      ...prev,
      subtotal,
      totalTax,
      totalAmount,
    }));
  };

  const handleSalesOrderChange = (field: keyof typeof salesOrder, value: any) => {
    setSalesOrder(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id || !user?.id) {
      setError('Company or user information is missing. Please log in and select a company.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const salesOrderToSave = {
        ...salesOrder,
        company_id: currentCompany.id,
        created_by: user.id,
        order_no: salesOrder.orderNo,
        customer_id: salesOrder.customerId,
        quotation_id: salesOrder.quotationId,
        order_date: salesOrder.orderDate,
        delivery_date: salesOrder.deliveryDate,
        reference_no: salesOrder.referenceNo,
        terms_and_conditions: salesOrder.termsAndConditions,
        total_tax: salesOrder.totalTax,
        total_amount: salesOrder.totalAmount,
      };

      let salesOrderId = salesOrder.id;

      if (salesOrder.id) {
        const { data, error } = await supabase
          .from('sales_orders')
          .update(salesOrderToSave)
          .eq('id', salesOrder.id)
          .select();
        if (error) throw error;
        setSuccessMessage('Sales Order updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('sales_orders')
          .insert(salesOrderToSave)
          .select();
        if (error) throw error;
        salesOrderId = data[0].id;
        setSuccessMessage('Sales Order created successfully!');
      }

      if (orderMode === 'item_mode' && salesOrderId) {
        await supabase.from('sales_order_items').delete().eq('order_id', salesOrderId);

        const itemsToSave = items.map(item => ({
          ...item,
          order_id: salesOrderId,
          item_code: item.itemCode,
          item_name: item.itemName,
          delivered_qty: item.deliveredQty,
          tax_rate: item.taxRate,
          tax_amount: item.taxAmount,
          line_total: item.lineTotal,
        }));
        const { error: itemsError } = await supabase.from('sales_order_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }

      resetForm();
      setViewMode('list');
      fetchSalesOrders();
    } catch (err: any) {
      setError(`Failed to save sales order: ${err.message}`);
      console.error('Save sales order error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSalesOrder = (order: any) => {
    setSalesOrder({
      id: order.id,
      orderNo: order.order_no,
      customerId: order.customer_id,
      customerName: order.customer_name || 'N/A',
      quotationId: order.quotation_id,
      orderDate: order.order_date,
      deliveryDate: order.delivery_date,
      referenceNo: order.reference_no || '',
      termsAndConditions: order.terms_and_conditions || '',
      notes: order.notes || '',
      status: order.status,
      subtotal: order.subtotal,
      totalTax: order.total_tax,
      totalAmount: order.total_amount,
    });
    supabase.from('sales_order_items')
      .select('*')
      .eq('order_id', order.id)
      .then(({ data, error }) => {
        if (!error && data) {
          setItems(data.map(item => ({
            id: item.id,
            itemCode: item.item_code,
            itemName: item.item_name,
            description: item.description,
            quantity: item.quantity,
            deliveredQty: item.delivered_qty,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount,
            taxRate: item.tax_rate,
            taxAmount: item.tax_amount,
            lineTotal: item.line_total,
          })));
          setOrderMode('item_mode');
        } else {
          setItems([]);
          setOrderMode('voucher_mode');
        }
      });
    setViewMode('create');
  };

  const handleDeleteSalesOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sales order? This action cannot be undone.')) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.from('sales_orders').delete().eq('id', id);
      if (error) throw error;
      setSuccessMessage('Sales Order deleted successfully!');
      fetchSalesOrders();
    } catch (err: any) {
      setError(`Failed to delete sales order: ${err.message}`);
      console.error('Delete sales order error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Orders</h1>
          <p className={theme.textSecondary}>Manage customer sales orders and fulfillment.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Order Suggestions')} />
          {viewMode === 'list' ? (
            <Button icon={<Plus size={16} />} onClick={() => { setViewMode('create'); resetForm(); }}>Create New Order</Button>
          ) : (
            <Button icon={<List size={16} />} onClick={() => setViewMode('list')}>View Orders List</Button>
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
              {salesOrder.id ? 'Edit Sales Order' : 'Create New Sales Order'}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${theme.textPrimary}`}>Mode:</span>
              <select
                value={orderMode}
                onChange={(e) => setOrderMode(e.target.value as 'item_mode' | 'voucher_mode')}
                className={`
                  px-3 py-1 border ${theme.inputBorder} rounded-lg
                  ${theme.inputBg} ${theme.textPrimary}
                  focus:ring-2 focus:ring-[${theme.hoverAccent}] focus:border-transparent
                `}
              >
                <option value="item_mode">Item Order Mode</option>
                <option value="voucher_mode">Voucher Mode</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleSaveSalesOrder} className="space-y-6">
            {/* Sales Order Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Sales Order Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Order Number"
                  value={salesOrder.orderNo}
                  onChange={(value) => handleSalesOrderChange('orderNo', value)}
                  placeholder="Auto-generated or manual"
                  required
                />
                <FormField
                  label="Order Date"
                  type="date"
                  value={salesOrder.orderDate}
                  onChange={(value) => handleSalesOrderChange('orderDate', value)}
                  required
                />
                <FormField
                  label="Delivery Date"
                  type="date"
                  value={salesOrder.deliveryDate}
                  onChange={(value) => handleSalesOrderChange('deliveryDate', value)}
                />
                <FormField
                  label="Reference No."
                  value={salesOrder.referenceNo}
                  onChange={(value) => handleSalesOrderChange('referenceNo', value)}
                  placeholder="Customer PO, etc."
                />
              </div>
            </Card>

            {/* Customer Details */}
            <Card className="p-6">
              <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Customer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Customer Name"
                  value={salesOrder.customerName}
                  onChange={(value) => handleSalesOrderChange('customerName', value)}
                  placeholder="Start typing customer name..."
                  required
                  aiHelper={true}
                  context="customer_selection"
                />
                <FormField
                  label="Quotation ID (Optional)"
                  value={salesOrder.quotationId}
                  onChange={(value) => handleSalesOrderChange('quotationId', value)}
                  placeholder="Link to a quotation"
                />
              </div>
            </Card>

            {/* Sales Order Items (Conditional) */}
            {orderMode === 'item_mode' && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className={`text-md font-semibold ${theme.textPrimary}`}>Order Items</h4>
                  <div className="flex space-x-2">
                    <AIButton variant="suggest" onSuggest={() => console.log('AI Item Suggestions')} size="sm" />
                    <Button size="sm" icon={<Plus size={16} />} onClick={addItem}>Add Item</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className={`p-4 border ${theme.borderColor} rounded-lg`}>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                          <FormField
                            label="Item Name"
                            value={item.itemName}
                            onChange={(value) => updateItem(index, 'itemName', value)}
                            placeholder="Product/Service name"
                            required
                          />
                        </div>
                        <div>
                          <FormField
                            label="Quantity"
                            type="number"
                            value={item.quantity.toString()}
                            onChange={(value) => updateItem(index, 'quantity', parseFloat(value) || 0)}
                            required
                          />
                        </div>
                        <div>
                          <FormField
                            label="Unit"
                            value={item.unit}
                            onChange={(value) => updateItem(index, 'unit', value)}
                            placeholder="Nos, Kgs, etc."
                          />
                        </div>
                        <div>
                          <FormField
                            label="Rate"
                            type="number"
                            value={item.rate.toString()}
                            onChange={(value) => updateItem(index, 'rate', parseFloat(value) || 0)}
                            required
                          />
                        </div>
                        <div>
                          <FormField
                            label="Tax Rate (%)"
                            type="number"
                            value={item.taxRate.toString()}
                            onChange={(value) => updateItem(index, 'taxRate', parseFloat(value) || 0)}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                            className="text-red-600 hover:text-red-800"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>Amount</label>
                          <div className={`px-3 py-2 ${theme.inputBg} border ${theme.borderColor} rounded-lg`}>
                            ₹{item.amount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>Tax Amount</label>
                          <div className={`px-3 py-2 ${theme.inputBg} border ${theme.borderColor} rounded-lg`}>
                            ₹{item.taxAmount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>Line Total</label>
                          <div className={`px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg font-semibold`}>
                            ₹{item.lineTotal.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Sales Order Totals & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
                  <Calculator size={20} className="mr-2" />
                  Order Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={theme.textMuted}>Subtotal:</span>
                    <span className={theme.textPrimary}>₹{salesOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme.textMuted}>Total Tax:</span>
                    <span className={theme.textPrimary}>₹{salesOrder.totalTax.toLocaleString()}</span>
                  </div>
                  <hr className={theme.borderColor} />
                  <div className="flex justify-between text-lg font-semibold">
                    <span className={theme.textPrimary}>Total Amount:</span>
                    <span className="text-emerald-600">₹{salesOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <AIButton 
                    variant="calculate" 
                    onSuggest={() => console.log('AI Calculate')}
                    className="w-full"
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h4 className={`text-md font-semibold ${theme.textPrimary} mb-4`}>Additional Information</h4>
                <FormField
                  label="Terms and Conditions"
                  value={salesOrder.termsAndConditions}
                  onChange={(value) => handleSalesOrderChange('termsAndConditions', value)}
                  placeholder="Payment terms, delivery terms, etc."
                />
                <FormField
                  label="Notes"
                  value={salesOrder.notes}
                  onChange={(value) => handleSalesOrderChange('notes', value)}
                  placeholder="Any additional notes"
                />
              </Card>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : (salesOrder.id ? 'Update Order' : 'Save Order')}
              </Button>
              {!salesOrder.id && (
                <Button type="button" icon={<Send size={16} />}>Send Order</Button>
              )}
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Sales Orders List</h3>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
              </div>
            ) : salesOrders.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500">
                <p>No sales orders found. Create a new order to get started.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.order_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{order.total_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{order.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleEditSalesOrder(order)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSalesOrder(order.id)} className="text-red-600 hover:text-red-800">Delete</Button>
                        <Button variant="ghost" size="sm" icon={<Truck size={16} />}>Create Challan</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <AIButton variant="analyze" onSuggest={() => console.log('AI Fulfillment Analysis')} className="w-full" />
          </div>
        </Card>
      )}
    </div>
  );
}

export default SalesOrdersPage;