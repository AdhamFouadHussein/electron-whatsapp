export const api = {
    getDashboardStats: () => window.api.db.getDashboardStats(),
    getMessagesChartData: () => window.api.db.getMessagesChartData(),
    getTodaysMessageStatus: () => window.api.db.getTodaysMessageStatus(),
    getUpcomingEventsList: (limit: number): Promise<any[]> => window.api.db.getUpcomingEventsList(limit),
    getCampaignPerformanceStats: (): Promise<any[]> => window.api.db.getCampaignPerformanceStats(),
    getHourlyActivityStats: (): Promise<any[]> => window.api.db.getHourlyActivityStats(),
    getTopContactsStats: (): Promise<any[]> => window.api.db.getTopContactsStats(),

    // User management
    getUsers: (): Promise<any[]> => window.api.db.getUsers(),
    createUser: (user: any): Promise<any> => window.api.db.createUser(user),
    createUsers: (users: any[]): Promise<any> => window.api.db.createUsers(users),
    updateUser: (id: number, user: any): Promise<any> => window.api.db.updateUser(id, user),
    deleteUser: (id: number): Promise<any> => window.api.db.deleteUser(id),

    // Event management
    getEvents: (userId?: number): Promise<any[]> => window.api.db.getEvents(userId),
    createEvent: (event: any): Promise<any> => window.api.db.createEvent(event),
    updateEvent: (id: number, event: any): Promise<any> => window.api.db.updateEvent(id, event),
    deleteEvent: (id: number): Promise<any> => window.api.db.deleteEvent(id),

    // Event Types
    getEventTypes: (): Promise<any[]> => window.api.db.getEventTypes(),
    createEventType: (eventType: any): Promise<any> => window.api.db.createEventType(eventType),
    deleteEventType: (id: number): Promise<any> => window.api.db.deleteEventType(id),

    // Reminder management
    getReminders: (status?: string): Promise<any[]> => window.api.db.getReminders(status),
    createReminder: (reminder: any): Promise<any> => window.api.db.createReminder(reminder),
    updateReminder: (id: number, reminder: any): Promise<any> => window.api.db.updateReminder(id, reminder),
    deleteReminder: (id: number): Promise<any> => window.api.db.deleteReminder(id),

    // Campaign management
    getCampaigns: (): Promise<any[]> => window.api.campaign.getAll(),
    createCampaign: (campaign: any): Promise<any> => window.api.campaign.create(campaign),
    getCampaign: (id: number): Promise<any> => window.api.campaign.get(id),
    parseCSV: (csvContent: string): Promise<{ recipients: any[], warnings: string[] }> => window.api.campaign.parseCSV(csvContent),
    addCampaignRecipients: (campaignId: number, recipients: any[]): Promise<any> => window.api.campaign.addRecipients({ campaignId, recipients }),
    getCampaignRecipients: (campaignId: number): Promise<any[]> => window.api.campaign.getRecipients(campaignId),
    startCampaign: (campaignId: number): Promise<any> => window.api.campaign.start(campaignId),
    pauseCampaign: (campaignId: number): Promise<any> => window.api.campaign.pause(campaignId),
    resumeCampaign: (campaignId: number): Promise<any> => window.api.campaign.resume(campaignId),
    deleteCampaign: (campaignId: number): Promise<any> => window.api.campaign.delete(campaignId),

    // Message templates
    getMessageTemplates: (language?: string): Promise<any[]> => window.api.db.getMessageTemplates(language),
    getMessageTemplate: (id: number): Promise<any> => window.api.db.getMessageTemplate(id),
    saveMessageTemplate: (template: any): Promise<any> => window.api.db.saveMessageTemplate(template),
    deleteMessageTemplate: (id: number): Promise<any> => window.api.db.deleteMessageTemplate(id),

    // Message logs
    getMessageLogs: (userId?: number): Promise<any[]> => window.api.db.getMessageLogs(userId),

    // Birthdays
    getUpcomingBirthdays: (daysAhead: number): Promise<any[]> => window.api.db.getUpcomingBirthdays(daysAhead),

    whatsapp: {
        connect: () => window.api.whatsapp.connect(),
        disconnect: () => window.api.whatsapp.disconnect(),
        getStatus: () => window.api.whatsapp.getStatus(),
        sendMessage: (phone: string, message: string, fileId?: number) => window.api.whatsapp.sendMessage(phone, message, fileId),
        sendBirthdayWish: (userId: number) => window.api.whatsapp.sendBirthdayWish(userId),
        onQRCode: (callback: (qr: string) => void) => window.api.whatsapp.onQRCode(callback),
        onStatusChange: (callback: (status: string) => void) => window.api.whatsapp.onStatusChange(callback),
    },

    settings: {
        getTheme: () => window.api.settings.getTheme(),
        setTheme: (theme: string) => window.api.settings.setTheme(theme),
        getLanguage: () => window.api.settings.getLanguage(),
        setLanguage: (language: string) => window.api.settings.setLanguage(language),
        getDatabaseConfig: () => window.api.settings.getDatabaseConfig(),
        setDatabaseConfig: (config: any) => window.api.settings.setDatabaseConfig(config),
        testDatabaseConnection: (config: any) => window.api.settings.testDatabaseConnection(config),
    }
};

