import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Search, Plus, FileText, Wrench, MessageSquare, 
  Calendar, Phone, Bike, ChevronRight, Download, History, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

const API_URL = 'http://localhost:5000/api';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchSettings();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_URL}/customers`);
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
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

  const handleViewHistory = async (customerId) => {
    try {
      const res = await axios.get(`${API_URL}/customers/${customerId}/history`);
      setSelectedCustomerHistory(res.data);
      setIsHistoryModalOpen(true);
    } catch (err) {
      console.error('Error fetching history:', err);
      alert('Error fetching customer history');
    }
  };

  const handleDownloadInvoicePDF = (invoice) => {
    downloadInvoicePDF(invoice, settings);
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.bikeModel || '').toLowerCase().includes(q) ||
      (c.regNo || '').toLowerCase().includes(q)
    );
  });

  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter(c => (c.visitCount || 1) > 1).length;
  const totalRevenue = customers.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory & Vehicle History</h1>
            <p className="text-xs text-slate-500">Manage client profiles, repeat visits, past invoices, and vehicle history</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Billing
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Registered Clients</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCustomers}</p>
        </div>
        <div className="bg-white border border-emerald-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Repeat / Loyal Clients</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{repeatCustomers}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lifetime Customer Value</p>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer by name, phone number, motorcycle model, or registration number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Customers List Table / Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                <th className="p-3.5">Customer Name & Contact</th>
                <th className="p-3.5">Motorcycle Specs</th>
                <th className="p-3.5 text-center">Visits</th>
                <th className="p-3.5 text-right">Lifetime Spent (₹)</th>
                <th className="p-3.5">Last Visited</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-slate-400 font-medium italic">
                    No customers found. As you create invoices or job cards, customers are saved permanently.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => {
                  const custId = customer.id || customer._id;
                  const isRepeat = (customer.visitCount || 1) > 1;

                  return (
                    <tr key={custId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs">{customer.name}</span>
                          {isRepeat && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center">
                              <Award className="w-3 h-3 mr-0.5" /> Repeat
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 font-mono text-[11px] mt-0.5">{customer.phone}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-800">{customer.bikeModel}</p>
                        <p className="text-slate-500 uppercase font-mono text-[11px]">
                          {customer.regNo || 'No Reg Number'}
                        </p>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          isRepeat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {customer.visitCount || 1} {customer.visitCount === 1 ? 'visit' : 'visits'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-950">
                        ₹{(customer.totalSpent || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px]">
                        {customer.lastVisited 
                          ? new Date(customer.lastVisited).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'First Visit'}
                        {customer.lastKm > 0 && <span className="block text-slate-400 font-mono">{customer.lastKm} KM</span>}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleViewHistory(custId)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold transition-colors inline-flex items-center"
                          title="View Past Invoices & Job Cards"
                        >
                          <History className="w-3.5 h-3.5 mr-1 text-slate-600" />
                          History
                        </button>
                        <button
                          onClick={() => {
                            navigate(`/?customerName=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}&bikeModel=${encodeURIComponent(customer.bikeModel)}&regNo=${encodeURIComponent(customer.regNo || '')}`);
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors inline-flex items-center shadow-2xs"
                          title="Create New Invoice for this customer"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          New Bill
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

      {/* Customer Full History Modal */}
      {isHistoryModalOpen && selectedCustomerHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 w-full max-w-3xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {selectedCustomerHistory.customer.name} — Visit & Vehicle History
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedCustomerHistory.customer.bikeModel} • {selectedCustomerHistory.customer.regNo || 'Bespoke'} • Phone: {selectedCustomerHistory.customer.phone}
                </p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Lifetime Summary Card */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs">
              <div>
                <span className="text-slate-500 font-bold uppercase">Total Invoices</span>
                <p className="text-base font-black text-slate-900 font-mono mt-0.5">
                  {selectedCustomerHistory.invoices?.length || 0}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase">Total Spend</span>
                <p className="text-base font-black text-slate-900 font-mono mt-0.5">
                  ₹{selectedCustomerHistory.stats?.totalSpent?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase">Last Odometer</span>
                <p className="text-base font-black text-slate-900 font-mono mt-0.5">
                  {selectedCustomerHistory.stats?.lastOdometer || 0} KM
                </p>
              </div>
            </div>

            {/* Invoices Timeline */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Past Invoices & Work Done
              </h3>

              {(!selectedCustomerHistory.invoices || selectedCustomerHistory.invoices.length === 0) ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No past invoices recorded for this client.</p>
              ) : (
                selectedCustomerHistory.invoices.map((inv, idx) => (
                  <div key={inv.id || inv._id || idx} className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-xs">
                          Invoice #{inv.invoiceNo || inv.id?.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          • {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {inv.currentKm > 0 && (
                          <span className="text-[11px] text-slate-600 font-mono">
                            • {inv.currentKm} KM
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-xs text-slate-950">
                          ₹{inv.grandTotal}
                        </span>
                        <button
                          onClick={() => handleDownloadInvoicePDF(inv)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-[11px] font-bold flex items-center"
                          title="Download PDF Invoice"
                        >
                          <Download className="w-3 h-3 mr-1 text-slate-600" />
                          PDF
                        </button>
                        <button
                          onClick={() => {
                            setIsHistoryModalOpen(false);
                            navigate(`/print/${inv.id || inv._id}`);
                          }}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold"
                          title="View / Print Tax Invoice"
                        >
                          View Bill
                        </button>
                      </div>
                    </div>

                    {/* Item list chips */}
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                      {inv.items?.map((it, i) => (
                        <span key={i} className="text-[10px] bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-medium">
                          {it.partName} (x{it.qty})
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => {
                  const c = selectedCustomerHistory.customer;
                  navigate(`/?customerName=${encodeURIComponent(c.name)}&phone=${encodeURIComponent(c.phone)}&bikeModel=${encodeURIComponent(c.bikeModel)}&regNo=${encodeURIComponent(c.regNo || '')}`);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Create New Bill for {selectedCustomerHistory.customer.name}
              </button>

              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
