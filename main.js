const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
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

// Configure auto-updater
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = true; // Automatically download updates
autoUpdater.autoInstallOnAppQuit = true; // Install on quit

// For private repos, set the GitHub token
if (process.env.GH_TOKEN) {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'AdhamFouadHussein',
    repo: 'electron-whatsapp',
    private: true,
    token: process.env.GH_TOKEN
  });
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
  // Notify the renderer process
  if (mainWindow) {
    mainWindow.webContents.send('update:available', info);
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info);
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update:error', err.message);
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  const message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
  console.log(message);
  if (mainWindow) {
    mainWindow.webContents.send('update:download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info);
  if (mainWindow) {
    mainWindow.webContents.send('update:downloaded', info);
  }
  // Optionally, you can prompt the user to restart
  // autoUpdater.quitAndInstall() will restart and install the update
});

// IPC handlers for manual update control
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

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

  // Check for updates after app is ready (only in production)
  if (app.isPackaged) {
    // Only check for updates if there are releases available
    // This prevents 404 errors when no releases exist yet
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('No updates available yet:', err.message);
      });
    }, 3000); // Wait 3 seconds after launch
    
    // Check for updates every hour
    setInterval(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('Update check failed:', err.message);
      });
    }, 60 * 60 * 1000); // 60 minutes
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
