const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

// Create or recreate connection pool
function createPool() {
  if (pool) {
    pool.end(); // Close existing pool
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'whatsapp_reminder_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  console.log('Database pool created/recreated with config:', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'whatsapp_reminder_app'
  });

  return pool;
}

// Get the pool, creating it if it doesn't exist
function getPool() {
  if (!pool) {
    createPool();
  }
  return pool;
}

// Test connection
async function testConnection() {
  try {
    const connection = await getPool().getConnection();
    console.log('✓ MySQL connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ MySQL connection failed:', error.message);
    return false;
  }
}

// Initialize database schema
async function initializeDatabase() {
  try {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS event_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        color VARCHAR(50) DEFAULT 'from-gray-500 to-slate-500',
        icon VARCHAR(50) DEFAULT 'Calendar',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Migrate event_type columns from ENUM to VARCHAR if needed
    try {
      await getPool().query(`
        ALTER TABLE events MODIFY COLUMN event_type VARCHAR(50) NOT NULL;
      `);
    } catch (e) {
      // Ignore if already varchar or other error, we'll assume it works or was already done
      console.log('Note: events.event_type modification skipped or failed (might be already VARCHAR)');
    }

    try {
      await getPool().query(`
        ALTER TABLE message_templates MODIFY COLUMN event_type VARCHAR(50) NOT NULL;
      `);
    } catch (e) {
      console.log('Note: message_templates.event_type modification skipped or failed');
    }

    await getPool().query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255),
        date_of_birth DATE,
        preferred_language VARCHAR(10) DEFAULT 'en',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phone (phone),
        INDEX idx_dob (date_of_birth)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await getPool().query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATETIME NOT NULL,
        location VARCHAR(255),
        reminder_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_event_date (event_date),
        INDEX idx_event_type (event_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await getPool().query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        reminder_time DATETIME NOT NULL,
        message_template_id INT,
        custom_message TEXT,
        file_id INT,
        status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
        sent_at TIMESTAMP NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        INDEX idx_event_id (event_id),
        INDEX idx_reminder_time (reminder_time),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await getPool().query(`
      CREATE TABLE IF NOT EXISTS message_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        language VARCHAR(10) NOT NULL,
        template_text TEXT NOT NULL,
        variables JSON,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_template (event_type, language, name),
        INDEX idx_event_type (event_type),
        INDEX idx_language (language)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await getPool().query(`
      CREATE TABLE IF NOT EXISTS files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100),
        file_size BIGINT,
        storage_type ENUM('mysql', 'cloud') DEFAULT 'mysql',
        file_data LONGBLOB,
        cloud_url TEXT,
        mime_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_filename (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await getPool().query(`
      CREATE TABLE IF NOT EXISTS message_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        reminder_id INT,
        message_type ENUM('reminder', 'birthday', 'manual') NOT NULL,
        message_text TEXT NOT NULL,
        language VARCHAR(10),
        file_id INT,
        phone VARCHAR(50) NOT NULL,
        status ENUM('sent', 'failed') NOT NULL,
        error_message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE SET NULL,
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_sent_at (sent_at),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Migration: Allow NULL user_id in message_logs
    try {
      await getPool().query(`
        ALTER TABLE message_logs MODIFY COLUMN user_id INT NULL;
      `);
    } catch (e) {
      console.log('Note: message_logs.user_id modification skipped or failed (might be already nullable)');
    }

    // Migration: Add 'campaign' to message_type ENUM in message_logs
    try {
      await getPool().query(`
        ALTER TABLE message_logs MODIFY COLUMN message_type ENUM('reminder', 'birthday', 'manual', 'campaign') NOT NULL;
      `);
    } catch (e) {
      console.log('Note: message_logs.message_type modification skipped or failed (might already have campaign)');
    }

    await getPool().query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await getPool().query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        message_text TEXT NOT NULL,
        status ENUM('draft', 'running', 'paused', 'completed', 'cancelled') DEFAULT 'draft',
        total_recipients INT DEFAULT 0,
        sent_count INT DEFAULT 0,
        failed_count INT DEFAULT 0,
        min_delay_sec INT DEFAULT 5,
        max_delay_sec INT DEFAULT 15,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await getPool().query(`
      CREATE TABLE IF NOT EXISTS campaign_recipients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT NOT NULL,
        phone VARCHAR(50) NOT NULL,
        name VARCHAR(255),
        status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
        sent_at TIMESTAMP NULL,
        error_message TEXT,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        INDEX idx_campaign_id (campaign_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✓ Database schema initialized successfully');

    // Insert default event types
    await insertDefaultEventTypes();

    // Insert default message templates
    await insertDefaultTemplates();

    return true;
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
}

async function insertDefaultEventTypes() {
  const types = [
    { name: 'birthday', color: 'from-pink-500 to-rose-500', icon: 'Cake' },
    { name: 'meeting', color: 'from-blue-500 to-cyan-500', icon: 'Briefcase' },
    { name: 'flight', color: 'from-orange-500 to-red-500', icon: 'Plane' },
    { name: 'embassy', color: 'from-purple-500 to-indigo-500', icon: 'Building2' },
    { name: 'custom', color: 'from-gray-500 to-slate-500', icon: 'Calendar' }
  ];

  for (const type of types) {
    await getPool().query(
      `INSERT IGNORE INTO event_types (name, color, icon) VALUES (?, ?, ?)`,
      [type.name, type.color, type.icon]
    );
  }
}

async function insertDefaultTemplates() {
  const templates = [
    // English templates
    {
      name: 'Default Meeting Reminder',
      event_type: 'meeting',
      language: 'en',
      template_text: 'Hi {{name}}! This is a reminder about your meeting: {{title}} on {{date}} at {{location}}.',
      variables: JSON.stringify(['name', 'title', 'date', 'location']),
      is_default: true
    },
    {
      name: 'Default Embassy Reminder',
      event_type: 'embassy',
      language: 'en',
      template_text: 'Hello {{name}}, your embassy appointment at {{location}} is scheduled for {{date}}. Please bring all required documents.',
      variables: JSON.stringify(['name', 'date', 'location']),
      is_default: true
    },
    {
      name: 'Default Flight Reminder',
      event_type: 'flight',
      language: 'en',
      template_text: 'Hi {{name}}! Your flight {{title}} is scheduled for {{date}}. Please arrive at the airport 2 hours early.',
      variables: JSON.stringify(['name', 'title', 'date']),
      is_default: true
    },
    {
      name: 'Default Birthday Wish',
      event_type: 'birthday',
      language: 'en',
      template_text: 'Happy Birthday {{name}}! 🎉🎂 Wishing you a wonderful day filled with joy and happiness!',
      variables: JSON.stringify(['name']),
      is_default: true
    },
    // Arabic templates
    {
      name: 'تذكير اجتماع افتراضي',
      event_type: 'meeting',
      language: 'ar',
      template_text: 'مرحباً {{name}}! هذا تذكير باجتماعك: {{title}} في {{date}} في {{location}}.',
      variables: JSON.stringify(['name', 'title', 'date', 'location']),
      is_default: true
    },
    {
      name: 'تذكير سفارة افتراضي',
      event_type: 'embassy',
      language: 'ar',
      template_text: 'مرحباً {{name}}، موعدك في السفارة في {{location}} مقرر في {{date}}. يرجى إحضار جميع المستندات المطلوبة.',
      variables: JSON.stringify(['name', 'date', 'location']),
      is_default: true
    },
    {
      name: 'تذكير رحلة افتراضي',
      event_type: 'flight',
      language: 'ar',
      template_text: 'مرحباً {{name}}! رحلتك {{title}} مقررة في {{date}}. يرجى الوصول إلى المطار قبل ساعتين.',
      variables: JSON.stringify(['name', 'title', 'date']),
      is_default: true
    },
    {
      name: 'تهنئة عيد ميلاد افتراضية',
      event_type: 'birthday',
      language: 'ar',
      template_text: 'عيد ميلاد سعيد {{name}}! 🎉🎂 أتمنى لك يوماً رائعاً مليئاً بالفرح والسعادة!',
      variables: JSON.stringify(['name']),
      is_default: true
    }
  ];

  for (const template of templates) {
    await getPool().query(
      `INSERT IGNORE INTO message_templates (name, event_type, language, template_text, variables, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [template.name, template.event_type, template.language, template.template_text, template.variables, template.is_default]
    );
  }
}

module.exports = {
  pool,
  getPool,
  createPool,
  testConnection,
  initializeDatabase
};
