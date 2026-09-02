import express from 'express';
import db, { CATALOG_TEMPLATES } from '../database/localDb.js';
import whatsappBot from '../services/whatsappLocalBot.js';
import { sendDueRemindersNow, formatServiceReminderMessage } from '../services/reminderScheduler.js';
import { generateInvoicePdfBuffer } from '../services/pdfService.js';

const router = express.Router();

// --- Dashboard & Analytics ---
router.get('/stats', (req, res) => {
  try {
    const stats = db.getDashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- WhatsApp Bot Automation Endpoints ---
router.get('/whatsapp/status', (req, res) => {
  try {
    const status = whatsappBot.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp/connect', async (req, res) => {
  try {
    await whatsappBot.init();
    res.json({ message: 'WhatsApp pairing initiated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp/disconnect', async (req, res) => {
  try {
    const success = await whatsappBot.disconnect();
    res.json({ success, status: whatsappBot.getStatus(), message: 'WhatsApp session disconnected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send PDF Document for an invoice over WhatsApp
router.post('/invoices/:id/send-whatsapp-pdf', async (req, res) => {
  try {
    const invoice = db.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const settings = db.getSettings();
    const phone = invoice.customer?.phone || invoice.customerPhone;
    if (!phone) {
      return res.status(400).json({ error: 'Customer phone number is missing' });
    }

    const currency = settings.currency || '₹';
    const invoiceNo = invoice.invoiceNo || invoice.id.slice(-6).toUpperCase();
    const fileName = `Tax_Invoice_${invoiceNo}.pdf`;
    const caption = `🧾 *TAX INVOICE — ${(settings.shopName || 'WORKSHOP').toUpperCase()}*\n` +
      `Invoice: #${invoiceNo} | Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}\n` +
      `Customer: ${invoice.customer?.name || invoice.customerName}\n` +
      `Motorcycle: ${invoice.customer?.bikeModel || invoice.bikeModel} (${invoice.customer?.regNo || 'Bespoke'})\n` +
      `Total: ${currency}${invoice.grandTotal}` + 
      (invoice.balanceDue > 0 ? ` | Balance Due: ${currency}${invoice.balanceDue}` : ' | Status: FULLY PAID') +
      `\n\n_Please find attached your official Tax Invoice PDF. Thank you for choosing ${settings.shopName}!_`;

    const pdfBuffer = await generateInvoicePdfBuffer(invoice, settings);
    const isSent = await whatsappBot.sendDocument(phone, pdfBuffer, fileName, caption);

    res.json({ success: isSent, isBotConnected: whatsappBot.isConnected, fileName });
  } catch (err) {
    console.error('Error sending WhatsApp PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp/send-bill', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }
    const isSent = await whatsappBot.sendMessage(phone, message);
    res.json({ success: isSent, isBotConnected: whatsappBot.isConnected });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Periodic Service Reminders ---
router.get('/reminders/due', (req, res) => {
  try {
    const dueList = db.getDueServiceReminders();
    res.json(dueList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reminders/send-due', async (req, res) => {
  try {
    const results = await sendDueRemindersNow();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reminders/send-single/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const dueList = db.getDueServiceReminders();
    const reminder = dueList.find(r => r.invoiceId === invoiceId);

    if (!reminder) {
      return res.status(404).json({ error: 'Service reminder not found' });
    }

    const settings = db.getSettings();
    const msg = formatServiceReminderMessage(reminder, settings);
    const isSent = await whatsappBot.sendMessage(reminder.customer.phone, msg);

    if (isSent) {
      db.markReminderSent(invoiceId, true);
    }

    res.json({ success: isSent, isBotConnected: whatsappBot.isConnected, messageText: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Catalog Preset Templates ---
router.get('/catalog/templates', (req, res) => {
  try {
    const keys = Object.keys(CATALOG_TEMPLATES);
    res.json({ templates: keys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/catalog/apply-template', (req, res) => {
  try {
    const { templateKey, mode } = req.body;
    const parts = db.applyCatalogTemplate(templateKey, mode || 'replace');
    res.json({ message: `Template '${templateKey}' applied successfully`, parts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Customers & History ---
router.get('/customers', (req, res) => {
  try {
    const customers = db.getCustomers();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers/search', (req, res) => {
  try {
    const query = req.query.q || '';
    const results = db.searchCustomers(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers/:id/history', (req, res) => {
  try {
    const history = db.getCustomerHistory(req.params.id);
    if (history) res.json(history);
    else res.status(404).json({ message: 'Customer history not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers/:phone', (req, res) => {
  try {
    const customer = db.getCustomerByPhone(req.params.phone);
    if (customer) res.json(customer);
    else res.status(404).json({ message: 'Customer not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers', (req, res) => {
  try {
    const customer = db.saveCustomer(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Parts & Custom Services Inventory ---
router.get('/parts', (req, res) => {
  try {
    const parts = db.getParts();
    res.json(parts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/parts', (req, res) => {
  try {
    const part = db.createPart(req.body);
    res.status(201).json(part);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/parts/:id', (req, res) => {
  try {
    const part = db.updatePart(req.params.id, req.body);
    if (part) res.json(part);
    else res.status(404).json({ message: 'Part not found' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/parts/:id', (req, res) => {
  try {
    const success = db.deletePart(req.params.id);
    if (success) res.json({ message: 'Part deleted successfully' });
    else res.status(404).json({ message: 'Part not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/seed-parts', (req, res) => {
  try {
    const parts = db.applyCatalogTemplate('custom_modifier', 'replace');
    res.json({ message: 'Seeded standard modification parts & services', parts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Invoices ---
router.post('/invoices', async (req, res) => {
  try {
    const { customerData, invoiceData } = req.body;
    if (!customerData || !invoiceData) {
      return res.status(400).json({ error: 'customerData and invoiceData are required.' });
    }

    const invoice = db.createInvoice(customerData, invoiceData);

    // Auto-send PDF bill via WhatsApp if bot is connected and setting enabled
    const settings = db.getSettings();
    if (settings.autoSendBillWhatsapp !== false && customerData.phone) {
      const currency = settings.currency || '₹';
      const invoiceNo = invoice.invoiceNo;
      const bType = invoice.billType || 'Tax Invoice';
      const bTitle = bType === 'Pre-Invoice' ? 'PRE-INVOICE' : (bType === 'Estimate' ? 'ESTIMATE / QUOTATION' : 'TAX INVOICE');
      const filePrefix = bType === 'Pre-Invoice' ? 'Pre_Invoice' : (bType === 'Estimate' ? 'Estimate' : 'Tax_Invoice');
      const fileName = `${filePrefix}_${invoiceNo}.pdf`;
      const caption = `📄 *${bTitle} — ${(settings.shopName || 'ROYAL ENFIELD WORKSHOP').toUpperCase()}*\n` +
        `Bill No: #${invoiceNo} | Date: ${new Date().toLocaleDateString('en-IN')}\n` +
        `Customer: ${customerData.name}\n` +
        `Motorcycle: ${customerData.bikeModel} (Reg No: ${customerData.regNo || 'Bespoke'})\n` +
        `Total Amount: ${currency}${invoice.grandTotal}` +
        (invoice.balanceDue > 0 ? ` | Balance Due: ${currency}${invoice.balanceDue}` : ' | Status: FULLY PAID') +
        `\n\n_Please find attached your official ${bTitle.toLowerCase()} document. Thank you for choosing ${(settings.shopName || 'our workshop')}!_`;

      if (whatsappBot.isConnected) {
        generateInvoicePdfBuffer(invoice, settings)
          .then(pdfBuffer => whatsappBot.sendDocument(customerData.phone, pdfBuffer, fileName, caption))
          .catch(err => console.error('[WhatsApp Auto-Send PDF Error]:', err.message));
      } else {
        console.log(`[WhatsApp Auto-Send]: WhatsApp bot offline. Pair phone in Settings to enable automatic delivery to ${customerData.phone}.`);
      }
    }

    res.status(201).json(invoice);
  } catch (err) {
    console.error('Invoice creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/invoices', (req, res) => {
  try {
    const invoices = db.getInvoices();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/invoices/:id', (req, res) => {
  try {
    const invoice = db.getInvoiceById(req.params.id);
    if (invoice) res.json(invoice);
    else res.status(404).json({ message: 'Invoice not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/invoices/:id', (req, res) => {
  try {
    const success = db.deleteInvoice(req.params.id);
    if (success) res.json({ message: 'Invoice deleted successfully' });
    else res.status(404).json({ message: 'Invoice not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Job Cards (Custom Build & Service Tracker) ---
router.get('/job-cards', (req, res) => {
  try {
    const cards = db.getJobCards();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/job-cards/:id', (req, res) => {
  try {
    const card = db.getJobCardById(req.params.id);
    if (card) res.json(card);
    else res.status(404).json({ message: 'Job Card not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/job-cards', (req, res) => {
  try {
    const card = db.createJobCard(req.body);
    res.status(201).json(card);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/job-cards/:id', (req, res) => {
  try {
    const card = db.updateJobCard(req.params.id, req.body);
    if (card) res.json(card);
    else res.status(404).json({ message: 'Job Card not found' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/job-cards/:id', (req, res) => {
  try {
    const success = db.deleteJobCard(req.params.id);
    if (success) res.json({ message: 'Job Card deleted successfully' });
    else res.status(404).json({ message: 'Job Card not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Settings ---
router.get('/settings', (req, res) => {
  try {
    const settings = db.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', (req, res) => {
  try {
    const settings = db.updateSettings(req.body);
    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Reset All Data ---
router.post('/reset-data', (req, res) => {
  try {
    db.resetAllData();
    res.json({ message: 'Database reset to clean workshop defaults' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Backup & Restore (USB Portability) ---
router.get('/backup', (req, res) => {
  try {
    const backup = db.exportBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=garage_backup_${Date.now()}.json`);
    res.json(backup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/restore', (req, res) => {
  try {
    const success = db.importBackup(req.body);
    if (success) {
      res.json({ message: 'Database restored successfully!' });
    } else {
      res.status(400).json({ error: 'Invalid backup file structure' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
