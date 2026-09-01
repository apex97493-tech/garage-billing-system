import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, Printer, MessageSquare, Search, 
  Wrench, Bike, FileText, Award, History, Download, CheckCircle2, UserCheck
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import { MOTORCYCLE_BRANDS, SERVICE_JOB_TYPES } from '../utils/bikeData';

const API_URL = 'http://localhost:5000/api';

export default function POS() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Customer & Bike Info
  const [customer, setCustomer] = useState({ 
    phone: searchParams.get('phone') || '', 
    name: searchParams.get('customerName') || '', 
    bikeModel: searchParams.get('bikeModel') || 'Royal Enfield Continental GT 650', 
    regNo: searchParams.get('regNo') || '' 
  });
  const [vinNo, setVinNo] = useState('');
  const [buildType, setBuildType] = useState(searchParams.get('buildType') || 'General Periodic Service & Tuning');
  const [currentKm, setCurrentKm] = useState('');
  const [nextServiceMonths, setNextServiceMonths] = useState(6);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [discount, setDiscount] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(Number(searchParams.get('advance')) || 0);
  const [notes, setNotes] = useState('');

  // Customer Auto-Recall & History States
  const [suggestedCustomers, setSuggestedCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [repeatCustomerInfo, setRepeatCustomerInfo] = useState(null);
  const [customerHistoryData, setCustomerHistoryData] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  // Inventory & Invoice Items
  const [partsList, setPartsList] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [searchPart, setSearchPart] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Custom on-the-fly Item row
  const [customItem, setCustomItem] = useState({
    name: '',
    price: '',
    qty: 1,
    gstRate: 18,
    isLabour: true
  });

  const searchDebounceRef = useRef(null);

  useEffect(() => {
    fetchParts();
    fetchSettings();
    if (customer.phone) {
      handleLookupByPhone(customer.phone);
    }
  }, []);

  const fetchParts = async () => {
    try {
      const res = await axios.get(`${API_URL}/parts`);
      setPartsList(res.data);
    } catch (err) {
      console.error('Error fetching parts:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      setSettings(res.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  // Live Smart Customer Search
  const handleCustomerSearch = (field, value) => {
    setCustomer(prev => ({ ...prev, [field]: value }));

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!value || value.trim().length < 2) {
      setSuggestedCustomers([]);
      setShowSuggestions(false);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_URL}/customers/search?q=${encodeURIComponent(value.trim())}`);
        setSuggestedCustomers(res.data || []);
        setShowSuggestions((res.data || []).length > 0);
      } catch (err) {
        console.error('Error searching customer:', err);
      }
    }, 200);
  };

  const handleSelectCustomer = (selected) => {
    setCustomer({
      phone: selected.phone || '',
      name: selected.name || '',
      bikeModel: selected.bikeModel || 'Royal Enfield Continental GT 650',
      regNo: selected.regNo || ''
    });
    if (selected.lastKm) {
      setCurrentKm(selected.lastKm);
    }
    setRepeatCustomerInfo(selected);
    setShowSuggestions(false);
  };

  const handleLookupByPhone = async (phone) => {
    if (!phone || phone.length < 10) return;
    try {
      const res = await axios.get(`${API_URL}/customers/${phone}`);
      if (res.data) {
        setCustomer({
          phone: res.data.phone,
          name: res.data.name,
          bikeModel: res.data.bikeModel,
          regNo: res.data.regNo
        });
        if (res.data.lastKm) setCurrentKm(res.data.lastKm);
        setRepeatCustomerInfo(res.data);
      }
    } catch (err) {
      // New customer
    }
  };

  const handleViewCustomerHistory = async () => {
    if (!customer.phone && !repeatCustomerInfo?.id) return;
    try {
      const targetId = repeatCustomerInfo?.id || customer.phone;
      const res = await axios.get(`${API_URL}/customers/${targetId}/history`);
      setCustomerHistoryData(res.data);
      setIsHistoryModalOpen(true);
    } catch (err) {
      console.error('Error fetching customer history:', err);
      alert('Could not fetch past records for this customer.');
    }
  };

  const addItemToInvoice = (part) => {
    const existingIndex = invoiceItems.findIndex(i => i.partName === part.name);
    if (existingIndex > -1) {
      const updated = [...invoiceItems];
      updated[existingIndex].qty += 1;
      setInvoiceItems(updated);
    } else {
      setInvoiceItems([...invoiceItems, {
        partId: part.id || part._id,
        partName: part.name,
        qty: 1,
        unitPrice: part.basePrice,
        gstRate: part.gstRate ?? 18,
        isLabour: Boolean(part.isLabour)
      }]);
    }
  };

  const handleAddCustomItem = () => {
    if (!customItem.name || !customItem.price) return;
    setInvoiceItems([...invoiceItems, {
      partName: customItem.name,
      qty: Number(customItem.qty) || 1,
      unitPrice: Number(customItem.price) || 0,
      gstRate: Number(customItem.gstRate) || 0,
      isLabour: customItem.isLabour
    }]);
    setCustomItem({ name: '', price: '', qty: 1, gstRate: 18, isLabour: true });
  };

  const updateItemQty = (index, delta) => {
    const updated = [...invoiceItems];
    const newQty = updated[index].qty + delta;
    if (newQty > 0) {
      updated[index].qty = newQty;
      setInvoiceItems(updated);
    } else {
      removeItem(index);
    }
  };

  const updateItemPrice = (index, newPrice) => {
    const updated = [...invoiceItems];
    updated[index].unitPrice = Number(newPrice) || 0;
    setInvoiceItems(updated);
  };

  const removeItem = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Calculations
  const currency = settings?.currency || '₹';
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const totalGst = invoiceItems.reduce((sum, item) => {
    const lineTotal = item.qty * item.unitPrice;
    return sum + (lineTotal * (item.gstRate / 100));
  }, 0);
  const grandTotal = Math.max(0, Math.round(subtotal + totalGst - Number(discount || 0)));
  const balanceDue = Math.max(0, grandTotal - Number(advancePaid || 0));

  const handleSaveInvoice = async (autoDownloadPDF = false) => {
    if (!customer.phone || !customer.name) {
      alert('Please enter Customer Phone and Name');
      return;
    }
    if (invoiceItems.length === 0) {
      alert('Please add at least one part or service to the bill.');
      return;
    }

    const currentKmNum = Number(currentKm) || 0;
    const nextDate = new Date();
    if (Number(nextServiceMonths) === 0) {
      // Due Today for instant test
      nextDate.setDate(nextDate.getDate());
    } else {
      nextDate.setMonth(nextDate.getMonth() + Number(nextServiceMonths));
    }

    const payload = {
      customerData: customer,
      invoiceData: {
        vinNo,
        buildType,
        currentKm: currentKmNum,
        nextServiceKm: currentKmNum + 4000,
        nextServiceDate: nextDate.toISOString(),
        items: invoiceItems,
        subtotal,
        totalGst,
        discount: Number(discount || 0),
        grandTotal,
        advancePaid: Number(advancePaid || 0),
        balanceDue,
        paymentMethod,
        notes
      }
    };

    try {
      const res = await axios.post(`${API_URL}/invoices`, payload);
      
      if (autoDownloadPDF && settings) {
        downloadInvoicePDF(res.data, settings);
      }

      navigate(`/print/${res.data.id || res.data._id}`);
    } catch (err) {
      console.error('Error saving invoice:', err);
      alert('Error creating invoice');
    }
  };

  const handleSendWhatsAppBill = () => {
    if (!customer.phone) {
      alert('Customer phone number is required');
      return;
    }

    let itemListText = '';
    invoiceItems.forEach((item, idx) => {
      const total = item.qty * item.unitPrice;
      itemListText += `${idx + 1}. ${item.partName} (x${item.qty}) - ${currency}${total}\n`;
    });

    const msg = `*TAX INVOICE / ESTIMATE*\n\n` +
      `Hello *${customer.name}*,\n` +
      `Bill breakdown for your *${customer.bikeModel}* (${customer.regNo || 'Bespoke'}):\n\n` +
      `*Parts & Services:*\n${itemListText}\n` +
      `*Subtotal:* ${currency}${subtotal.toFixed(2)}\n` +
      `*Tax:* ${currency}${totalGst.toFixed(2)}\n` +
      (discount > 0 ? `*Discount:* ${currency}${discount}\n` : '') +
      `*Total Amount:* ${currency}${grandTotal}\n` +
      (advancePaid > 0 ? `*Advance Paid:* ${currency}${advancePaid}\n*Balance Due:* ${currency}${balanceDue}\n` : '') +
      (settings?.upiId ? `\n*UPI ID:* ${settings.upiId}\n` : '') +
      `\nThank you for choosing our workshop!`;

    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Distinct categories in partsList
  const dynamicCategories = ['All', ...Array.from(new Set(partsList.map(p => p.category || 'General')))];

  const filteredParts = partsList.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchPart.toLowerCase()) || 
                          (p.category || '').toLowerCase().includes(searchPart.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Customer & Motorcycle Specs Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative">
        
        {/* Header and Repeat Customer Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Bike className="w-4 h-4 text-slate-600" />
            <span>Customer & Vehicle Information</span>
          </div>

          {repeatCustomerInfo && (
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center">
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                Repeat Client ({repeatCustomerInfo.visitCount || 1} visits)
              </span>
              <button
                type="button"
                onClick={handleViewCustomerHistory}
                className="text-[11px] font-bold text-slate-700 hover:text-black underline flex items-center"
              >
                <History className="w-3.5 h-3.5 mr-1" /> View Past History
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative">
          
          {/* Customer Phone */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer Phone *</label>
            <input
              type="text"
              placeholder="10-digit mobile number"
              value={customer.phone}
              onChange={e => handleCustomerSearch('phone', e.target.value)}
              onFocus={() => { if (suggestedCustomers.length > 0) setShowSuggestions(true); }}
              className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          {/* Customer Name */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
            <input
              type="text"
              placeholder="e.g. Vikram Malhotra"
              value={customer.name}
              onChange={e => handleCustomerSearch('name', e.target.value)}
              onFocus={() => { if (suggestedCustomers.length > 0) setShowSuggestions(true); }}
              className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          {/* Motorcycle Make & Model (Multi-Brand Datalist) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Motorcycle Make & Model *</label>
            <input
              list="all-bike-models"
              value={customer.bikeModel}
              onChange={e => setCustomer({ ...customer, bikeModel: e.target.value })}
              className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
              placeholder="Select or enter bike model"
            />
            <datalist id="all-bike-models">
              {MOTORCYCLE_BRANDS.map(group => (
                group.models.map(m => (
                  <option key={`${group.brand}-${m}`} value={`${group.brand} ${m}`} />
                ))
              ))}
            </datalist>
          </div>

          {/* Reg / Chassis */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 mb-1">Reg / Chassis Number</label>
            <input
              type="text"
              placeholder="e.g. DL-01-AB-1234"
              value={customer.regNo}
              onChange={e => handleCustomerSearch('regNo', e.target.value.toUpperCase())}
              onFocus={() => { if (suggestedCustomers.length > 0) setShowSuggestions(true); }}
              className="w-full px-3 py-2 bg-white text-slate-900 font-medium uppercase placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          {/* Live Auto-Suggest Floating Dropdown */}
          {showSuggestions && suggestedCustomers.length > 0 && (
            <div className="absolute top-[68px] left-0 right-0 z-50 bg-white border border-slate-300 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
              <div className="p-2 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
                <span>Matching Saved Customers (Click to auto-fill)</span>
                <button type="button" onClick={() => setShowSuggestions(false)} className="text-slate-400 hover:text-black">✕</button>
              </div>
              {suggestedCustomers.map((cust) => (
                <div
                  key={cust.id || cust._id}
                  onClick={() => handleSelectCustomer(cust)}
                  className="p-3 hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900">{cust.name}</span>
                      <span className="text-[11px] font-mono text-slate-600">({cust.phone})</span>
                      {(cust.visitCount || 1) > 1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {cust.visitCount} visits
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {cust.bikeModel} • <span className="font-mono uppercase font-bold text-slate-800">{cust.regNo || 'No Reg'}</span>
                      {cust.lastKm > 0 && ` • Last KM: ${cust.lastKm}`}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                    Auto Fill ↵
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Secondary Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Service / Job Category</label>
            <input
              list="service-job-types"
              value={buildType}
              onChange={e => setBuildType(e.target.value)}
              className="w-full px-3 py-1.5 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              placeholder="e.g. Periodic Service, Custom Build"
            />
            <datalist id="service-job-types">
              {SERVICE_JOB_TYPES.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Odometer (KM)</label>
            <input
              type="number"
              placeholder="e.g. 12500"
              value={currentKm}
              onChange={e => setCurrentKm(e.target.value)}
              className="w-full px-3 py-1.5 bg-white text-slate-900 font-mono font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Next Service Reminder Interval</label>
            <select
              value={nextServiceMonths}
              onChange={e => setNextServiceMonths(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-white text-slate-900 font-medium border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value={0}>⚡ Due Today (For Instant Testing)</option>
              <option value={1}>In 1 Month</option>
              <option value={3}>In 3 Months (Standard)</option>
              <option value={6}>In 6 Months (Recommended)</option>
              <option value={12}>In 1 Year (Major)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Billing Workspace: Left Catalog, Right Invoice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side (Catalog & Custom Item) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Custom On-The-Fly Item */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                <Wrench className="w-3.5 h-3.5 mr-1 text-slate-600" /> Custom Labor / Service Rate
              </span>
              <label className="flex items-center space-x-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={customItem.isLabour}
                  onChange={e => setCustomItem({ ...customItem, isLabour: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-0"
                />
                <span>Is Labor / Service</span>
              </label>
            </div>
            <div className="grid grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Custom service/part description"
                value={customItem.name}
                onChange={e => setCustomItem({ ...customItem, name: e.target.value })}
                className="col-span-6 px-2.5 py-1.5 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <input
                type="number"
                placeholder={`Price (${currency})`}
                value={customItem.price}
                onChange={e => setCustomItem({ ...customItem, price: e.target.value })}
                className="col-span-3 px-2.5 py-1.5 bg-white text-slate-900 font-mono font-bold placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="col-span-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center transition-colors shadow-2xs"
              >
                <Plus className="w-4 h-4 mr-0.5" /> Add
              </button>
            </div>
          </div>

          {/* Catalog Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col h-[500px]">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 flex-wrap pb-1 mb-2.5">
              {dynamicCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search catalog items, rates..."
                value={searchPart}
                onChange={e => setSearchPart(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Catalog Items */}
            <div className="flex-grow overflow-y-auto space-y-1.5 pr-1">
              {filteredParts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  No catalog items found. Add custom items above or install templates in Settings.
                </div>
              ) : (
                filteredParts.map(part => {
                  const isLabour = part.isLabour;
                  return (
                    <div
                      key={part.id || part._id}
                      onClick={() => addItemToInvoice(part)}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-lg cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-slate-900">
                            {part.name}
                          </span>
                          {isLabour && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              Service
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-600 mt-0.5">
                          <span className="text-slate-950 font-mono font-bold">{currency}{part.basePrice}</span>
                          <span>•</span>
                          <span className="font-medium">Tax {part.gstRate}%</span>
                          {!isLabour && (
                            <>
                              <span>•</span>
                              <span className={part.stock < 5 ? 'text-red-600 font-bold' : 'text-slate-600'}>
                                Stock: {part.stock}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button className="p-1 rounded bg-white group-hover:bg-slate-900 group-hover:text-white border border-slate-300 text-slate-700 transition-colors shadow-2xs">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side (Invoice Details & Actions) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[560px]">
            
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Itemized Bill</h2>
                </div>
                <span className="text-xs font-semibold text-slate-600 font-mono">
                  {invoiceItems.length} items added
                </span>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto mb-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 uppercase tracking-wider font-bold">
                      <th className="py-2 px-2 text-left">Description</th>
                      <th className="py-2 px-2 text-center w-24">Qty</th>
                      <th className="py-2 px-2 text-right w-24">Rate ({currency})</th>
                      <th className="py-2 px-2 text-right w-16">Tax %</th>
                      <th className="py-2 px-2 text-right w-24">Total</th>
                      <th className="py-2 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-14 text-slate-400 font-medium italic">
                          No items added yet. Click items from the catalog on the left or add custom work.
                        </td>
                      </tr>
                    ) : (
                      invoiceItems.map((item, idx) => {
                        const lineBase = item.qty * item.unitPrice;
                        const lineGst = lineBase * (item.gstRate / 100);
                        const lineTotal = lineBase + lineGst;

                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-2 font-bold text-slate-900">
                              <p>{item.partName}</p>
                              {item.isLabour && <span className="text-[10px] text-purple-700 font-semibold">Labor / Service</span>}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <div className="inline-flex items-center space-x-1.5 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                                <button onClick={() => updateItemQty(idx, -1)} className="text-slate-700 hover:text-black font-bold text-xs">-</button>
                                <span className="font-mono font-bold text-slate-900 w-4 text-center">{item.qty}</span>
                                <button onClick={() => updateItemQty(idx, 1)} className="text-slate-700 hover:text-black font-bold text-xs">+</button>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-right font-mono">
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={e => updateItemPrice(idx, e.target.value)}
                                className="w-18 bg-white text-slate-900 font-bold border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 text-right text-slate-700 font-mono font-medium">{item.gstRate}%</td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-slate-950">{currency}{Math.round(lineTotal)}</td>
                            <td className="py-2 px-2 text-center">
                              <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-600 transition-colors">
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations & Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              
              {/* Calculations Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-600 font-semibold">Subtotal:</span>
                  <p className="text-sm font-mono font-bold text-slate-900">{currency}{subtotal.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-600 font-semibold">Total Tax:</span>
                  <p className="text-sm font-mono font-bold text-slate-900">{currency}{totalGst.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-600 font-semibold">Discount ({currency}):</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    className="w-full bg-white text-slate-900 font-mono font-bold border border-slate-300 rounded px-2 py-0.5 text-xs mt-0.5 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-slate-800 font-black uppercase">Grand Total:</span>
                  <p className="text-lg font-mono font-black text-slate-950">{currency}{grandTotal}</p>
                </div>
              </div>

              {/* Advance & Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                <div>
                  <label className="block text-slate-700 mb-0.5 font-bold">Advance Paid ({currency})</label>
                  <input
                    type="number"
                    value={advancePaid}
                    onChange={e => setAdvancePaid(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white text-emerald-800 font-mono font-bold border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-0.5 font-bold">Balance Due</label>
                  <p className="text-base font-mono font-black text-amber-800 pt-0.5">{currency}{balanceDue}</p>
                </div>
                <div>
                  <label className="block text-slate-700 mb-0.5 font-bold">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full bg-white text-slate-900 font-medium border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card / POS</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleSendWhatsAppBill}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center shadow-xs transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  WhatsApp Bill
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear bill items?')) setInvoiceItems([]);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveInvoice(true)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-bold rounded-lg text-xs flex items-center shadow-2xs transition-colors"
                    title="Save invoice and instantly download PDF file"
                  >
                    <Download className="w-4 h-4 mr-1 text-slate-700" />
                    Save & Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveInvoice(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center shadow-xs transition-colors"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    Save & Print
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Customer Past History Modal */}
      {isHistoryModalOpen && customerHistoryData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 w-full max-w-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-950 flex items-center">
                  <History className="w-5 h-5 text-slate-700 mr-2" />
                  Past Visits & Invoices: {customerHistoryData.customer.name}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {customerHistoryData.customer.bikeModel} • {customerHistoryData.customer.regNo || 'No Reg'} • Phone: {customerHistoryData.customer.phone}
                </p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {(!customerHistoryData.invoices || customerHistoryData.invoices.length === 0) ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">No previous invoices found for this customer.</p>
              ) : (
                customerHistoryData.invoices.map((inv, idx) => (
                  <div key={inv.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-900">
                          Invoice #{inv.invoiceNo || inv.id?.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-2 font-medium">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {inv.currentKm > 0 && <span className="text-[11px] text-slate-600 font-mono ml-2">({inv.currentKm} KM)</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-xs text-slate-950">{currency}{inv.grandTotal}</span>
                        <button
                          onClick={() => downloadInvoicePDF(inv, settings)}
                          className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[11px] font-bold flex items-center text-slate-800"
                        >
                          <Download className="w-3 h-3 mr-1 text-slate-600" /> PDF
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/80">
                      {inv.items?.map((it, i) => (
                        <span key={i} className="text-[10px] bg-white text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                          {it.partName} (x{it.qty})
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 mt-4">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
