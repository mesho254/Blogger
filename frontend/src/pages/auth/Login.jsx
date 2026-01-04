import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTheme, styles } from '../../styles/theme';

function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: (body) => api.post('/auth/login', body),
    onSuccess: (response) => {
      localStorage.setItem('jwt', response.data.token); // Adjust if token is at response.data.access_token or similar
      queryClient.removeQueries({ queryKey: ['user'] }); // Clear any persisted error state
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Logged in');
      navigate('/');
    },
  });

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: styles.padding, background: theme.background }}>
      <h2>Login</h2>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', marginBottom: styles.margin }} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', marginBottom: styles.margin }} />
      <button onClick={() => mutation.mutate({ email, password })} style={styles.buttonStyle}>Login</button>
      <button onClick={() => navigate('/auth/register')} style={styles.buttonStyle}>Register</button>
    </div>
  );
}

export default Login;