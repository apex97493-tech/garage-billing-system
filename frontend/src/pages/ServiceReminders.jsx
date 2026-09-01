import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BellRing, Calendar, CheckCircle2, AlertTriangle, MessageSquare, 
  Send, RotateCw, Bike, Clock, Search, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

export default function ServiceReminders() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState({ isConnected: false });
  const [sendResult, setSendResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchReminders();
    fetchWhatsappStatus();
    fetchSettings();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/reminders/due`);
      setReminders(res.data);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsappStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/whatsapp/status`);
      setWhatsappStatus(res.data);
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
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

  const handleSendAllDue = async () => {
    if (!whatsappStatus.isConnected) {
      alert('Your WhatsApp is not connected. Please go to Settings & Backup to link your WhatsApp by scanning the QR code, or send reminders individually.');
      return;
    }

    if (window.confirm('Send automated WhatsApp service reminders to all due customers now?')) {
      setSendingAll(true);
      try {
        const res = await axios.post(`${API_URL}/reminders/send-due`);
        setSendResult(res.data);
        fetchReminders();
        setTimeout(() => setSendResult(null), 6000);
      } catch (err) {
        console.error('Error sending all reminders:', err);
        alert('Error sending service reminders.');
      } finally {
        setSendingAll(false);
      }
    }
  };

  const handleSendSingleReminder = async (item) => {
    const cust = item.customer || {};
    const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // If local WhatsApp Bot is connected, send via backend bot
    if (whatsappStatus.isConnected) {
      try {
        const res = await axios.post(`${API_URL}/reminders/send-single/${item.invoiceId}`);
        if (res.data.success) {
          alert(`Automated service reminder sent to ${cust.name} (${cust.phone})!`);
          fetchReminders();
          return;
        }
      } catch (err) {
        console.warn('Backend bot send failed, falling back to 1-click WhatsApp Web:', err);
      }
    }

    // Fallback: 1-Click WhatsApp Web / Desktop Dispatch
    const dueDateStr = new Date(item.nextServiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const shopName = (settings?.shopName || 'MOTO WORKSHOP').toUpperCase();
    const address = settings?.address || '';
    const phone = settings?.contactNumber || '';

    const msg = `🏍️ *PERIODIC SERVICE REMINDER — ${shopName}*\n` +
      `═════════════════════════════════════\n\n` +
      `Hello *${cust.name}*,\n\n` +
      `This is a friendly reminder that your motorcycle *${cust.bikeModel}* (${cust.regNo || 'Bespoke'}) is due for its periodic maintenance service!\n\n` +
      `📅 *Target Service Date:* ${dueDateStr}\n` +
      (item.lastKm > 0 ? `⏱️ *Last Service KM:* ${item.lastKm} KM\n` : '') +
      (item.nextServiceKm > 0 ? `🎯 *Next Service KM:* ~${item.nextServiceKm} KM\n\n` : '\n') +
      `Regular periodic servicing keeps your engine smooth, optimizes fuel efficiency, and ensures maximum riding safety.\n\n` +
      `📍 *Workshop Address:*\n${address}\n` +
      `📞 *Call / WhatsApp for Appointment:* ${phone}\n\n` +
      `_Thank you for choosing ${shopName}. Ride Safe!_`;

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredReminders = reminders.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const cust = r.customer || {};
    return (
      (cust.name || '').toLowerCase().includes(q) ||
      (cust.phone || '').includes(q) ||
      (cust.bikeModel || '').toLowerCase().includes(q) ||
      (cust.regNo || '').toLowerCase().includes(q)
    );
  });

  const totalDue = reminders.length;
  const overdueCount = reminders.filter(r => r.isOverdue).length;
  const sentCount = reminders.filter(r => r.reminderSent).length;
  const pendingCount = reminders.filter(r => !r.reminderSent).length;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Periodic Service Reminders & Due Center</h1>
            <p className="text-xs text-slate-500">Automated motorcycle periodic service tracking and customer retention reminders</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchReminders}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 transition-colors shadow-2xs"
            title="Refresh List"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSendAllDue}
            disabled={sendingAll || pendingCount === 0}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs flex items-center transition-colors"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {sendingAll ? 'Sending Reminders...' : `Send All Due (${pendingCount})`}
          </button>
        </div>
      </div>

      {/* WhatsApp Status Alert Banner */}
      <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
        whatsappStatus.isConnected 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center space-x-2">
          {whatsappStatus.isConnected ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>100% Free Automated WhatsApp Active:</strong> Connected to your phone ({whatsappStatus.connectedPhone || 'Linked'}). Automated daily service reminders are active at 10:00 AM!
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>WhatsApp Not Linked Yet:</strong> Go to <strong>Settings & Backup</strong> to scan the free QR code once. You can also send 1-click reminders directly via WhatsApp Web below.
              </span>
            </>
          )}
        </div>

        <button
          onClick={() => navigate('/settings')}
          className="px-2.5 py-1 rounded bg-white text-slate-900 font-bold border border-slate-300 hover:bg-slate-50 transition-colors shrink-0 shadow-2xs"
        >
          WhatsApp Setup
        </button>
      </div>

      {/* Send Result Notification */}
      {sendResult && (
        <div className="p-3 bg-slate-900 text-white rounded-xl text-xs flex items-center justify-between shadow-xs">
          <span>
            Dispatched {sendResult.sentCount} service reminders successfully ({sendResult.failedCount} skipped or offline).
          </span>
          <button onClick={() => setSendResult(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Due / Upcoming</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalDue}</p>
        </div>

        <div className="bg-white border border-red-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-red-800 font-bold uppercase tracking-wider">Overdue for Service</p>
          <p className="text-2xl font-black text-red-800 mt-1">{overdueCount}</p>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Pending Reminders</p>
          <p className="text-2xl font-black text-amber-800 mt-1">{pendingCount}</p>
        </div>

        <div className="bg-white border border-emerald-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Reminders Sent</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{sentCount}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search due customers by name, phone, motorcycle model, or reg number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Reminders List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                <th className="p-3.5">Customer & Phone</th>
                <th className="p-3.5">Motorcycle Details</th>
                <th className="p-3.5">Due Service Date</th>
                <th className="p-3.5">Odometer Details</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReminders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-slate-400 font-medium italic">
                    No motorcycles currently due for service. As you create invoices with 3/6 month intervals, they will appear here automatically.
                  </td>
                </tr>
              ) : (
                filteredReminders.map(item => {
                  const cust = item.customer || {};
                  const isOverdue = item.isOverdue;

                  return (
                    <tr key={item.invoiceId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{cust.name}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{cust.phone}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-800">{cust.bikeModel}</p>
                        <p className="text-slate-500 uppercase font-mono text-[11px]">{cust.regNo || 'Bespoke'}</p>
                      </td>
                      <td className="p-3.5">
                        <p className={`font-bold ${isOverdue ? 'text-red-700' : 'text-slate-800'}`}>
                          {new Date(item.nextServiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {isOverdue ? `Overdue by ${Math.abs(item.daysDiff)} days` : `Due in ${item.daysDiff} days`}
                        </p>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {item.lastKm > 0 && <p className="font-bold">Last: {item.lastKm} KM</p>}
                        {item.nextServiceKm > 0 && <p className="text-[11px] text-slate-500">Target: ~{item.nextServiceKm} KM</p>}
                      </td>
                      <td className="p-3.5 text-center">
                        {item.reminderSent ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Reminded
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-800 border border-red-200 inline-flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1 text-red-600" /> Overdue
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-amber-600" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleSendSingleReminder(item)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors inline-flex items-center shadow-2xs"
                          title="Send Service Due WhatsApp Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1" />
                          Send WhatsApp
                        </button>
                        <button
                          onClick={() => {
                            navigate(`/?customerName=${encodeURIComponent(cust.name)}&phone=${encodeURIComponent(cust.phone)}&bikeModel=${encodeURIComponent(cust.bikeModel)}&regNo=${encodeURIComponent(cust.regNo || '')}&buildType=General Periodic Service & Tuning`);
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors inline-flex items-center shadow-2xs"
                          title="Start Periodic Service Bill"
                        >
                          Create Bill
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
