import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Save, HardDrive, Download, Upload, CheckCircle2, 
  RotateCcw, AlertTriangle, Sparkles, Building2, 
  Smartphone, QrCode, ShieldCheck, RefreshCw, Unlink
} from 'lucide-react';
import { WORKSHOP_TYPES } from '../utils/bikeData';

const API_URL = 'http://localhost:5000/api';

const CATALOG_PACKS = [
  {
    id: 'multi_brand_service',
    title: 'Multi-Brand Service & Maintenance Pack',
    desc: 'Synthetic oils, filters, brake pads, chain sprockets, fork overhaul, general service labor'
  },
  {
    id: 'custom_modifier',
    title: 'Custom Modification & Fabrication Pack',
    desc: 'Free-flow exhausts, cafe seats, clip-ons, LED headlights, TIG welding, candy paint'
  },
  {
    id: 'superbike_performance',
    title: 'Superbike & Performance Tuning Pack',
    desc: 'Motul 300V, Brembo pads, BMC air filters, ECU flashing, dyno tuning, quickshifters'
  },
  {
    id: 'ev_workshop',
    title: 'Electric 2-Wheeler & EV Service Pack',
    desc: 'Battery diagnostics, BLDC motor hub overhaul, regenerative brakes, controller flashing'
  }
];

export default function Settings() {
  const [settings, setSettings] = useState({
    shopName: '',
    tagline: '',
    workshopType: 'multi_brand_service',
    contactNumber: '',
    address: '',
    gstin: '',
    upiId: '',
    currency: '₹',
    taxLabel: 'GST',
    autoSendBillWhatsapp: true,
    autoSendServiceReminders: true,
    reminderDaysBefore: 3,
    bankDetails: '',
    terms: ''
  });

  const [saved, setSaved] = useState(false);
  const [templateStatus, setTemplateStatus] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('');
  const [dbStats, setDbStats] = useState({ customers: 0, invoices: 0, jobCards: 0, parts: 0 });

  // WhatsApp Free Bot State
  const [whatsappStatus, setWhatsappStatus] = useState({
    isConnected: false,
    isConnecting: false,
    connectedPhone: null,
    hasQR: false,
    qrCodeDataUrl: null
  });
  const [pollingQR, setPollingQR] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchStats();
    fetchWhatsappStatus();

    const interval = setInterval(fetchWhatsappStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      if (res.data) setSettings(res.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const [cRes, iRes, jRes, pRes] = await Promise.all([
        axios.get(`${API_URL}/customers`),
        axios.get(`${API_URL}/invoices`),
        axios.get(`${API_URL}/job-cards`),
        axios.get(`${API_URL}/parts`),
      ]);
      setDbStats({
        customers: cRes.data.length,
        invoices: iRes.data.length,
        jobCards: jRes.data.length,
        parts: pRes.data.length
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchWhatsappStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/whatsapp/status`);
      setWhatsappStatus(res.data);
    } catch (err) {
      // Backend starting
    }
  };

  const handleConnectWhatsapp = async () => {
    try {
      await axios.post(`${API_URL}/whatsapp/connect`);
      fetchWhatsappStatus();
    } catch (err) {
      console.error('Error initiating WhatsApp pairing:', err);
    }
  };

  const handleDisconnectWhatsapp = async () => {
    if (window.confirm('Disconnect your workshop WhatsApp session?')) {
      try {
        await axios.post(`${API_URL}/whatsapp/disconnect`);
        fetchWhatsappStatus();
      } catch (err) {
        console.error('Error disconnecting WhatsApp:', err);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/settings`, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Error saving workshop settings.');
    }
  };

  const handleApplyTemplate = async (templateKey, mode = 'replace') => {
    const confirmMsg = mode === 'replace' 
      ? `Replace parts catalog with the '${templateKey}' preset template? (Custom added items will be replaced)`
      : `Add '${templateKey}' preset items to your existing catalog?`;
    
    if (window.confirm(confirmMsg)) {
      try {
        await axios.post(`${API_URL}/catalog/apply-template`, { templateKey, mode });
        setTemplateStatus(`Applied '${templateKey}' template successfully!`);
        fetchStats();
        setTimeout(() => setTemplateStatus(''), 4000);
      } catch (err) {
        console.error('Error applying template:', err);
        alert('Error applying catalog template.');
      }
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await axios.get(`${API_URL}/backup`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `garage_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Error exporting backup:', err);
      alert('Error downloading backup file.');
    }
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        await axios.post(`${API_URL}/restore`, parsed);
        setRestoreStatus('Database restored successfully from file!');
        fetchSettings();
        fetchStats();
        setTimeout(() => setRestoreStatus(''), 4000);
      } catch (err) {
        console.error('Error restoring backup:', err);
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = async () => {
    const confirmed = window.confirm(
      'WARNING: This will clear all sample customers and test invoices for a clean fresh start. Parts catalog will be preserved. Are you sure?'
    );
    if (confirmed) {
      try {
        await axios.post(`${API_URL}/reset-data`);
        alert('Workshop database reset to fresh clean start!');
        fetchSettings();
        fetchStats();
      } catch (err) {
        console.error('Error resetting database:', err);
        alert('Error resetting database.');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h1 className="text-xl font-black text-slate-950 tracking-tight">Workshop Profile & Automation Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">Configure your business profile, connect free automated WhatsApp, customize taxes, and manage data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Columns: Workshop Identity Form & Automated Messaging Toggles */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Main Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center">
              <Building2 className="w-4 h-4 mr-1.5 text-slate-700" />
              Workshop Business Profile & Tax Setup
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Workshop Type / Specialization */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Workshop Type / Specialization</label>
                <select
                  value={settings.workshopType || 'multi_brand_service'}
                  onChange={e => setSettings({ ...settings, workshopType: e.target.value })}
                  className="w-full px-3 py-2 bg-white text-slate-950 font-bold border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  {WORKSHOP_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {WORKSHOP_TYPES.find(t => t.id === settings.workshopType)?.desc || ''}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Workshop / Studio Name *</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 bg-white text-slate-950 font-bold placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  value={settings.shopName}
                  onChange={e => setSettings({ ...settings, shopName: e.target.value })}
                  placeholder="e.g. Apex Moto Works / Speed Custom Motorcycles"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  value={settings.tagline}
                  onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                  placeholder="e.g. Multi-Brand Motorcycle Service, Modifications & Tuning"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone *</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    value={settings.contactNumber}
                    onChange={e => setSettings({ ...settings, contactNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white text-slate-900 font-bold placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none text-center"
                    value={settings.currency || '₹'}
                    onChange={e => setSettings({ ...settings, currency: e.target.value })}
                    placeholder="₹"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tax Label</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white text-slate-900 font-medium uppercase placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none text-center"
                    value={settings.taxLabel || 'GST'}
                    onChange={e => setSettings({ ...settings, taxLabel: e.target.value.toUpperCase() })}
                    placeholder="GST / VAT"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tax / GSTIN Number (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white text-slate-900 font-medium uppercase placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    value={settings.gstin}
                    onChange={e => setSettings({ ...settings, gstin: e.target.value })}
                    placeholder="07AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">UPI ID (For Invoice QR Code)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    value={settings.upiId}
                    onChange={e => setSettings({ ...settings, upiId: e.target.value })}
                    placeholder="workshop@upi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Workshop Address *</label>
                <textarea
                  required
                  rows={2}
                  className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Plot 42, Main Auto Market..."
                ></textarea>
              </div>

              {/* Automated Messaging Toggles */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Automated Messaging Preferences
                </h3>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSendBillWhatsapp ?? true}
                    onChange={e => setSettings({ ...settings, autoSendBillWhatsapp: e.target.checked })}
                    className="rounded text-slate-900 focus:ring-0 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Auto-Send Bill on POS Checkout</span>
                    <span className="text-[11px] text-slate-600 font-medium">Dispatches digital tax invoice breakdown to customer's WhatsApp instantly upon saving bill</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSendServiceReminders ?? true}
                    onChange={e => setSettings({ ...settings, autoSendServiceReminders: e.target.checked })}
                    className="rounded text-slate-900 focus:ring-0 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Daily Automated Periodic Service Reminders</span>
                    <span className="text-[11px] text-slate-600 font-medium">Daily 10:00 AM background check to notify customers whose motorcycle is due for periodic maintenance</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Invoice Terms & Warranty Conditions</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none leading-relaxed"
                  value={settings.terms}
                  onChange={e => setSettings({ ...settings, terms: e.target.value })}
                  placeholder="1. Estimate valid for 7 days. 2. Workmanship guaranteed for 30 days..."
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {saved ? (
                  <span className="text-emerald-800 text-xs font-bold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Settings saved successfully!
                  </span>
                ) : <span></span>}
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Settings
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column: Free WhatsApp Pairing & Industry Packs */}
        <div className="space-y-4">
          
          {/* 100% Free WhatsApp Link Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>100% Free WhatsApp Bot</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                whatsappStatus.isConnected 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {whatsappStatus.isConnected ? '🟢 Linked' : '⚪ Offline'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Link your shop phone once. All bills and service reminders send automatically from your WhatsApp at <strong>₹0 cost</strong>.
            </p>

            {whatsappStatus.isConnected ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center text-emerald-900 font-bold">
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Connected Number: {whatsappStatus.connectedPhone || 'Linked Device'}
                </div>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Automated background bill dispatch and daily service reminders are active.
                </p>
                <button
                  onClick={handleDisconnectWhatsapp}
                  className="w-full py-1.5 px-3 bg-white text-red-700 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center shadow-2xs"
                >
                  <Unlink className="w-3.5 h-3.5 mr-1" />
                  Unlink WhatsApp
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {whatsappStatus.qrCodeDataUrl ? (
                  <div className="text-center p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-[11px] font-bold text-slate-800">
                      Open WhatsApp on Phone → Linked Devices → Scan this QR:
                    </p>
                    <img 
                      src={whatsappStatus.qrCodeDataUrl} 
                      alt="WhatsApp Pairing QR" 
                      className="w-44 h-44 mx-auto rounded-lg border border-slate-300 bg-white p-1 shadow-xs"
                    />
                    <p className="text-[10px] text-slate-500 font-medium">
                      QR refreshes automatically. Scan once to pair forever.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectWhatsapp}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center transition-colors shadow-xs"
                  >
                    <QrCode className="w-4 h-4 mr-1.5" />
                    Show WhatsApp Pairing QR
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Industry Preset Templates Pack */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Industry Catalog Packs</span>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Load instant pre-configured parts & labor rate catalogs tailored for different garage types:
            </p>

            <div className="space-y-2.5 pt-1">
              {CATALOG_PACKS.map(pack => (
                <div key={pack.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{pack.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-normal">
                    {pack.desc}
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(pack.id, 'replace')}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold transition-colors"
                    >
                      Install Pack
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(pack.id, 'append')}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-750 rounded text-[11px] font-bold transition-colors"
                    >
                      + Merge
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {templateStatus && (
              <p className="text-xs font-bold text-emerald-800 text-center bg-emerald-50 p-2 rounded border border-emerald-200">
                {templateStatus}
              </p>
            )}
          </div>

          {/* Backup & Factory Reset */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Backup & Maintenance
            </h3>

            <div>
              <button
                onClick={handleExportBackup}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-lg text-xs font-bold flex items-center justify-center transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-slate-700" />
                Export Backup (JSON)
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-dashed border-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-700" />
                Restore from Backup JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
              {restoreStatus && (
                <p className="text-[11px] text-emerald-800 font-bold mt-1.5 text-center">
                  {restoreStatus}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleFactoryReset}
                className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded-lg text-xs font-bold flex items-center justify-center transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-red-700" />
                Reset to Clean Workshop
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
