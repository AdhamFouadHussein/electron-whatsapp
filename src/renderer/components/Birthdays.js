import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiGift, FiSend, FiRefreshCw, FiCalendar, FiUser } from 'react-icons/fi';

function Birthdays() {
  const { t } = useTranslation();
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});
  const [daysAhead, setDaysAhead] = useState(30);
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');

  useEffect(() => {
    loadBirthdays();
    checkWhatsAppStatus();
  }, [daysAhead]);

  const loadBirthdays = async () => {
    try {
      setLoading(true);
      const data = await window.api.db.getUpcomingBirthdays(daysAhead);
      setBirthdays(data);
    } catch (error) {
      console.error('Failed to load birthdays:', error);
      alert('Failed to load birthdays: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkWhatsAppStatus = async () => {
    try {
      const status = await window.api.whatsapp.getStatus();
      setWhatsappStatus(status);
    } catch (error) {
      console.error('Failed to check WhatsApp status:', error);
    }
  };

  const sendBirthdayWish = async (user) => {
    if (whatsappStatus !== 'connected') {
      alert(t('birthdays.whatsappNotConnected'));
      return;
    }

    if (!confirm(t('birthdays.confirmSend', { name: user.name }))) {
      return;
    }

    try {
      setSending({ ...sending, [user.id]: true });
      await window.api.whatsapp.sendBirthdayWish(user.id);
      alert(t('birthdays.sentSuccess', { name: user.name }));
    } catch (error) {
      console.error('Failed to send birthday wish:', error);
      alert(t('birthdays.sentError', { name: user.name, error: error.message }));
    } finally {
      setSending({ ...sending, [user.id]: false });
    }
  };

  const formatDaysUntil = (days) => {
    if (days === 0) {
      return t('birthdays.today');
    } else if (days === 1) {
      return t('birthdays.tomorrow');
    } else {
      return t('birthdays.inDays', { days });
    }
  };

  const getBirthdayClass = (days) => {
    if (days === 0) return 'birthday-today';
    if (days <= 7) return 'birthday-soon';
    return '';
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiGift style={{ fontSize: '24px', color: '#ff6b6b' }} />
            <h2 className="card-title">{t('birthdays.title')}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ marginRight: '5px' }}>{t('birthdays.showNext')}</label>
            <select 
              className="form-select" 
              style={{ width: 'auto', minWidth: '100px' }}
              value={daysAhead}
              onChange={(e) => setDaysAhead(parseInt(e.target.value))}
            >
              <option value="7">7 {t('birthdays.days')}</option>
              <option value="14">14 {t('birthdays.days')}</option>
              <option value="30">30 {t('birthdays.days')}</option>
              <option value="60">60 {t('birthdays.days')}</option>
              <option value="90">90 {t('birthdays.days')}</option>
            </select>
            <button className="btn btn-secondary" onClick={loadBirthdays}>
              <FiRefreshCw style={{ marginRight: '5px' }} /> {t('common.refresh')}
            </button>
          </div>
        </div>

        {whatsappStatus !== 'connected' && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffc107',
            borderRadius: '4px',
            marginBottom: '15px',
            color: '#856404'
          }}>
            ⚠️ {t('birthdays.whatsappWarning')}
          </div>
        )}

        {birthdays.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <FiCalendar style={{ fontSize: '48px', marginBottom: '10px' }} />
            <p>{t('birthdays.noBirthdays')}</p>
          </div>
        ) : (
          <div className="birthday-list">
            {birthdays.map((user) => (
              <div 
                key={user.id} 
                className={`birthday-card ${getBirthdayClass(user.days_until)}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: user.days_until === 0 ? '#fff9e6' : '#f8f9fa',
                  border: user.days_until === 0 ? '2px solid #ffd700' : '1px solid #dee2e6',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: user.days_until === 0 ? '#ffd700' : '#6c757d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px'
                  }}>
                    {user.days_until === 0 ? '🎂' : <FiUser />}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      marginBottom: '5px'
                    }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {user.name}
                      </h3>
                      {user.days_until === 0 && (
                        <span style={{
                          backgroundColor: '#ff6b6b',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {t('birthdays.today').toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '20px',
                      fontSize: '14px',
                      color: '#6c757d'
                    }}>
                      <span>📅 {new Date(user.date_of_birth).toLocaleDateString()}</span>
                      <span>📞 {user.phone}</span>
                      <span>🌐 {user.preferred_language === 'ar' ? 'العربية' : 'English'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    padding: '8px 15px',
                    backgroundColor: user.days_until === 0 ? '#ff6b6b' : '#17a2b8',
                    color: 'white',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    minWidth: '120px',
                    textAlign: 'center'
                  }}>
                    {formatDaysUntil(user.days_until)}
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={() => sendBirthdayWish(user)}
                    disabled={sending[user.id] || whatsappStatus !== 'connected'}
                    style={{ minWidth: '120px' }}
                  >
                    {sending[user.id] ? (
                      <>
                        <span className="spinner-small"></span> {t('birthdays.sending')}
                      </>
                    ) : (
                      <>
                        <FiSend style={{ marginRight: '5px' }} /> {t('birthdays.sendWish')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">{t('birthdays.howItWorks')}</h3>
        </div>
        <div style={{ padding: '15px' }}>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>{t('birthdays.step1')}</li>
            <li>{t('birthdays.step2')}</li>
            <li>{t('birthdays.step3')}</li>
            <li>{t('birthdays.step4')}</li>
          </ol>
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#e7f3ff',
            borderLeft: '4px solid #2196F3',
            borderRadius: '4px'
          }}>
            <strong>💡 {t('birthdays.tip')}</strong> {t('birthdays.tipText')}
          </div>
        </div>
      </div>

      <style jsx>{`
        .birthday-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .spinner-small {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Birthdays;
