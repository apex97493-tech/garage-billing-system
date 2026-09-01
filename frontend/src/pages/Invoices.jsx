import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Search, Printer, Download, MessageSquare, 
  Trash2, Plus, Calendar, AlertCircle, CheckCircle2, TrendingUp, DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

const API_URL = 'http://localhost:5000/api';

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [whatsappStatus, setWhatsappStatus] = useState({ isConnected: false });
  const [stats, setStats] = useState({
    todaySales: 0,
    todayInvoicesCount: 0,
    monthSales: 0,
    monthInvoicesCount: 0,
    totalPendingBalance: 0,
    pendingInvoicesCount: 0,
    totalCustomers: 0
  });

  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Today', 'Pending', 'Month'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInvoices();
    fetchStats();
    fetchSettings();
    fetchWhatsappStatus();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(`${API_URL}/invoices`);
      setInvoices(res.data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`);
      if (res.data) setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      if (res.data) setSettings(res.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchWhatsappStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/whatsapp/status`);
      if (res.data) setWhatsappStatus(res.data);
    } catch (err) {
      // Backend starting
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await axios.delete(`${API_URL}/invoices/${id}`);
        fetchInvoices();
        fetchStats();
      } catch (err) {
        console.error('Error deleting invoice:', err);
        alert('Error deleting invoice.');
      }
    }
  };

  const handleDownloadPDF = (inv) => {
    downloadInvoicePDF(inv, settings);
  };

  const handleSendWhatsAppPDF = async (inv) => {
    const cust = inv.customer || { name: inv.customerName, phone: inv.customerPhone, bikeModel: inv.bikeModel, regNo: inv.regNo };
    const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    if (whatsappStatus.isConnected) {
      try {
        const res = await axios.post(`${API_URL}/invoices/${inv.id || inv._id}/send-whatsapp-pdf`);
        if (res.data.success) {
          alert(`Official PDF Invoice sent directly to ${cust.name} (${cust.phone}) over WhatsApp!`);
          return;
        }
      } catch (err) {
        console.warn('Bot send failed, falling back:', err);
      }
    }

    // Fallback: Download PDF and open WhatsApp Web
    downloadInvoicePDF(inv, settings);
    const currency = settings?.currency || '₹';

    const msg = `*TAX INVOICE — ${(settings?.shopName || 'WORKSHOP').toUpperCase()}*\n\n` +
      `Hello *${cust.name}*,\n\n` +
      `Here is your invoice for *${cust.bikeModel}* (${cust.regNo || 'Bespoke'}):\n` +
      `• Invoice No: #${inv.invoiceNo || inv.id?.slice(-6).toUpperCase()}\n` +
      `• Date: ${new Date(inv.createdAt).toLocaleDateString('en-IN')}\n` +
      `• Total Amount: ${currency}${inv.grandTotal}\n` +
      (inv.balanceDue > 0 ? `• *Balance Due: ${currency}${inv.balanceDue}*\n` : '• *Status: FULLY PAID*\n') +
      (settings?.upiId ? `\nPay via UPI: *${settings.upiId}*\n` : '') +
      `\n_PDF file downloaded to your PC. Please attach and send._\n` +
      `Thank you!\n${settings?.shopName || 'Workshop'}`;

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSendWhatsAppReminder = (inv) => {
    const cust = inv.customer || { name: inv.customerName, phone: inv.customerPhone, bikeModel: inv.bikeModel };
    const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const currency = settings?.currency || '₹';

    const msg = `*PAYMENT REMINDER — ${(settings?.shopName || 'WORKSHOP').toUpperCase()}*\n\n` +
      `Hello *${cust.name}*,\n\n` +
      `Friendly reminder regarding your motorcycle *${cust.bikeModel}* (Invoice #${inv.invoiceNo || inv.id?.slice(-6).toUpperCase()}):\n\n` +
      `• Total Bill Amount: ${currency}${inv.grandTotal}\n` +
      `• Advance Paid: ${currency}${inv.advancePaid || 0}\n` +
      `• *Pending Balance Due: ${currency}${inv.balanceDue}*\n\n` +
      (settings?.upiId ? `You can pay via UPI: *${settings.upiId}*\n\n` : '') +
      `Thank you!\n${settings?.shopName || 'Workshop'}`;

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const currency = settings?.currency || '₹';
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = new Date().toISOString().slice(0, 7);

  const filteredInvoices = invoices.filter(inv => {
    const invDate = (inv.createdAt || '').slice(0, 10);
    const invMonth = (inv.createdAt || '').slice(0, 7);

    let matchTab = true;
    if (activeTab === 'Today') matchTab = invDate === todayStr;
    else if (activeTab === 'Month') matchTab = invMonth === monthStr;
    else if (activeTab === 'Pending') matchTab = (inv.balanceDue || 0) > 0;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchTab;

    const cust = inv.customer || {};
    const matchSearch = 
      (inv.invoiceNo || '').toLowerCase().includes(q) ||
      (inv.customerName || cust.name || '').toLowerCase().includes(q) ||
      (inv.customerPhone || cust.phone || '').includes(q) ||
      (inv.bikeModel || cust.bikeModel || '').toLowerCase().includes(q) ||
      (inv.regNo || cust.regNo || '').toLowerCase().includes(q);

    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales Reports & Past Invoices</h1>
            <p className="text-xs text-slate-500">Track daily revenue, pending balance collections, and reprint customer bills</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New Bill
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Today's Revenue</p>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{currency}{stats.todaySales.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{stats.todayInvoicesCount} bills generated today</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">This Month's Sales</p>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{currency}{stats.monthSales.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{stats.monthInvoicesCount} invoices this month</p>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Pending Balance (Udhaar)</p>
          <p className="text-2xl font-black text-amber-800 mt-1 font-mono">{currency}{stats.totalPendingBalance.toLocaleString()}</p>
          <p className="text-[11px] text-amber-700 mt-0.5 font-bold">{stats.pendingInvoicesCount} unpaid balances due</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Registered Clients</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalCustomers}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Permanent workshop directory</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              activeTab === 'All'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Bills ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('Today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              activeTab === 'Today'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Today's Bills ({invoices.filter(i => (i.createdAt || '').slice(0, 10) === todayStr).length})
          </button>
          <button
            onClick={() => setActiveTab('Pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border flex items-center space-x-1.5 ${
              activeTab === 'Pending'
                ? 'bg-amber-800 text-white border-amber-800 shadow-2xs'
                : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <span>Pending Balance Due</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">
              {invoices.filter(i => (i.balanceDue || 0) > 0).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('Month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              activeTab === 'Month'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            This Month
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search bill #, customer, bike..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Customer & Contact</th>
                <th className="p-3.5">Motorcycle Model</th>
                <th className="p-3.5 text-right">Total ({currency})</th>
                <th className="p-3.5 text-right">Advance ({currency})</th>
                <th className="p-3.5 text-right">Balance ({currency})</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-slate-400 font-medium italic">
                    No invoices match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const invId = inv.id || inv._id;
                  const cust = inv.customer || { name: inv.customerName, phone: inv.customerPhone, bikeModel: inv.bikeModel, regNo: inv.regNo };
                  const isPending = (inv.balanceDue || 0) > 0;

                  return (
                    <tr key={invId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        #{inv.invoiceNo || invId.slice(-6).toUpperCase()}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{cust.name}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{cust.phone}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-800">{cust.bikeModel}</p>
                        <p className="text-slate-500 uppercase font-mono text-[11px]">{cust.regNo || 'Bespoke'}</p>
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-950">
                        {currency}{inv.grandTotal}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-800">
                        {inv.advancePaid > 0 ? `${currency}${inv.advancePaid}` : '—'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black">
                        {isPending ? (
                          <span className="text-amber-800">{currency}{inv.balanceDue}</span>
                        ) : (
                          <span className="text-slate-400">{currency}0</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {isPending ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Due {currency}{inv.balanceDue}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {isPending && (
                          <button
                            onClick={() => handleSendWhatsAppReminder(inv)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-bold transition-colors inline-flex items-center"
                            title="Send Balance Due WhatsApp Reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1 text-amber-700" />
                            Remind
                          </button>
                        )}
                        <button
                          onClick={() => handleSendWhatsAppPDF(inv)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors inline-flex items-center shadow-2xs"
                          title="Send PDF Document over WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1" />
                          WhatsApp PDF
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold transition-colors inline-flex items-center"
                          title="Download PDF Bill"
                        >
                          <Download className="w-3.5 h-3.5 mr-1 text-slate-600" />
                          PDF
                        </button>
                        <button
                          onClick={() => navigate(`/print/${invId}`)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors inline-flex items-center shadow-2xs"
                          title="View / Print Tax Invoice"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" />
                          Bill
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invId)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors inline-flex items-center"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
