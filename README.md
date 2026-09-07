# 🏍️ Royal Enfield Workshop Studio POS & Management System

A full-stack, offline-first Workshop Management & Dealership Standard Billing System built for Motorcycle Modification Studios, Royal Enfield Dealerships, and Multi-Brand Garages.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, jsPDF, html2canvas
- **Backend Engine**: Node.js (ES Modules), Express.js, Baileys (Local WhatsApp WebSockets), PDFKit, QRCode
- **Database**: Local JSON Engine (`data/garage_database.json`) — 100% portable with zero cloud/MongoDB dependencies
- **Distribution**: Standalone Portable Mode with embedded `bin/node.exe` for zero-install client delivery

---

## 🚀 Getting Started for Developers

If you are a new developer or contributor cloning this repository, follow these simple steps to set up the development environment:

### 1. Clone the Repository
```bash
git clone https://github.com/apex97493-tech/garage-billing-system.git
cd garage-billing-system
```

### 2. Install Dependencies

You need to install npm packages for both the **Backend** and **Frontend**:

```bash
# 1. Install Backend Dependencies
cd backend
npm install
cd ..

# 2. Install Frontend Dependencies
cd frontend
npm install
cd ..
```

---

## 💻 Running in Development Mode (Live Hot Reload)

To develop with live hot-reloading (frontend on `5173`, backend on `5000`):

#### Terminal 1 — Backend Server:
```bash
cd backend
npm run dev
```
*(Runs on `http://localhost:5000` with Node.js watch mode)*

#### Terminal 2 — Frontend Dev Server:
```bash
cd frontend
npm run dev
```
*(Runs on `http://localhost:5173` with instant Vite Hot Module Replacement)*

---

## 🏗️ Project Structure & Key Files

```
garage-billing-system/
 ├── backend/
 │    ├── routes/api.js              # REST API endpoints (Invoices, Parts, Customers, Settings, WhatsApp)
 │    ├── database/localDb.js        # Offline database controller & JSON file storage
 │    ├── services/pdfService.js     # Dealership standard Indian GST PDF invoice generator
 │    ├── services/whatsappLocalBot.js # Local Baileys WhatsApp bot & instant unlinking
 │    └── server.js                  # Express server & static dist file server
 │
 ├── frontend/
 │    ├── src/pages/
 │    │    ├── POS.jsx               # Main billing interface with Royal Enfield auto-lookup
 │    │    ├── Invoices.jsx          # Invoice registry & sales analytics
 │    │    ├── PrintInvoice.jsx      # Printable Dealership GST Invoice view & dynamic UPI QR
 │    │    ├── Customers.jsx         # Customer profiles, motorcycle history & service logs
 │    │    ├── Inventory.jsx         # 21,600+ parts catalog with clean pricing & stock management
 │    │    ├── Reminders.jsx         # Automated periodic service maintenance reminders
 │    │    └── Settings.jsx          # Workshop business profile, custom logo upload, WhatsApp pairing
 │    └── dist/                      # Compiled production frontend bundle
 │
 ├── bin/
 │    └── node.exe                   # Standalone portable Node.js runtime for client PCs
 │
 ├── data/
 │    └── garage_database.json       # All customer, parts catalog, settings, and invoice data
 │
 ├── Start-Workshop-Studio.bat       # 1-Click launcher with terminal status
 ├── Launch-App-Silent.vbs          # 1-Click silent background launcher (no command prompt)
 └── Create-Desktop-Shortcut.bat     # Creates a 1-click shortcut on the Windows Desktop
```

---

## 📦 Building for Production / Client Distribution

Whenever you make changes to frontend code (`frontend/src/`) and want to update the standalone app for your client:

```bash
cd frontend
npm run build
cd ..
```

This compiles the React app into `frontend/dist/`. The backend (`backend/server.js`) automatically serves `frontend/dist/` at `http://localhost:5000` when the client launches the app.

---

## 🔄 How to Push Updates to GitHub

```bash
# 1. Stage all changes
git add .

# 2. Commit with a clear message
git commit -m "Add new feature or update"

# 3. Push to main branch
git push origin main
```
