import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { FiWifi, FiWifiOff, FiRefreshCw, FiCheck, FiX, FiSmartphone } from 'react-icons/fi';

function WhatsAppManager() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionHistory, setConnectionHistory] = useState([]);

  useEffect(() => {
    // Load initial WhatsApp status
    loadWhatsAppStatus();

    // Listen for status changes
    window.api.whatsapp.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setIsConnecting(false);
      
      // Clear QR code when connected
      if (newStatus === 'connected') {
        setQrCode(null);
        addToHistory('Connected successfully', 'success');
      } else if (newStatus === 'disconnected') {
        addToHistory('Disconnected', 'info');
      } else if (newStatus === 'logged_out') {
        addToHistory('Logged out from WhatsApp', 'warning');
      } else if (newStatus === 'error') {
        addToHistory('Connection error occurred', 'error');
      }
    });

    // Listen for QR code updates
    window.api.whatsapp.onQRCode((qr) => {
      setQrCode(qr);
      addToHistory('QR code generated - scan to connect', 'info');
    });
  }, []);

  const loadWhatsAppStatus = async () => {
    try {
      const currentStatus = await window.api.whatsapp.getStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Failed to load WhatsApp status:', error);
    }
  };

  const addToHistory = (message, type) => {
    const newEntry = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setConnectionHistory(prev => [newEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      addToHistory('Initiating WhatsApp connection...', 'info');
      await window.api.whatsapp.connect();
      addToHistory('Connection initiated - waiting for QR code...', 'info');
    } catch (error) {
      console.error('Failed to connect WhatsApp:', error);
      addToHistory(`Connection failed: ${error.message}`, 'error');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      addToHistory('Disconnecting from WhatsApp...', 'info');
      await window.api.whatsapp.disconnect();
      addToHistory('Disconnected successfully', 'success');
    } catch (error) {
      console.error('Failed to disconnect WhatsApp:', error);
      addToHistory(`Disconnect failed: ${error.message}`, 'error');
    }
  };

  const handleRefresh = () => {
    loadWhatsAppStatus();
    addToHistory('Status refreshed', 'info');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <FiWifi className="status-icon connected" />;
      case 'disconnected':
      case 'logged_out':
        return <FiWifiOff className="status-icon disconnected" />;
      case 'reconnecting':
      case 'qr_ready':
        return <FiRefreshCw className="status-icon reconnecting" />;
      default:
        return <FiWifiOff className="status-icon disconnected" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return t('whatsapp.status.connected');
      case 'disconnected':
        return t('whatsapp.status.disconnected');
      case 'reconnecting':
        return t('whatsapp.status.reconnecting');
      case 'qr_ready':
        return t('whatsapp.status.qrReady');
      case 'logged_out':
        return t('whatsapp.status.loggedOut');
      case 'error':
        return t('whatsapp.status.error');
      default:
        return status;
    }
  };

  const getStatusClass = () => {
    if (status === 'connected') return 'connected';
    if (status === 'reconnecting' || status === 'qr_ready') return 'reconnecting';
    return 'disconnected';
  };

  return (
    <div className="whatsapp-manager">
      <div className="whatsapp-header">
        <h2>{t('whatsapp.title')}</h2>
        <p className="whatsapp-subtitle">{t('whatsapp.subtitle')}</p>
      </div>

      {/* Status Card */}
      <div className="card whatsapp-status-card">
        <div className="status-header">
          <div className="status-info">
            {getStatusIcon()}
            <div>
              <h3>{t('whatsapp.currentStatus')}</h3>
              <p className={`status-text ${getStatusClass()}`}>{getStatusText()}</p>
            </div>
          </div>
          <button 
            className="btn btn-secondary"
            onClick={handleRefresh}
            title={t('whatsapp.refresh')}
          >
            <FiRefreshCw />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="status-actions">
          {status === 'connected' ? (
            <button 
              className="btn btn-danger"
              onClick={handleDisconnect}
            >
              <FiWifiOff />
              {t('whatsapp.disconnect')}
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={handleConnect}
              disabled={isConnecting || status === 'reconnecting' || status === 'qr_ready'}
            >
              <FiWifi />
              {isConnecting ? t('whatsapp.connecting') : t('whatsapp.connect')}
            </button>
          )}
        </div>
      </div>

      {/* QR Code Display */}
      {qrCode && (
        <div className="card qr-card">
          <div className="qr-header">
            <h3>{t('whatsapp.qrTitle')}</h3>
            <p>{t('whatsapp.qrSubtitle')}</p>
          </div>
          
          <div className="qr-content">
            <div className="qr-code-container">
              <QRCode value={qrCode} size={200} />
            </div>
            
            <div className="qr-instructions">
              <h4>{t('whatsapp.qrInstructions.title')}</h4>
              <ol>
                <li>
                  <FiSmartphone className="instruction-icon" />
                  {t('whatsapp.qrInstructions.step1')}
                </li>
                <li>{t('whatsapp.qrInstructions.step2')}</li>
                <li>{t('whatsapp.qrInstructions.step3')}</li>
                <li>{t('whatsapp.qrInstructions.step4')}</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Connection History */}
      <div className="card history-card">
        <h3>{t('whatsapp.connectionHistory')}</h3>
        <div className="history-list">
          {connectionHistory.length === 0 ? (
            <p className="no-history">{t('whatsapp.noHistory')}</p>
          ) : (
            connectionHistory.map((entry) => (
              <div key={entry.id} className={`history-item ${entry.type}`}>
                <div className="history-icon">
                  {entry.type === 'success' && <FiCheck />}
                  {entry.type === 'error' && <FiX />}
                  {entry.type === 'warning' && <FiWifiOff />}
                  {entry.type === 'info' && <FiRefreshCw />}
                </div>
                <div className="history-content">
                  <p>{entry.message}</p>
                  <span className="history-time">{entry.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default WhatsAppManager;