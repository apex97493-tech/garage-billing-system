import mongoose from 'mongoose';

const partSchema = new mongoose.Schema({
  name: { type: String, required: true },
  basePrice: { type: Number, required: true },
  gstRate: { type: Number, required: true, default: 18 },
  stock: { type: Number, required: true, default: 0 }
}, { timestamps: true });

export default mongoose.model('Part', partSchema);
