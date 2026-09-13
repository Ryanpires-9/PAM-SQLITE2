import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Cores inspiradas no Microsoft Fluent Design (Microsoft Store)
  const colors = isDark
    ? {
        isDark: true,
        bg: '#080c14',
        bgSecondary: '#0f1728',
        card: '#141e34',
        cardBorder: '#223150',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        textSubtle: '#64748b',
        accent: '#0078d4', // Microsoft Fluent Blue
        accentHover: '#1084d8',
        accentLight: 'rgba(0, 120, 212, 0.15)',
        surfaceHover: '#1a2744',
        badgeBg: '#1e293b',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        modalOverlay: 'rgba(0, 0, 0, 0.78)',
        // Gradiente de dispersão de luz inspirado exatamente na imagem de referência
        lightDispersionGradient: ['#030712', '#0d2855', '#1b4f91', '#3b7bc4', '#dbeafe']
      }
    : {
        isDark: false,
        bg: '#f3f5f9',
        bgSecondary: '#ffffff',
        card: '#ffffff',
        cardBorder: '#e2e8f0',
        text: '#0f172a',
        textMuted: '#475569',
        textSubtle: '#94a3b8',
        accent: '#0078d4',
        accentHover: '#006cc1',
        accentLight: 'rgba(0, 120, 212, 0.08)',
        surfaceHover: '#f1f5f9',
        badgeBg: '#f1f5f9',
        success: '#10b981',
        warning: '#d97706',
        danger: '#dc2626',
        modalOverlay: 'rgba(15, 23, 42, 0.65)',
        // Versão clara do gradiente de dispersão
        lightDispersionGradient: ['#0d2855', '#1b4f91', '#3b7bc4', '#93c5fd', '#ffffff']
      };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

