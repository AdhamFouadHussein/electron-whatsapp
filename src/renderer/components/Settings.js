import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, changeTheme } = useTheme();

  const handleLanguageChange = async (lang) => {
    await window.api.settings.setLanguage(lang);
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="card">
      <h2>{t('settings.title')}</h2>
      
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
  );
}

export default Settings;
