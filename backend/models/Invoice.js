import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  partName: { type: String, required: true },
  qty: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  gstRate: { type: Number, required: true },
  isLabour: { type: Boolean, default: false }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  currentKm: { type: Number, required: true },
  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true },
  totalGst: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  serviceDate: { type: Date, default: Date.now },
  nextServiceDate: { type: Date, required: true },
  nextServiceKm: { type: Number, required: true },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);
