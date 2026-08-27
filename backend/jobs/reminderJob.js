import cron from 'node-cron';
import Invoice from '../models/Invoice.js';
import Setting from '../models/Setting.js';
import { sendWhatsAppReminder } from '../services/whatsappService.js';

// Run every day at 09:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily WhatsApp reminder job...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find invoices where nextServiceDate is today and reminder hasn't been sent
    const dueInvoices = await Invoice.find({
      nextServiceDate: {
        $gte: today,
        $lt: tomorrow
      },
      reminderSent: false
    }).populate('customer');

    if (dueInvoices.length === 0) {
      console.log('No reminders due today.');
      return;
    }

    const settings = await Setting.findOne();
    const garageName = settings?.shopName || 'Royal Enfield Workshop';
    const garageContact = settings?.contactNumber || '';

    for (const invoice of dueInvoices) {
      const customer = invoice.customer;
      
      const message = `Hello ${customer.name},\n\nThis is a friendly reminder from ${garageName} that your Royal Enfield ${customer.bikeModel} (${customer.regNo}) is due for its periodic service today (Last service was at ${invoice.currentKm} KM).\n\nExpected Target: ${invoice.nextServiceKm} KM.\n\nPlease visit us or call ${garageContact} to book an appointment.\n\nRide Safe!`;

      const success = await sendWhatsAppReminder(customer.phone, message);
      
      if (success) {
        invoice.reminderSent = true;
        await invoice.save();
      }
    }
  } catch (error) {
    console.error('Error in reminder job:', error);
  }
});
