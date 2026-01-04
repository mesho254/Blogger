import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import { useTheme, styles } from '../styles/theme';
import { FiBell } from 'react-icons/fi';

function NotificationBell() {
  const theme = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL, { auth: { token } });

    const handler = (notif) => setNotifications((prev) => [...prev, notif]);
    socket.on('notification:receive', handler);

    socket.on('connect_error', (err) => console.warn('Notification socket error', err));

    return () => {
      try {
        socket.off('notification:receive', handler);
        socket.disconnect();
      } catch (e) {
        console.warn('Notification socket cleanup failed', e);
      }
    };
  }, []);

  useEffect(() => {
    const onLogout = () => {
      try {
        // no-op: cleanup handled by above return when component unmounts, but ensure disconnect
        // If socket is still open, disconnect it by creating a temporary socket and disconnecting
      } catch (e) {
        console.warn('Error on notification logout cleanup', e);
      }
    };
    window.addEventListener('app:logout', onLogout);
    return () => window.removeEventListener('app:logout', onLogout);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <FiBell onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer', fontSize: '1.5rem', color: theme.color }} />
      {notifications.length > 0 && (
        <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', padding: '0.2rem 0.5rem' }}>
          {notifications.length}
        </span>
      )}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '2rem',
            right: 0,
            background: theme.cardBackground,
            boxShadow: styles.cardShadow,
            borderRadius: styles.borderRadius,
            width: '300px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {notifications.map((notif, i) => (
            <div key={i} style={{ padding: styles.padding, borderBottom: '1px solid #ddd' }}>
              {notif.type}: {notif.data}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;