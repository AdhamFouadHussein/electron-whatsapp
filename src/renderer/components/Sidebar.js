import React from 'react';
import { useTranslation } from 'react-i18next';

function Sidebar({ currentView, setCurrentView }) {
  const { t } = useTranslation();

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: '📊' },
    { id: 'users', label: t('nav.users'), icon: '👥' },
    { id: 'events', label: t('nav.events'), icon: '📅' },
    { id: 'reminders', label: t('nav.reminders'), icon: '⏰' },
    { id: 'templates', label: t('nav.templates'), icon: '📝' },
    { id: 'logs', label: t('nav.logs'), icon: '📋' },
    { id: 'settings', label: t('nav.settings'), icon: '⚙️' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>WhatsApp Reminders</h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
