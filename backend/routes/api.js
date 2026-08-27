import express from 'express';
import Customer from '../models/Customer.js';
import Part from '../models/Part.js';
import Invoice from '../models/Invoice.js';
import Setting from '../models/Setting.js';

const router = express.Router();

// --- Customers ---
router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers/:phone', async (req, res) => {
  try {
    const customer = await Customer.findOne({ phone: req.params.phone });
    if (customer) res.json(customer);
    else res.status(404).json({ message: 'Customer not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Parts ---
router.get('/parts', async (req, res) => {
  try {
    const parts = await Part.find().sort({ name: 1 });
    res.json(parts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/parts', async (req, res) => {
  try {
    const part = new Part(req.body);
    await part.save();
    res.status(201).json(part);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/parts/:id', async (req, res) => {
  try {
    const part = await Part.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(part);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/parts/:id', async (req, res) => {
  try {
    await Part.findByIdAndDelete(req.params.id);
    res.json({ message: 'Part deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Invoices ---
router.post('/invoices', async (req, res) => {
  try {
    const { customerData, invoiceData } = req.body;
    
    // Find or create customer
    let customer = await Customer.findOne({ phone: customerData.phone });
    if (!customer) {
      customer = new Customer(customerData);
      await customer.save();
    } else {
      customer.name = customerData.name;
      customer.bikeModel = customerData.bikeModel;
      customer.regNo = customerData.regNo;
      await customer.save();
    }

    const invoice = new Invoice({
      ...invoiceData,
      customer: customer._id
    });
    
    await invoice.save();

    // Deduct stock
    for (const item of invoiceData.items) {
      if (!item.isLabour) {
        await Part.findOneAndUpdate({ name: item.partName }, { $inc: { stock: -item.qty } });
      }
    }

    // Populate customer before returning
    await invoice.populate('customer');
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('customer').sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('customer');
    if (invoice) res.json(invoice);
    else res.status(404).json({ message: 'Invoice not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Settings ---
router.get('/settings', async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting();
      await setting.save();
    }
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting(req.body);
    } else {
      Object.assign(setting, req.body);
    }
    await setting.save();
    res.json(setting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Seed Data (Optional helper) ---
router.post('/seed-parts', async (req, res) => {
  try {
    const commonParts = [
      { name: 'Engine Oil 15W50 (Liquid Gun)', basePrice: 850, gstRate: 18, stock: 50 },
      { name: 'Oil Filter', basePrice: 120, gstRate: 18, stock: 100 },
      { name: 'Air Filter', basePrice: 250, gstRate: 18, stock: 50 },
      { name: 'Spark Plug (Bosch)', basePrice: 150, gstRate: 18, stock: 50 },
      { name: 'Front Brake Pads', basePrice: 450, gstRate: 28, stock: 20 },
      { name: 'Rear Brake Pads', basePrice: 400, gstRate: 28, stock: 20 },
      { name: 'Chain Sprocket Kit', basePrice: 1800, gstRate: 28, stock: 10 },
      { name: 'Clutch Cable', basePrice: 220, gstRate: 18, stock: 30 },
      { name: 'Accelerator Cable', basePrice: 180, gstRate: 18, stock: 30 }
    ];
    await Part.insertMany(commonParts);
    res.json({ message: 'Seeded standard RE parts.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
