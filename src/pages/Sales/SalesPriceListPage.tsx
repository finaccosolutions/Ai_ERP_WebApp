import React, { useState } from 'react';
import { Plus, Tag, Percent, DollarSign, Calendar, RefreshCw, ArrowLeft } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom'; // Add this line

function SalesPriceListPage() {
  const { theme } = useTheme();
  const navigate = useNavigate(); // Initialize useNavigate

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [priceListData, setPriceListData] = useState({
    name: '',
    currency: 'INR',
    isDefault: false,
    validFrom: '',
    validTo: '',
    isActive: true,
    items: [{ itemId: '', itemName: '', rate: '0', discountPercent: '0', discountAmount: '0' }]
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setPriceListData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...priceListData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setPriceListData(prev => ({ ...prev, items: newItems }));
  };

  const addItemRow = () => {
    setPriceListData(prev => ({
      ...prev,
      items: [...prev.items, { itemId: '', itemName: '', rate: '0', discountPercent: '0', discountAmount: '0' }]
    }));
  };

  const removeItemRow = (index: number) => {
    setPriceListData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting price list data:', priceListData);
    // Logic to save price list data to database
    setShowCreateForm(false);
    // Reset form or show success message
  };

  const priceLists = [
    { id: '1', name: 'Standard Retail Price', currency: 'INR', validFrom: '2024-01-01', validTo: '2024-12-31', isDefault: true },
    { id: '2', name: 'Wholesale Discount', currency: 'INR', validFrom: '2024-03-01', validTo: '2024-06-30', isDefault: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Sales Price List / Discount Rules</h1>
          <p className={theme.textSecondary}>Define and manage your product pricing and discount rules.</p>
        </div>
        <div className="flex space-x-2">
          {/* Add this button */}
          <Button variant="outline" onClick={() => navigate('/sales')} icon={<ArrowLeft size={16} />} className="text-gray-600 hover:text-gray-800">
            Back
          </Button>
          <AIButton variant="suggest" onSuggest={() => console.log('AI Pricing Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => setShowCreateForm(true)}>Add New Price List</Button>
        </div>
      </div>

      {showCreateForm && (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Add New Price List / Discount Rule</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Price List Name" value={priceListData.name} onChange={(val) => handleInputChange('name', val)} required />
              <FormField label="Currency" value={priceListData.currency} onChange={(val) => handleInputChange('currency', val)} />
              <FormField label="Valid From" type="date" value={priceListData.validFrom} onChange={(val) => handleInputChange('validFrom', val)} icon={<Calendar size={18} />} />
              <FormField label="Valid To" type="date" value={priceListData.validTo} onChange={(val) => handleInputChange('validTo', val)} icon={<Calendar size={18} />} />
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isDefault" checked={priceListData.isDefault} onChange={(e) => handleInputChange('isDefault', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                <label htmlFor="isDefault" className={`text-sm font-medium ${theme.textPrimary}`}>Set as Default</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isActive" checked={priceListData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} className="w-4 h-4 text-[${theme.hoverAccent}] border-gray-300 rounded focus:ring-[${theme.hoverAccent}]" />
                <label htmlFor="isActive" className={`text-sm font-medium ${theme.textPrimary}`}>Is Active</label>
              </div>
            </div>

            <h4 className={`text-md font-semibold ${theme.textPrimary} mt-6 mb-2`}>Items & Pricing</h4>
            <div className="space-y-3">
              {priceListData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-3 border rounded-lg">
                  <div className="md:col-span-2">
                    <FormField label="Item Name" value={item.itemName} onChange={(val) => handleItemChange(index, 'itemName', val)} placeholder="Product/Service Name" />
                  </div>
                  <FormField label="Rate" type="number" value={item.rate} onChange={(val) => handleItemChange(index, 'rate', val)} icon={<DollarSign size={18} />} />
                  <FormField label="Discount (%)" type="number" value={item.discountPercent} onChange={(val) => handleItemChange(index, 'discountPercent', val)} icon={<Percent size={18} />} />
                  <FormField label="Discount Amount" type="number" value={item.discountAmount} onChange={(val) => handleItemChange(index, 'discountAmount', val)} icon={<DollarSign size={18} />} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItemRow(index)}>Remove</Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addItemRow} icon={<Plus size={16} />}>Add Item Row</Button>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button type="submit">Save Price List</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Price Lists & Discounts</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {priceLists.map((list) => (
                <tr key={list.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{list.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{list.currency}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{list.validFrom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{list.validTo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{list.isDefault ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm">View</Button>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {priceLists.length === 0 && (
          <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500 mt-4">
            <p>No price lists found. Add a new price list to get started.</p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="predict" onSuggest={() => console.log('AI Optimal Pricing')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default SalesPriceListPage;

