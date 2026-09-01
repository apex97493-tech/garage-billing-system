import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import whatsappBot from './services/whatsappLocalBot.js';
import { initReminderScheduler } from './services/reminderScheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api', apiRoutes);

// Serve Frontend Static Files (from Vite build in dist folder)
const distPath = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// For SPA routing, serve index.html for non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, async () => {
  console.log(`========================================================`);
  console.log(`  WORKSHOP ENGINE ACTIVE ON http://localhost:${PORT}`);
  console.log(`  Database stored in: ./data/garage_database.json`);
  console.log(`========================================================`);

  // Initialize WhatsApp Bot & Scheduler in background
  whatsappBot.init();
  initReminderScheduler();
});
