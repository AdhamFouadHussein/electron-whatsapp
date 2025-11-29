const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Database operations
  db: {
    getUsers: () => ipcRenderer.invoke('db:getUsers'),
    getUser: (id) => ipcRenderer.invoke('db:getUser', id),
    createUser: (user) => ipcRenderer.invoke('db:createUser', user),
    createUsers: (users) => ipcRenderer.invoke('db:createUsers', users),
    updateUser: (id, user) => ipcRenderer.invoke('db:updateUser', id, user),
    deleteUser: (id) => ipcRenderer.invoke('db:deleteUser', id),

    getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats'),
    getMessagesChartData: () => ipcRenderer.invoke('db:getMessagesChartData'),
    getTodaysMessageStatus: () => ipcRenderer.invoke('db:getTodaysMessageStatus'),
    getUpcomingEventsList: (limit) => ipcRenderer.invoke('db:getUpcomingEventsList', limit),

    getEvents: (userId) => ipcRenderer.invoke('db:getEvents', userId),
    createEvent: (event) => ipcRenderer.invoke('db:createEvent', event),
    updateEvent: (id, event) => ipcRenderer.invoke('db:updateEvent', id, event),
    deleteEvent: (id) => ipcRenderer.invoke('db:deleteEvent', id),

    getReminders: () => ipcRenderer.invoke('db:getReminders'),
    createReminder: (reminder) => ipcRenderer.invoke('db:createReminder', reminder),
    updateReminder: (id, reminder) => ipcRenderer.invoke('db:updateReminder', id, reminder),
    deleteReminder: (id) => ipcRenderer.invoke('db:deleteReminder', id),

    getMessageTemplates: (language) => ipcRenderer.invoke('db:getMessageTemplates', language),
    getMessageTemplate: (id) => ipcRenderer.invoke('db:getMessageTemplate', id),
    saveMessageTemplate: (template) => ipcRenderer.invoke('db:saveMessageTemplate', template),
    deleteMessageTemplate: (id) => ipcRenderer.invoke('db:deleteMessageTemplate', id),

    getMessageLogs: (userId) => ipcRenderer.invoke('db:getMessageLogs', userId),
    getUpcomingBirthdays: (daysAhead) => ipcRenderer.invoke('db:getUpcomingBirthdays', daysAhead),

    uploadFile: (file) => ipcRenderer.invoke('db:uploadFile', file),
    getFile: (id) => ipcRenderer.invoke('db:getFile', id),
    getUserFiles: (userId) => ipcRenderer.invoke('db:getUserFiles', userId),
    getAllFiles: () => ipcRenderer.invoke('db:getAllFiles'),
    deleteFile: (id) => ipcRenderer.invoke('db:deleteFile', id)
  },

  // WhatsApp operations
  whatsapp: {
    connect: () => ipcRenderer.invoke('whatsapp:connect'),
    getStatus: () => ipcRenderer.invoke('whatsapp:getStatus'),
    disconnect: () => ipcRenderer.invoke('whatsapp:disconnect'),
    sendMessage: (phone, message, language) => ipcRenderer.invoke('whatsapp:sendMessage', phone, message, language),
    sendMessageWithFile: (phone, message, fileId, language) => ipcRenderer.invoke('whatsapp:sendMessageWithFile', phone, message, fileId, language),
    sendBirthdayWish: (userId) => ipcRenderer.invoke('whatsapp:sendBirthdayWish', userId),
    onQRCode: (callback) => ipcRenderer.on('whatsapp:qr', (_, qr) => callback(qr)),
    onStatusChange: (callback) => ipcRenderer.on('whatsapp:status', (_, status) => callback(status))
  },

  // Settings
  settings: {
    getTheme: () => ipcRenderer.invoke('settings:getTheme'),
    setTheme: (theme) => ipcRenderer.invoke('settings:setTheme', theme),
    getLanguage: () => ipcRenderer.invoke('settings:getLanguage'),
    setLanguage: (language) => ipcRenderer.invoke('settings:setLanguage', language),
    getSystemTheme: () => ipcRenderer.invoke('settings:getSystemTheme'),
    onSystemThemeChange: (callback) => ipcRenderer.on('settings:systemThemeChanged', (_, theme) => callback(theme)),
    getDatabaseConfig: () => ipcRenderer.invoke('settings:getDatabaseConfig'),
    setDatabaseConfig: (config) => ipcRenderer.invoke('settings:setDatabaseConfig', config),
    testDatabaseConnection: (config) => ipcRenderer.invoke('settings:testDatabaseConnection', config)
  },

  // System
  system: {
    getVersion: () => ipcRenderer.invoke('system:getVersion'),
    checkForUpdates: () => ipcRenderer.invoke('system:checkForUpdates')
  },

  // Auto-updater
  updater: {
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    installUpdate: () => ipcRenderer.send('install-update'),
    onUpdateAvailable: (callback) => ipcRenderer.on('update:available', (_, info) => callback(info)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update:downloaded', (_, info) => callback(info)),
    onDownloadProgress: (callback) => ipcRenderer.on('update:download-progress', (_, progress) => callback(progress)),
    onUpdateError: (callback) => ipcRenderer.on('update:error', (_, error) => callback(error))
  },

  // License
  license: {
    check: () => ipcRenderer.invoke('license:check'),
    activate: (licenseKey, email) => ipcRenderer.invoke('license:activate', { licenseKey, email }),
    deactivate: () => ipcRenderer.invoke('license:deactivate'),
    getInfo: () => ipcRenderer.invoke('license:getInfo'),
    getHardwareId: () => ipcRenderer.invoke('license:getHardwareId')
  },

  // Campaign operations
  campaign: {
    create: (campaign) => ipcRenderer.invoke('campaign:create', campaign),
    getAll: () => ipcRenderer.invoke('campaign:getAll'),
    get: (id) => ipcRenderer.invoke('campaign:get', id),
    parseCSV: (csvContent) => ipcRenderer.invoke('campaign:parseCSV', csvContent),
    addRecipients: (data) => ipcRenderer.invoke('campaign:addRecipients', data),
    getRecipients: (campaignId) => ipcRenderer.invoke('campaign:getRecipients', campaignId),
    start: (campaignId) => ipcRenderer.invoke('campaign:start', campaignId),
    pause: (campaignId) => ipcRenderer.invoke('campaign:pause', campaignId),
    resume: (campaignId) => ipcRenderer.invoke('campaign:resume', campaignId),
    getStatus: () => ipcRenderer.invoke('campaign:getStatus'),
    delete: (campaignId) => ipcRenderer.invoke('campaign:delete', campaignId)
  },

  // Notify main process of license activation
  licenseActivated: () => ipcRenderer.send('license:activated')
});
