export const api = {
    getDashboardStats: () => window.ipcRenderer.invoke('db:getDashboardStats'),
    getMessagesChartData: () => window.ipcRenderer.invoke('db:getMessagesChartData'),
    getTodaysMessageStatus: () => window.ipcRenderer.invoke('db:getTodaysMessageStatus'),
    getUpcomingEventsList: (limit: number) => window.ipcRenderer.invoke('db:getUpcomingEventsList', limit),
};
