// const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { Boom } = require('@hapi/boom');
const { app } = require('electron');

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.qrCallback = null;
    this.statusCallback = null;
    // Use absolute path in user data directory
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    this.sessionPath = path.join(userDataPath, 'whatsapp-session');
    this.status = 'disconnected';
    this.DisconnectReason = null; // Will be loaded dynamically
  }

  setQRCallback(callback) {
    this.qrCallback = callback;
  }

  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  updateStatus(status) {
    this.status = status;
    if (this.statusCallback) {
      this.statusCallback(status);
    }
    console.log(`WhatsApp Status: ${status}`);
  }

  async connect() {
    try {
      // Dynamically import Baileys (ESM module)
      const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = await import('@whiskeysockets/baileys');
      this.DisconnectReason = DisconnectReason;

      // Ensure session directory exists
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
      // Fetch latest baileys version info (log it for diagnostics)
      const versionInfo = await fetchLatestBaileysVersion();
      // Some versions of the library return an object, others return an array/tuple.
      // Normalize and log for debugging.
      let version = versionInfo && versionInfo.version ? versionInfo.version : versionInfo && versionInfo[0] ? versionInfo[0] : versionInfo;
      console.log('Baileys version info:', versionInfo);

      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false, // Disable terminal QR printing for production
        browser: ['WhatsApp Reminder App', 'Desktop', '1.0.0']
      });
      console.log('WASocket created');

      // Handle connection updates
      this.sock.ev.on('connection.update', async (update) => {
        console.log('connection.update event:', JSON.stringify(update));
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('QR Code received, sending to UI');
          // Send QR code to UI for display
          if (this.qrCallback) {
            this.qrCallback(qr);
          }
          this.updateStatus('qr_ready');
        }

        if (connection === 'close') {
          // Determine whether to attempt reconnection. The shape of lastDisconnect.error
          // can vary across Baileys versions. Log and handle common cases safely.
          let shouldReconnect = true;
          try {
            if (lastDisconnect && lastDisconnect.error) {
              console.log('lastDisconnect.error:', lastDisconnect.error);
              // If the disconnect indicates a logged out session, don't reconnect.
              const err = lastDisconnect.error;
              if (err === this.DisconnectReason.loggedOut ||
                (err && err.output && err.output.statusCode && String(err.output.statusCode) === String(this.DisconnectReason.loggedOut)) ||
                (err && err.message && String(err.message).toLowerCase().includes('logged out'))) {
                shouldReconnect = false;
              }
            }
          } catch (detErr) {
            console.warn('Error while evaluating reconnect logic:', detErr);
            shouldReconnect = true;
          }

          console.log('Connection closed, lastDisconnect:', lastDisconnect, ', reconnecting:', shouldReconnect);

          if (shouldReconnect) {
            this.updateStatus('reconnecting');
            setTimeout(() => this.connect(), 3000);
          } else {
            this.updateStatus('logged_out');
            // Clear session files if logged out
            if (fs.existsSync(this.sessionPath)) {
              try {
                fs.rmSync(this.sessionPath, { recursive: true, force: true });
              } catch (rmErr) {
                console.error('Failed to remove session files:', rmErr);
              }
            }
          }
        } else if (connection === 'open') {
          console.log('WhatsApp connected successfully!');
          this.updateStatus('connected');
        }
      });

      // Save credentials when updated
      this.sock.ev.on('creds.update', saveCreds);

    } catch (error) {
      console.error('WhatsApp connection error:', error);
      this.updateStatus('error');
      throw error;
    }
  }

  async disconnect() {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.updateStatus('disconnected');
    }
  }

  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Add country code if not present (assuming international format)
    if (!cleaned.startsWith('1') && !cleaned.startsWith('2') && !cleaned.startsWith('3') &&
      !cleaned.startsWith('4') && !cleaned.startsWith('5') && !cleaned.startsWith('6') &&
      !cleaned.startsWith('7') && !cleaned.startsWith('8') && !cleaned.startsWith('9')) {
      // If no country code, you might want to add a default one
      // Example: cleaned = '1' + cleaned; // for US numbers
    }

    // WhatsApp uses the format: [country code][number]@s.whatsapp.net
    return `${cleaned}@s.whatsapp.net`;
  }

  async sendMessage(phone, message) {
    if (!this.sock || this.status !== 'connected') {
      throw new Error('WhatsApp is not connected');
    }

    try {
      const jid = this.formatPhoneNumber(phone);
      await this.sock.sendMessage(jid, { text: message });
      console.log(`Message sent to ${phone}`);
      return { success: true, phone, message };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendMessageWithFile(phone, message, filePath, mimetype, filename) {
    if (!this.sock || this.status !== 'connected') {
      throw new Error('WhatsApp is not connected');
    }

    try {
      const jid = this.formatPhoneNumber(phone);

      // Read file
      const fileBuffer = fs.readFileSync(filePath);

      // Determine message type based on mimetype
      let messageContent;
      if (mimetype.startsWith('image/')) {
        messageContent = {
          image: fileBuffer,
          caption: message,
          mimetype: mimetype,
          fileName: filename
        };
      } else if (mimetype.startsWith('video/')) {
        messageContent = {
          video: fileBuffer,
          caption: message,
          mimetype: mimetype,
          fileName: filename
        };
      } else if (mimetype.startsWith('audio/')) {
        messageContent = {
          audio: fileBuffer,
          mimetype: mimetype,
          fileName: filename
        };
        // Send caption as a separate message for audio
        if (message) {
          await this.sock.sendMessage(jid, { text: message });
        }
      } else {
        // For documents (PDF, DOCX, etc.)
        messageContent = {
          document: fileBuffer,
          mimetype: mimetype,
          fileName: filename,
          caption: message
        };
      }

      await this.sock.sendMessage(jid, messageContent);
      console.log(`Message with file sent to ${phone}`);
      return { success: true, phone, message, filename };
    } catch (error) {
      console.error('Error sending message with file:', error);
      throw error;
    }
  }

  async sendMessageWithBuffer(phone, message, fileBuffer, mimetype, filename) {
    if (!this.sock || this.status !== 'connected') {
      throw new Error('WhatsApp is not connected');
    }

    try {
      const jid = this.formatPhoneNumber(phone);

      let messageContent;
      if (mimetype.startsWith('image/')) {
        messageContent = {
          image: fileBuffer,
          caption: message,
          mimetype: mimetype,
          fileName: filename
        };
      } else if (mimetype.startsWith('video/')) {
        messageContent = {
          video: fileBuffer,
          caption: message,
          mimetype: mimetype,
          fileName: filename
        };
      } else if (mimetype.startsWith('audio/')) {
        messageContent = {
          audio: fileBuffer,
          mimetype: mimetype,
          fileName: filename
        };
        if (message) {
          await this.sock.sendMessage(jid, { text: message });
        }
      } else {
        messageContent = {
          document: fileBuffer,
          mimetype: mimetype,
          fileName: filename,
          caption: message
        };
      }

      await this.sock.sendMessage(jid, messageContent);
      console.log(`Message with file buffer sent to ${phone}`);
      return { success: true, phone, message, filename };
    } catch (error) {
      console.error('Error sending message with file buffer:', error);
      throw error;
    }
  }

  getStatus() {
    return this.status;
  }

  isConnected() {
    return this.status === 'connected';
  }
}

// Export singleton instance
const whatsappService = new WhatsAppService();
module.exports = whatsappService;
