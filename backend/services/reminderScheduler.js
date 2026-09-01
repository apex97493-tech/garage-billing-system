import cron from 'node-cron';
import db from '../database/localDb.js';
import whatsappBot from './whatsappLocalBot.js';

/**
 * Format a friendly, professional periodic service reminder message
 */
export function formatServiceReminderMessage(reminder, settings) {
  const shopName = (settings?.shopName || 'MOTO WORKSHOP').toUpperCase();
  const address = settings?.address || '';
  const phone = settings?.contactNumber || '';
  const cust = reminder.customer || {};

  const dueDateStr = new Date(reminder.nextServiceDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return `🏍️ *PERIODIC SERVICE REMINDER — ${shopName}*\n` +
    `═════════════════════════════════════\n\n` +
    `Hello *${cust.name}*,\n\n` +
    `This is a friendly reminder that your motorcycle *${cust.bikeModel}* (${cust.regNo || 'Bespoke'}) is due for its periodic maintenance service!\n\n` +
    `📅 *Target Service Date:* ${dueDateStr}\n` +
    (reminder.lastKm > 0 ? `⏱️ *Last Service KM:* ${reminder.lastKm} KM\n` : '') +
    (reminder.nextServiceKm > 0 ? `🎯 *Next Service KM:* ~${reminder.nextServiceKm} KM\n\n` : '\n') +
    `Regular periodic servicing keeps your engine smooth, optimizes fuel efficiency, and ensures maximum riding safety.\n\n` +
    `📍 *Workshop Address:*\n${address}\n` +
    `📞 *Call / WhatsApp for Appointment:* ${phone}\n\n` +
    `_Thank you for trusting ${shopName}. Ride with pride!_`;
}

/**
 * Send due service reminders to all eligible customers
 */
export async function sendDueRemindersNow() {
  const settings = db.getSettings();
  const dueReminders = db.getDueServiceReminders();
  const unsentReminders = dueReminders.filter(r => !r.reminderSent && r.customer?.phone);

  const results = {
    totalChecked: dueReminders.length,
    unsentCount: unsentReminders.length,
    sentCount: 0,
    failedCount: 0,
    details: []
  };

  console.log(`[Service Reminder] Processing ${unsentReminders.length} unsent due service reminders...`);

  for (const reminder of unsentReminders) {
    const phone = reminder.customer.phone;
    const msg = formatServiceReminderMessage(reminder, settings);

    const isSent = await whatsappBot.sendMessage(phone, msg);
    if (isSent) {
      db.markReminderSent(reminder.invoiceId, true);
      results.sentCount++;
      results.details.push({ phone, name: reminder.customer.name, status: 'sent' });
    } else {
      results.failedCount++;
      results.details.push({ phone, name: reminder.customer.name, status: 'failed_or_bot_offline' });
    }
  }

  return results;
}

/**
 * Initialize background daily cron scheduler (Runs at 10:00 AM daily)
 */
export function initReminderScheduler() {
  // Run once daily at 10:00 AM
  cron.schedule('0 10 * * *', async () => {
    const settings = db.getSettings();
    if (settings.autoSendServiceReminders !== false && whatsappBot.isConnected) {
      console.log('[Scheduler] Running daily 10:00 AM service reminder check...');
      await sendDueRemindersNow();
    }
  });

  console.log('[Scheduler] Daily automated service reminder cron active.');
}
