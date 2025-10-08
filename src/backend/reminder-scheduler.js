const cron = require('node-cron');
const {
  getPendingReminders,
  updateReminderStatus,
  createMessageLog,
  getMessageTemplate,
  getFile,
  getUpcomingBirthdays,
  getUser,
  getMessageTemplates
} = require('./db-operations');
const whatsappService = require('./whatsapp-service');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ReminderScheduler {
  constructor() {
    this.tasks = [];
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('Reminder scheduler is already running');
      return;
    }

    console.log('Starting reminder scheduler...');
    this.isRunning = true;

    // Check for pending reminders every minute
    const reminderTask = cron.schedule('* * * * *', async () => {
      await this.processReminders();
    });

    // Check for birthdays every day at 9:00 AM
    const birthdayTask = cron.schedule('0 9 * * *', async () => {
      await this.processBirthdays();
    });

    this.tasks.push(reminderTask, birthdayTask);
    console.log('✓ Reminder scheduler started');
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping reminder scheduler...');
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
    this.isRunning = false;
    console.log('✓ Reminder scheduler stopped');
  }

  async processReminders() {
    try {
      const reminders = await getPendingReminders();
      
      if (reminders.length === 0) {
        return;
      }

      console.log(`Processing ${reminders.length} pending reminder(s)...`);

      for (const reminder of reminders) {
        try {
          await this.sendReminder(reminder);
        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error);
          await updateReminderStatus(reminder.id, 'failed', error.message);
        }
      }
    } catch (error) {
      console.error('Error in processReminders:', error);
    }
  }

  async sendReminder(reminder) {
    if (!whatsappService.isConnected()) {
      throw new Error('WhatsApp is not connected');
    }

    // Build the message
    let message;
    if (reminder.custom_message) {
      message = this.interpolateVariables(reminder.custom_message, reminder);
    } else if (reminder.message_template_id) {
      const template = await getMessageTemplate(reminder.message_template_id);
      if (template) {
        message = this.interpolateVariables(template.template_text, reminder);
      } else {
        message = this.buildDefaultMessage(reminder);
      }
    } else {
      message = this.buildDefaultMessage(reminder);
    }

    try {
      // Send message with or without file
      if (reminder.file_id) {
        const file = await getFile(reminder.file_id);
        if (file) {
          await this.sendWithFile(reminder, message, file);
        } else {
          await whatsappService.sendMessage(reminder.phone, message);
        }
      } else {
        await whatsappService.sendMessage(reminder.phone, message);
      }

      // Update reminder status
      await updateReminderStatus(reminder.id, 'sent');

      // Log the message
      await createMessageLog({
        user_id: reminder.user_id,
        reminder_id: reminder.id,
        message_type: 'reminder',
        message_text: message,
        language: reminder.preferred_language,
        file_id: reminder.file_id,
        phone: reminder.phone,
        status: 'sent'
      });

      console.log(`✓ Reminder ${reminder.id} sent to ${reminder.user_name}`);
    } catch (error) {
      await updateReminderStatus(reminder.id, 'failed', error.message);
      
      await createMessageLog({
        user_id: reminder.user_id,
        reminder_id: reminder.id,
        message_type: 'reminder',
        message_text: message,
        language: reminder.preferred_language,
        file_id: reminder.file_id,
        phone: reminder.phone,
        status: 'failed',
        error_message: error.message
      });

      throw error;
    }
  }

  async sendWithFile(reminder, message, file) {
    if (file.storage_type === 'mysql' && file.file_data) {
      // File is stored in MySQL as BLOB
      await whatsappService.sendMessageWithBuffer(
        reminder.phone,
        message,
        file.file_data,
        file.mime_type,
        file.original_name
      );
    } else if (file.storage_type === 'cloud' && file.cloud_url) {
      // File is stored in cloud - download first
      // This is a placeholder - implement based on your cloud storage
      throw new Error('Cloud storage not yet implemented');
    } else {
      throw new Error('Invalid file storage configuration');
    }
  }

  async processBirthdays() {
    try {
      const birthdays = await getUpcomingBirthdays(0); // Get today's birthdays
      
      if (birthdays.length === 0) {
        console.log('No birthdays today');
        return;
      }

      console.log(`Processing ${birthdays.length} birthday(s)...`);

      for (const user of birthdays) {
        try {
          await this.sendBirthdayWish(user);
        } catch (error) {
          console.error(`Error sending birthday wish to ${user.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in processBirthdays:', error);
    }
  }

  async sendBirthdayWish(user) {
    if (!whatsappService.isConnected()) {
      throw new Error('WhatsApp is not connected');
    }

    // Get birthday template for user's preferred language
    const templates = await getMessageTemplates(user.preferred_language);
    const birthdayTemplate = templates.find(t => t.event_type === 'birthday' && t.is_default);

    let message;
    if (birthdayTemplate) {
      message = this.interpolateVariables(birthdayTemplate.template_text, { name: user.name });
    } else {
      // Fallback message
      message = `Happy Birthday ${user.name}! 🎉🎂 Wishing you a wonderful day!`;
    }

    try {
      await whatsappService.sendMessage(user.phone, message);

      // Log the message
      await createMessageLog({
        user_id: user.id,
        reminder_id: null,
        message_type: 'birthday',
        message_text: message,
        language: user.preferred_language,
        file_id: null,
        phone: user.phone,
        status: 'sent'
      });

      console.log(`✓ Birthday wish sent to ${user.name}`);
    } catch (error) {
      await createMessageLog({
        user_id: user.id,
        reminder_id: null,
        message_type: 'birthday',
        message_text: message,
        language: user.preferred_language,
        file_id: null,
        phone: user.phone,
        status: 'failed',
        error_message: error.message
      });

      throw error;
    }
  }

  interpolateVariables(template, data) {
    let message = template;
    
    // Replace common variables
    const variables = {
      name: data.user_name || data.name,
      title: data.event_title || data.title,
      date: data.event_date ? new Date(data.event_date).toLocaleDateString() : '',
      location: data.location || '',
      description: data.description || ''
    };

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      message = message.replace(regex, value || '');
    }

    return message;
  }

  buildDefaultMessage(reminder) {
    const eventDate = new Date(reminder.event_date).toLocaleDateString();
    let message = `Hi ${reminder.user_name}!\n\n`;
    message += `This is a reminder about: ${reminder.event_title}\n`;
    message += `Date: ${eventDate}\n`;
    
    if (reminder.location) {
      message += `Location: ${reminder.location}\n`;
    }
    
    if (reminder.description) {
      message += `\nDetails: ${reminder.description}`;
    }

    return message;
  }
}

// Export singleton instance
const reminderScheduler = new ReminderScheduler();
module.exports = reminderScheduler;
