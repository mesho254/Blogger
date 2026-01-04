import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1100 }}>
          <button onClick={() => this.setState({ hasError: false })} style={{ padding: '8px 12px' }}>Open Chat</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
