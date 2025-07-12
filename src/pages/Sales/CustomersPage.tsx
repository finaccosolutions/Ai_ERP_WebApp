import React, { useState } from 'react';
import { Plus, Search, Users, Mail, Phone, MapPin, Building } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';

function CustomersPage() {
  const { theme } = useTheme();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: '',
    customerCode: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    taxId: '',
    gstin: '',
    billingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
    shippingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
    creditLimit: '0',
    creditDays: '30',
    paymentTerms: '',
    customerGroup: '',
    notes: '',
  });

  const handleInputChange = (field: string, value: string | number | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCustomerData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setCustomerData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting customer data:', customerData);
    // Logic to save customer data to database
    setShowCreateForm(false);
    // Reset form or show success message
  };

  const customers = [
    { id: '1', name: 'ABC Corp', email: 'abc@example.com', phone: '123-456-7890', outstanding: 15000 },
    { id: '2', name: 'XYZ Solutions', email: 'xyz@example.com', phone: '098-765-4321', outstanding: 0 },
    { id: '3', name: 'Global Traders', email: 'global@example.com', phone: '555-123-4567', outstanding: 2500 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>Customer Master</h1>
          <p className={theme.textSecondary}>Manage your customer profiles and details.</p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="suggest" onSuggest={() => console.log('AI Customer Suggestions')} />
          <Button icon={<Plus size={16} />} onClick={() => setShowCreateForm(true)}>Add New Customer</Button>
        </div>
      </div>

      {showCreateForm && (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Add New Customer</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Customer Name" value={customerData.name} onChange={(val) => handleInputChange('name', val)} required />
              <FormField label="Customer Code" value={customerData.customerCode} onChange={(val) => handleInputChange('customerCode', val)} />
              <FormField label="Email" type="email" value={customerData.email} onChange={(val) => handleInputChange('email', val)} icon={<Mail size={18} />} />
              <FormField label="Phone" value={customerData.phone} onChange={(val) => handleInputChange('phone', val)} icon={<Phone size={18} />} />
              <FormField label="Mobile" value={customerData.mobile} onChange={(val) => handleInputChange('mobile', val)} icon={<Phone size={18} />} />
              <FormField label="Website" value={customerData.website} onChange={(val) => handleInputChange('website', val)} />
              <FormField label="Tax ID" value={customerData.taxId} onChange={(val) => handleInputChange('taxId', val)} />
              <FormField label="GSTIN" value={customerData.gstin} onChange={(val) => handleInputChange('gstin', val)} />
            </div>

            <h4 className={`text-md font-semibold ${theme.textPrimary} mt-6 mb-2`}>Billing Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Street" value={customerData.billingAddress.street} onChange={(val) => handleInputChange('billingAddress.street', val)} icon={<MapPin size={18} />} />
              <FormField label="City" value={customerData.billingAddress.city} onChange={(val) => handleInputChange('billingAddress.city', val)} />
              <FormField label="State" value={customerData.billingAddress.state} onChange={(val) => handleInputChange('billingAddress.state', val)} />
              <FormField label="ZIP Code" value={customerData.billingAddress.zipCode} onChange={(val) => handleInputChange('billingAddress.zipCode', val)} />
              <FormField label="Country" value={customerData.billingAddress.country} onChange={(val) => handleInputChange('billingAddress.country', val)} />
            </div>

            <h4 className={`text-md font-semibold ${theme.textPrimary} mt-6 mb-2`}>Shipping Address (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Street" value={customerData.shippingAddress.street} onChange={(val) => handleInputChange('shippingAddress.street', val)} icon={<MapPin size={18} />} />
              <FormField label="City" value={customerData.shippingAddress.city} onChange={(val) => handleInputChange('shippingAddress.city', val)} />
              <FormField label="State" value={customerData.shippingAddress.state} onChange={(val) => handleInputChange('shippingAddress.state', val)} />
              <FormField label="ZIP Code" value={customerData.shippingAddress.zipCode} onChange={(val) => handleInputChange('shippingAddress.zipCode', val)} />
              <FormField label="Country" value={customerData.shippingAddress.country} onChange={(val) => handleInputChange('shippingAddress.country', val)} />
            </div>

            <h4 className={`text-md font-semibold ${theme.textPrimary} mt-6 mb-2`}>Financial Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Credit Limit" type="number" value={customerData.creditLimit} onChange={(val) => handleInputChange('creditLimit', parseFloat(val))} />
              <FormField label="Credit Days" type="number" value={customerData.creditDays} onChange={(val) => handleInputChange('creditDays', parseInt(val))} />
              <FormField label="Payment Terms" value={customerData.paymentTerms} onChange={(val) => handleInputChange('paymentTerms', val)} />
              <FormField label="Customer Group" value={customerData.customerGroup} onChange={(val) => handleInputChange('customerGroup', val)} />
            </div>

            <FormField label="Notes" value={customerData.notes} onChange={(val) => handleInputChange('notes', val)} />

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button type="submit">Save Customer</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Customer List</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{customer.outstanding.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm">View</Button>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && (
          <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-gray-500 mt-4">
            <p>No customers found. Add a new customer to get started.</p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <AIButton variant="audit" onSuggest={() => console.log('AI Duplicate Check')} className="w-full" />
        </div>
      </Card>
    </div>
  );
}

export default CustomersPage;
