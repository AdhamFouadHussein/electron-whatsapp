const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool for better performance with multiple devices
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
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
    await pool.query(`
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        event_type ENUM('meeting', 'embassy', 'flight', 'birthday', 'custom') NOT NULL,
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

    await pool.query(`
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        event_type ENUM('meeting', 'embassy', 'flight', 'birthday', 'custom') NOT NULL,
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

    await pool.query(`
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

    await pool.query(`
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✓ Database schema initialized successfully');
    
    // Insert default message templates
    await insertDefaultTemplates();
    
    return true;
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
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
    await pool.query(
      `INSERT IGNORE INTO message_templates (name, event_type, language, template_text, variables, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [template.name, template.event_type, template.language, template.template_text, template.variables, template.is_default]
    );
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
