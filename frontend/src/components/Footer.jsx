import { useTheme, styles } from '../styles/theme';

function Footer() {
  const theme = useTheme();
  return (
    <footer
      style={{
        background: theme.cardBackground,
        padding: styles.padding,
        textAlign: 'center',
        boxShadow: styles.cardShadow,
      }}
    >
      <p style={{ color: theme.color }}>&copy; 2025 Blog Platform. All rights reserved.</p>
      <p>
        <a href="/donate" style={{ color: '#0b74de' }}>Donate</a>
      </p>
    </footer>
  );
}

export default Footer;