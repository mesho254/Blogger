import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useState } from 'react';
import { useTheme, styles } from '../styles/theme';
import { useAuth } from '../hooks/useAuth';

function FollowButton({ userId }) {
  const theme = useTheme();
  const [followed, setFollowed] = useState(false);
  const { data: currentUser } = useAuth();

  const mutation = useMutation({
    mutationFn: () => api.post(`/users/${userId}/follow`),
    onSuccess: () => setFollowed(!followed),
  });

  // Don't render the button if it's the current user's profile
  if (currentUser?._id === userId) {
    return null;
  }

  return (
    <button 
      onClick={mutation.mutate} 
      style={{ 
        ...styles.buttonStyle, 
        background: followed ? styles.secondaryColor : styles.primaryColor 
      }}
    >
      {followed ? 'Unfollow' : 'Follow'}
    </button>
  );
}

export default FollowButton;