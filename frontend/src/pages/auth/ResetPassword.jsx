import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useTheme, styles } from '../../styles/theme';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [password, setPassword] = useState('');

  const mutation = useMutation((body) => api.post('/auth/reset-password', body), {
    onSuccess: () => {
      toast.success('Password reset');
      navigate('/auth/login');
    },
  });

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: styles.padding, background: theme.background }}>
      <h2>Reset Password</h2>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" style={{ width: '100%', marginBottom: styles.margin }} />
      <button onClick={() => mutation.mutate({ token, password })} style={styles.buttonStyle}>Reset</button>
    </div>
  );
}

export default ResetPassword;