import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const BIKE_MODELS = [
  'Classic 350', 'Bullet 350', 'Meteor 350', 'Hunter 350', 
  'Himalayan 450', 'Scram 411', 'Interceptor 650', 'Continental GT 650', 'Super Meteor 650'
];

export default function POS() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({ phone: '', name: '', bikeModel: 'Classic 350', regNo: '' });
  const [currentKm, setCurrentKm] = useState('');
  const [nextServiceMonths, setNextServiceMonths] = useState(6);
  
  const [partsList, setPartsList] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [searchPart, setSearchPart] = useState('');

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const res = await axios.get(`${API_URL}/parts`);
      setPartsList(res.data);
    } catch (err) {
      console.error('Error fetching parts:', err);
    }
  };

  const handleCustomerLookup = async () => {
    if (customer.phone.length >= 10) {
      try {
        const res = await axios.get(`${API_URL}/customers/${customer.phone}`);
        if (res.data) {
          setCustomer(prev => ({
            ...prev,
            name: res.data.name,
            bikeModel: res.data.bikeModel,
            regNo: res.data.regNo
          }));
        }
      } catch (err) {
        // Not found, normal for new customers
      }
    }
  };

  const addPartToInvoice = (part) => {
    const existing = invoiceItems.find(i => i.partName === part.name);
    if (existing) {
      setInvoiceItems(invoiceItems.map(i => 
        i.partName === part.name ? { ...i, qty: i.qty + 1 } : i
      ));
    } else {
      setInvoiceItems([...invoiceItems, { 
        partName: part.name, 
        qty: 1, 
        unitPrice: part.basePrice, 
        gstRate: part.gstRate, 
        isLabour: false 
      }]);
    }
    setSearchPart('');
  };

  const addLabour = () => {
    setInvoiceItems([...invoiceItems, { 
      partName: 'General Service / Labour', 
      qty: 1, 
      unitPrice: 500, 
      gstRate: 18, 
      isLabour: true 
    }]);
  };

  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceItems];
    newItems[index][field] = Number(value);
    setInvoiceItems(newItems);
  };

  const removeInvoiceItem = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let totalGst = 0;

    invoiceItems.forEach(item => {
      const lineTotal = item.qty * item.unitPrice;
      const gstAmount = lineTotal * (item.gstRate / 100);
      subtotal += lineTotal;
      totalGst += gstAmount;
    });

    return {
      subtotal,
      totalGst,
      grandTotal: Math.round(subtotal + totalGst)
    };
  };

  const totals = calculateTotals();

  const handleCheckout = async () => {
    if (!customer.phone || !customer.name || !customer.regNo || !currentKm) {
      alert("Please fill all required customer and bike details.");
      return;
    }
    if (invoiceItems.length === 0) {
      alert("Please add at least one item to the invoice.");
      return;
    }

    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + parseInt(nextServiceMonths));

    const invoiceData = {
      currentKm: parseInt(currentKm),
      items: invoiceItems,
      subtotal: totals.subtotal,
      totalGst: totals.totalGst,
      grandTotal: totals.grandTotal,
      nextServiceDate: nextDate,
      nextServiceKm: parseInt(currentKm) + (nextServiceMonths === 6 ? 4000 : 2000)
    };

    try {
      const res = await axios.post(`${API_URL}/invoices`, {
        customerData: customer,
        invoiceData
      });
      navigate(`/print/${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create invoice.");
    }
  };

  const filteredParts = partsList.filter(p => p.name.toLowerCase().includes(searchPart.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel: Customer & Search */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Customer & Bike Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input type="text" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500" 
                value={customer.phone} 
                onChange={e => setCustomer({...customer, phone: e.target.value})} 
                onBlur={handleCustomerLookup}
                placeholder="10-digit mobile" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input type="text" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500" 
                value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bike Model *</label>
                <select className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500"
                  value={customer.bikeModel} onChange={e => setCustomer({...customer, bikeModel: e.target.value})}>
                  {BIKE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reg No. *</label>
                <input type="text" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500 uppercase" 
                  value={customer.regNo} onChange={e => setCustomer({...customer, regNo: e.target.value})} placeholder="RJ14-XX-1234"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Odo (KM) *</label>
                <input type="number" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500" 
                  value={currentKm} onChange={e => setCurrentKm(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Service In *</label>
                <select className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500"
                  value={nextServiceMonths} onChange={e => setNextServiceMonths(e.target.value)}>
                  <option value={6}>6 Months (~4000 KM)</option>
                  <option value={3}>3 Months (~2000 KM)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">Add Parts / Labour</h2>
            <button onClick={addLabour} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center transition-colors">
              <Plus className="w-4 h-4 mr-1" /> Add Labour
            </button>
          </div>
          <div>
            <input type="text" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500 mb-2" 
              placeholder="Search parts (e.g. Filter)..." value={searchPart} onChange={e => setSearchPart(e.target.value)} />
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredParts.map(part => (
                <button key={part._id} onClick={() => addInvoiceItem(part)} className="w-full text-left p-2 hover:bg-red-50 rounded-md border border-transparent hover:border-red-100 transition-colors flex justify-between">
                  <span className="font-medium text-gray-700">{part.name}</span>
                  <span className="text-gray-500 text-sm">₹{part.basePrice}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Invoice Table & Summary */}
      <div className="lg:col-span-2 flex flex-col h-[calc(100vh-8rem)]">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 flex-grow flex flex-col overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Current Invoice</h2>
            <span className="text-sm text-gray-500 font-medium">Items: {invoiceItems.length}</span>
          </div>
          <div className="flex-grow overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 sticky top-0 shadow-sm text-sm text-gray-600">
                <tr>
                  <th className="p-3 font-semibold">Item</th>
                  <th className="p-3 font-semibold w-24">Qty</th>
                  <th className="p-3 font-semibold w-28">Price (₹)</th>
                  <th className="p-3 font-semibold w-24">GST %</th>
                  <th className="p-3 font-semibold w-28 text-right">Total (₹)</th>
                  <th className="p-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoiceItems.map((item, index) => {
                  const lineTotal = item.qty * item.unitPrice;
                  const totalWithGst = lineTotal + (lineTotal * (item.gstRate / 100));
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <span className={`font-medium ${item.isLabour ? 'text-blue-700' : 'text-gray-800'}`}>{item.partName}</span>
                      </td>
                      <td className="p-3">
                        <input type="number" min="1" className="w-full p-1 border rounded text-center" 
                          value={item.qty} onChange={e => updateInvoiceItem(index, 'qty', e.target.value)} />
                      </td>
                      <td className="p-3">
                        <input type="number" min="0" className="w-full p-1 border rounded text-right" 
                          value={item.unitPrice} onChange={e => updateInvoiceItem(index, 'unitPrice', e.target.value)} />
                      </td>
                      <td className="p-3">
                        <select className="w-full p-1 border rounded" value={item.gstRate} onChange={e => updateInvoiceItem(index, 'gstRate', e.target.value)}>
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {totalWithGst.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => removeInvoiceItem(index)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {invoiceItems.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center p-8 text-gray-400">No items added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 p-6 border-t">
            <div className="flex justify-end mb-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 border-b pb-2">
                  <span>Total GST:</span>
                  <span>₹{totals.totalGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
                  <span>Grand Total:</span>
                  <span>₹{totals.grandTotal}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setInvoiceItems([])} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors">
                Clear All
              </button>
              <button onClick={handleCheckout} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold flex items-center shadow-md transition-transform active:scale-95">
                <Printer className="w-5 h-5 mr-2" /> Generate Bill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
