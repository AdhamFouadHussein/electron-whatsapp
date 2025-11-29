const Papa = require('papaparse');
const dbOps = require('./db-operations');
const whatsappService = require('./whatsapp-service');

// Active campaign state
let activeCampaign = null;
let isPaused = false;
let isRunning = false;

/**
 * Parse CSV file content and extract recipients
 * Expected columns: phone (required), name (optional)
 */
function parseCSV(csvContent) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        if (results.errors.length > 0) {
          return reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
        }

        const recipients = [];
        const errors = [];

        results.data.forEach((row, index) => {
          const phone = row.phone || row.number || row.phonenumber;
          if (!phone) {
            errors.push(`Row ${index + 1}: Missing phone number`);
            return;
          }

          // Clean phone number (remove spaces, dashes, etc.)
          const cleanPhone = phone.toString().replace(/[\s\-()]/g, '');

          recipients.push({
            phone: cleanPhone,
            name: row.name || null
          });
        });

        if (errors.length > 0) {
          console.warn('CSV parsing warnings:', errors);
        }

        if (recipients.length === 0) {
          return reject(new Error('No valid recipients found in CSV. Ensure there is a "phone" column.'));
        }

        resolve({ recipients, warnings: errors });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
}

/**
 * Start sending messages for a campaign
 */
async function startCampaign(campaignId) {
  if (isRunning) {
    throw new Error('Another campaign is already running');
  }

  const campaign = await dbOps.getCampaign(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status === 'completed') {
    throw new Error('Campaign is already completed');
  }

  // Get pending recipients
  const recipients = await dbOps.getCampaignRecipients(campaignId, 'pending');
  if (recipients.length === 0) {
    await dbOps.updateCampaignStatus(campaignId, 'completed');
    throw new Error('No pending recipients to send messages to');
  }

  console.log(`Starting campaign ${campaignId}: ${recipients.length} pending recipients`);

  activeCampaign = campaign;
  isRunning = true;
  isPaused = false;

  await dbOps.updateCampaignStatus(campaignId, 'running');

  // Process recipients sequentially with delays
  await processRecipients(campaign, recipients);

  console.log(`Campaign ${campaignId} completed`);
}

/**
 * Process recipients with human-like delays
 */
async function processRecipients(campaign, recipients) {
  const logBuffer = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < recipients.length; i++) {
    // Check if paused or stopped
    if (isPaused) {
      console.log(`Campaign ${campaign.id} paused at recipient ${i + 1}/${recipients.length}`);
      await dbOps.updateCampaignStatus(campaign.id, 'paused');
      isRunning = false;
      // Flush remaining logs before pausing
      if (logBuffer.length > 0) {
        await dbOps.createMessageLogsBatch(logBuffer);
      }
      return;
    }

    if (!isRunning) {
      console.log(`Campaign ${campaign.id} stopped at recipient ${i + 1}/${recipients.length}`);
      // Flush remaining logs before stopping
      if (logBuffer.length > 0) {
        await dbOps.createMessageLogsBatch(logBuffer);
      }
      return;
    }

    const recipient = recipients[i];
    let message = campaign.message_text;
    let status = 'sent';
    let errorMessage = null;

    try {
      console.log(`Sending message to ${recipient.phone} (${i + 1}/${recipients.length})...`);

      // Replace variables
      // Replace {{name}}
      if (recipient.name) {
        message = message.replace(/\{\{name\}\}/gi, recipient.name);
      } else {
        message = message.replace(/\{\{name\}\}/gi, '');
      }

      // Replace {{phoneNumber}} or {{phone}}
      if (recipient.phone) {
        message = message.replace(/\{\{phoneNumber\}\}/gi, recipient.phone);
        message = message.replace(/\{\{phone\}\}/gi, recipient.phone);
      }

      // Send message via WhatsApp
      await whatsappService.sendMessage(recipient.phone, message);

      // Update recipient status
      await dbOps.updateRecipientStatus(recipient.id, 'sent');
      await dbOps.incrementCampaignCounters(campaign.id, 1, 0);

      console.log(`✓ Message sent to ${recipient.phone}`);

    } catch (error) {
      console.error(`✗ Failed to send message to ${recipient.phone}:`, error.message);
      status = 'failed';
      errorMessage = error.message;

      // Update recipient status with error
      await dbOps.updateRecipientStatus(recipient.id, 'failed', {
        error_message: error.message
      });
      await dbOps.incrementCampaignCounters(campaign.id, 0, 1);
    }

    // Add to log buffer
    logBuffer.push({
      user_id: null, // Campaign recipients might not be in users table
      reminder_id: null,
      message_type: 'campaign',
      message_text: message,
      language: 'en',
      file_id: null,
      phone: recipient.phone,
      status: status,
      error_message: errorMessage
    });

    // Flush buffer if full
    if (logBuffer.length >= BATCH_SIZE) {
      await dbOps.createMessageLogsBatch(logBuffer);
      logBuffer.length = 0;
    }

    // Add human-like delay before next message (except for last recipient)
    if (i < recipients.length - 1) {
      const delay = getRandomDelay(campaign.min_delay_sec, campaign.max_delay_sec);
      console.log(`Waiting ${delay}s before next message...`);
      await sleep(delay * 1000);
    }
  }

  // Flush remaining logs
  if (logBuffer.length > 0) {
    await dbOps.createMessageLogsBatch(logBuffer);
  }

  // Mark campaign as completed
  await dbOps.updateCampaignStatus(campaign.id, 'completed');
  isRunning = false;
  activeCampaign = null;
}

/**
 * Get random delay between min and max seconds
 */
function getRandomDelay(minSec, maxSec) {
  return Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Pause the active campaign
 */
async function pauseCampaign(campaignId) {
  if (!isRunning || !activeCampaign || activeCampaign.id !== campaignId) {
    throw new Error('Campaign is not running');
  }

  console.log(`Pausing campaign ${campaignId}...`);
  isPaused = true;

  return { success: true };
}

/**
 * Resume a paused campaign
 */
async function resumeCampaign(campaignId) {
  const campaign = await dbOps.getCampaign(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'paused') {
    throw new Error('Campaign is not paused');
  }

  console.log(`Resuming campaign ${campaignId}...`);

  // Restart the campaign (it will only process pending recipients)
  await startCampaign(campaignId);

  return { success: true };
}

/**
 * Get current campaign status
 */
function getActiveCampaignStatus() {
  return {
    isRunning,
    isPaused,
    campaignId: activeCampaign ? activeCampaign.id : null
  };
}

module.exports = {
  parseCSV,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  getActiveCampaignStatus
};
