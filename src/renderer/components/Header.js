import React from 'react';
import { useTranslation } from 'react-i18next';

function Header({ whatsappStatus }) {
  const { t } = useTranslation();

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return t('dashboard.connected');
      case 'disconnected':
        return t('dashboard.disconnected');
      case 'reconnecting':
        return t('dashboard.reconnecting');
      case 'qr_ready':
        return t('dashboard.qrReady');
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    if (status === 'connected') return 'connected';
    if (status === 'reconnecting' || status === 'qr_ready') return 'reconnecting';
    return 'disconnected';
  };

  return (
    <div className="header">
      <div className="header-title">
        {/* Title will be set by individual views */}
      </div>
      <div className="header-actions">
        <div className="whatsapp-status">
          <span className={`status-indicator ${getStatusClass(whatsappStatus)}`}></span>
          <span>{t('dashboard.whatsappStatus')}: {getStatusText(whatsappStatus)}</span>
        </div>
      </div>
    </div>
  );
}

export default Header;
