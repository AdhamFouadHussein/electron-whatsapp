import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Events from './components/Events';
import Reminders from './components/Reminders';
import Templates from './components/Templates';
import MessageLogs from './components/MessageLogs';
import WhatsAppManager from './components/WhatsAppManager';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import QRCodeDisplay from './components/QRCodeDisplay';
import './styles/App.css';

function AppContent() {
  const { t, i18n } = useTranslation();
  const [currentView, setCurrentView] = useState('dashboard');
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    // Load language preference
    const loadLanguage = async () => {
      try {
        const savedLanguage = await window.api.settings.getLanguage();
        i18n.changeLanguage(savedLanguage);
        document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
      } catch (error) {
        console.error('Failed to load language:', error);
      }
    };

    loadLanguage();

    // Load WhatsApp status
    const loadWhatsAppStatus = async () => {
      try {
        const status = await window.api.whatsapp.getStatus();
        setWhatsappStatus(status);
      } catch (error) {
        console.error('Failed to load WhatsApp status:', error);
      }
    };

    loadWhatsAppStatus();

    // Listen for WhatsApp status changes
    window.api.whatsapp.onStatusChange((status) => {
      setWhatsappStatus(status);
      // Clear QR code when connected
      if (status === 'connected') {
        setQrCode(null);
      }
    });

    // Listen for QR code updates
    window.api.whatsapp.onQRCode((qr) => {
      setQrCode(qr);
    });
  }, [i18n]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard setCurrentView={setCurrentView} />;
      case 'users':
        return <Users />;
      case 'events':
        return <Events />;
      case 'reminders':
        return <Reminders />;
      case 'templates':
        return <Templates />;
      case 'logs':
        return <MessageLogs />;
      case 'whatsapp':
        return <WhatsAppManager />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="app">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="main-content">
        <Header whatsappStatus={whatsappStatus} />
        <div className="content-area">
          {renderView()}
        </div>
      </div>
      
      {/* QR Code Modal */}
      {qrCode && (
        <QRCodeDisplay 
          qrString={qrCode} 
          onClose={() => setQrCode(null)} 
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
