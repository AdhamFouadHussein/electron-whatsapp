export const api = {
    getDashboardStats: () => window.ipcRenderer.invoke('db:getDashboardStats'),
    getMessagesChartData: () => window.ipcRenderer.invoke('db:getMessagesChartData'),
    getTodaysMessageStatus: () => window.ipcRenderer.invoke('db:getTodaysMessageStatus'),
    getUpcomingEventsList: (limit: number): Promise<any[]> => window.ipcRenderer.invoke('db:getUpcomingEventsList', limit),

    // User management
    getUsers: (): Promise<any[]> => window.ipcRenderer.invoke('db:getUsers'),
    createUser: (user: any): Promise<any> => window.ipcRenderer.invoke('db:createUser', user),
    updateUser: (id: number, user: any): Promise<any> => window.ipcRenderer.invoke('db:updateUser', id, user),
    deleteUser: (id: number): Promise<any> => window.ipcRenderer.invoke('db:deleteUser', id),
};
