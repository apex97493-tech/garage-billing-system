import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Inventory() {
  const [parts, setParts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', basePrice: '', gstRate: 18, stock: ''
  });

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    const res = await axios.get(`${API_URL}/parts`);
    setParts(res.data);
  };

  const openModal = (part = null) => {
    if (part) {
      setEditingId(part._id);
      setFormData(part);
    } else {
      setEditingId(null);
      setFormData({ name: '', basePrice: '', gstRate: 18, stock: '' });
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
      console.error(err);
      alert("Error saving part");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this part?')) {
      await axios.delete(`${API_URL}/parts/${id}`);
      fetchParts();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        <div className="space-x-3">
          <button onClick={async () => { await axios.post(`${API_URL}/seed-parts`); fetchParts(); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
            Load Default Parts
          </button>
          <button onClick={() => openModal()} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center inline-flex">
            <Plus className="w-4 h-4 mr-2" /> Add New Part
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-gray-600">Part Name</th>
              <th className="p-4 font-semibold text-gray-600">Base Price (₹)</th>
              <th className="p-4 font-semibold text-gray-600">GST %</th>
              <th className="p-4 font-semibold text-gray-600">Stock Qty</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {parts.map(part => (
              <tr key={part._id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{part.name}</td>
                <td className="p-4 text-gray-600">{part.basePrice}</td>
                <td className="p-4 text-gray-600">{part.gstRate}%</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${part.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {part.stock}
                  </span>
                </td>
                <td className="p-4 text-right space-x-3">
                  <button onClick={() => openModal(part)} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-5 h-5 inline" /></button>
                  <button onClick={() => handleDelete(part._id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-5 h-5 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Part' : 'Add New Part'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                <input required type="text" className="w-full p-2 border rounded-md" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label>
                <input required type="number" className="w-full p-2 border rounded-md" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                  <select className="w-full p-2 border rounded-md" value={formData.gstRate} onChange={e => setFormData({...formData, gstRate: e.target.value})}>
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input required type="number" className="w-full p-2 border rounded-md" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
