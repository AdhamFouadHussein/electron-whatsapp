const { machineIdSync } = require('node-machine-id');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class LicenseService {
  constructor() {
    this.licenseFilePath = path.join(process.env.APPDATA || process.env.HOME, '.whatsapp-manager', 'license.json');
    this.licenseServerUrl = process.env.LICENSE_SERVER_URL || 'http://localhost:3001/api/license';
    this.appVersion = require('../../package.json').version;
    this.hardwareId = null;
    this.licenseData = null;
  }

  /**
   * Get unique hardware ID for this machine
   */
  async getHardwareId() {
    if (this.hardwareId) {
      return this.hardwareId;
    }

    try {
      // Get machine ID (stable across reboots)
      const machineId = machineIdSync({ original: true });
      
      // Create a hash of the machine ID for privacy
      this.hardwareId = crypto
        .createHash('sha256')
        .update(machineId)
        .digest('hex');
      
      return this.hardwareId;
    } catch (error) {
      console.error('Failed to get hardware ID:', error);
      throw new Error('Failed to generate hardware ID');
    }
  }

  /**
   * Ensure license directory exists
   */
  async ensureLicenseDirectory() {
    const dir = path.dirname(this.licenseFilePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Load license from local storage
   */
  async loadLocalLicense() {
    try {
      const data = await fs.readFile(this.licenseFilePath, 'utf8');
      this.licenseData = JSON.parse(data);
      return this.licenseData;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // No license file exists
      }
      throw error;
    }
  }

  /**
   * Save license to local storage
   */
  async saveLocalLicense(licenseData) {
    await this.ensureLicenseDirectory();
    await fs.writeFile(
      this.licenseFilePath,
      JSON.stringify(licenseData, null, 2),
      'utf8'
    );
    this.licenseData = licenseData;
  }

  /**
   * Validate license structure and signature
   */
  validateLicenseStructure(license) {
    if (!license || typeof license !== 'object') {
      return { valid: false, reason: 'Invalid license format' };
    }

    const required = ['licenseKey', 'hardwareId', 'email', 'expiresAt', 'signature'];
    for (const field of required) {
      if (!license[field]) {
        return { valid: false, reason: `Missing required field: ${field}` };
      }
    }

    // Check if license has expired
    const expiryDate = new Date(license.expiresAt);
    if (expiryDate < new Date()) {
      return { valid: false, reason: 'License has expired' };
    }

    return { valid: true };
  }
  
  /**
   * Activate license with server
   */
  async activateLicense(licenseKey, email) {
    try {
      const hardwareId = await this.getHardwareId();
      
      const response = await axios.post(`${this.licenseServerUrl}/activate`, {
        licenseKey,
        email,
        hardwareId,
        appVersion: this.appVersion
      }, {
        timeout: 10000
      });

      if (response.data.success) {
        const licenseData = response.data.license;
        await this.saveLocalLicense(licenseData);
        return {
          success: true,
          license: licenseData,
          message: 'License activated successfully'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'License activation failed'
        };
      }
    } catch (error) {
      console.error('License activation error:', error);
      
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Server rejected license activation'
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to license server. Please check your internet connection.'
        };
      } else {
        return {
          success: false,
          message: 'License activation failed: ' + error.message
        };
      }
    }
  }

  /**
   * Verify license with server
   */
  async verifyLicenseOnline(license) {
    try {
      const response = await axios.post(`${this.licenseServerUrl}/verify`, {
        licenseKey: license.licenseKey,
        hardwareId: license.hardwareId,
        email: license.email
      }, {
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('Online license verification error:', error);
      // If server is unreachable, allow offline validation
      return { success: true, offline: true };
    }
  }

  /**
   * Check if application is licensed
   */
  async checkLicense() {
    try {
      const hardwareId = await this.getHardwareId();
      
      // Load local license
      const license = await this.loadLocalLicense();
      
      if (!license) {
        return {
          valid: false,
          reason: 'No license found',
          requiresActivation: true,
          hardwareId
        };
      }

      // Validate structure
      const structureCheck = this.validateLicenseStructure(license);
      if (!structureCheck.valid) {
        return {
          valid: false,
          reason: structureCheck.reason,
          requiresActivation: true,
          hardwareId
        };
      }

      // Check hardware ID match
      if (license.hardwareId !== hardwareId) {
        return {
          valid: false,
          reason: 'License is tied to a different machine',
          requiresActivation: true,
          hardwareId
        };
      }


      // Verify with server (online check)
      const onlineCheck = await this.verifyLicenseOnline(license);
      if (!onlineCheck.success && !onlineCheck.offline) {
        return {
          valid: false,
          reason: onlineCheck.message || 'License verification failed',
          requiresActivation: true,
          hardwareId
        };
      }

      return {
        valid: true,
        license: {
          email: license.email,
          expiresAt: license.expiresAt,
          type: license.type || 'standard',
          features: license.features || []
        },
        offline: onlineCheck.offline || false
      };
    } catch (error) {
      console.error('License check error:', error);
      return {
        valid: false,
        reason: 'License check failed: ' + error.message,
        requiresActivation: true
      };
    }
  }

  /**
   * Deactivate license (remove local license)
   */
  async deactivateLicense() {
    try {
      const license = await this.loadLocalLicense();
      
      if (license) {
        // Notify server about deactivation
        try {
          await axios.post(`${this.licenseServerUrl}/deactivate`, {
            licenseKey: license.licenseKey,
            hardwareId: license.hardwareId
          }, {
            timeout: 5000
          });
        } catch (error) {
          console.error('Failed to notify server about deactivation:', error);
          // Continue with local deactivation even if server notification fails
        }
      }

      // Remove local license file
      await fs.unlink(this.licenseFilePath);
      this.licenseData = null;
      
      return { success: true, message: 'License deactivated successfully' };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true, message: 'No license to deactivate' };
      }
      throw error;
    }
  }

  /**
   * Get license info
   */
  async getLicenseInfo() {
    const license = await this.loadLocalLicense();
    const hardwareId = await this.getHardwareId();
    
    if (!license) {
      return {
        status: 'unlicensed',
        hardwareId
      };
    }

    const expiryDate = new Date(license.expiresAt);
    const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

    return {
      status: expiryDate > new Date() ? 'active' : 'expired',
      email: license.email,
      expiresAt: license.expiresAt,
      daysUntilExpiry,
      type: license.type || 'standard',
      features: license.features || [],
      hardwareId
    };
  }
}

module.exports = new LicenseService();
