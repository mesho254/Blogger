import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Adjust path if useAuth is elsewhere (e.g., '../hooks/useAuth')

function ProtectedRoute() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useAuth();

  useEffect(() => {
    if (!isLoading && (isError || !data)) {
      navigate('/auth/login');
    }
  }, [isLoading, isError, data, navigate]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return <Outlet />;
}

export default ProtectedRoute;