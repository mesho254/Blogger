import ChatWidget from '../components/ChatWidget';
import ErrorBoundary from '../components/ErrorBoundary';
import { useTheme } from '../styles/theme';

function Messages() {
  const theme = useTheme();
  return (
    <div style={{ height: '100vh', background: theme.background }}>
      <ErrorBoundary>
        <ChatWidget /> {/* Expanded full page */}
      </ErrorBoundary>
    </div>
  );
}

export default Messages;