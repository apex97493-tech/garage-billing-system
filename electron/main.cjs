const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let serverProcess;
const PORT = 5000;
const SERVER_URL = `http://localhost:${PORT}`;

function startBackendServer() {
  const serverScript = path.join(__dirname, '../backend/server.js');
  // Start backend node server
  serverProcess = spawn(process.execPath, [serverScript], {
    cwd: path.join(__dirname, '../backend'),
    env: { ...process.env, PORT: PORT.toString() },
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start backend server:', err);
  });
}

function waitForServer(callback, retries = 30) {
  if (retries === 0) {
    console.error('Server failed to start in time.');
    return;
  }

  http.get(SERVER_URL + '/api/health', (res) => {
    if (res.statusCode === 200) {
      callback();
    } else {
      setTimeout(() => waitForServer(callback, retries - 1), 500);
    }
  }).on('error', () => {
    setTimeout(() => waitForServer(callback, retries - 1), 500);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#020617',
    title: 'Iron & Throttle — Custom Bike Modifier Studio',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL(SERVER_URL);

  // Custom App Menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Print Invoice / Page',
          accelerator: 'CmdOrCtrl+P',
          click: () => { mainWindow.webContents.print(); }
        },
        { type: 'separator' },
        { label: 'Exit Studio', role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', accelerator: 'F5' },
        { role: 'forceReload', accelerator: 'CmdOrCtrl+F5' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggledevtools', accelerator: 'F12' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackendServer();
  waitForServer(createWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
