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
                createUsers: (users: any[]) => Promise<any>;
                updateUser: (id: number, userData: any) => Promise<any>;
                deleteUser: (id: number) => Promise<void>;

                // Events
                getEvents: (userId?: number) => Promise<any[]>;
                createEvent: (eventData: any) => Promise<any>;
                updateEvent: (id: number, eventData: any) => Promise<any>;
                deleteEvent: (id: number) => Promise<void>;

                // Event Types
                getEventTypes: () => Promise<any[]>;
                createEventType: (eventType: any) => Promise<any>;
                deleteEventType: (id: number) => Promise<void>;

                // Reminders
                getReminders: (status?: string) => Promise<any[]>;
                createReminder: (reminderData: any) => Promise<any>;
                updateReminder: (id: number, reminderData: any) => Promise<any>;
                deleteReminder: (id: number) => Promise<void>;

                // Templates
                getMessageTemplates: (language?: string) => Promise<any[]>;
                getMessageTemplate: (id: number) => Promise<any>;
                saveMessageTemplate: (templateData: any) => Promise<any>;
                deleteMessageTemplate: (id: number) => Promise<void>;

                // Files
                getAllFiles: () => Promise<any[]>;
                getUserFiles: (userId: number) => Promise<any[]>;
                uploadFile: (fileData: any) => Promise<any>;
                deleteFile: (id: number) => Promise<void>;

                // Message Logs
                getMessageLogs: (userId?: number) => Promise<any[]>;

                // Birthdays
                getUpcomingBirthdays: (daysAhead: number) => Promise<any[]>;
            };

            campaign: {
                create: (campaign: any) => Promise<any>;
                getAll: () => Promise<any[]>;
                get: (id: number) => Promise<any>;
                parseCSV: (csvContent: string) => Promise<any[]>;
                addRecipients: (data: { campaignId: number; recipients: any[] }) => Promise<any>;
                getRecipients: (campaignId: number) => Promise<any[]>;
                start: (campaignId: number) => Promise<any>;
                pause: (campaignId: number) => Promise<any>;
                resume: (campaignId: number) => Promise<any>;
                getStatus: () => Promise<any>;
                delete: (campaignId: number) => Promise<any>;
            };

            whatsapp: {
                connect: () => Promise<void>;
                disconnect: () => Promise<void>;
                getStatus: () => Promise<string>;
                sendMessage: (phone: string, message: string, fileId?: number) => Promise<any>;
                sendBirthdayWish: (userId: number) => Promise<any>;
                onQRCode: (callback: (qr: string) => void) => void;
                onStatusChange: (callback: (status: string) => void) => void;
            };

            settings: {
                getTheme: () => Promise<string>;
                setTheme: (theme: string) => Promise<void>;
                getLanguage: () => Promise<string>;
                setLanguage: (language: string) => Promise<void>;
                getDatabaseConfig: () => Promise<any>;
                setDatabaseConfig: (config: any) => Promise<void>;
                testDatabaseConnection: (config: any) => Promise<boolean>;
            };

            license: {
                verify: (key: string, email: string) => Promise<any>;
                getStatus: () => Promise<any>;
            };
        };
    }
}

export { };
