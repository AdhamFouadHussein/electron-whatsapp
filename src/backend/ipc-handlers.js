const { ipcMain, nativeTheme } = require('electron');
const { testConnection, initializeDatabase } = require('./database');
const dbOps = require('./db-operations');
const whatsappService = require('./whatsapp-service');
const reminderScheduler = require('./reminder-scheduler');
const licenseService = require('./license-service');
const campaignService = require('./campaign-service');
const fs = require('fs');
const path = require('path');

// Load database configuration from user data directory
async function loadDatabaseConfig() {
  try {
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'database-config.json');
    
    if (fs.existsSync(configPath)) {
      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Update environment variables with saved config
      if (savedConfig.host) process.env.DB_HOST = savedConfig.host;
      if (savedConfig.port) process.env.DB_PORT = savedConfig.port;
      if (savedConfig.user) process.env.DB_USER = savedConfig.user;
      if (savedConfig.password) process.env.DB_PASSWORD = savedConfig.password;
      if (savedConfig.database) process.env.DB_NAME = savedConfig.database;
      
      console.log('Database configuration loaded from user data');
    }
  } catch (error) {
    console.error('Error loading database config:', error);
  }
}

// Initialize backend services
async function initializeBackend(mainWindow) {
  try {
    console.log('Initializing backend services...');
    
    // Load database configuration from user data directory
    await loadDatabaseConfig();
    
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
    
    // Try to auto-connect WhatsApp (will use saved session if exists)
    try {
      await whatsappService.connect();
    } catch (error) {
      console.log('WhatsApp auto-connect failed (this is normal for first time setup):', error.message);
    }
    
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

ipcMain.handle('db:getUpcomingBirthdays', async (event, daysAhead) => {
  return await dbOps.getUpcomingBirthdays(daysAhead || 30);
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

ipcMain.handle('db:getAllFiles', async () => {
  return await dbOps.getAllFiles();
});

ipcMain.handle('db:deleteFile', async (event, id) => {
  return await dbOps.deleteFile(id);
});

// WhatsApp IPC handlers
ipcMain.handle('whatsapp:connect', async () => {
  try {
    await whatsappService.connect();
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to connect WhatsApp: ${error.message}`);
  }
});

ipcMain.handle('whatsapp:getStatus', async () => {
  return whatsappService.getStatus();
});

ipcMain.handle('whatsapp:disconnect', async () => {
  try {
    await whatsappService.disconnect();
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to disconnect WhatsApp: ${error.message}`);
  }
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

ipcMain.handle('whatsapp:sendBirthdayWish', async (event, userId) => {
  try {
    // Get user data
    const user = await dbOps.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get birthday template for user's preferred language
    const templates = await dbOps.getMessageTemplates(user.preferred_language);
    const birthdayTemplate = templates.find(t => t.event_type === 'birthday' && t.is_default);

    let message;
    if (birthdayTemplate) {
      // Interpolate variables in template
      message = birthdayTemplate.template_text.replace(/\{\{name\}\}/g, user.name);
    } else {
      // Fallback message
      message = user.preferred_language === 'ar' 
        ? `عيد ميلاد سعيد ${user.name}! 🎉🎂 أتمنى لك يوماً رائعاً مليئاً بالفرح والسعادة!`
        : `Happy Birthday ${user.name}! 🎉🎂 Wishing you a wonderful day filled with joy and happiness!`;
    }

    // Send message via WhatsApp
    await whatsappService.sendMessage(user.phone, message);

    // Log the message
    await dbOps.createMessageLog({
      user_id: user.id,
      reminder_id: null,
      message_type: 'birthday',
      message_text: message,
      language: user.preferred_language,
      file_id: null,
      phone: user.phone,
      status: 'sent'
    });

    return { success: true, message };
  } catch (error) {
    // Log failed attempt
    try {
      const user = await dbOps.getUser(userId);
      if (user) {
        await dbOps.createMessageLog({
          user_id: user.id,
          reminder_id: null,
          message_type: 'birthday',
          message_text: 'Failed to send',
          language: user.preferred_language,
          file_id: null,
          phone: user.phone,
          status: 'failed',
          error_message: error.message
        });
      }
    } catch (logError) {
      console.error('Error logging failed birthday message:', logError);
    }
    throw new Error(`Failed to send birthday wish: ${error.message}`);
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
    const fs = require('fs');
    const path = require('path');
    const { app } = require('electron');
    
    // Try to read from user data directory first
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'database-config.json');
    
    let config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '3306',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'whatsapp_reminder_app'
    };
    
    // If user config exists, use it
    if (fs.existsSync(configPath)) {
      try {
        const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config = {
          host: savedConfig.host || config.host,
          port: savedConfig.port || config.port,
          user: savedConfig.user || config.user,
          password: savedConfig.password || config.password,
          database: savedConfig.database || config.database
        };
        
        // Update environment variables with saved config
        process.env.DB_HOST = config.host;
        process.env.DB_PORT = config.port;
        process.env.DB_USER = config.user;
        process.env.DB_PASSWORD = config.password;
        process.env.DB_NAME = config.database;
      } catch (parseError) {
        console.error('Error parsing saved database config:', parseError);
      }
    }
    
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
    const { app } = require('electron');
    const { createPool } = require('./database');
    
    // Get user data directory (writable location)
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'database-config.json');
    
    // Save database configuration to user data directory
    const configData = {
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      updatedAt: new Date().toISOString()
    };
    
    // Ensure directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Write configuration file
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    
    // Update process.env for immediate effect
    process.env.DB_HOST = config.host;
    process.env.DB_PORT = config.port;
    process.env.DB_USER = config.user;
    process.env.DB_PASSWORD = config.password;
    process.env.DB_NAME = config.database;
    
    // Recreate the database pool with new settings
    createPool();
    
    console.log('Database configuration saved and pool recreated with new settings');
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

// Campaign IPC handlers
ipcMain.handle('campaign:create', async (event, campaignData) => {
  return await dbOps.createCampaign(campaignData);
});

ipcMain.handle('campaign:getAll', async () => {
  return await dbOps.getCampaigns();
});

ipcMain.handle('campaign:get', async (event, id) => {
  return await dbOps.getCampaign(id);
});

ipcMain.handle('campaign:parseCSV', async (event, csvContent) => {
  return await campaignService.parseCSV(csvContent);
});

ipcMain.handle('campaign:addRecipients', async (event, { campaignId, recipients }) => {
  return await dbOps.addCampaignRecipients(campaignId, recipients);
});

ipcMain.handle('campaign:getRecipients', async (event, campaignId) => {
  return await dbOps.getCampaignRecipients(campaignId);
});

ipcMain.handle('campaign:start', async (event, campaignId) => {
  return await campaignService.startCampaign(campaignId);
});

ipcMain.handle('campaign:pause', async (event, campaignId) => {
  return await campaignService.pauseCampaign(campaignId);
});

ipcMain.handle('campaign:resume', async (event, campaignId) => {
  return await campaignService.resumeCampaign(campaignId);
});

ipcMain.handle('campaign:getStatus', async () => {
  return campaignService.getActiveCampaignStatus();
});

module.exports = { initializeBackend, loadDatabaseConfig };

