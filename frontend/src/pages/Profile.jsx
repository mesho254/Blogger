import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import BlogCard from '../components/BlogCard';
import FollowButton from '../components/FollowButton';
import { useTheme, styles } from '../styles/theme';
import { useState } from 'react';

function Profile() {
  const { userId } = useParams();
  const theme = useTheme();
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.get(`/users/${userId}`).then((res) => res.data),
  });
  const { data: posts } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => api.get(`/blogs?authorId=${userId}`).then((res) => res.data),
  });
  const [tab, setTab] = useState('posts');

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ padding: styles.padding, background: theme.background }}>
      <div style={{ textAlign: 'center' }}>
        <img src={user.avatarUrl} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
        <h1>{user.name}</h1>
        <p>{user.bio}</p>
        <FollowButton userId={userId} />
        <p>Followers: {user.followersCount} | Following: {user.followingCount}</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: styles.margin }}>
        <button onClick={() => setTab('posts')} style={styles.buttonStyle}>Posts</button>
        <button onClick={() => setTab('liked')} style={styles.buttonStyle}>Liked</button>
        <button onClick={() => setTab('bookmarked')} style={styles.buttonStyle}>Bookmarked</button>
        <button onClick={() => setTab('followers')} style={styles.buttonStyle}>Followers</button>
        <button onClick={() => setTab('following')} style={styles.buttonStyle}>Following</button>
      </div>
      <div>
        {tab === 'posts' && posts?.map((blog) => <BlogCard key={blog._id} blog={blog} />)}
        {tab === 'liked' && user?.likedPosts?.length === 0 && <p>No liked posts</p>}
        {tab === 'liked' && (() => {
          const seen = new Set();
          return (user?.likedPosts || []).filter(b => b && b._id && !seen.has(b._id) && seen.add(b._id)).map((blog) => <BlogCard key={blog._id} blog={blog} />);
        })()}
        {tab === 'bookmarked' && user?.bookmarkedPosts?.length === 0 && <p>No bookmarked posts</p>}
        {tab === 'bookmarked' && (() => {
          const seen = new Set();
          return (user?.bookmarkedPosts || []).filter(b => b && b._id && !seen.has(b._id) && seen.add(b._id)).map((blog) => <BlogCard key={blog._id} blog={blog} />);
        })()}
      </div>
    </div>
  );
}

export default Profile;