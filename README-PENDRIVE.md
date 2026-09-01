# 🏍️ Motorcycle Workshop & Modification Studio POS
### 100% Standalone & Zero-Dependency Software (No Node.js Required on Client PC)

This software is **100% self-contained**. Your client **does NOT need to install Node.js, MongoDB, or any developer tools** on their computer.

---

## 🚀 How to Hand Over & Run on Client's PC

### Step 1: Copy to Client's PC or USB Drive
Copy the entire `garage-billing-system` folder to your client's computer (or keep it on a USB Pen Drive).

### Step 2: Double-Click to Launch
Open the folder and double-click either:

1. **`Start-Workshop-Studio.bat`** *(Standard Launcher)*
   - Launches the local workshop engine and opens the app in the browser.
   - Shows status that the database is active.
   
2. **`Launch-App-Silent.vbs`** *(Silent Launcher)*
   - Launches silently in the background without showing any command prompt window and opens the app directly in the browser at `http://localhost:5000`.

---

## 📁 Why It Works on Any PC Without Installing Anything

- **Embedded Runtime**: The folder contains its own self-contained portable engine inside `bin/node.exe`.
- **Embedded Database**: Customer records, invoices, parts catalog, and job cards are saved automatically inside `data/garage_database.json`.
- **Pre-Built Frontend**: The user interface is bundled in `frontend/dist/` and served locally.
- **Offline PDF & WhatsApp**: Generates downloadable PDF tax invoices and WhatsApp bill links completely offline.

---

## ⚙️ First-Time Setup for Client (1 Minute)
When your client opens the software:
1. Click **Settings & Backup** in the navigation bar.
2. Enter their **Workshop Name**, **Contact Number**, **Address**, and **UPI ID** (for the invoice payment QR code).
3. Click **Save Settings**. All invoices and bills will now carry their business details.
