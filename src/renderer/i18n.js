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
        qrReady: 'QR Code Ready',
        quickActions: 'Quick Actions',
        addUser: 'Add User',
        addUserHint: 'Go to Users page to add a new user',
        scheduleEvent: 'Schedule Event',
        scheduleEventHint: 'Go to Events page to create a new event',
        createReminder: 'Create Reminder',
        createReminderHint: 'Go to Reminders page to set up a new reminder',
        refresh: 'Refresh Stats',
        refreshHint: 'Reload dashboard statistics'
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
        upcomingEvents: 'Upcoming Events',
        pastEvents: 'Past Events',
        totalEvents: 'Total Events',
        upcoming: 'Upcoming',
        past: 'Past',
        noEventsFound: 'No events found',
        createFirstEvent: 'Create your first event to get started!',
        updateEvent: 'Update Event',
        createEvent: 'Create Event',
        allUsers: 'All Users',
        allTypes: 'All Types',
        clearFilters: 'Clear Filters',
        timeUntil: 'Time Until',
        reminderEnabledTooltip: 'Reminder enabled',
        noReminderTooltip: 'No reminder',
        reminderEnabledHelp: 'Enable this to allow creating reminders for this event',
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
        allStatuses: 'All Statuses',
        pending: 'Pending',
        sent: 'Sent',
        failed: 'Failed',
        cancelled: 'Cancelled',
        noRemindersFound: 'No reminders found',
        createFirstReminder: 'Create a reminder to automate notifications!',
        updateReminder: 'Update',
        createReminder: 'Create Reminder',
        event: 'Event',
        user: 'User',
        messagePreview: 'Message Preview',
        attachment: 'Attachment',
        usingTemplate: 'Using template',
        noFileAttachment: 'No file attachment',
        noUpcomingEvents: 'No upcoming events available. Please create an event first.',
        reminderTimeHelp: 'When to send the reminder (usually before the event)',
        useDefaultTemplate: 'Use default template for event type',
        customMessagePlaceholder: 'Leave empty to use template. Use {{name}}, {{title}}, {{date}}, {{location}} for variables.',
        customMessageHelp: 'Optional: Override template with custom message',
        noFilesUploaded: 'No files uploaded for this user yet.',
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
        availableVariables: 'Available Variables: {{name}}, {{title}}, {{date}}, {{location}}',
        allLanguages: 'All Languages',
        allTypes: 'All Types',
        clearFilters: 'Clear Filters',
        noTemplatesFound: 'No templates found',
        createFirstTemplate: 'Create your first message template!',
        updateTemplate: 'Update Template',
        createTemplate: 'Create Template',
        defaultBadge: 'DEFAULT',
        preview: 'Preview (with sample data)',
        previewPlaceholder: 'Your preview will appear here...',
        isDefaultHelp: 'Set as the default template for this event type and language',
        languages: {
          en: 'English',
          ar: 'العربية'
        }
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
        dbUser: 'Username',
        dbPassword: 'Password',
        dbName: 'Database Name',
        testConnection: 'Test Connection',
        connectionSuccess: 'Connection successful!',
        connectionFailed: 'Connection failed',
        saveSettings: 'Save Settings',
        settingsSaved: 'Settings saved successfully!',
        restartRequired: 'Please restart the application for changes to take effect.',
        whatsapp: 'WhatsApp',
        scanQR: 'Scan QR Code',
        disconnect: 'Disconnect',
        about: 'About',
        version: 'Version'
      },
      
      // WhatsApp
      whatsapp: {
        qrTitle: 'WhatsApp QR Code',
        qrInstructions: {
          title: 'How to connect:',
          step1: 'Open WhatsApp on your phone',
          step2: 'Tap Menu or Settings',
          step3: 'Tap "Linked Devices"',
          step4: 'Scan this QR code with your phone'
        }
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
        select: 'Select',
        past: 'Past',
        tomorrow: 'Tomorrow',
        soon: 'Soon!',
        days: 'days',
        hours: 'hours'
      },
      // Message Logs
      messageLogs: {
        title: 'Message Logs',
        exportCsv: 'Export CSV',
        totalMessages: 'Total Messages',
        sentSuccessfully: 'Sent Successfully',
        failed: 'Failed',
        successRate: 'Success Rate',
        allUsers: 'All Users',
        allStatuses: 'All Statuses',
        allTypes: 'All Types',
        clearFilters: 'Clear Filters',
        type: 'Type',
        user: 'User',
        phone: 'Phone',
        status: 'Status',
        language: 'Language',
        sentAt: 'Sent At',
        messagePreview: 'Message Preview',
        actions: 'Actions',
        viewFullMessage: 'View full message',
        noLogsFound: 'No message logs found',
        messagesWillAppear: 'Messages will appear here once sent',
        messageDetails: 'Message Details',
        messageContent: 'Message Content',
        attachment: 'Attachment',
        fileAttached: 'File attached',
        errorMessage: 'Error',
        messageTypes: {
          reminder: 'Reminder',
          birthday: 'Birthday',
          manual: 'Manual'
        },
        statuses: {
          sent: 'Sent',
          failed: 'Failed'
        }
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
        qrReady: 'رمز QR جاهز',
        quickActions: 'إجراءات سريعة',
        addUser: 'إضافة مستخدم',
        addUserHint: 'الانتقال إلى صفحة المستخدمين لإضافة مستخدم جديد',
        scheduleEvent: 'جدولة حدث',
        scheduleEventHint: 'الانتقال إلى صفحة الأحداث لإنشاء حدث جديد',
        createReminder: 'إنشاء تذكير',
        createReminderHint: 'الانتقال إلى صفحة التذكيرات لإعداد تذكير جديد',
        refresh: 'تحديث الإحصائيات',
        refreshHint: 'إعادة تحميل إحصائيات لوحة التحكم'
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
        upcomingEvents: 'الأحداث القادمة',
        pastEvents: 'الأحداث السابقة',
        totalEvents: 'إجمالي الأحداث',
        upcoming: 'قادمة',
        past: 'سابقة',
        noEventsFound: 'لم يتم العثور على أحداث',
        createFirstEvent: 'أنشئ حدثك الأول للبدء!',
        updateEvent: 'تحديث الحدث',
        createEvent: 'إنشاء حدث',
        allUsers: 'جميع المستخدمين',
        allTypes: 'جميع الأنواع',
        clearFilters: 'مسح المرشحات',
        timeUntil: 'الوقت المتبقي',
        reminderEnabledTooltip: 'التذكير مفعل',
        noReminderTooltip: 'لا يوجد تذكير',
        reminderEnabledHelp: 'فعل هذا للسماح بإنشاء تذكيرات لهذا الحدث',
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
        allStatuses: 'جميع الحالات',
        pending: 'معلق',
        sent: 'مرسل',
        failed: 'فشل',
        cancelled: 'ملغى',
        noRemindersFound: 'لم يتم العثور على تذكيرات',
        createFirstReminder: 'أنشئ تذكيراً لأتمتة الإشعارات!',
        updateReminder: 'تحديث',
        createReminder: 'إنشاء تذكير',
        event: 'الحدث',
        user: 'المستخدم',
        messagePreview: 'معاينة الرسالة',
        attachment: 'المرفق',
        usingTemplate: 'استخدام القالب',
        noFileAttachment: 'لا يوجد مرفق',
        noUpcomingEvents: 'لا توجد أحداث قادمة متاحة. يرجى إنشاء حدث أولاً.',
        reminderTimeHelp: 'متى يتم إرسال التذكير (عادة قبل الحدث)',
        useDefaultTemplate: 'استخدام القالب الافتراضي لنوع الحدث',
        customMessagePlaceholder: 'اتركه فارغاً لاستخدام القالب. استخدم {{name}}, {{title}}, {{date}}, {{location}} للمتغيرات.',
        customMessageHelp: 'اختياري: تجاوز القالب برسالة مخصصة',
        noFilesUploaded: 'لم يتم رفع ملفات لهذا المستخدم بعد.',
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
        availableVariables: 'المتغيرات المتاحة: {{name}}, {{title}}, {{date}}, {{location}}',
        allLanguages: 'جميع اللغات',
        allTypes: 'جميع الأنواع',
        clearFilters: 'مسح المرشحات',
        noTemplatesFound: 'لم يتم العثور على قوالب',
        createFirstTemplate: 'أنشئ قالب رسالتك الأول!',
        updateTemplate: 'تحديث القالب',
        createTemplate: 'إنشاء قالب',
        defaultBadge: 'افتراضي',
        preview: 'معاينة (مع بيانات عينة)',
        previewPlaceholder: 'ستظهر معاينتك هنا...',
        isDefaultHelp: 'تعيين كقالب افتراضي لهذا النوع من الأحداث واللغة',
        languages: {
          en: 'الإنجليزية',
          ar: 'العربية'
        }
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
        dbUser: 'اسم المستخدم',
        dbPassword: 'كلمة المرور',
        dbName: 'اسم قاعدة البيانات',
        testConnection: 'اختبار الاتصال',
        connectionSuccess: 'نجح الاتصال!',
        connectionFailed: 'فشل الاتصال',
        saveSettings: 'حفظ الإعدادات',
        settingsSaved: 'تم حفظ الإعدادات بنجاح!',
        restartRequired: 'يرجى إعادة تشغيل التطبيق لتصبح التغييرات سارية المفعول.',
        whatsapp: 'واتساب',
        scanQR: 'مسح رمز QR',
        disconnect: 'قطع الاتصال',
        about: 'حول',
        version: 'الإصدار'
      },
      
      // WhatsApp
      whatsapp: {
        qrTitle: 'رمز QR للواتساب',
        qrInstructions: {
          title: 'كيفية الاتصال:',
          step1: 'افتح واتساب على هاتفك',
          step2: 'اضغط على القائمة أو الإعدادات',
          step3: 'اضغط على "الأجهزة المرتبطة"',
          step4: 'امسح رمز QR هذا بهاتفك'
        }
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
        select: 'اختيار',
        past: 'سابق',
        tomorrow: 'غداً',
        soon: 'قريباً!',
        days: 'أيام',
        hours: 'ساعات'
      },
      // Message Logs
      messageLogs: {
        title: 'سجل الرسائل',
        exportCsv: 'تصدير CSV',
        totalMessages: 'إجمالي الرسائل',
        sentSuccessfully: 'تم الإرسال بنجاح',
        failed: 'فشل',
        successRate: 'معدل النجاح',
        allUsers: 'جميع المستخدمين',
        allStatuses: 'جميع الحالات',
        allTypes: 'جميع الأنواع',
        clearFilters: 'مسح المرشحات',
        type: 'النوع',
        user: 'المستخدم',
        phone: 'الهاتف',
        status: 'الحالة',
        language: 'اللغة',
        sentAt: 'تاريخ الإرسال',
        messagePreview: 'معاينة الرسالة',
        actions: 'الإجراءات',
        viewFullMessage: 'عرض الرسالة كاملة',
        noLogsFound: 'لم يتم العثور على سجل رسائل',
        messagesWillAppear: 'ستظهر الرسائل هنا بمجرد إرسالها',
        messageDetails: 'تفاصيل الرسالة',
        messageContent: 'محتوى الرسالة',
        attachment: 'المرفق',
        fileAttached: 'ملف مرفق',
        errorMessage: 'رسالة الخطأ',
        messageTypes: {
          reminder: 'تذكير',
          birthday: 'عيد ميلاد',
          manual: 'يدوي'
        },
        statuses: {
          sent: 'مرسل',
          failed: 'فشل'
        }
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
