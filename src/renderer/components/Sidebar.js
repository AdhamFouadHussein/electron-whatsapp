import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiHome, FiUsers, FiCalendar, FiBell, FiFileText, FiList, FiSettings } from 'react-icons/fi';

function Sidebar({ currentView, setCurrentView }) {
  const { t } = useTranslation();

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: FiHome },
    { id: 'users', label: t('nav.users'), icon: FiUsers },
    { id: 'events', label: t('nav.events'), icon: FiCalendar },
    { id: 'reminders', label: t('nav.reminders'), icon: FiBell },
    { id: 'templates', label: t('nav.templates'), icon: FiFileText },
    { id: 'logs', label: t('nav.logs'), icon: FiList },
    { id: 'settings', label: t('nav.settings'), icon: FiSettings }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>WhatsApp Reminders</h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              className={`sidebar-nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <IconComponent size={20} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;
