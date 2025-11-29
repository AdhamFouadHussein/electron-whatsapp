export const api = {
    getDashboardStats: () => window.api.db.getDashboardStats(),
    getMessagesChartData: () => window.api.db.getMessagesChartData(),
    getTodaysMessageStatus: () => window.api.db.getTodaysMessageStatus(),
    getUpcomingEventsList: (limit: number): Promise<any[]> => window.api.db.getUpcomingEventsList(limit),

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
};

