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

async function createUsers(users) {
  if (users.length === 0) return { success: true, count: 0 };

  const values = users.map(u => [
    u.name,
    u.phone,
    u.email || null,
    u.date_of_birth || null,
    u.preferred_language || 'en',
    u.notes || null
  ]);

  const [result] = await getPool().query(
    'INSERT IGNORE INTO users (name, phone, email, date_of_birth, preferred_language, notes) VALUES ?',
    [values]
  );
  return { success: true, count: result.affectedRows };
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
    SELECT r.*, r.reminder_time as reminder_date,
           COALESCE(r.custom_message, mt.template_text) as message,
           e.title as event_title, e.event_type, e.event_date, 
           u.id as user_id, u.name as user_name, u.phone, u.preferred_language
    FROM reminders r
    JOIN events e ON r.event_id = e.id
    JOIN users u ON e.user_id = u.id
    LEFT JOIN message_templates mt ON r.message_template_id = mt.id
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
  // Use UTC_TIMESTAMP() to compare reminder_time in UTC to avoid issues when the
  // MySQL server time zone or clock differs from application/local time.
  const [rows] = await getPool().query(`
    SELECT r.*, e.title as event_title, e.event_type, e.event_date, e.location, e.description,
           u.id as user_id, u.name as user_name, u.phone, u.preferred_language
    FROM reminders r
    JOIN events e ON r.event_id = e.id
    JOIN users u ON e.user_id = u.id
    WHERE r.status = 'pending' AND r.reminder_time <= UTC_TIMESTAMP()
    ORDER BY r.reminder_time
  `);
  return rows;
}

async function createReminder(reminder) {
  // If event_id is missing but user_id is present, create a placeholder event
  if (!reminder.event_id && reminder.user_id) {
    const [eventResult] = await getPool().query(
      'INSERT INTO events (user_id, event_type, title, description, event_date, reminder_enabled) VALUES (?, ?, ?, ?, ?, ?)',
      [reminder.user_id, 'custom', 'Manual Reminder', reminder.custom_message, reminder.reminder_time, false]
    );
    reminder.event_id = eventResult.insertId;
  }

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
  // Use UTC_TIMESTAMP() for sent_at to keep timestamps consistent in UTC
  await getPool().query(
    'UPDATE reminders SET status = ?, sent_at = UTC_TIMESTAMP(), error_message = ? WHERE id = ?',
    [status, errorMessage, id]
  );
}

async function deleteReminder(id) {
  await getPool().query('DELETE FROM reminders WHERE id = ?', [id]);
  return { success: true };
}

// Message template operations
async function getMessageTemplates(language = null) {
  let rows;
  if (language) {
    [rows] = await getPool().query(
      'SELECT * FROM message_templates WHERE language = ? ORDER BY event_type, name',
      [language]
    );
  } else {
    [rows] = await getPool().query('SELECT * FROM message_templates ORDER BY event_type, language, name');
  }

  return rows.map(t => ({
    ...t,
    variables: typeof t.variables === 'string' ? JSON.parse(t.variables) : (t.variables || []),
    is_default: Boolean(t.is_default)
  }));
}

async function getMessageTemplate(id) {
  const [rows] = await getPool().query('SELECT * FROM message_templates WHERE id = ?', [id]);
  if (!rows[0]) return null;

  const template = rows[0];
  return {
    ...template,
    variables: typeof template.variables === 'string' ? JSON.parse(template.variables) : (template.variables || []),
    is_default: Boolean(template.is_default)
  };
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

async function deleteMessageTemplate(id) {
  await getPool().query('DELETE FROM message_templates WHERE id = ?', [id]);
  return { success: true };
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

// Dashboard operations
async function getDashboardStats() {
  const pool = getPool();
  const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
  const [[{ upcomingEvents }]] = await pool.query('SELECT COUNT(*) as upcomingEvents FROM events WHERE event_date > NOW()');
  const [[{ pendingReminders }]] = await pool.query('SELECT COUNT(*) as pendingReminders FROM reminders WHERE status = "pending"');

  // Count regular messages
  const [[{ regularMessages }]] = await pool.query('SELECT COUNT(*) as regularMessages FROM message_logs WHERE DATE(sent_at) = CURDATE()');

  // Count campaign messages
  const [[{ campaignMessages }]] = await pool.query('SELECT COUNT(*) as campaignMessages FROM campaign_recipients WHERE DATE(sent_at) = CURDATE()');

  const messagesToday = regularMessages + campaignMessages;

  return { totalUsers, upcomingEvents, pendingReminders, messagesToday };
}

async function getMessagesChartData() {
  const [rows] = await getPool().query(`
        SELECT DATE_FORMAT(sent_at, '%a') as day, COUNT(*) as value
        FROM (
            SELECT sent_at FROM message_logs WHERE sent_at >= CURDATE() - INTERVAL 7 DAY
            UNION ALL
            SELECT sent_at FROM campaign_recipients WHERE sent_at >= CURDATE() - INTERVAL 7 DAY
        ) as combined
        GROUP BY day
        ORDER BY MIN(sent_at)
    `);
  return rows;
}

async function getTodaysMessageStatus() {
  const [rows] = await getPool().query(`
        SELECT status, COUNT(*) as value
        FROM (
            SELECT status, sent_at FROM message_logs WHERE DATE(sent_at) = CURDATE()
            UNION ALL
            SELECT status, sent_at FROM campaign_recipients WHERE DATE(sent_at) = CURDATE()
        ) as combined
        GROUP BY status
    `);

  const stats = { sent: 0, failed: 0, pending: 0 };
  rows.forEach(row => {
    if (stats[row.status] !== undefined) {
      stats[row.status] = row.value;
    }
  });

  const total = Object.values(stats).reduce((sum, value) => sum + value, 0);
  if (total === 0) return [{ name: 'No Data', value: 100 }];

  return Object.entries(stats).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round((value / total) * 100)
  }));
}

async function getCampaignPerformanceStats() {
  const [rows] = await getPool().query(`
    SELECT name, sent_count, failed_count 
    FROM campaigns 
    ORDER BY created_at DESC 
    LIMIT 5
  `);
  return rows;
}

async function getHourlyActivityStats() {
  const [rows] = await getPool().query(`
    SELECT HOUR(sent_at) as hour, COUNT(*) as count
    FROM (
      SELECT sent_at FROM message_logs WHERE sent_at >= NOW() - INTERVAL 30 DAY
      UNION ALL
      SELECT sent_at FROM campaign_recipients WHERE sent_at >= NOW() - INTERVAL 30 DAY
    ) as combined
    GROUP BY hour
    ORDER BY hour
  `);

  // Fill in missing hours
  const result = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  rows.forEach(row => {
    result[row.hour].count = row.count;
  });

  return result.map(r => ({
    hour: `${r.hour}:00`,
    count: r.count
  }));
}

async function getTopContactsStats() {
  // Try to join with users table if possible, otherwise just use phone
  // We'll do a best effort to get names
  const [rows] = await getPool().query(`
    SELECT 
      COALESCE(MAX(u.name), combined.phone) as name, 
      COUNT(*) as count
    FROM (
      SELECT phone, user_id FROM message_logs
      UNION ALL
      SELECT phone, NULL as user_id FROM campaign_recipients
    ) as combined
    LEFT JOIN users u ON combined.user_id = u.id OR combined.phone = u.phone
    GROUP BY combined.phone
    ORDER BY count DESC
    LIMIT 5
  `);
  return rows;
}

// ...existing code...
async function getUpcomingEventsList(limit = 4) {
  const [rows] = await getPool().query(`
        SELECT e.id, u.name as user, e.title as event, e.event_date as date, 'pending' as status
        FROM events e
        JOIN users u ON e.user_id = u.id
        WHERE e.event_date > NOW()
        ORDER BY e.event_date ASC
        LIMIT ?
    `, [limit]);
  return rows;
}

// Campaign operations
async function createCampaign(campaign) {
  // ...existing code...
  const [result] = await getPool().query(
    'INSERT INTO campaigns (name, message_text, min_delay_sec, max_delay_sec, total_recipients) VALUES (?, ?, ?, ?, ?)',
    [campaign.name, campaign.message_text, campaign.min_delay_sec || 5, campaign.max_delay_sec || 15, campaign.total_recipients || 0]
  );
  return { id: result.insertId, ...campaign };
}

async function getCampaigns() {
  const [rows] = await getPool().query(`
    SELECT 
      id,
      name,
      message_text,
      status,
      total_recipients,
      sent_count,
      failed_count,
      min_delay_sec,
      max_delay_sec,
      UNIX_TIMESTAMP(created_at) * 1000 AS created_at_epoch_ms,
      UNIX_TIMESTAMP(started_at) * 1000 AS started_at_epoch_ms,
      UNIX_TIMESTAMP(completed_at) * 1000 AS completed_at_epoch_ms
    FROM campaigns 
    ORDER BY created_at DESC
  `);
  return rows;
}

async function getCampaign(id) {
  const [rows] = await getPool().query(`
    SELECT 
      id,
      name,
      message_text,
      status,
      total_recipients,
      sent_count,
      failed_count,
      min_delay_sec,
      max_delay_sec,
      UNIX_TIMESTAMP(created_at) * 1000 AS created_at_epoch_ms,
      UNIX_TIMESTAMP(started_at) * 1000 AS started_at_epoch_ms,
      UNIX_TIMESTAMP(completed_at) * 1000 AS completed_at_epoch_ms
    FROM campaigns 
    WHERE id = ?
  `, [id]);
  return rows[0];
}

async function updateCampaignStatus(id, status, extraFields = {}) {
  const updates = ['status = ?'];
  const params = [status];

  if (status === 'running' && !extraFields.started_at) {
    updates.push('started_at = NOW()');
  }
  if (status === 'completed' && !extraFields.completed_at) {
    updates.push('completed_at = NOW()');
  }

  Object.keys(extraFields).forEach(key => {
    updates.push(`${key} = ?`);
    params.push(extraFields[key]);
  });

  params.push(id);

  await getPool().query(
    `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  return { success: true };
}

async function addCampaignRecipients(campaignId, recipients) {
  if (recipients.length === 0) return { success: true, count: 0 };

  const values = recipients.map(r => [campaignId, r.phone, r.name || null]);
  await getPool().query(
    'INSERT INTO campaign_recipients (campaign_id, phone, name) VALUES ?',
    [values]
  );

  // Update campaign total_recipients count
  await getPool().query(
    'UPDATE campaigns SET total_recipients = total_recipients + ? WHERE id = ?',
    [recipients.length, campaignId]
  );

  return { success: true, count: recipients.length };
}

async function getCampaignRecipients(campaignId, status = null) {
  let query = `
    SELECT 
      id,
      campaign_id,
      phone,
      name,
      status,
      UNIX_TIMESTAMP(sent_at) * 1000 AS sent_at_epoch_ms,
      error_message
    FROM campaign_recipients 
    WHERE campaign_id = ?
  `;
  const params = [campaignId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY id';

  const [rows] = await getPool().query(query, params);
  return rows;
}

async function updateRecipientStatus(id, status, extraFields = {}) {
  const updates = ['status = ?'];
  const params = [status];

  if (status === 'sent' && !extraFields.sent_at) {
    updates.push('sent_at = NOW()');
  }

  Object.keys(extraFields).forEach(key => {
    updates.push(`${key} = ?`);
    params.push(extraFields[key]);
  });

  params.push(id);

  await getPool().query(
    `UPDATE campaign_recipients SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  return { success: true };
}

async function incrementCampaignCounters(campaignId, sentIncrement = 0, failedIncrement = 0) {
  await getPool().query(
    'UPDATE campaigns SET sent_count = sent_count + ?, failed_count = failed_count + ? WHERE id = ?',
    [sentIncrement, failedIncrement, campaignId]
  );
  return { success: true };
}

async function deleteCampaign(id) {
  await getPool().query('DELETE FROM campaigns WHERE id = ?', [id]);
  return { success: true };
}

// Event Type operations
async function getEventTypes() {
  const [rows] = await getPool().query('SELECT * FROM event_types ORDER BY name');
  return rows;
}

async function createEventType(eventType) {
  const [result] = await getPool().query(
    'INSERT INTO event_types (name, color, icon) VALUES (?, ?, ?)',
    [eventType.name, eventType.color, eventType.icon]
  );
  return { id: result.insertId, ...eventType };
}

async function deleteEventType(id) {
  // Check if used in events
  const [events] = await getPool().query('SELECT COUNT(*) as count FROM events WHERE event_type = (SELECT name FROM event_types WHERE id = ?)', [id]);
  if (events[0].count > 0) {
    throw new Error('Cannot delete event type that is in use by events');
  }

  // Check if used in templates
  const [templates] = await getPool().query('SELECT COUNT(*) as count FROM message_templates WHERE event_type = (SELECT name FROM event_types WHERE id = ?)', [id]);
  if (templates[0].count > 0) {
    throw new Error('Cannot delete event type that is in use by templates');
  }

  await getPool().query('DELETE FROM event_types WHERE id = ?', [id]);
  return { success: true };
}

module.exports = {
  // Dashboard
  getDashboardStats,
  getMessagesChartData,
  getTodaysMessageStatus,
  getUpcomingEventsList,
  getCampaignPerformanceStats,
  getHourlyActivityStats,
  getTopContactsStats,

  // Users
  getUsers,
  getUser,
  createUser,
  createUsers,
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
  deleteMessageTemplate,

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
  setSetting,

  // Campaigns
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaignStatus,
  addCampaignRecipients,
  getCampaignRecipients,
  updateRecipientStatus,
  incrementCampaignCounters,
  deleteCampaign,

  // Event Types
  getEventTypes,
  createEventType,
  deleteEventType
};
