import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database in a persistent 'data' folder at the root of the project (so it stays on the USB drive)
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'garage_database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Preset Catalog Templates for Multiple Workshop Niche Types
export const CATALOG_TEMPLATES = {
  custom_modifier: [
    { id: 'p_mod_1', name: 'Custom Scrambler Free-Flow Exhaust (Stainless Steel)', category: 'Exhaust', basePrice: 4800, gstRate: 18, stock: 12 },
    { id: 'p_mod_2', name: 'Megaphone Cafe Racer Silencer (Matte Black)', category: 'Exhaust', basePrice: 3500, gstRate: 18, stock: 15 },
    { id: 'p_mod_3', name: 'High-Flow Performance Air Filter (BMC/K&N Type)', category: 'Performance', basePrice: 2200, gstRate: 18, stock: 20 },
    { id: 'p_mod_4', name: 'ECU Stage 1 Remap & Dyno Tune', category: 'Performance', basePrice: 6500, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_mod_5', name: '7-inch LED Projector Headlight with DRL Ring', category: 'Lighting', basePrice: 2800, gstRate: 18, stock: 18 },
    { id: 'p_mod_6', name: 'CNC Bar-End Turn Signals (Amber LED Pair)', category: 'Lighting', basePrice: 1200, gstRate: 18, stock: 25 },
    { id: 'p_mod_7', name: 'Integrated Strip LED Tail Light with Indicators', category: 'Lighting', basePrice: 950, gstRate: 18, stock: 30 },
    { id: 'p_mod_8', name: 'CNC Clip-On Handlebars (Adjustable 37-41mm)', category: 'Controls', basePrice: 2400, gstRate: 18, stock: 10 },
    { id: 'p_mod_9', name: 'Tracker Wide Handlebar (Chrome/Black)', category: 'Controls', basePrice: 1600, gstRate: 18, stock: 14 },
    { id: 'p_mod_10', name: 'Round CNC Aluminum Bar-End Mirrors (Pair)', category: 'Controls', basePrice: 1400, gstRate: 18, stock: 22 },
    { id: 'p_mod_11', name: 'Custom Cafe Racer Hand-Stitched Leather Seat', category: 'Bodywork', basePrice: 3200, gstRate: 18, stock: 8 },
    { id: 'p_mod_12', name: 'Bobber Single Spring Solo Seat (Genuine Leather)', category: 'Bodywork', basePrice: 3600, gstRate: 18, stock: 6 },
    { id: 'p_mod_13', name: 'Handcrafted Teardrop Custom Fuel Tank', category: 'Bodywork', basePrice: 8500, gstRate: 18, stock: 4 },
    { id: 'p_mod_14', name: 'Full Custom Candy/Metallic 3-Stage Paint Job', category: 'Paint', basePrice: 14000, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_mod_15', name: 'Complete Frame Powder Coating (Gloss/Matte)', category: 'Paint', basePrice: 7500, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_mod_16', name: 'Custom Subframe Chopping & Loop Fabrication (TIG)', category: 'Fabrication', basePrice: 4500, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_mod_17', name: 'Full Custom Bike Transformation Labor & Assembly', category: 'Fabrication', basePrice: 18000, gstRate: 18, stock: 999, isLabour: true }
  ],

  multi_brand_service: [
    { id: 'p_srv_1', name: 'Fully Synthetic Engine Oil 10W40/10W50 (1 Litre)', category: 'Maintenance', basePrice: 950, gstRate: 18, stock: 40 },
    { id: 'p_srv_2', name: 'Semi-Synthetic Engine Oil 15W50 / 20W40 (1 Litre)', category: 'Maintenance', basePrice: 550, gstRate: 18, stock: 50 },
    { id: 'p_srv_3', name: 'OEM High-Flow Oil Filter Element', category: 'Maintenance', basePrice: 220, gstRate: 18, stock: 35 },
    { id: 'p_srv_4', name: 'NGK Iridium Spark Plug', category: 'Maintenance', basePrice: 650, gstRate: 18, stock: 30 },
    { id: 'p_srv_5', name: 'Ceramic Front Disc Brake Pads (Set)', category: 'Brakes', basePrice: 850, gstRate: 18, stock: 25 },
    { id: 'p_srv_6', name: 'Rear Disc Brake Pads / Drum Shoes', category: 'Brakes', basePrice: 600, gstRate: 18, stock: 25 },
    { id: 'p_srv_7', name: 'Heavy-Duty Brass Chain & Sprocket Kit', category: 'Drivetrain', basePrice: 2600, gstRate: 18, stock: 15 },
    { id: 'p_srv_8', name: 'Fork Oil & Oil Seals Replacement Set', category: 'Suspension', basePrice: 850, gstRate: 18, stock: 18 },
    { id: 'p_srv_9', name: 'Comprehensive Periodic General Service Labor', category: 'Service Labor', basePrice: 1200, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_srv_10', name: 'Throttle Body / Injector Ultrasonic Cleaning', category: 'Service Labor', basePrice: 750, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_srv_11', name: 'Complete Brake Fluid Flush & Hydraulic Bleed', category: 'Service Labor', basePrice: 450, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_srv_12', name: 'Chain Cleaning, Lube & Tension Adjustment', category: 'Service Labor', basePrice: 250, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_srv_13', name: 'Complete Engine Valve / Tappet Clearance Setting', category: 'Service Labor', basePrice: 650, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_srv_14', name: 'Major Engine Rebuild & Head Gasket Replacement Labor', category: 'Service Labor', basePrice: 4500, gstRate: 18, stock: 999, isLabour: true }
  ],

  superbike_performance: [
    { id: 'p_sbk_1', name: 'Motul 300V 10W40 Factory Line Synthetic (1L)', category: 'Lubricants', basePrice: 1850, gstRate: 18, stock: 24 },
    { id: 'p_sbk_2', name: 'Brembo Sintered Racing Brake Pads (Front Pair)', category: 'Brakes', basePrice: 4200, gstRate: 18, stock: 10 },
    { id: 'p_sbk_3', name: 'BMC / K&N High Performance Air Filter', category: 'Performance', basePrice: 5800, gstRate: 18, stock: 12 },
    { id: 'p_sbk_4', name: 'Engine Ice High-Performance Radiator Coolant (1/2 Gallon)', category: 'Cooling', basePrice: 1650, gstRate: 18, stock: 16 },
    { id: 'p_sbk_5', name: 'Full ECU Flash, Fuel Map & Dyno Calibration', category: 'Performance', basePrice: 12500, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_sbk_6', name: 'Quickshifter & Auto-Blipper Sensor Fitment', category: 'Performance', basePrice: 3500, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_sbk_7', name: 'Front Upside-Down (USD) Fork Overhaul & Revalve', category: 'Suspension', basePrice: 3800, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_sbk_8', name: 'Full Akrapovic / SC Project Slip-On Exhaust Install', category: 'Exhaust', basePrice: 2500, gstRate: 18, stock: 999, isLabour: true }
  ],

  ev_workshop: [
    { id: 'p_ev_1', name: 'EV Lithium Battery Diagnostic & Cell Balancing', category: 'EV Diagnostics', basePrice: 1500, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_ev_2', name: 'BLDC Hub Motor Bearing & Water-Seal Overhaul', category: 'EV Motor', basePrice: 1800, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_ev_3', name: 'Motor Drive Belt / Chain Replacement & Tensioning', category: 'Drivetrain', basePrice: 850, gstRate: 18, stock: 20 },
    { id: 'p_ev_4', name: 'EV Regenerative Brake Pad & Rotor Set', category: 'Brakes', basePrice: 950, gstRate: 18, stock: 25 },
    { id: 'p_ev_5', name: 'Main Wiring Harness Moisture & Insulation Check', category: 'Electrical', basePrice: 650, gstRate: 18, stock: 999, isLabour: true },
    { id: 'p_ev_6', name: 'Controller Firmware Flashing & Throttle Sensor Calibration', category: 'Software', basePrice: 900, gstRate: 18, stock: 999, isLabour: true }
  ]
};

const DEFAULT_SETTINGS = {
  shopName: 'MOTO STUDIO & SERVICE CENTER',
  tagline: 'Multi-Brand Motorcycle Service, Modifications & Tuning',
  workshopType: 'multi_brand_service',
  contactNumber: '+91 98765 43210',
  address: 'Shop No. 12, Main Auto Market, Industrial Area',
  gstin: '',
  upiId: 'workshop@upi',
  currency: '₹',
  taxLabel: 'GST',
  autoSendBillWhatsapp: true,
  autoSendServiceReminders: true,
  reminderDaysBefore: 3,
  terms: '1. Estimate is valid for 7 days from issue date.\n2. 50% advance required on custom builds/major repairs.\n3. Replaced old parts must be claimed at delivery.\n4. All repair workmanship is guaranteed for 30 days.',
  bankDetails: ''
};

class LocalDatabase {
  constructor() {
    this.data = {
      customers: [],
      parts: [],
      invoices: [],
      jobCards: [],
      settings: DEFAULT_SETTINGS
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          customers: parsed.customers || [],
          parts: (parsed.parts && parsed.parts.length > 0) ? parsed.parts : CATALOG_TEMPLATES.custom_modifier,
          invoices: parsed.invoices || [],
          jobCards: parsed.jobCards || [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
        };
      } else {
        this.data.parts = CATALOG_TEMPLATES.custom_modifier;
        this.data.settings = DEFAULT_SETTINGS;
        this.save();
      }
    } catch (err) {
      console.error('Error loading database file:', err.message);
      this.data.parts = CATALOG_TEMPLATES.custom_modifier;
      this.data.settings = DEFAULT_SETTINGS;
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving database to file:', err.message);
    }
  }

  // --- Catalog Templates ---
  applyCatalogTemplate(templateKey, mode = 'replace') {
    this.load();
    const template = CATALOG_TEMPLATES[templateKey] || CATALOG_TEMPLATES.custom_modifier;
    if (mode === 'replace') {
      this.data.parts = [...template];
    } else {
      const existingNames = new Set(this.data.parts.map(p => p.name.toLowerCase()));
      const newItems = template.filter(p => !existingNames.has(p.name.toLowerCase()));
      this.data.parts = [...this.data.parts, ...newItems];
    }
    this.save();
    return this.data.parts;
  }

  // --- Service Due Reminders ---
  getDueServiceReminders() {
    this.load();
    const today = new Date();
    // Include all due up to 14 days in advance or overdue
    const upcomingThreshold = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    return (this.data.invoices || []).filter(inv => {
      if (!inv.nextServiceDate) return false;
      const dueDate = new Date(inv.nextServiceDate);
      return dueDate <= upcomingThreshold;
    }).map(inv => {
      const customer = (this.data.customers || []).find(c => c.id === inv.customerId) || {
        name: inv.customerName,
        phone: inv.customerPhone,
        bikeModel: inv.bikeModel,
        regNo: inv.regNo
      };
      
      const dueDate = new Date(inv.nextServiceDate);
      const isOverdue = dueDate < today;
      const daysDiff = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

      return {
        invoiceId: inv.id || inv._id,
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.createdAt,
        nextServiceDate: inv.nextServiceDate,
        nextServiceKm: inv.nextServiceKm,
        lastKm: inv.currentKm,
        reminderSent: Boolean(inv.reminderSent),
        reminderSentAt: inv.reminderSentAt || null,
        isOverdue,
        daysDiff,
        customer
      };
    }).sort((a, b) => new Date(a.nextServiceDate) - new Date(b.nextServiceDate));
  }

  markReminderSent(invoiceId, sent = true) {
    this.load();
    const idx = (this.data.invoices || []).findIndex(i => i.id === invoiceId || i._id === invoiceId);
    if (idx >= 0) {
      this.data.invoices[idx].reminderSent = sent;
      this.data.invoices[idx].reminderSentAt = sent ? new Date().toISOString() : null;
      this.save();
      return this.data.invoices[idx];
    }
    return null;
  }

  // --- Summary & Analytics ---
  getDashboardStats() {
    this.load();
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = new Date().toISOString().slice(0, 7);

    const invoices = this.data.invoices || [];
    const todayInvoices = invoices.filter(i => (i.createdAt || '').startsWith(today));
    const monthInvoices = invoices.filter(i => (i.createdAt || '').startsWith(thisMonth));

    const todaySales = todayInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
    const monthSales = monthInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
    const totalPendingBalance = invoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0);

    const pendingInvoices = invoices.filter(i => (i.balanceDue || 0) > 0);
    const activeJobs = (this.data.jobCards || []).filter(j => j.stage !== 'Completed');
    const dueReminders = this.getDueServiceReminders();

    return {
      todaySales,
      todayInvoicesCount: todayInvoices.length,
      monthSales,
      monthInvoicesCount: monthInvoices.length,
      totalPendingBalance,
      pendingInvoicesCount: pendingInvoices.length,
      totalCustomers: (this.data.customers || []).length,
      activeJobsCount: activeJobs.length,
      dueServiceCount: dueReminders.length
    };
  }

  // --- Customers & Retention ---
  getCustomers() {
    this.load();
    return (this.data.customers || []).sort((a, b) => new Date(b.lastVisited || b.createdAt || 0) - new Date(a.lastVisited || a.createdAt || 0));
  }

  getCustomerById(id) {
    this.load();
    return (this.data.customers || []).find(c => c.id === id || c._id === id);
  }

  getCustomerByPhone(phone) {
    this.load();
    if (!phone) return null;
    const clean = phone.replace(/[^0-9]/g, '');
    return (this.data.customers || []).find(c => {
      const cClean = (c.phone || '').replace(/[^0-9]/g, '');
      return cClean === clean || (clean.length === 10 && cClean.endsWith(clean));
    });
  }

  searchCustomers(query) {
    this.load();
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();
    const cleanQ = q.replace(/[^0-9]/g, '');

    return (this.data.customers || []).filter(c => {
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchReg = (c.regNo || '').toLowerCase().includes(q);
      const matchBike = (c.bikeModel || '').toLowerCase().includes(q);
      const matchPhone = cleanQ.length > 0 && (c.phone || '').replace(/[^0-9]/g, '').includes(cleanQ);
      return matchName || matchReg || matchBike || matchPhone;
    }).slice(0, 8);
  }

  saveCustomer(customerData, invoiceStats = null) {
    this.load();
    if (!this.data.customers) this.data.customers = [];
    const cleanPhone = (customerData.phone || '').replace(/[^0-9]/g, '');
    const existingIndex = this.data.customers.findIndex(c => {
      const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
      return (cleanPhone && cPhone === cleanPhone) || 
             (customerData.regNo && c.regNo && c.regNo.toUpperCase() === customerData.regNo.toUpperCase());
    });

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = this.data.customers[existingIndex];
      const newVisitCount = invoiceStats ? (existing.visitCount || 1) + 1 : (existing.visitCount || 1);
      const newTotalSpent = invoiceStats ? (existing.totalSpent || 0) + (Number(invoiceStats.amount) || 0) : (existing.totalSpent || 0);

      this.data.customers[existingIndex] = {
        ...existing,
        name: customerData.name || existing.name,
        phone: customerData.phone || existing.phone,
        bikeModel: customerData.bikeModel || existing.bikeModel,
        regNo: customerData.regNo || existing.regNo,
        vinNo: customerData.vinNo || existing.vinNo || '',
        visitCount: newVisitCount,
        totalSpent: newTotalSpent,
        lastKm: invoiceStats?.km || existing.lastKm || 0,
        lastVisited: now,
        updatedAt: now
      };
      this.save();
      return this.data.customers[existingIndex];
    } else {
      const newCustomer = {
        id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: customerData.name || 'Valued Client',
        phone: customerData.phone || '',
        bikeModel: customerData.bikeModel || '',
        regNo: customerData.regNo || '',
        vinNo: customerData.vinNo || '',
        visitCount: 1,
        totalSpent: invoiceStats ? (Number(invoiceStats.amount) || 0) : 0,
        lastKm: invoiceStats?.km || 0,
        lastVisited: now,
        createdAt: now,
        updatedAt: now
      };
      this.data.customers.unshift(newCustomer);
      this.save();
      return newCustomer;
    }
  }

  getCustomerHistory(customerIdOrPhone) {
    this.load();
    const customer = this.getCustomerById(customerIdOrPhone) || this.getCustomerByPhone(customerIdOrPhone);
    if (!customer) return null;

    const invoices = (this.data.invoices || []).filter(inv => 
      inv.customerId === customer.id || inv.customerPhone === customer.phone
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const jobCards = (this.data.jobCards || []).filter(jc => 
      jc.phone === customer.phone || (jc.regNo && customer.regNo && jc.regNo.toUpperCase() === customer.regNo.toUpperCase())
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      customer,
      invoices,
      jobCards,
      stats: {
        totalVisits: Math.max(customer.visitCount || 1, invoices.length),
        totalSpent: invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
        lastVisitDate: invoices[0]?.createdAt || customer.lastVisited || customer.createdAt,
        lastOdometer: invoices[0]?.currentKm || customer.lastKm || 0
      }
    };
  }

  // --- Parts & Services ---
  getParts() {
    this.load();
    return this.data.parts;
  }

  getPartById(id) {
    this.load();
    return this.data.parts.find(p => p.id === id || p._id === id);
  }

  createPart(partData) {
    this.load();
    const newPart = {
      id: 'p_' + Date.now(),
      name: partData.name,
      category: partData.category || 'General',
      basePrice: Number(partData.basePrice) || 0,
      gstRate: Number(partData.gstRate) || 0,
      stock: Number(partData.stock) || 0,
      isLabour: Boolean(partData.isLabour),
      createdAt: new Date().toISOString()
    };
    this.data.parts.unshift(newPart);
    this.save();
    return newPart;
  }

  updatePart(id, partData) {
    this.load();
    const idx = this.data.parts.findIndex(p => p.id === id || p._id === id);
    if (idx >= 0) {
      this.data.parts[idx] = {
        ...this.data.parts[idx],
        ...partData,
        basePrice: Number(partData.basePrice) || this.data.parts[idx].basePrice,
        gstRate: Number(partData.gstRate) ?? this.data.parts[idx].gstRate,
        stock: Number(partData.stock) ?? this.data.parts[idx].stock,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.parts[idx];
    }
    return null;
  }

  deletePart(id) {
    this.load();
    const beforeLen = this.data.parts.length;
    this.data.parts = this.data.parts.filter(p => p.id !== id && p._id !== id);
    this.save();
    return this.data.parts.length < beforeLen;
  }

  // --- Invoices ---
  getInvoices() {
    this.load();
    return (this.data.invoices || []).map(inv => {
      const customer = (this.data.customers || []).find(c => c.id === inv.customerId) || {
        name: inv.customerName || 'Customer',
        phone: inv.customerPhone || '',
        bikeModel: inv.bikeModel || '',
        regNo: inv.regNo || ''
      };
      return {
        ...inv,
        customer
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getInvoiceById(id) {
    this.load();
    const inv = (this.data.invoices || []).find(i => i.id === id || i._id === id);
    if (!inv) return null;
    const customer = (this.data.customers || []).find(c => c.id === inv.customerId) || {
      name: inv.customerName || 'Customer',
      phone: inv.customerPhone || '',
      bikeModel: inv.bikeModel || '',
      regNo: inv.regNo || ''
    };
    return {
      ...inv,
      customer
    };
  }

  createInvoice(customerData, invoiceData) {
    this.load();
    const customer = this.saveCustomer(customerData, {
      amount: Number(invoiceData.grandTotal) || 0,
      km: Number(invoiceData.currentKm) || 0
    });

    const now = new Date().toISOString();
    const invoiceId = 'inv_' + Date.now();
    const invoiceNo = 'MOD-' + ((this.data.invoices || []).length + 1001);

    const newInvoice = {
      id: invoiceId,
      _id: invoiceId,
      invoiceNo,
      billType: invoiceData.billType || 'Tax Invoice',
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      bikeModel: customer.bikeModel,
      regNo: customer.regNo,
      vinNo: invoiceData.vinNo || customer.vinNo || '',
      currentKm: Number(invoiceData.currentKm) || 0,
      nextServiceKm: Number(invoiceData.nextServiceKm) || 0,
      nextServiceDate: invoiceData.nextServiceDate || null,
      items: invoiceData.items || [],
      subtotal: Number(invoiceData.subtotal) || 0,
      totalGst: Number(invoiceData.totalGst) || 0,
      discount: Number(invoiceData.discount) || 0,
      grandTotal: Number(invoiceData.grandTotal) || 0,
      advancePaid: Number(invoiceData.advancePaid) || 0,
      balanceDue: Math.max(0, (Number(invoiceData.grandTotal) || 0) - (Number(invoiceData.advancePaid) || 0)),
      paymentMethod: invoiceData.paymentMethod || 'UPI',
      notes: invoiceData.notes || '',
      reminderSent: false,
      createdAt: now
    };

    if (Array.isArray(invoiceData.items)) {
      for (const item of invoiceData.items) {
        if (!item.isLabour) {
          const part = this.data.parts.find(p => p.name === item.partName || p.id === item.partId);
          if (part) {
            part.stock = Math.max(0, (part.stock || 0) - (Number(item.qty) || 1));
          }
        }
      }
    }

    if (!this.data.invoices) this.data.invoices = [];
    this.data.invoices.unshift(newInvoice);
    this.save();

    return {
      ...newInvoice,
      customer
    };
  }

  deleteInvoice(id) {
    this.load();
    if (!this.data.invoices) return false;
    const beforeLen = this.data.invoices.length;
    this.data.invoices = this.data.invoices.filter(i => i.id !== id && i._id !== id);
    this.save();
    return this.data.invoices.length < beforeLen;
  }

  // --- Job Cards ---
  getJobCards() {
    this.load();
    return (this.data.jobCards || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getJobCardById(id) {
    this.load();
    return (this.data.jobCards || []).find(j => j.id === id || j._id === id);
  }

  createJobCard(cardData) {
    this.load();
    if (!this.data.jobCards) this.data.jobCards = [];
    
    this.saveCustomer({
      name: cardData.customerName,
      phone: cardData.phone,
      bikeModel: cardData.bikeModel,
      regNo: cardData.regNo
    });

    const jobNo = 'JC-' + (new Date().getFullYear()) + '-' + String(this.data.jobCards.length + 1).padStart(3, '0');
    const newCard = {
      id: 'jc_' + Date.now(),
      jobNo,
      customerName: cardData.customerName || '',
      phone: cardData.phone || '',
      bikeModel: cardData.bikeModel || '',
      regNo: cardData.regNo || '',
      buildType: cardData.buildType || 'Service & Repair',
      description: cardData.description || '',
      stage: cardData.stage || 'Concept',
      estimatedCost: Number(cardData.estimatedCost) || 0,
      advancePaid: Number(cardData.advancePaid) || 0,
      deliveryDate: cardData.deliveryDate || '',
      mechanicNotes: cardData.mechanicNotes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.jobCards.unshift(newCard);
    this.save();
    return newCard;
  }

  updateJobCard(id, cardData) {
    this.load();
    if (!this.data.jobCards) this.data.jobCards = [];
    const idx = this.data.jobCards.findIndex(j => j.id === id || j._id === id);
    if (idx >= 0) {
      this.data.jobCards[idx] = {
        ...this.data.jobCards[idx],
        ...cardData,
        estimatedCost: Number(cardData.estimatedCost) ?? this.data.jobCards[idx].estimatedCost,
        advancePaid: Number(cardData.advancePaid) ?? this.data.jobCards[idx].advancePaid,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.jobCards[idx];
    }
    return null;
  }

  deleteJobCard(id) {
    this.load();
    if (!this.data.jobCards) return false;
    const beforeLen = this.data.jobCards.length;
    this.data.jobCards = this.data.jobCards.filter(j => j.id !== id && j._id !== id);
    this.save();
    return this.data.jobCards.length < beforeLen;
  }

  // --- Settings ---
  getSettings() {
    this.load();
    return this.data.settings || DEFAULT_SETTINGS;
  }

  updateSettings(newSettings) {
    this.load();
    this.data.settings = {
      ...DEFAULT_SETTINGS,
      ...this.data.settings,
      ...newSettings
    };
    this.save();
    return this.data.settings;
  }

  // --- Reset All Data ---
  resetAllData() {
    this.data.customers = [];
    this.data.invoices = [];
    this.data.jobCards = [];
    this.data.parts = CATALOG_TEMPLATES[this.data.settings.workshopType] || CATALOG_TEMPLATES.custom_modifier;
    this.save();
    return true;
  }

  // --- Export & Import Backup ---
  exportBackup() {
    this.load();
    return this.data;
  }

  importBackup(backupData) {
    if (backupData && typeof backupData === 'object') {
      if (Array.isArray(backupData.customers)) this.data.customers = backupData.customers;
      if (Array.isArray(backupData.parts)) this.data.parts = backupData.parts;
      if (Array.isArray(backupData.invoices)) this.data.invoices = backupData.invoices;
      if (Array.isArray(backupData.jobCards)) this.data.jobCards = backupData.jobCards;
      if (backupData.settings) this.data.settings = backupData.settings;
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new LocalDatabase();
export default db;
