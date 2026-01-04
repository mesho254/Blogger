import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { MdBookmark, MdBookmarkBorder } from 'react-icons/md';
import { useState } from 'react';

function BookmarkButton({ blogId, initialBookmarked = false }) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post(`/blogs/${blogId}/bookmark`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['blog', blogId] });
      const previous = queryClient.getQueryData(['blog', blogId]);
      queryClient.setQueryData(['blog', blogId], (old) => ({
        ...old,
        bookmarksCount: bookmarked ? (old?.bookmarksCount || 0) - 1 : (old?.bookmarksCount || 0) + 1,
      }));
      setBookmarked(!bookmarked);
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['blog', blogId], context.previous);
      setBookmarked(initialBookmarked); // Revert local state on error
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['blog', blogId] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return (
    <span onClick={() => mutation.mutate()} style={{ cursor: 'pointer' }}>
      {bookmarked ? <MdBookmark style={{ color: 'blue' }} /> : <MdBookmarkBorder />}
    </span>
  );
}

export default BookmarkButton;