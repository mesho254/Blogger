import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import { useState } from 'react';

function LikeButton({ blogId, initialLiked = false }) {
  const [liked, setLiked] = useState(initialLiked);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post(`/blogs/${blogId}/like`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['blog', blogId] });
      const previous = queryClient.getQueryData(['blog', blogId]);
      queryClient.setQueryData(['blog', blogId], (old) => ({
        ...old,
        likesCount: liked ? (old?.likesCount || 0) - 1 : (old?.likesCount || 0) + 1,
      }));
      setLiked(!liked);
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['blog', blogId], context.previous);
      setLiked(initialLiked); // Revert local state on error
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['blog', blogId] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return (
    <span onClick={() => mutation.mutate()} style={{ cursor: 'pointer' }}>
      {liked ? <MdFavorite style={{ color: 'red' }} /> : <MdFavoriteBorder />}
    </span>
  );
}

export default LikeButton;