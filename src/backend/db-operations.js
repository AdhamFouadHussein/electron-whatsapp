const { getPool } = require('./database');

// User operations
async function getUsers() {
  const [rows] = await getPool().query('SELECT * FROM users ORDER BY name');
  return rows;
}

async function getUser(id) {
  const [rows] = await getPool().query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
}

async function createUser(user) {
  const [result] = await getPool().query(
    'INSERT INTO users (name, phone, email, date_of_birth, preferred_language, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [user.name, user.phone, user.email, user.date_of_birth, user.preferred_language || 'en', user.notes]
  );
  return { id: result.insertId, ...user };
}

async function updateUser(id, user) {
  await getPool().query(
    'UPDATE users SET name = ?, phone = ?, email = ?, date_of_birth = ?, preferred_language = ?, notes = ? WHERE id = ?',
    [user.name, user.phone, user.email, user.date_of_birth, user.preferred_language, user.notes, id]
  );
  return { id, ...user };
}

async function deleteUser(id) {
  await getPool().query('DELETE FROM users WHERE id = ?', [id]);
  return { success: true };
}

// Event operations
async function getEvents(userId = null) {
  if (userId) {
    const [rows] = await getPool().query(
      'SELECT e.*, u.name as user_name FROM events e JOIN users u ON e.user_id = u.id WHERE e.user_id = ? ORDER BY e.event_date',
      [userId]
    );
    return rows;
  }
  const [rows] = await getPool().query(
    'SELECT e.*, u.name as user_name FROM events e JOIN users u ON e.user_id = u.id ORDER BY e.event_date'
  );
  return rows;
}

async function createEvent(event) {
  const [result] = await getPool().query(
    'INSERT INTO events (user_id, event_type, title, description, event_date, location, reminder_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [event.user_id, event.event_type, event.title, event.description, event.event_date, event.location, event.reminder_enabled !== false]
  );
  
  const eventId = result.insertId;
  
  // Automatically create a reminder 24 hours before the event if reminder is enabled
  if (event.reminder_enabled !== false) {
    try {
      // Get user to fetch preferred language
      const user = await getUser(event.user_id);
      
      // Get the default template for this event type and user's language
      const templates = await getMessageTemplates(user.preferred_language);
      const defaultTemplate = templates.find(
        t => t.event_type === event.event_type && t.is_default
      );
      
      // Calculate reminder time (24 hours before event)
      const eventDate = new Date(event.event_date);
      const reminderTime = new Date(eventDate.getTime() - (24 * 60 * 60 * 1000));
      
      // Only create reminder if it's in the future
      if (reminderTime > new Date()) {
        await getPool().query(
          'INSERT INTO reminders (event_id, reminder_time, message_template_id, status) VALUES (?, ?, ?, ?)',
          [eventId, reminderTime, defaultTemplate ? defaultTemplate.id : null, 'pending']
        );
        console.log(`✓ Auto-created reminder for event ${eventId} at ${reminderTime}`);
      }
    } catch (error) {
      console.error('Failed to create automatic reminder:', error);
      // Don't fail the event creation if reminder creation fails
    }
  }
  
  return { id: eventId, ...event };
}

async function updateEvent(id, event) {
  await getPool().query(
    'UPDATE events SET user_id = ?, event_type = ?, title = ?, description = ?, event_date = ?, location = ?, reminder_enabled = ? WHERE id = ?',
    [event.user_id, event.event_type, event.title, event.description, event.event_date, event.location, event.reminder_enabled, id]
  );
  
  // Update or create reminder if reminder is enabled
  if (event.reminder_enabled) {
    try {
      // Get user to fetch preferred language
      const user = await getUser(event.user_id);
      
      // Get the default template for this event type and user's language
      const templates = await getMessageTemplates(user.preferred_language);
      const defaultTemplate = templates.find(
        t => t.event_type === event.event_type && t.is_default
      );
      
      // Calculate reminder time (24 hours before event)
      const eventDate = new Date(event.event_date);
      const reminderTime = new Date(eventDate.getTime() - (24 * 60 * 60 * 1000));
      
      // Check if a reminder already exists for this event
      const [existingReminders] = await getPool().query(
        'SELECT id FROM reminders WHERE event_id = ? AND status = "pending"',
        [id]
      );
      
      // Only update/create reminder if it's in the future
      if (reminderTime > new Date()) {
        if (existingReminders.length > 0) {
          // Update existing reminder
          await getPool().query(
            'UPDATE reminders SET reminder_time = ?, message_template_id = ? WHERE id = ?',
            [reminderTime, defaultTemplate ? defaultTemplate.id : null, existingReminders[0].id]
          );
          console.log(`✓ Updated reminder for event ${id} at ${reminderTime}`);
        } else {
          // Create new reminder
          await getPool().query(
            'INSERT INTO reminders (event_id, reminder_time, message_template_id, status) VALUES (?, ?, ?, ?)',
            [id, reminderTime, defaultTemplate ? defaultTemplate.id : null, 'pending']
          );
          console.log(`✓ Auto-created reminder for event ${id} at ${reminderTime}`);
        }
      }
    } catch (error) {
      console.error('Failed to update/create automatic reminder:', error);
      // Don't fail the event update if reminder update fails
    }
  } else {
    // If reminder is disabled, cancel any pending reminders
    try {
      await getPool().query(
        'UPDATE reminders SET status = "cancelled" WHERE event_id = ? AND status = "pending"',
        [id]
      );
    } catch (error) {
      console.error('Failed to cancel reminders:', error);
    }
  }
  
  return { id, ...event };
}

async function deleteEvent(id) {
  await getPool().query('DELETE FROM events WHERE id = ?', [id]);
  return { success: true };
}

// Reminder operations
async function getReminders(status = null) {
  let query = `
    SELECT r.*, e.title as event_title, e.event_type, e.event_date, 
           u.name as user_name, u.phone, u.preferred_language
    FROM reminders r
    JOIN events e ON r.event_id = e.id
    JOIN users u ON e.user_id = u.id
  `;
  
  if (status) {
    query += ' WHERE r.status = ?';
    const [rows] = await getPool().query(query + ' ORDER BY r.reminder_time', [status]);
    return rows;
  }
  
  const [rows] = await getPool().query(query + ' ORDER BY r.reminder_time');
  return rows;
}

async function getPendingReminders() {
  const [rows] = await getPool().query(`
    SELECT r.*, e.title as event_title, e.event_type, e.event_date, e.location, e.description,
           u.id as user_id, u.name as user_name, u.phone, u.preferred_language
    FROM reminders r
    JOIN events e ON r.event_id = e.id
    JOIN users u ON e.user_id = u.id
    WHERE r.status = 'pending' AND r.reminder_time <= NOW()
    ORDER BY r.reminder_time
  `);
  return rows;
}

async function createReminder(reminder) {
  const [result] = await getPool().query(
    'INSERT INTO reminders (event_id, reminder_time, message_template_id, custom_message, file_id) VALUES (?, ?, ?, ?, ?)',
    [reminder.event_id, reminder.reminder_time, reminder.message_template_id, reminder.custom_message, reminder.file_id]
  );
  return { id: result.insertId, ...reminder };
}

async function updateReminder(id, reminder) {
  await getPool().query(
    'UPDATE reminders SET event_id = ?, reminder_time = ?, message_template_id = ?, custom_message = ?, file_id = ?, status = ? WHERE id = ?',
    [reminder.event_id, reminder.reminder_time, reminder.message_template_id, reminder.custom_message, reminder.file_id, reminder.status, id]
  );
  return { id, ...reminder };
}

async function updateReminderStatus(id, status, errorMessage = null) {
  await getPool().query(
    'UPDATE reminders SET status = ?, sent_at = NOW(), error_message = ? WHERE id = ?',
    [status, errorMessage, id]
  );
}

async function deleteReminder(id) {
  await getPool().query('DELETE FROM reminders WHERE id = ?', [id]);
  return { success: true };
}

// Message template operations
async function getMessageTemplates(language = null) {
  if (language) {
    const [rows] = await getPool().query(
      'SELECT * FROM message_templates WHERE language = ? ORDER BY event_type, name',
      [language]
    );
    return rows;
  }
  const [rows] = await getPool().query('SELECT * FROM message_templates ORDER BY event_type, language, name');
  return rows;
}

async function getMessageTemplate(id) {
  const [rows] = await getPool().query('SELECT * FROM message_templates WHERE id = ?', [id]);
  return rows[0];
}

async function saveMessageTemplate(template) {
  if (template.id) {
    await getPool().query(
      'UPDATE message_templates SET name = ?, event_type = ?, language = ?, template_text = ?, variables = ?, is_default = ? WHERE id = ?',
      [template.name, template.event_type, template.language, template.template_text, JSON.stringify(template.variables), template.is_default, template.id]
    );
    return { ...template };
  } else {
    const [result] = await getPool().query(
      'INSERT INTO message_templates (name, event_type, language, template_text, variables, is_default) VALUES (?, ?, ?, ?, ?, ?)',
      [template.name, template.event_type, template.language, template.template_text, JSON.stringify(template.variables), template.is_default || false]
    );
    return { id: result.insertId, ...template };
  }
}

// File operations
async function uploadFile(fileData) {
  // Convert array back to Buffer if needed
  const fileBuffer = Array.isArray(fileData.file_data) 
    ? Buffer.from(fileData.file_data) 
    : fileData.file_data;
    
  const [result] = await getPool().query(
    'INSERT INTO files (user_id, filename, original_name, file_type, file_size, storage_type, file_data, mime_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [fileData.user_id, fileData.filename, fileData.original_name, fileData.file_type, fileData.file_size, 'mysql', fileBuffer, fileData.mime_type]
  );
  return { id: result.insertId, filename: fileData.filename, original_name: fileData.original_name };
}

async function getFile(id) {
  const [rows] = await getPool().query('SELECT * FROM files WHERE id = ?', [id]);
  return rows[0];
}

async function getUserFiles(userId) {
  const [rows] = await getPool().query(
    'SELECT id, filename, original_name, file_type, file_size, mime_type, created_at FROM files WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

async function getAllFiles() {
  const [rows] = await getPool().query(
    `SELECT f.id, f.filename, f.original_name, f.file_type, f.file_size, f.mime_type, f.created_at, f.user_id,
            u.name as user_name, u.phone as user_phone
     FROM files f
     JOIN users u ON f.user_id = u.id
     ORDER BY f.created_at DESC`
  );
  return rows;
}

async function deleteFile(id) {
  await getPool().query('DELETE FROM files WHERE id = ?', [id]);
  return { id };
}

// Message log operations
async function createMessageLog(log) {
  const [result] = await getPool().query(
    'INSERT INTO message_logs (user_id, reminder_id, message_type, message_text, language, file_id, phone, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [log.user_id, log.reminder_id, log.message_type, log.message_text, log.language, log.file_id, log.phone, log.status, log.error_message]
  );
  return { id: result.insertId, ...log };
}

async function getMessageLogs(userId = null, limit = 100) {
  if (userId) {
    const [rows] = await getPool().query(
      'SELECT * FROM message_logs WHERE user_id = ? ORDER BY sent_at DESC LIMIT ?',
      [userId, limit]
    );
    return rows;
  }
  const [rows] = await getPool().query(
    'SELECT ml.*, u.name as user_name FROM message_logs ml JOIN users u ON ml.user_id = u.id ORDER BY ml.sent_at DESC LIMIT ?',
    [limit]
  );
  return rows;
}

// Birthday operations
async function getUpcomingBirthdays(daysAhead = 7) {
  const [rows] = await getPool().query(`
    SELECT u.*, 
           DATE_FORMAT(u.date_of_birth, '%m-%d') as birthday_md,
           DATEDIFF(
             DATE_ADD(
               MAKEDATE(YEAR(CURDATE()), 1),
               INTERVAL DAYOFYEAR(u.date_of_birth) - 1 DAY
             ),
             CURDATE()
           ) as days_until
    FROM users u
    WHERE u.date_of_birth IS NOT NULL
    HAVING days_until >= 0 AND days_until <= ?
    ORDER BY days_until
  `, [daysAhead]);
  return rows;
}

// Settings operations
async function getSetting(key) {
  const [rows] = await getPool().query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [key]);
  return rows[0]?.setting_value;
}

async function setSetting(key, value) {
  await getPool().query(
    'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
    [key, value, value]
  );
}

module.exports = {
  // Users
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  
  // Events
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  
  // Reminders
  getReminders,
  getPendingReminders,
  createReminder,
  updateReminder,
  updateReminderStatus,
  deleteReminder,
  
  // Message templates
  getMessageTemplates,
  getMessageTemplate,
  saveMessageTemplate,
  
  // Files
  uploadFile,
  getFile,
  getUserFiles,
  getAllFiles,
  deleteFile,
  
  // Message logs
  createMessageLog,
  getMessageLogs,
  
  // Birthdays
  getUpcomingBirthdays,
  
  // Settings
  getSetting,
  setSetting
};
