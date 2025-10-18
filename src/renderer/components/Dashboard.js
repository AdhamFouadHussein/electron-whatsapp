import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUsers, FiCalendar, FiBell, FiMessageSquare, FiRefreshCw, FiUserPlus, FiGift } from 'react-icons/fi';

function Dashboard({ setCurrentView }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    upcomingEvents: 0,
    pendingReminders: 0,
    messagesSent: 0,
    upcomingBirthdays: 0
  });
  const [loading, setLoading] = useState(true);
  const [birthdays, setBirthdays] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Load users
      const users = await window.api.db.getUsers();
      
      // Load events
      const events = await window.api.db.getEvents();
      const now = new Date();
      const upcomingEvents = events.filter(e => new Date(e.event_date) > now);
      
      // Load reminders
      const reminders = await window.api.db.getReminders('pending');
      
      // Load today's message logs
      const logs = await window.api.db.getMessageLogs();
      const today = new Date().toDateString();
      const todayLogs = logs.filter(log => 
        new Date(log.sent_at).toDateString() === today && log.status === 'sent'
      );

      // Load upcoming birthdays (next 7 days)
      const upcomingBirthdays = await window.api.db.getUpcomingBirthdays(7);
      setBirthdays(upcomingBirthdays.slice(0, 3)); // Show only top 3

      setStats({
        totalUsers: users.length,
        upcomingEvents: upcomingEvents.length,
        pendingReminders: reminders.length,
        messagesSent: todayLogs.length,
        upcomingBirthdays: upcomingBirthdays.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h2 className="page-title">{t('dashboard.title')}</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <FiUsers className="stat-icon" />
          <div className="stat-label">{t('dashboard.totalUsers')}</div>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        
        <div className="stat-card">
          <FiCalendar className="stat-icon" />
          <div className="stat-label">{t('dashboard.upcomingEvents')}</div>
          <div className="stat-value">{stats.upcomingEvents}</div>
        </div>
        
        <div className="stat-card">
          <FiBell className="stat-icon" />
          <div className="stat-label">{t('dashboard.pendingReminders')}</div>
          <div className="stat-value">{stats.pendingReminders}</div>
        </div>
        
        <div className="stat-card">
          <FiMessageSquare className="stat-icon" />
          <div className="stat-label">{t('dashboard.messagesSent')}</div>
          <div className="stat-value">{stats.messagesSent}</div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('birthdays')}>
          <FiGift className="stat-icon" style={{ color: '#ff6b6b' }} />
          <div className="stat-label">Upcoming Birthdays (7 days)</div>
          <div className="stat-value">{stats.upcomingBirthdays}</div>
        </div>
      </div>

      {birthdays.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiGift style={{ fontSize: '20px', color: '#ff6b6b' }} />
              <h3 className="card-title">Upcoming Birthdays</h3>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setCurrentView('birthdays')}
            >
              View All
            </button>
          </div>
          <div style={{ padding: '10px' }}>
            {birthdays.map((user) => (
              <div 
                key={user.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: user.days_until === 0 ? '#fff9e6' : '#f8f9fa',
                  border: user.days_until === 0 ? '2px solid #ffd700' : '1px solid #dee2e6',
                  borderRadius: '6px'
                }}
              >
                <div>
                  <strong>{user.name}</strong>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>
                    📅 {new Date(user.date_of_birth).toLocaleDateString()} • 📞 {user.phone}
                  </div>
                </div>
                <div style={{
                  padding: '6px 12px',
                  backgroundColor: user.days_until === 0 ? '#ff6b6b' : '#17a2b8',
                  color: 'white',
                  borderRadius: '15px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {user.days_until === 0 ? '🎂 Today!' : user.days_until === 1 ? 'Tomorrow' : `in ${user.days_until} days`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t('dashboard.quickActions')}</h3>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setCurrentView('users')}
            title={t('dashboard.addUserHint')}
          >
            <FiUserPlus style={{ marginRight: '5px' }} /> {t('dashboard.addUser')}
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setCurrentView('events')}
            title={t('dashboard.scheduleEventHint')}
          >
            <FiCalendar style={{ marginRight: '5px' }} /> {t('dashboard.scheduleEvent')}
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setCurrentView('reminders')}
            title={t('dashboard.createReminderHint')}
          >
            <FiBell style={{ marginRight: '5px' }} /> {t('dashboard.createReminder')}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={loadStats}
            title={t('dashboard.refreshHint')}
          >
            <FiRefreshCw style={{ marginRight: '5px' }} /> {t('dashboard.refresh')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
