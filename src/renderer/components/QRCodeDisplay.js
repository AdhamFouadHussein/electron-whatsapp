import React from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';

function QRCodeDisplay({ qrString, onClose }) {
  const { t } = useTranslation();

  if (!qrString) return null;

  return (
    <div className="qr-modal-overlay">
      <div className="qr-modal">
        <div className="qr-modal-header">
          <h3>{t('whatsapp.qrTitle')}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="qr-modal-content">
          <div className="qr-code-container">
            <QRCode value={qrString} size={256} />
          </div>
          <div className="qr-instructions">
            <h4>{t('whatsapp.qrInstructions.title')}</h4>
            <ol>
              <li>{t('whatsapp.qrInstructions.step1')}</li>
              <li>{t('whatsapp.qrInstructions.step2')}</li>
              <li>{t('whatsapp.qrInstructions.step3')}</li>
              <li>{t('whatsapp.qrInstructions.step4')}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRCodeDisplay;