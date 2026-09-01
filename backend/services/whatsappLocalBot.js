import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_DIR = path.resolve(__dirname, '../../data/whatsapp_session');

if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

class WhatsAppLocalBot {
  constructor() {
    this.sock = null;
    this.qrCodeDataUrl = null;
    this.qrRaw = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.connectedPhone = null;
    this.retryCount = 0;
  }

  async init() {
    try {
      const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = await import('@whiskeysockets/baileys');
      const { default: pino } = await import('pino');

      this.isConnecting = true;
      const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Workshop POS Studio', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrRaw = qr;
          this.qrCodeDataUrl = await QRCode.toDataURL(qr);
          this.isConnected = false;
          console.log('[WhatsApp] New pairing QR generated. Scan from Settings.');
        }

        if (connection === 'open') {
          this.isConnected = true;
          this.isConnecting = false;
          this.qrCodeDataUrl = null;
          this.qrRaw = null;
          this.retryCount = 0;
          const userJid = this.sock.user?.id || '';
          this.connectedPhone = userJid.split(':')[0] || userJid.split('@')[0];
          console.log(`[WhatsApp] Workshop WhatsApp connected successfully! Number: ${this.connectedPhone}`);
        } else if (connection === 'close') {
          this.isConnected = false;
          this.isConnecting = false;
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          console.log(`[WhatsApp] Connection closed. Reason code: ${statusCode}. Reconnecting: ${shouldReconnect}`);

          if (shouldReconnect && this.retryCount < 5) {
            this.retryCount++;
            setTimeout(() => this.init(), 3000);
          } else if (statusCode === DisconnectReason.loggedOut) {
            this.disconnect();
          }
        }
      });
    } catch (err) {
      console.warn('[WhatsApp Bot] Baileys library initializing error:', err.message);
      this.isConnecting = false;
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      connectedPhone: this.connectedPhone,
      hasQR: Boolean(this.qrCodeDataUrl),
      qrCodeDataUrl: this.qrCodeDataUrl
    };
  }

  async disconnect() {
    try {
      this.isConnected = false;
      this.isConnecting = false;
      this.qrCodeDataUrl = null;
      this.connectedPhone = null;

      if (this.sock) {
        await this.sock.logout().catch(() => {});
        this.sock = null;
      }

      if (fs.existsSync(SESSION_DIR)) {
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        fs.mkdirSync(SESSION_DIR, { recursive: true });
      }

      console.log('[WhatsApp] Disconnected and session cleared.');
      return true;
    } catch (err) {
      console.error('[WhatsApp] Error during disconnect:', err.message);
      return false;
    }
  }

  async sendMessage(phone, text) {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const jid = `${fullPhone}@s.whatsapp.net`;

    if (!this.isConnected || !this.sock) {
      console.log(`[WhatsApp Simulated Text] To: ${fullPhone}\nMessage: ${text.slice(0, 80)}...`);
      return false;
    }

    try {
      await this.sock.sendMessage(jid, { text });
      console.log(`[WhatsApp] Text message sent to ${fullPhone}`);
      return true;
    } catch (err) {
      console.error(`[WhatsApp] Failed to send message to ${fullPhone}:`, err.message);
      return false;
    }
  }

  async sendDocument(phone, docBuffer, fileName = 'Tax_Invoice.pdf', caption = '') {
    if (!phone || !docBuffer) return false;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const jid = `${fullPhone}@s.whatsapp.net`;

    if (!this.isConnected || !this.sock) {
      console.log(`[WhatsApp Simulated PDF Document] To: ${fullPhone}, File: ${fileName}, Size: ${docBuffer.length} bytes`);
      return false;
    }

    try {
      await this.sock.sendMessage(jid, {
        document: docBuffer,
        mimetype: 'application/pdf',
        fileName: fileName,
        caption: caption
      });
      console.log(`[WhatsApp] PDF document file successfully sent to ${fullPhone}`);
      return true;
    } catch (err) {
      console.error(`[WhatsApp] Failed to send PDF document to ${fullPhone}:`, err.message);
      return false;
    }
  }
}

export const whatsappBot = new WhatsAppLocalBot();
export default whatsappBot;
