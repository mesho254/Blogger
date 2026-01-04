import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';
import { useTheme, styles } from '../styles/theme';
import { FiSearch, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

function NavBar({ setTheme }) {
  const theme = useTheme();
  const { data: user, isLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery) navigate(`/blogs?q=${searchQuery}`);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      // Clear all possible storage locations
      localStorage.clear(); // Clear all localStorage items
      sessionStorage.clear(); // Clear all sessionStorage items
      // Clear React Query cache
      queryClient.clear();
      // Reset all queries
      queryClient.resetQueries();
      // Invalidate user query specifically
      queryClient.invalidateQueries(['user']);
      // notify other components to cleanup
      window.dispatchEvent(new Event('app:logout'));

      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed. Please try again.');
    }
  };

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  if (isLoading) return null;

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: theme.cardBackground,
        padding: styles.padding,
        boxShadow: styles.cardShadow,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.color }}>
        Blog Platform
      </Link>
      <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search blogs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: styles.borderRadius,
            border: `1px solid ${styles.secondaryColor}`,
            marginRight: '0.5rem',
          }}
        />
        <button type="submit" style={styles.buttonStyle}>
          <FiSearch />
        </button>
      </form>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <NotificationBell />
        {user ? (
          <>
            {/* New Post button for authenticated users */}
            <Link to="/blogs/create" style={{ ...styles.buttonStyle, padding: '0.4rem 0.6rem' }}>
              New Post
            </Link>
            {/* Donate link */}
            <Link to="/donate" style={{ ...styles.buttonStyle, padding: '0.4rem 0.6rem', background: '#0b74de', color: '#fff' }}>
              Donate
            </Link>
            {/* Admin Panel visible only to admin users */}
            {user?.role === 'admin' && (
              <Link to="/admin" style={{ ...styles.buttonStyle, padding: '0.4rem 0.6rem', background: '#222', color: '#fff' }}>
                Admin Panel
              </Link>
            )}
            <Link to={`/authors/${user._id}`}>
              <FiUser style={{ color: theme.color }} />
            </Link>
            <Link to="/settings">
              <FiSettings style={{ color: theme.color }} />
            </Link>
            <button onClick={handleLogout} style={{ ...styles.buttonStyle, background: 'blue' }}>
              <FiLogOut />
            </button>
          </>
        ) : (
          <Link to="/auth/login" style={styles.buttonStyle}>
            Login
          </Link>
        )}
        <button onClick={toggleTheme} style={styles.buttonStyle}>
          Toggle Theme
        </button>
      </div>
    </nav>
  );
}

export default NavBar;
