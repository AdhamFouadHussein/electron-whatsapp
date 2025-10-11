const { ipcMain, nativeTheme } = require('electron');
const { testConnection, initializeDatabase } = require('./database');
const dbOps = require('./db-operations');
const whatsappService = require('./whatsapp-service');
const reminderScheduler = require('./reminder-scheduler');
const licenseService = require('./license-service');
const fs = require('fs');
const path = require('path');

// Initialize backend services
async function initializeBackend(mainWindow) {
  try {
    console.log('Initializing backend services...');
    
    // Test database connection
    await testConnection();
    
    // Initialize database schema
    await initializeDatabase();
    
    // Connect WhatsApp
    whatsappService.setQRCallback((qr) => {
      if (mainWindow) {
        mainWindow.webContents.send('whatsapp:qr', qr);
      }
    });
    
    whatsappService.setStatusCallback((status) => {
      if (mainWindow) {
        mainWindow.webContents.send('whatsapp:status', status);
      }
    });
    
    await whatsappService.connect();
    
    // Start reminder scheduler
    reminderScheduler.start();
    
    console.log('✓ Backend services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize backend services:', error);
    throw error;
  }
}

// Database IPC handlers
ipcMain.handle('db:getUsers', async () => {
  return await dbOps.getUsers();
});

ipcMain.handle('db:getUser', async (event, id) => {
  return await dbOps.getUser(id);
});

ipcMain.handle('db:createUser', async (event, user) => {
  return await dbOps.createUser(user);
});

ipcMain.handle('db:updateUser', async (event, id, user) => {
  return await dbOps.updateUser(id, user);
});

ipcMain.handle('db:deleteUser', async (event, id) => {
  return await dbOps.deleteUser(id);
});

ipcMain.handle('db:getEvents', async (event, userId) => {
  return await dbOps.getEvents(userId);
});

ipcMain.handle('db:createEvent', async (event, eventData) => {
  return await dbOps.createEvent(eventData);
});

ipcMain.handle('db:updateEvent', async (event, id, eventData) => {
  return await dbOps.updateEvent(id, eventData);
});

ipcMain.handle('db:deleteEvent', async (event, id) => {
  return await dbOps.deleteEvent(id);
});

ipcMain.handle('db:getReminders', async (event, status) => {
  return await dbOps.getReminders(status);
});

ipcMain.handle('db:createReminder', async (event, reminder) => {
  return await dbOps.createReminder(reminder);
});

ipcMain.handle('db:updateReminder', async (event, id, reminder) => {
  return await dbOps.updateReminder(id, reminder);
});

ipcMain.handle('db:deleteReminder', async (event, id) => {
  return await dbOps.deleteReminder(id);
});

ipcMain.handle('db:getMessageTemplates', async (event, language) => {
  return await dbOps.getMessageTemplates(language);
});

ipcMain.handle('db:saveMessageTemplate', async (event, template) => {
  return await dbOps.saveMessageTemplate(template);
});

ipcMain.handle('db:getMessageLogs', async (event, userId) => {
  return await dbOps.getMessageLogs(userId);
});

ipcMain.handle('db:uploadFile', async (event, fileData) => {
  // fileData should contain: user_id, filename, original_name, file_type, file_size, file_data (as Buffer), mime_type
  return await dbOps.uploadFile(fileData);
});

ipcMain.handle('db:getFile', async (event, id) => {
  return await dbOps.getFile(id);
});

ipcMain.handle('db:getUserFiles', async (event, userId) => {
  return await dbOps.getUserFiles(userId);
});

// WhatsApp IPC handlers
ipcMain.handle('whatsapp:getStatus', async () => {
  return whatsappService.getStatus();
});

ipcMain.handle('whatsapp:sendMessage', async (event, phone, message, language) => {
  try {
    return await whatsappService.sendMessage(phone, message);
  } catch (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }
});

ipcMain.handle('whatsapp:sendMessageWithFile', async (event, phone, message, fileId, language) => {
  try {
    const file = await dbOps.getFile(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    
    if (file.storage_type === 'mysql' && file.file_data) {
      return await whatsappService.sendMessageWithBuffer(
        phone,
        message,
        file.file_data,
        file.mime_type,
        file.original_name
      );
    } else {
      throw new Error('Unsupported file storage type');
    }
  } catch (error) {
    throw new Error(`Failed to send message with file: ${error.message}`);
  }
});

// Settings IPC handlers
ipcMain.handle('settings:getTheme', async () => {
  const theme = await dbOps.getSetting('theme');
  return theme || 'auto';
});

ipcMain.handle('settings:setTheme', async (event, theme) => {
  await dbOps.setSetting('theme', theme);
  return theme;
});

ipcMain.handle('settings:getLanguage', async () => {
  const language = await dbOps.getSetting('language');
  return language || 'en';
});

ipcMain.handle('settings:setLanguage', async (event, language) => {
  await dbOps.setSetting('language', language);
  return language;
});

ipcMain.handle('settings:getSystemTheme', async () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

// Database settings IPC handlers
ipcMain.handle('settings:getDatabaseConfig', async () => {
  try {
    // Always read from environment variables (current config)
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '3306',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'whatsapp_reminder_app'
    };
    return config;
  } catch (error) {
    console.error('Error getting database config:', error);
    throw error;
  }
});

ipcMain.handle('settings:setDatabaseConfig', async (event, config) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Read current .env.production file
    const envPath = path.join(__dirname, '../../.env.production');
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      // If file doesn't exist, create basic structure
      envContent = `# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=whatsapp_reminder_app

# Application Settings
NODE_ENV=production
APP_PORT=3000

# License Server Configuration
LICENSE_SERVER_URL=http://your-license-server.com/api/license
LICENSE_SECRET=your-secret-key-change-in-production

# Security
ENCRYPTION_KEY=your-32-character-encryption-key

# WhatsApp Session Storage
WA_SESSION_PATH=./whatsapp-session

# Logging
LOG_LEVEL=info
`;
    }

    // Update database configuration in .env content
    envContent = envContent
      .replace(/^DB_HOST=.*$/m, `DB_HOST=${config.host}`)
      .replace(/^DB_PORT=.*$/m, `DB_PORT=${config.port}`)
      .replace(/^DB_USER=.*$/m, `DB_USER=${config.user}`)
      .replace(/^DB_PASSWORD=.*$/m, `DB_PASSWORD=${config.password}`)
      .replace(/^DB_NAME=.*$/m, `DB_NAME=${config.database}`);

    // Write back to file
    fs.writeFileSync(envPath, envContent);
    
    // Update process.env for immediate effect
    process.env.DB_HOST = config.host;
    process.env.DB_PORT = config.port;
    process.env.DB_USER = config.user;
    process.env.DB_PASSWORD = config.password;
    process.env.DB_NAME = config.database;
    
    return { success: true };
  } catch (error) {
    console.error('Error setting database config:', error);
    throw error;
  }
});

ipcMain.handle('settings:testDatabaseConnection', async (event, config) => {
  try {
    const mysql = require('mysql2/promise');
    const testPool = mysql.createPool({
      host: config.host,
      port: parseInt(config.port),
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: 1,
      acquireTimeout: 5000,
      timeout: 5000
    });

    const connection = await testPool.getConnection();
    connection.release();
    await testPool.end();
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Listen for system theme changes
nativeTheme.on('updated', () => {
  const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  // Notify renderer process
  const windows = require('electron').BrowserWindow.getAllWindows();
  windows.forEach(window => {
    window.webContents.send('settings:systemThemeChanged', theme);
  });
});

// System IPC handlers
ipcMain.handle('system:getVersion', async () => {
  const packageJson = require('../../package.json');
  return packageJson.version;
});

ipcMain.handle('system:checkForUpdates', async () => {
  // Placeholder for auto-updater
  return { available: false };
});

// License IPC handlers
ipcMain.handle('license:check', async () => {
  return await licenseService.checkLicense();
});

ipcMain.handle('license:activate', async (event, { licenseKey, email }) => {
  return await licenseService.activateLicense(licenseKey, email);
});

ipcMain.handle('license:deactivate', async () => {
  return await licenseService.deactivateLicense();
});

ipcMain.handle('license:getInfo', async () => {
  return await licenseService.getLicenseInfo();
});

ipcMain.handle('license:getHardwareId', async () => {
  return await licenseService.getHardwareId();
});

module.exports = { initializeBackend };
