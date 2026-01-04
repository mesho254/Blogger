import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BlogCreate from './pages/BlogCreate';
import BlogDetail from './pages/BlogDetail';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Donate from './pages/Donate';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import BlogList from './pages/BlogList';
import { useState } from 'react';
import { ThemeProvider } from './styles/theme';
import ChatWidget from './components/ChatWidget';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute'; // Adjust path

function App() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeProvider theme={theme}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavBar setTheme={setTheme} />
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Public auth routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset/:token" element={<ResetPassword />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/blogs/create" element={<BlogCreate />} />
              <Route path="/blogs/:id" element={<BlogDetail />} />
              <Route path="/blogs/:id/edit" element={<BlogCreate editMode />} />
              <Route path="/blogs" element={<BlogList />} />
              <Route path="/authors/:userId" element={<Profile />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin/*" element={<AdminPanel />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/donate" element={<Donate />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
      <ErrorBoundary>
        <ChatWidget />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;