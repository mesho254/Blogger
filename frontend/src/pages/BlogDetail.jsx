import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import BlogView from '../components/BlogView';
import CommentList from '../components/CommentList';
import LikeButton from '../components/LikeButton';
import BookmarkButton from '../components/BookmarkButton';
import AdSlot from '../components/AdSlot';
import FollowButton from '../components/FollowButton';
import { useEffect } from 'react';
import { useTheme, styles } from '../styles/theme';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function BlogDetail() {
  const { id } = useParams();
  const theme = useTheme();
  const { data: blog, isLoading, error } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => api.get(`/blogs/${id}`).then((res) => res.data),
  });
  const { data: me } = useAuth();

  useEffect(() => {
    // increment view count once per session for this blog id
    try {
      const key = `viewed:${id}`;
      if (!sessionStorage.getItem(key)) {
        // fire-and-forget, don't await to avoid blocking render
        api.post(`/blogs/${id}/view`).catch((e) => console.warn('view increment failed', e));
        sessionStorage.setItem(key, '1');
      }
    } catch {
      // sessionStorage might be unavailable in some environments
      api.post(`/blogs/${id}/view`).catch((err) => console.warn('view increment failed', err));
    }
  }, [id]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!blog) return <div>No blog found</div>;

  return (
    <div style={{ maxWidth: '800px', margin: 'auto', padding: styles.padding, background: theme.background }}>
      <BlogView content={blog.contentJson} blog={blog} />
      <div style={{ display: 'flex', gap: '1rem', marginBottom: styles.margin }}>
        <LikeButton blogId={id} initialLiked={!!blog.isLiked} />
        <BookmarkButton blogId={id} initialBookmarked={!!blog.isBookmarked} />
        <FollowButton userId={blog.authorId?._id || blog.authorId} />
        {/* Edit button for post owner or admin */}
        {(me && (me._id === (blog.authorId?._id || blog.authorId) || me.role === 'admin')) && (
          <Link to={`/blogs/${id}/edit`} style={{ ...styles.buttonStyle }}>Edit</Link>
        )}
      </div>
      <AdSlot position="inline" />
      <CommentList blogId={id} />
    </div>
  );
}

export default BlogDetail;