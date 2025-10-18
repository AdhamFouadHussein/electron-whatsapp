const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Load environment variables
// In production (packaged app), load from extraResources
// In development, load from root directory
const envPath = app.isPackaged 
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.warn('No .env file found at:', envPath);
  // In production, try .env.production as fallback
  const prodEnvPath = path.join(__dirname, '.env.production');
  if (fs.existsSync(prodEnvPath)) {
    require('dotenv').config({ path: prodEnvPath });
  }
}

const { initializeBackend } = require('./src/backend/ipc-handlers');
const licenseService = require('./src/backend/license-service');

let mainWindow;
let licenseWindow;

function createLicenseWindow() {
  licenseWindow = new BrowserWindow({
    width: 600,
    height: 750,
    minWidth: 500,
    minHeight: 650,
    resizable: true,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1e1e1e',
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  licenseWindow.loadFile('dist/license.html');

  licenseWindow.once('ready-to-show', () => {
    licenseWindow.show();
  });

  licenseWindow.on('closed', () => {
    licenseWindow = null;
    // If license window is closed without activation, quit app
    if (!mainWindow) {
      app.quit();
    }
  });
}

// Handle successful license activation
ipcMain.on('license:activated', () => {
  if (licenseWindow) {
    licenseWindow.close();
    licenseWindow = null;
  }
  createWindow();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1e1e1e',
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // Load the React app
  mainWindow.loadFile('dist/index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initialize backend services
  initializeBackend(mainWindow).catch(error => {
    console.error('Failed to initialize backend:', error);
  });
}

// App lifecycle
app.whenReady().then(async () => {
  // Check license before creating main window
  const licenseCheck = await licenseService.checkLicense();
  
  if (!licenseCheck.valid) {
    // Show license activation window
    createLicenseWindow();
  } else {
    // License is valid, create main window
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
