import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ClipboardList, Plus, Search, Edit3, Trash2, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOTORCYCLE_BRANDS, SERVICE_JOB_TYPES } from '../utils/bikeData';

const API_URL = 'http://localhost:5000/api';

const STAGES = [
  { key: 'Concept', label: 'Estimate / Diagnosis', color: 'border-purple-300 text-purple-800 bg-purple-50' },
  { key: 'Teardown', label: 'Teardown & Prep', color: 'border-blue-300 text-blue-800 bg-blue-50' },
  { key: 'Fabrication', label: 'Service & Fabrication', color: 'border-orange-300 text-orange-800 bg-orange-50' },
  { key: 'Paint', label: 'Paint / Detailing', color: 'border-pink-300 text-pink-800 bg-pink-50' },
  { key: 'Assembly', label: 'Assembly & Tuning', color: 'border-amber-300 text-amber-800 bg-amber-50' },
  { key: 'DynoTest', label: 'QC & Test Ride', color: 'border-cyan-300 text-cyan-800 bg-cyan-50' },
  { key: 'Completed', label: 'Ready for Delivery', color: 'border-emerald-300 text-emerald-800 bg-emerald-50' },
];

export default function JobCards() {
  const navigate = useNavigate();
  const [jobCards, setJobCards] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [settings, setSettings] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    bikeModel: 'Royal Enfield Continental GT 650',
    regNo: '',
    buildType: 'General Periodic Service & Tuning',
    description: '',
    stage: 'Concept',
    estimatedCost: '',
    advancePaid: '',
    deliveryDate: '',
    mechanicNotes: ''
  });

  useEffect(() => {
    fetchJobCards();
    fetchSettings();
  }, []);

  const fetchJobCards = async () => {
    try {
      const res = await axios.get(`${API_URL}/job-cards`);
      setJobCards(res.data);
    } catch (err) {
      console.error('Error fetching job cards:', err);
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

  const currency = settings?.currency || '₹';

  const handleOpenModal = (card = null) => {
    if (card) {
      setEditingId(card.id || card._id);
      setFormData({
        customerName: card.customerName || '',
        phone: card.phone || '',
        bikeModel: card.bikeModel || '',
        regNo: card.regNo || '',
        buildType: card.buildType || 'General Periodic Service & Tuning',
        description: card.description || '',
        stage: card.stage || 'Concept',
        estimatedCost: card.estimatedCost || '',
        advancePaid: card.advancePaid || '',
        deliveryDate: card.deliveryDate || '',
        mechanicNotes: card.mechanicNotes || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        customerName: '',
        phone: '',
        bikeModel: 'Royal Enfield Continental GT 650',
        regNo: '',
        buildType: 'General Periodic Service & Tuning',
        description: '',
        stage: 'Concept',
        estimatedCost: '',
        advancePaid: '',
        deliveryDate: '',
        mechanicNotes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/job-cards/${editingId}`, formData);
      } else {
        await axios.post(`${API_URL}/job-cards`, formData);
      }
      setIsModalOpen(false);
      fetchJobCards();
    } catch (err) {
      console.error('Error saving job card:', err);
      alert('Error saving workshop job card.');
    }
  };

  const handleStageChange = async (cardId, newStage) => {
    try {
      await axios.put(`${API_URL}/job-cards/${cardId}`, { stage: newStage });
      setJobCards(prev => prev.map(card => (card.id === cardId || card._id === cardId) ? { ...card, stage: newStage } : card));
    } catch (err) {
      console.error('Error updating stage:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this job card?')) {
      try {
        await axios.delete(`${API_URL}/job-cards/${id}`);
        fetchJobCards();
      } catch (err) {
        console.error('Error deleting job card:', err);
      }
    }
  };

  const handleWhatsAppUpdate = (card) => {
    const stageObj = STAGES.find(s => s.key === card.stage);
    const stageLabel = stageObj ? stageObj.label : card.stage;
    const balance = Math.max(0, (Number(card.estimatedCost) || 0) - (Number(card.advancePaid) || 0));

    const msg = `*WORKSHOP JOB CARD UPDATE*\n\n` +
      `Hello *${card.customerName}*,\n\n` +
      `Status update for your *${card.bikeModel}* (${card.regNo || 'Bespoke'}):\n\n` +
      `• Job: ${card.buildType}\n` +
      `• Current Stage: *${stageLabel}*\n` +
      `• Notes: ${card.mechanicNotes || card.description || 'In progress'}\n` +
      `• Estimated Total: ${currency}${card.estimatedCost || 0}\n` +
      `• Advance Paid: ${currency}${card.advancePaid || 0}\n` +
      `• Balance Remaining: ${currency}${balance}\n` +
      (card.deliveryDate ? `• Target Delivery: ${card.deliveryDate}\n` : '') +
      `\nThank you for choosing ${settings?.shopName || 'our workshop'}!`;

    const cleanPhone = card.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredCards = jobCards.filter(card => {
    const matchesFilter = activeFilter === 'All' || card.stage === activeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (card.customerName || '').toLowerCase().includes(q) ||
      (card.phone || '').includes(q) ||
      (card.bikeModel || '').toLowerCase().includes(q) ||
      (card.regNo || '').toLowerCase().includes(q) ||
      (card.jobNo || '').toLowerCase().includes(q) ||
      (card.buildType || '').toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalBuilds = jobCards.length;
  const inFab = jobCards.filter(c => c.stage === 'Fabrication').length;
  const inPaint = jobCards.filter(c => c.stage === 'Paint').length;
  const readyDelivery = jobCards.filter(c => c.stage === 'Completed').length;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workshop Job Cards & Build Tracker</h1>
            <p className="text-xs text-slate-500">Track multi-brand motorcycle services, major repairs, custom builds, and stages</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Job Card
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Jobs</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalBuilds}</p>
        </div>
        <div className="bg-white border border-orange-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-orange-800 font-bold uppercase tracking-wider">In Service / Fab</p>
          <p className="text-2xl font-black text-orange-800 mt-1">{inFab}</p>
        </div>
        <div className="bg-white border border-pink-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-pink-800 font-bold uppercase tracking-wider">In Paint / Detailing</p>
          <p className="text-2xl font-black text-pink-800 mt-1">{inPaint}</p>
        </div>
        <div className="bg-white border border-emerald-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Ready for Delivery</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{readyDelivery}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Stage Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pb-1 md:pb-0">
          <button
            onClick={() => setActiveFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${
              activeFilter === 'All'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All ({jobCards.length})
          </button>
          {STAGES.map(stage => {
            const count = jobCards.filter(c => c.stage === stage.key).length;
            return (
              <button
                key={stage.key}
                onClick={() => setActiveFilter(stage.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border flex items-center space-x-1.5 ${
                  activeFilter === stage.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{stage.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeFilter === stage.key ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search bike, customer, job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-xl border border-slate-200 shadow-xs">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">No Job Cards Found</p>
          <p className="text-xs text-slate-500 mt-0.5">Create a new job card to begin tracking a project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => {
            const cardId = card.id || card._id;
            const stageInfo = STAGES.find(s => s.key === card.stage) || STAGES[0];
            const balanceDue = Math.max(0, (Number(card.estimatedCost) || 0) - (Number(card.advancePaid) || 0));

            return (
              <div
                key={cardId}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-5 flex flex-col justify-between transition-shadow shadow-xs hover:shadow-sm"
              >
                <div>
                  {/* Top Bar: Job No & Stage Selector */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-black text-slate-800 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {card.jobNo || 'JC-BUILD'}
                    </span>
                    <select
                      value={card.stage}
                      onChange={(e) => handleStageChange(cardId, e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border cursor-pointer focus:outline-none ${stageInfo.color}`}
                    >
                      {STAGES.map(s => (
                        <option key={s.key} value={s.key} className="bg-white text-slate-900 font-medium">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bike & Customer */}
                  <h3 className="text-base font-black text-slate-950">
                    {card.bikeModel}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-600 mt-1">
                    <span className="font-mono uppercase font-bold text-slate-850">{card.regNo || 'NO REG'}</span>
                    <span>•</span>
                    <span className="text-slate-900 font-bold">{card.customerName}</span>
                    <span>({card.phone})</span>
                  </div>

                  {/* Build Type */}
                  <div className="mt-2.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {card.buildType}
                    </span>
                  </div>

                  {/* Description */}
                  {card.description && (
                    <p className="text-xs text-slate-700 mt-2.5 bg-slate-50 p-2 rounded-lg border border-slate-200 font-medium line-clamp-2">
                      {card.description}
                    </p>
                  )}

                  {/* Notes */}
                  {card.mechanicNotes && (
                    <p className="text-xs text-slate-600 mt-2 italic flex items-center font-medium">
                      <span className="text-slate-800 font-bold not-italic mr-1">Note:</span> {card.mechanicNotes}
                    </p>
                  )}
                </div>

                {/* Financial Summary & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-600 uppercase font-bold">Est. Cost</p>
                      <p className="font-mono font-black text-slate-900">{currency}{card.estimatedCost || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-800 uppercase font-bold">Advance</p>
                      <p className="font-mono font-black text-emerald-800">{currency}{card.advancePaid || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-amber-800 uppercase font-bold">Balance</p>
                      <p className="font-mono font-black text-amber-800">{currency}{balanceDue}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleWhatsAppUpdate(card)}
                        title="Send WhatsApp Update"
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                        WhatsApp
                      </button>

                      <button
                        onClick={() => {
                          navigate(`/?customerName=${encodeURIComponent(card.customerName)}&phone=${encodeURIComponent(card.phone)}&bikeModel=${encodeURIComponent(card.bikeModel)}&regNo=${encodeURIComponent(card.regNo)}&buildType=${encodeURIComponent(card.buildType)}&advance=${card.advancePaid || 0}`);
                        }}
                        title="Generate Bill"
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center transition-colors shadow-2xs"
                      >
                        Create Bill
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenModal(card)}
                        className="p-1.5 text-slate-600 hover:text-slate-950 rounded hover:bg-slate-100 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cardId)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 w-full max-w-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-black text-slate-950">
                {editingId ? 'Edit Workshop Job Card' : 'New Workshop Job Card'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="e.g. Vikram Malhotra"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                  <input
                    required
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Motorcycle Make & Model *</label>
                  <input
                    required
                    list="all-bike-models-jc"
                    type="text"
                    value={formData.bikeModel}
                    onChange={e => setFormData({ ...formData, bikeModel: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="Select or enter motorcycle"
                  />
                  <datalist id="all-bike-models-jc">
                    {MOTORCYCLE_BRANDS.map(group => (
                      group.models.map(m => (
                        <option key={`jc-${group.brand}-${m}`} value={`${group.brand} ${m}`} />
                      ))
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reg / Chassis Number</label>
                  <input
                    type="text"
                    value={formData.regNo}
                    onChange={e => setFormData({ ...formData, regNo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white text-slate-900 font-medium uppercase placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="e.g. DL-01-AB-1234"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Job / Service Type</label>
                  <input
                    list="service-job-types-jc"
                    value={formData.buildType}
                    onChange={e => setFormData({ ...formData, buildType: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-slate-900 font-medium border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="Select or enter job type"
                  />
                  <datalist id="service-job-types-jc">
                    {SERVICE_JOB_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Workshop Stage</label>
                  <select
                    value={formData.stage}
                    onChange={e => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-slate-900 font-medium border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    {STAGES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Scope of Work / Complaint & Requirements</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail parts needed, service checklist, custom fabrication, paint, engine issues, etc."
                  className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estimated Cost ({currency})</label>
                  <input
                    type="number"
                    value={formData.estimatedCost}
                    onChange={e => setFormData({ ...formData, estimatedCost: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-slate-900 font-mono font-bold placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="e.g. 4500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Advance Paid ({currency})</label>
                  <input
                    type="number"
                    value={formData.advancePaid}
                    onChange={e => setFormData({ ...formData, advancePaid: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-emerald-800 font-mono font-bold placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="e.g. 2000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Delivery Date</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-slate-900 font-medium border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Internal Mechanic Notes / Stage Progress</label>
                <input
                  type="text"
                  value={formData.mechanicNotes}
                  onChange={e => setFormData({ ...formData, mechanicNotes: e.target.value })}
                  placeholder="e.g. Oil drained, spark plug replaced. Valve clearance done."
                  className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  Save Job Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
