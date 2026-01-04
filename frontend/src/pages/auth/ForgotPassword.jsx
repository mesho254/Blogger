import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useTheme, styles } from '../../styles/theme';

function ForgotPassword() {
  const theme = useTheme();
  const [email, setEmail] = useState('');

  const mutation = useMutation((body) => api.post('/auth/forgot-password', body), {
    onSuccess: () => toast.success('Reset email sent'),
  });

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: styles.padding, background: theme.background }}>
      <h2>Forgot Password</h2>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', marginBottom: styles.margin }} />
      <button onClick={() => mutation.mutate({ email })} style={styles.buttonStyle}>Send Reset Link</button>
    </div>
  );
}

export default ForgotPassword;