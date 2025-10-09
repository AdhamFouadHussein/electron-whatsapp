import React, { useState, useEffect } from 'react';
import { FiKey, FiMail, FiServer, FiAlertCircle, FiCheckCircle, FiCopy, FiCheck } from 'react-icons/fi';
import './License.css';

function License() {
  const [licenseKey, setLicenseKey] = useState('');
  const [email, setEmail] = useState('');
  const [hardwareId, setHardwareId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadHardwareId();
  }, []);

  const loadHardwareId = async () => {
    try {
      const hwId = await window.api.license.getHardwareId();
      setHardwareId(hwId);
    } catch (error) {
      console.error('Failed to get hardware ID:', error);
      setError('Failed to get hardware ID');
    }
  };

  const copyHardwareId = () => {
    navigator.clipboard.writeText(hardwareId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate inputs
      if (!licenseKey.trim()) {
        throw new Error('Please enter a license key');
      }
      if (!email.trim()) {
        throw new Error('Please enter your email address');
      }
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const result = await window.api.license.activate(licenseKey.trim(), email.trim());

      if (result.success) {
        setSuccess('License activated successfully! The application will now start...');
        // Notify main process that license was activated
        setTimeout(() => {
          window.api.licenseActivated();
        }, 1500);
      } else {
        setError(result.message || 'License activation failed');
      }
    } catch (error) {
      setError(error.message || 'License activation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="license-container">
      <div className="license-card">
        <div className="license-header">
          <FiKey className="license-icon" />
          <h1>WhatsApp Manager</h1>
          <p>License Activation</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <FiCheckCircle />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleActivate} className="license-form">
          <div className="form-group">
            <label htmlFor="licenseKey">
              <FiKey style={{ marginRight: '8px' }} />
              License Key
            </label>
            <input
              id="licenseKey"
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              maxLength={19}
              disabled={loading}
              required
            />
            <small>Enter the license key provided by your administrator</small>
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <FiMail style={{ marginRight: '8px' }} />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
              required
            />
            <small>Enter the email address associated with your license</small>
          </div>

          <div className="form-group">
            <label>
              <FiServer style={{ marginRight: '8px' }} />
              Hardware ID
            </label>
            <div className="hardware-id-container">
              <input
                type="text"
                value={hardwareId}
                readOnly
                className="hardware-id-input"
              />
              <button
                type="button"
                onClick={copyHardwareId}
                className="btn-copy"
                title="Copy to clipboard"
              >
                {copied ? <FiCheck /> : <FiCopy />}
              </button>
            </div>
            <small>
              {copied ? 'Copied!' : 'This ID will be tied to your license. Share it with your administrator if needed.'}
            </small>
          </div>

          <button
            type="submit"
            className="btn-activate"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                <span>Activating...</span>
              </>
            ) : (
              <>
                <FiKey style={{ marginRight: '8px' }} />
                <span>Activate License</span>
              </>
            )}
          </button>
        </form>

        <div className="license-footer">
          <p>Need a license? Contact your administrator.</p>
          <p className="version">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

export default License;
