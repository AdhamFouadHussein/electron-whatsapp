// API adapter for Electron IPC
// This file provides a bridge between the new frontend and the existing Electron backend

declare global {
    interface Window {
        api: {
            db: {
                // Dashboard
                getDashboardStats: () => Promise<any>;
                getMessagesChartData: () => Promise<any>;
                getTodaysMessageStatus: () => Promise<any>;
                getUpcomingEventsList: (limit: number) => Promise<any[]>;

                // Users
                getUsers: () => Promise<any[]>;
                createUser: (userData: any) => Promise<any>;
                updateUser: (id: number, userData: any) => Promise<any>;
                deleteUser: (id: number) => Promise<void>;

                // Events
                getEvents: (userId?: number) => Promise<any[]>;
                createEvent: (eventData: any) => Promise<any>;
                updateEvent: (id: number, eventData: any) => Promise<any>;
                deleteEvent: (id: number) => Promise<void>;

                // Reminders
                getReminders: (status?: string) => Promise<any[]>;
                createReminder: (reminderData: any) => Promise<any>;
                updateReminder: (id: number, reminderData: any) => Promise<any>;
                deleteReminder: (id: number) => Promise<void>;

                // Templates
                getMessageTemplates: () => Promise<any[]>;
                createMessageTemplate: (templateData: any) => Promise<any>;
                updateMessageTemplate: (id: number, templateData: any) => Promise<any>;
                deleteMessageTemplate: (id: number) => Promise<void>;

                // Files
                getAllFiles: () => Promise<any[]>;
                getUserFiles: (userId: number) => Promise<any[]>;
                uploadFile: (fileData: any) => Promise<any>;
                deleteFile: (id: number) => Promise<void>;

                // Message Logs
                getMessageLogs: () => Promise<any[]>;

                // Campaigns
                createCampaign: (campaignData: any) => Promise<any>;
                getCampaigns: () => Promise<any[]>;
            };

            whatsapp: {
                connect: () => Promise<void>;
                disconnect: () => Promise<void>;
                getStatus: () => Promise<string>;
                sendMessage: (phone: string, message: string, fileId?: number) => Promise<any>;
                onQRCode: (callback: (qr: string) => void) => void;
                onStatusChange: (callback: (status: string) => void) => void;
            };

            license: {
                verify: (key: string, email: string) => Promise<any>;
                getStatus: () => Promise<any>;
            };
        };
    }
}

export { };
