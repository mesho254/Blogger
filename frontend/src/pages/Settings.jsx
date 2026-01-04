import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import FileUploader from '../components/FileUploader';
import { toast } from 'react-toastify';
import { useTheme, styles } from '../styles/theme';

function Settings() {
  const { data: user, refetch } = useAuth();
  const theme = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  const mutation = useMutation({
    mutationFn: (body) => api.put(`/users/${user._id}`, body),
    onSuccess: () => {
      toast.success('Settings updated');
      refetch();
    },
  });

  const handleSubmit = () => mutation.mutate({ name, bio, avatarUrl });

  return (
    <div style={{ padding: styles.padding, background: theme.background }}>
      <h2>Account Settings</h2>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ width: '100%', marginBottom: styles.margin }} />
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" style={{ width: '100%', minHeight: '100px', marginBottom: styles.margin }} />
      <FileUploader onUpload={setAvatarUrl} />
      {avatarUrl && <img src={avatarUrl} alt="Avatar" style={{ width: '100px', borderRadius: '50%', marginBottom: styles.margin }} />}
      <button onClick={handleSubmit} style={styles.buttonStyle}>Save</button>
      {/* Email, notifications */}
    </div>
  );
}

export default Settings;