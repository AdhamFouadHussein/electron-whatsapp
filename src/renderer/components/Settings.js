import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, changeTheme } = useTheme();
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '',
    database: 'whatsapp_reminder_app'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadDatabaseConfig();
  }, []);

  const loadDatabaseConfig = async () => {
    try {
      setIsLoading(true);
      const config = await window.api.settings.getDatabaseConfig();
      setDbConfig(config);
    } catch (error) {
      console.error('Failed to load database config:', error);
      setMessage({ type: 'error', text: 'Failed to load database configuration' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (lang) => {
    await window.api.settings.setLanguage(lang);
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleDbConfigChange = (field, value) => {
    setDbConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testDatabaseConnection = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      const result = await window.api.settings.testDatabaseConnection(dbConfig);
      
      if (result.success) {
        setMessage({ type: 'success', text: t('settings.connectionSuccess') });
      } else {
        setMessage({ type: 'error', text: `${t('settings.connectionFailed')}: ${result.message}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `${t('settings.connectionFailed')}: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const saveDatabaseSettings = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      await window.api.settings.setDatabaseConfig(dbConfig);
      setMessage({ 
        type: 'success', 
        text: `${t('settings.settingsSaved')} ${t('settings.restartRequired')}` 
      });
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to save settings: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>{t('settings.title')}</h2>
      
      {/* Appearance Settings */}
      <div className="settings-section">
        <h3>{t('settings.appearance')}</h3>
        
        <div className="form-group">
          <label className="form-label">{t('settings.theme')}</label>
          <select className="form-select" value={theme} onChange={(e) => changeTheme(e.target.value)}>
            <option value="auto">{t('settings.themeAuto')}</option>
            <option value="light">{t('settings.themeLight')}</option>
            <option value="dark">{t('settings.themeDark')}</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t('settings.language')}</label>
          <select className="form-select" value={i18n.language} onChange={(e) => handleLanguageChange(e.target.value)}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>

      {/* Database Settings */}
      <div className="settings-section">
        <h3>{t('settings.database')}</h3>
        
        <div className="form-group">
          <label className="form-label">{t('settings.dbHost')}</label>
          <input
            type="text"
            className="form-input"
            value={dbConfig.host}
            onChange={(e) => handleDbConfigChange('host', e.target.value)}
            placeholder="localhost"
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('settings.dbPort')}</label>
          <input
            type="number"
            className="form-input"
            value={dbConfig.port}
            onChange={(e) => handleDbConfigChange('port', e.target.value)}
            placeholder="3306"
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('settings.dbUser')}</label>
          <input
            type="text"
            className="form-input"
            value={dbConfig.user}
            onChange={(e) => handleDbConfigChange('user', e.target.value)}
            placeholder="root"
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('settings.dbPassword')}</label>
          <input
            type="password"
            className="form-input"
            value={dbConfig.password}
            onChange={(e) => handleDbConfigChange('password', e.target.value)}
            placeholder="Enter password"
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('settings.dbName')}</label>
          <input
            type="text"
            className="form-input"
            value={dbConfig.database}
            onChange={(e) => handleDbConfigChange('database', e.target.value)}
            placeholder="whatsapp_reminder_app"
          />
        </div>

        <div className="form-group">
          <div className="button-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={testDatabaseConnection}
              disabled={isLoading}
            >
              {isLoading ? 'Testing...' : t('settings.testConnection')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveDatabaseSettings}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : t('settings.saveSettings')}
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
