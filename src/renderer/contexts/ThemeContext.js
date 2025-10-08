import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('auto'); // 'auto', 'light', 'dark'
  const [effectiveTheme, setEffectiveTheme] = useState('light'); // actual theme being applied
  const [systemTheme, setSystemTheme] = useState('light');

  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await window.api.settings.getTheme();
        setTheme(savedTheme);
        
        const sysTheme = await window.api.settings.getSystemTheme();
        setSystemTheme(sysTheme);
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };

    loadTheme();

    // Listen for system theme changes
    window.api.settings.onSystemThemeChange((newTheme) => {
      setSystemTheme(newTheme);
    });
  }, []);

  // Update effective theme when theme or systemTheme changes
  useEffect(() => {
    const newEffectiveTheme = theme === 'auto' ? systemTheme : theme;
    setEffectiveTheme(newEffectiveTheme);
    
    // Update document class
    document.documentElement.className = newEffectiveTheme;
    document.body.className = newEffectiveTheme;
  }, [theme, systemTheme]);

  const changeTheme = async (newTheme) => {
    try {
      await window.api.settings.setTheme(newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, changeTheme, systemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
