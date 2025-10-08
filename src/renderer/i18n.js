import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        dashboard: 'Dashboard',
        users: 'Users',
        events: 'Events',
        reminders: 'Reminders',
        templates: 'Templates',
        logs: 'Message Logs',
        settings: 'Settings'
      },
      // Dashboard
      dashboard: {
        title: 'Dashboard',
        totalUsers: 'Total Users',
        upcomingEvents: 'Upcoming Events',
        pendingReminders: 'Pending Reminders',
        messagesSent: 'Messages Sent Today',
        whatsappStatus: 'WhatsApp Status',
        connected: 'Connected',
        disconnected: 'Disconnected',
        reconnecting: 'Reconnecting',
        qrReady: 'QR Code Ready'
      },
      // Users
      users: {
        title: 'User Management',
        addUser: 'Add User',
        editUser: 'Edit User',
        deleteUser: 'Delete User',
        name: 'Name',
        phone: 'Phone',
        email: 'Email',
        dateOfBirth: 'Date of Birth',
        preferredLanguage: 'Preferred Language',
        notes: 'Notes',
        actions: 'Actions',
        confirmDelete: 'Are you sure you want to delete this user?'
      },
      // Events
      events: {
        title: 'Event Management',
        addEvent: 'Add Event',
        editEvent: 'Edit Event',
        deleteEvent: 'Delete Event',
        eventType: 'Event Type',
        eventTitle: 'Title',
        description: 'Description',
        eventDate: 'Event Date',
        location: 'Location',
        reminderEnabled: 'Enable Reminder',
        user: 'User',
        types: {
          meeting: 'Meeting',
          embassy: 'Embassy Visit',
          flight: 'Flight',
          birthday: 'Birthday',
          custom: 'Custom'
        }
      },
      // Reminders
      reminders: {
        title: 'Reminder Management',
        addReminder: 'Add Reminder',
        editReminder: 'Edit Reminder',
        reminderTime: 'Reminder Time',
        messageTemplate: 'Message Template',
        customMessage: 'Custom Message',
        attachFile: 'Attach File',
        status: 'Status',
        statuses: {
          pending: 'Pending',
          sent: 'Sent',
          failed: 'Failed',
          cancelled: 'Cancelled'
        }
      },
      // Templates
      templates: {
        title: 'Message Templates',
        addTemplate: 'Add Template',
        editTemplate: 'Edit Template',
        templateName: 'Template Name',
        language: 'Language',
        templateText: 'Template Text',
        variables: 'Variables',
        isDefault: 'Default Template',
        availableVariables: 'Available Variables: {{name}}, {{title}}, {{date}}, {{location}}'
      },
      // Settings
      settings: {
        title: 'Settings',
        appearance: 'Appearance',
        theme: 'Theme',
        themeAuto: 'Auto (System)',
        themeLight: 'Light',
        themeDark: 'Dark',
        language: 'Language',
        database: 'Database',
        dbHost: 'Host',
        dbPort: 'Port',
        dbName: 'Database Name',
        whatsapp: 'WhatsApp',
        scanQR: 'Scan QR Code',
        disconnect: 'Disconnect',
        about: 'About',
        version: 'Version'
      },
      // Common
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        search: 'Search',
        filter: 'Filter',
        loading: 'Loading...',
        noData: 'No data available',
        error: 'Error',
        success: 'Success',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
        close: 'Close',
        upload: 'Upload',
        download: 'Download',
        select: 'Select'
      }
    }
  },
  ar: {
    translation: {
      // Navigation
      nav: {
        dashboard: 'لوحة التحكم',
        users: 'المستخدمون',
        events: 'الأحداث',
        reminders: 'التذكيرات',
        templates: 'القوالب',
        logs: 'سجل الرسائل',
        settings: 'الإعدادات'
      },
      // Dashboard
      dashboard: {
        title: 'لوحة التحكم',
        totalUsers: 'إجمالي المستخدمين',
        upcomingEvents: 'الأحداث القادمة',
        pendingReminders: 'التذكيرات المعلقة',
        messagesSent: 'الرسائل المرسلة اليوم',
        whatsappStatus: 'حالة واتساب',
        connected: 'متصل',
        disconnected: 'غير متصل',
        reconnecting: 'إعادة الاتصال',
        qrReady: 'رمز QR جاهز'
      },
      // Users
      users: {
        title: 'إدارة المستخدمين',
        addUser: 'إضافة مستخدم',
        editUser: 'تعديل مستخدم',
        deleteUser: 'حذف مستخدم',
        name: 'الاسم',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        dateOfBirth: 'تاريخ الميلاد',
        preferredLanguage: 'اللغة المفضلة',
        notes: 'ملاحظات',
        actions: 'الإجراءات',
        confirmDelete: 'هل أنت متأكد من حذف هذا المستخدم؟'
      },
      // Events
      events: {
        title: 'إدارة الأحداث',
        addEvent: 'إضافة حدث',
        editEvent: 'تعديل حدث',
        deleteEvent: 'حذف حدث',
        eventType: 'نوع الحدث',
        eventTitle: 'العنوان',
        description: 'الوصف',
        eventDate: 'تاريخ الحدث',
        location: 'الموقع',
        reminderEnabled: 'تفعيل التذكير',
        user: 'المستخدم',
        types: {
          meeting: 'اجتماع',
          embassy: 'زيارة سفارة',
          flight: 'رحلة طيران',
          birthday: 'عيد ميلاد',
          custom: 'مخصص'
        }
      },
      // Reminders
      reminders: {
        title: 'إدارة التذكيرات',
        addReminder: 'إضافة تذكير',
        editReminder: 'تعديل تذكير',
        reminderTime: 'وقت التذكير',
        messageTemplate: 'قالب الرسالة',
        customMessage: 'رسالة مخصصة',
        attachFile: 'إرفاق ملف',
        status: 'الحالة',
        statuses: {
          pending: 'معلق',
          sent: 'مرسل',
          failed: 'فشل',
          cancelled: 'ملغى'
        }
      },
      // Templates
      templates: {
        title: 'قوالب الرسائل',
        addTemplate: 'إضافة قالب',
        editTemplate: 'تعديل قالب',
        templateName: 'اسم القالب',
        language: 'اللغة',
        templateText: 'نص القالب',
        variables: 'المتغيرات',
        isDefault: 'القالب الافتراضي',
        availableVariables: 'المتغيرات المتاحة: {{name}}, {{title}}, {{date}}, {{location}}'
      },
      // Settings
      settings: {
        title: 'الإعدادات',
        appearance: 'المظهر',
        theme: 'السمة',
        themeAuto: 'تلقائي (النظام)',
        themeLight: 'فاتح',
        themeDark: 'داكن',
        language: 'اللغة',
        database: 'قاعدة البيانات',
        dbHost: 'المضيف',
        dbPort: 'المنفذ',
        dbName: 'اسم قاعدة البيانات',
        whatsapp: 'واتساب',
        scanQR: 'مسح رمز QR',
        disconnect: 'قطع الاتصال',
        about: 'حول',
        version: 'الإصدار'
      },
      // Common
      common: {
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        view: 'عرض',
        search: 'بحث',
        filter: 'تصفية',
        loading: 'جاري التحميل...',
        noData: 'لا توجد بيانات',
        error: 'خطأ',
        success: 'نجح',
        confirm: 'تأكيد',
        yes: 'نعم',
        no: 'لا',
        close: 'إغلاق',
        upload: 'رفع',
        download: 'تحميل',
        select: 'اختيار'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
