import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  shopName: { type: String, required: true, default: 'Royal Enfield Workshop' },
  contactNumber: { type: String, required: true, default: '' },
  address: { type: String, required: true, default: '' },
  gstin: { type: String, default: '' },
  upiId: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Setting', settingSchema);
