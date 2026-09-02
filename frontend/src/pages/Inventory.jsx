import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, Package, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const CATALOG_PACKS = [
  {
    id: 'multi_brand_service',
    title: 'Multi-Brand Service & Maintenance Pack',
    desc: 'Oils, filters, spark plugs, brake pads, chain sprockets, fork overhaul, general service labor'
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

export default function Inventory() {
  const [parts, setParts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'General Parts',
    basePrice: '',
    gstRate: 18,
    stock: '',
    isLabour: false
  });

  useEffect(() => {
    fetchParts();
    fetchSettings();
  }, []);

  const fetchParts = async () => {
    try {
      const res = await axios.get(`${API_URL}/parts`);
      setParts(res.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
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

  const openModal = (part = null) => {
    if (part) {
      setEditingId(part.id || part._id);
      setFormData({
        name: part.name || '',
        category: part.category || 'General Parts',
        basePrice: part.basePrice || '',
        gstRate: part.gstRate ?? 18,
        stock: part.stock ?? 0,
        isLabour: Boolean(part.isLabour)
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        category: 'General Parts',
        basePrice: '',
        gstRate: 18,
        stock: '50',
        isLabour: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/parts/${editingId}`, formData);
      } else {
        await axios.post(`${API_URL}/parts`, formData);
      }
      setIsModalOpen(false);
      fetchParts();
    } catch (err) {
      console.error('Error saving part:', err);
      alert('Error saving catalog item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this catalog item?')) {
      try {
        await axios.delete(`${API_URL}/parts/${id}`);
        fetchParts();
      } catch (err) {
        console.error('Error deleting part:', err);
      }
    }
  };

  const handleApplyTemplate = async (templateKey, mode = 'replace') => {
    const confirmMsg = mode === 'replace' 
      ? `Replace parts catalog with the '${templateKey}' preset template? (Custom added items will be replaced)`
      : `Add '${templateKey}' preset items to your existing catalog?`;
    
    if (window.confirm(confirmMsg)) {
      try {
        await axios.post(`${API_URL}/catalog/apply-template`, { templateKey, mode });
        setIsTemplateModalOpen(false);
        fetchParts();
      } catch (err) {
        console.error('Error applying template:', err);
        alert('Error applying catalog template.');
      }
    }
  };

  const categories = ['All', 'Service Labor', 'Maintenance', 'Brakes', 'Drivetrain', 'Electrical', 'Engine', 'Exhaust', 'Suspension', 'Controls', 'Bodywork', 'General Parts'];

  const filteredParts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return parts.filter(part => {
      const matchesCategory = selectedCategory === 'All' || part.category === selectedCategory;
      const matchesSearch = !q || 
        (part.name || '').toLowerCase().includes(q) ||
        (part.partNo && part.partNo.toLowerCase().includes(q)) ||
        (part.category || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [parts, selectedCategory, searchQuery]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filteredParts.length / itemsPerPage) || 1;
  const paginatedParts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredParts.slice(start, start + itemsPerPage);
  }, [filteredParts, currentPage]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Parts, Labor & Service Catalog</h1>
            <p className="text-xs text-slate-500">
              {parts.length.toLocaleString()} total parts with genuine New MRP prices, service labor rates & stock
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg text-xs font-bold border border-purple-300 transition-colors flex items-center shadow-2xs"
            title="Load industry catalog presets"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-700" />
            Industry Templates
          </button>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item / Service
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pb-1 md:pb-0 overflow-x-auto max-w-full">
          {categories.map(cat => {
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border flex items-center space-x-1.5 ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search across 21,600+ parts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-medium">
          <span>
            Found <strong className="text-slate-900">{filteredParts.length.toLocaleString()}</strong> items
            {searchQuery && ` for "${searchQuery}"`} (Page {currentPage} of {totalPages})
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-white border border-slate-300 disabled:opacity-30 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-slate-900">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-white border border-slate-300 disabled:opacity-30 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                <th className="p-3.5">Part / Description</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5 text-right">Price (New MRP)</th>
                <th className="p-3.5 text-right">Tax %</th>
                <th className="p-3.5 text-center">Stock</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedParts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium italic">
                    No items found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedParts.map(part => {
                  const partId = part.id || part._id;
                  const isLabour = part.isLabour;
                  const isLowStock = !isLabour && (part.stock || 0) < 5;

                  return (
                    <tr key={partId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        {part.name}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                          {part.category || 'General'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {isLabour ? (
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                            Labor / Service
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                            Genuine Part
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-950">
                        {currency}{part.basePrice}
                      </td>
                      <td className="p-3.5 text-right font-mono font-medium text-slate-700">
                        {part.gstRate}%
                      </td>
                      <td className="p-3.5 text-center">
                        {isLabour ? (
                          <span className="text-slate-500 font-medium italic">Service</span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                            isLowStock 
                              ? 'bg-red-50 text-red-800 border border-red-200' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {part.stock} in stock
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => openModal(part)}
                          className="p-1 text-slate-600 hover:text-slate-950 rounded hover:bg-slate-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(partId)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                          title="Delete"
                        >
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

        {/* Bottom Pagination Bar */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredParts.length)} of {filteredParts.length.toLocaleString()}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded bg-white border border-slate-300 font-bold disabled:opacity-40 hover:bg-slate-100 transition-colors flex items-center"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded bg-white border border-slate-300 font-bold disabled:opacity-40 hover:bg-slate-100 transition-colors flex items-center"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Industry Catalog Presets Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 w-full max-w-xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-black text-slate-950 flex items-center">
                  <Sparkles className="w-4 h-4 text-purple-600 mr-2" />
                  Load Industry Catalog Template
                </h2>
                <p className="text-xs text-slate-500 font-medium">Instantly load standard parts & labor rates for any motorcycle workshop type</p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {CATALOG_PACKS.map(pack => (
                <div key={pack.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">{pack.title}</h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{pack.desc}</p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(pack.id, 'replace')}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Install Pack
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(pack.id, 'append')}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                    >
                      + Merge into Catalog
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Part Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 w-full max-w-md text-slate-900">
            <h2 className="text-base font-black mb-4 text-slate-950">
              {editingId ? 'Edit Part / Service' : 'Add New Part / Labor Service'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description / Name *</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 bg-white text-slate-900 font-medium placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Fully Synthetic Engine Oil (1L)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white text-slate-900 font-medium border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Maintenance, Brakes, Exhaust"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Base Price ({currency}) *</label>
                  <input
                    required
                    type="number"
                    className="w-full px-3 py-2 bg-white text-slate-900 font-mono font-bold placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    value={formData.basePrice}
                    onChange={e => setFormData({ ...formData, basePrice: e.target.value })}
                    placeholder="e.g. 950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tax Rate (%)</label>
                  <select
                    className="w-full px-3 py-2 bg-white text-slate-900 font-mono font-medium border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    value={formData.gstRate}
                    onChange={e => setFormData({ ...formData, gstRate: e.target.value })}
                  >
                    <option value={0}>0% (Tax Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard)</option>
                    <option value={28}>28% (Luxury/Special)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Stock</label>
                  <input
                    disabled={formData.isLabour}
                    type="number"
                    className="w-full px-3 py-2 bg-white text-slate-900 font-mono font-bold placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none disabled:opacity-40"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isLabour}
                    onChange={e => setFormData({ ...formData, isLabour: e.target.checked })}
                    className="rounded text-slate-900 focus:ring-0 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Labor / Service Rate</span>
                    <span className="text-[11px] text-slate-600 font-medium">Service labor rates do not deduct physical inventory stock</span>
                  </div>
                </label>
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
