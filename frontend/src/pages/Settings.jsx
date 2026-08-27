import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    shopName: '', contactNumber: '', address: '', gstin: '', upiId: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      if (res.data) setSettings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/settings`, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Garage Profile Settings</h1>
      
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
          <input required type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 bg-gray-50" 
            value={settings.shopName} onChange={e => setSettings({...settings, shopName: e.target.value})} />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
          <input required type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 bg-gray-50" 
            value={settings.contactNumber} onChange={e => setSettings({...settings, contactNumber: e.target.value})} />
          <p className="text-xs text-gray-500 mt-1">This number will be shown in invoices and WhatsApp reminders.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
          <textarea required rows="3" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 bg-gray-50" 
            value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})}></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN (Optional)</label>
            <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 bg-gray-50 uppercase" 
              value={settings.gstin} onChange={e => setSettings({...settings, gstin: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (Optional)</label>
            <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 bg-gray-50" 
              value={settings.upiId} onChange={e => setSettings({...settings, upiId: e.target.value})} placeholder="shop@upi" />
          </div>
        </div>

        <div className="pt-6 border-t flex items-center justify-between">
          {saved ? <span className="text-green-600 font-medium">Settings saved successfully!</span> : <span></span>}
          <button type="submit" className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold flex items-center shadow-md transition-colors">
            <Save className="w-5 h-5 mr-2" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
