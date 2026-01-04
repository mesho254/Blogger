import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useState } from 'react';
import { useTheme, styles } from '../styles/theme';

function CommentList({ blogId }) {
  const theme = useTheme();
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', blogId],
    queryFn: () => api.get(`/comments/blogs/${blogId}/comments`).then((res) => res.data),
  });
  const [newComment, setNewComment] = useState('');

  const mutation = useMutation({
    mutationFn: (content) => api.post(`/comments/blogs/${blogId}/comments`, { content }),
    onSuccess: () => {
      setNewComment('');
      // Invalidate comments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['comments', blogId] });
    },
  });

  const queryClient = useQueryClient();

  if (isLoading) return <div>Loading comments...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div style={{ marginTop: styles.margin }}>
      <h3>Comments</h3>
      {comments?.map((comment) => (
        <div key={comment._id} style={{ padding: styles.padding, borderBottom: '1px solid #ddd' }}>
          <p>{comment.content}</p>
          {/* Replies, reactions */}
        </div>
      ))}
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        style={{ width: '100%', minHeight: '100px' }}
        placeholder="Write a comment..."
      />
      <button
        onClick={() => mutation.mutate(newComment)}
        style={styles.buttonStyle}
        disabled={!newComment.trim() || mutation.isLoading}
      >
        Post Comment
      </button>
    </div>
  );
}

export default CommentList;