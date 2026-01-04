import { createContext, useContext } from 'react';

export const styles = {
  titleSize: '2.5rem',
  subtitleSize: '1.5rem',
  fontFamily: "'Inter', sans-serif",
  primaryColor: '#007bff',
  secondaryColor: '#6c757d',
  backgroundLight: '#ffffff',
  backgroundDark: '#1e1e1e',
  textLight: '#000000',
  textDark: '#ffffff',
  cardShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  borderRadius: '8px',
  padding: '1rem',
  margin: '1rem',
  buttonStyle: {
    backgroundColor: '#007bff',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  // Add more tokens as needed
};

const ThemeContext = createContext();

export const ThemeProvider = ({ theme, children }) => {
  const themeStyles = theme === 'dark'
    ? {
        background: styles.backgroundDark,
        color: styles.textDark,
        cardBackground: '#2c2c2c',
      }
    : {
        background: styles.backgroundLight,
        color: styles.textLight,
        cardBackground: '#f8f9fa',
      };
  return <ThemeContext.Provider value={themeStyles}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);