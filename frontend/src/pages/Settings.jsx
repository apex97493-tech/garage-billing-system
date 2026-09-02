import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Save, HardDrive, Download, Upload, CheckCircle2, 
  Building2, Smartphone, QrCode, ShieldCheck, Unlink,
  Image as ImageIcon, Trash2, RefreshCw
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    logo: '',
    shopName: 'ROYAL ENFIELD WORKSHOP STUDIO',
    tagline: 'Genuine Parts, Periodic Service & Maintenance',
    contactNumber: '+91 98765 43210',
    address: 'Shop No. 12, Main Auto Market, Industrial Area',
    gstin: '',
    upiId: 'workshop@upi',
    currency: '₹',
    taxLabel: 'GST',
    autoSendBillWhatsapp: true,
    autoSendServiceReminders: true,
    reminderDaysBefore: 3,
    bankDetails: '',
    terms: '1. Estimate is valid for 7 days from issue date.\n2. Replaced old parts must be claimed at delivery.\n3. All repair workmanship is guaranteed for 30 days.'
  });

  const [saved, setSaved] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState('');
  const [dbStats, setDbStats] = useState({ customers: 0, invoices: 0, parts: 0 });
  const [disconnecting, setDisconnecting] = useState(false);
  const fileInputRef = useRef(null);

  // WhatsApp Free Bot State
  const [whatsappStatus, setWhatsappStatus] = useState({
    isConnected: false,
    isConnecting: false,
    connectedPhone: null,
    hasQR: false,
    qrCodeDataUrl: null
  });

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
      const [cRes, iRes, pRes] = await Promise.all([
        axios.get(`${API_URL}/customers`),
        axios.get(`${API_URL}/invoices`),
        axios.get(`${API_URL}/parts`),
      ]);
      setDbStats({
        customers: cRes.data.length,
        invoices: iRes.data.length,
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
    if (window.confirm('Are you sure you want to disconnect this WhatsApp number?')) {
      setDisconnecting(true);
      try {
        setWhatsappStatus({
          isConnected: false,
          isConnecting: false,
          connectedPhone: null,
          hasQR: false,
          qrCodeDataUrl: null
        });
        await axios.post(`${API_URL}/whatsapp/disconnect`);
        setTimeout(() => {
          fetchWhatsappStatus();
          setDisconnecting(false);
        }, 800);
      } catch (err) {
        console.error('Error disconnecting WhatsApp:', err);
        setDisconnecting(false);
        alert('Failed to disconnect WhatsApp.');
      }
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSettings(prev => ({ ...prev, logo: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logo: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleExportBackup = async () => {
    try {
      const res = await axios.get(`${API_URL}/backup`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `workshop_backup_${new Date().toISOString().slice(0,10)}.json`);
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

  const formatDisplayPhone = (p) => {
    if (!p) return '';
    const clean = p.replace(/[^0-9]/g, '');
    if (clean.length === 12 && clean.startsWith('91')) {
      return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
    }
    return `+${clean}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h1 className="text-xl font-black text-slate-950 tracking-tight">Workshop Profile & Automation Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Customize your workshop name, logo, phone number, automated WhatsApp, and billing setup
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Columns: Workshop Profile & Setup */}
        <div className="lg:col-span-2 space-y-4">
          
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
            
            {/* Workshop Logo Block */}
            <div className="border-b border-slate-100 pb-5">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center">
                <ImageIcon className="w-4 h-4 mr-1.5 text-slate-700" />
                Workshop Logo (For Invoices & Bills)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-lg border border-slate-300 bg-white flex items-center justify-center p-1 overflow-hidden shadow-2xs shrink-0">
                  {settings.logo ? (
                    <img src={settings.logo} alt="Workshop Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] font-bold block">No Logo</span>
                    </div>
                  )}
                </div>

                {/* Upload & Remove Controls */}
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <p className="text-xs font-bold text-slate-900">Upload Shop Logo / Seal</p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Recommended: PNG or JPG with transparent or white background. Appears automatically on all printed bills and WhatsApp PDF invoices.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs flex items-center"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      {settings.logo ? 'Change Logo' : 'Upload Logo'}
                    </label>

                    {settings.logo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Shop Details */}
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-1.5 text-slate-700" />
                Workshop Business Profile & Tax Setup
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Workshop Name *</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 bg-white text-slate-950 font-bold placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  value={settings.shopName}
                  onChange={e => setSettings({ ...settings, shopName: e.target.value })}
                  placeholder="e.g. Royal Enfield Workshop Studio"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  value={settings.tagline}
                  onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                  placeholder="e.g. Genuine Spares, Periodic Service & Maintenance"
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
                    placeholder="GST"
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">UPI ID (For Instant QR on Bills)</label>
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Workshop Full Address *</label>
                <textarea
                  required
                  rows={2}
                  className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Shop No. 12, Main Auto Market, Near Bus Stand..."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bank Account Details (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  value={settings.bankDetails}
                  onChange={e => setSettings({ ...settings, bankDetails: e.target.value })}
                  placeholder="HDFC Bank | A/C: 502000... | IFSC: HDFC0001234"
                />
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
            </div>

            {/* Automated Messaging Preferences */}
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

        {/* Right Column: Free WhatsApp Pairing & Data Backup */}
        <div className="space-y-4">
          
          {/* Professional WhatsApp Service Integration Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Messaging Service</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                whatsappStatus.isConnected 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {whatsappStatus.isConnected ? '🟢 Connected' : '⚪ Disconnected'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Connect your workshop's WhatsApp number to automatically dispatch PDF bills and periodic service reminders to your customers.
            </p>

            {whatsappStatus.isConnected ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center text-emerald-900 font-bold">
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                  <span>Linked Phone: {formatDisplayPhone(whatsappStatus.connectedPhone) || 'Workshop Device'}</span>
                </div>
                <p className="text-[11px] text-emerald-800 font-medium leading-normal">
                  Automatic invoice document delivery and service maintenance reminders are active.
                </p>
                <button
                  type="button"
                  disabled={disconnecting}
                  onClick={handleDisconnectWhatsapp}
                  className="w-full py-2 px-3 bg-white text-red-700 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center shadow-2xs disabled:opacity-50"
                >
                  <Unlink className="w-3.5 h-3.5 mr-1.5" />
                  {disconnecting ? 'Disconnecting Number...' : 'Disconnect Number'}
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {whatsappStatus.qrCodeDataUrl ? (
                  <div className="text-center p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-[11px] font-bold text-slate-800">
                      Open WhatsApp on Phone → Linked Devices → Scan this QR Code:
                    </p>
                    <img 
                      src={whatsappStatus.qrCodeDataUrl} 
                      alt="WhatsApp Pairing QR" 
                      className="w-44 h-44 mx-auto rounded-lg border border-slate-300 bg-white p-1 shadow-xs"
                    />
                    <p className="text-[10px] text-slate-500 font-medium">
                      Point your phone camera to pair your workshop number.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectWhatsapp}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center transition-colors shadow-xs"
                  >
                    <QrCode className="w-4 h-4 mr-1.5" />
                    Link WhatsApp Number
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Database Backup & Safety */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>Data Backup & Safety</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-medium text-slate-600">
                <span>Total Genuine Parts:</span>
                <strong className="text-slate-900 font-mono">{dbStats.parts.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>Customer Records:</span>
                <strong className="text-slate-900 font-mono">{dbStats.customers.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>Invoices Generated:</span>
                <strong className="text-slate-900 font-mono">{dbStats.invoices.toLocaleString()}</strong>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleExportBackup}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export Complete Data Backup
              </button>

              <label className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                Restore Data from File
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              {restoreStatus && (
                <p className="text-xs text-emerald-700 font-bold text-center">
                  {restoreStatus}
                </p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
