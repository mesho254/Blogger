import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTheme, styles } from '../../styles/theme';

function Register() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: (body) => api.post('/auth/register', body),
    onSuccess: () => {
      toast.success('Registered');
      navigate('/auth/login');
    },
  });

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: styles.padding, background: theme.background }}>
      <h2>Register</h2>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ width: '100%', marginBottom: styles.margin }} />
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" style={{ width: '100%', marginBottom: styles.margin }} />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', marginBottom: styles.margin }} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', marginBottom: styles.margin }} />
      <button onClick={() => mutation.mutate({ name, username, email, password })} style={styles.buttonStyle}>Register</button>
    </div>
  );
}

export default Register;