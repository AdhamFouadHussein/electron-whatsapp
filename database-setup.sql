-- WhatsApp Reminder App - Database Initialization Script
-- Run this script manually if automatic initialization fails

-- Create database
CREATE DATABASE IF NOT EXISTS whatsapp_reminder_app 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE whatsapp_reminder_app;

-- Users table
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

-- Events table
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

-- Reminders table
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

-- Message templates table
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

-- Files table
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

-- Message logs table
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

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default message templates
INSERT IGNORE INTO message_templates (name, event_type, language, template_text, variables, is_default) VALUES
-- English templates
('Default Meeting Reminder', 'meeting', 'en', 
 'Hi {{name}}! This is a reminder about your meeting: {{title}} on {{date}} at {{location}}.', 
 '["name", "title", "date", "location"]', TRUE),

('Default Embassy Reminder', 'embassy', 'en',
 'Hello {{name}}, your embassy appointment at {{location}} is scheduled for {{date}}. Please bring all required documents.',
 '["name", "date", "location"]', TRUE),

('Default Flight Reminder', 'flight', 'en',
 'Hi {{name}}! Your flight {{title}} is scheduled for {{date}}. Please arrive at the airport 2 hours early.',
 '["name", "title", "date"]', TRUE),

('Default Birthday Wish', 'birthday', 'en',
 'Happy Birthday {{name}}! 🎉🎂 Wishing you a wonderful day filled with joy and happiness!',
 '["name"]', TRUE),

-- Arabic templates
('تذكير اجتماع افتراضي', 'meeting', 'ar',
 'مرحباً {{name}}! هذا تذكير باجتماعك: {{title}} في {{date}} في {{location}}.',
 '["name", "title", "date", "location"]', TRUE),

('تذكير سفارة افتراضي', 'embassy', 'ar',
 'مرحباً {{name}}، موعدك في السفارة في {{location}} مقرر في {{date}}. يرجى إحضار جميع المستندات المطلوبة.',
 '["name", "date", "location"]', TRUE),

('تذكير رحلة افتراضي', 'flight', 'ar',
 'مرحباً {{name}}! رحلتك {{title}} مقررة في {{date}}. يرجى الوصول إلى المطار قبل ساعتين.',
 '["name", "title", "date"]', TRUE),

('تهنئة عيد ميلاد افتراضية', 'birthday', 'ar',
 'عيد ميلاد سعيد {{name}}! 🎉🎂 أتمنى لك يوماً رائعاً مليئاً بالفرح والسعادة!',
 '["name"]', TRUE);

-- Sample data (optional - remove if not needed)
INSERT IGNORE INTO users (name, phone, email, date_of_birth, preferred_language) VALUES
('John Doe', '+1234567890', 'john@example.com', '1990-01-15', 'en'),
('أحمد محمد', '+9665512345678', 'ahmed@example.com', '1985-06-20', 'ar');

SELECT 'Database initialization completed successfully!' AS status;
