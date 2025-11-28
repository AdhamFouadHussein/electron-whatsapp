export const api = {
    getDashboardStats: () => window.api.db.getDashboardStats(),
    getMessagesChartData: () => window.api.db.getMessagesChartData(),
    getTodaysMessageStatus: () => window.api.db.getTodaysMessageStatus(),
    getUpcomingEventsList: (limit: number): Promise<any[]> => window.api.db.getUpcomingEventsList(limit),

    // User management
    getUsers: (): Promise<any[]> => window.api.db.getUsers(),
    createUser: (user: any): Promise<any> => window.api.db.createUser(user),
    updateUser: (id: number, user: any): Promise<any> => window.api.db.updateUser(id, user),
    deleteUser: (id: number): Promise<any> => window.api.db.deleteUser(id),

    // Event management
    getEvents: (userId?: number): Promise<any[]> => window.api.db.getEvents(userId),
    createEvent: (event: any): Promise<any> => window.api.db.createEvent(event),
    updateEvent: (id: number, event: any): Promise<any> => window.api.db.updateEvent(id, event),
    deleteEvent: (id: number): Promise<any> => window.api.db.deleteEvent(id),
};

