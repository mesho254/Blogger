import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useTheme, styles } from '../styles/theme';
import {
  LineChart,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useState } from 'react';
import { toast } from 'react-toastify';

function AdminPanel() {
  const theme = useTheme();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get('/admin/stats').then((res) => res.data),
  });

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.get('/admin/users').then((res) => res.data),
  });

  const { data: posts, isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ['adminPosts'],
    queryFn: () => api.get('/admin/posts').then((res) => res.data),
  });

  const { data: comments, isLoading: commentsLoading, error: commentsError } = useQuery({
    queryKey: ['adminComments'],
    queryFn: () => api.get('/admin/comments').then((res) => res.data),
  });

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: () => api.get('/admin/analytics').then((res) => res.data),
  });

  const [adPositions, setAdPositions] = useState(['top', 'inline', 'sidebar']); // Example

  const banMutation = useMutation({
    mutationFn: (userId) => api.put(`/admin/users/${userId}/role`, { role: 'banned' }),
    onSuccess: () => toast.success('User banned'),
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => api.delete(`/admin/posts/${postId}`),
    onSuccess: () => toast.success('Post deleted'),
  });

  const featurePostMutation = useMutation({
    mutationFn: (postId) => api.put(`/admin/posts/${postId}/feature`),
    onSuccess: () => toast.success('Post featured'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/admin/comments/${commentId}`),
    onSuccess: () => toast.success('Comment deleted'),
  });

  const updateAdsMutation = useMutation({
    mutationFn: (positions) => api.put('/admin/ads', { positions }),
    onSuccess: () => toast.success('Ads updated'),
  });

  const handleUpdateAds = () => updateAdsMutation.mutate(adPositions);

  // Sample analytics data if not fetched
  const dailyActiveUsers = analytics?.dailyActiveUsers || [
    { date: '2025-10-01', count: 10 },
    { date: '2025-10-02', count: 20 },
    { date: '2025-10-03', count: 15 },
    // ...
  ];

  const postMetrics = analytics?.postMetrics || [
    { name: 'Posts Created', value: 50 },
    { name: 'Likes', value: 200 },
    { name: 'Comments', value: 100 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Optional: Render loading or error states
  if (statsLoading || usersLoading || postsLoading || commentsLoading || analyticsLoading) {
    return <div>Loading...</div>;
  }
  if (statsError || usersError || postsError || commentsError || analyticsError) {
    return <div>Error loading data</div>;
  }

  return (
    <div
      style={{
        padding: styles.padding,
        background: theme.background,
        minHeight: '100vh',
        color: theme.color,
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: styles.margin }}>Admin Panel</h2>

      {/* Analytics Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: styles.margin,
          marginBottom: styles.margin * 2,
        }}
      >
        <div
          style={{
            background: theme.cardBackground,
            borderRadius: styles.borderRadius,
            boxShadow: styles.cardShadow,
            padding: styles.padding,
          }}
        >
          <h3>Key Stats</h3>
          <p>Users: {stats?.users || 0}</p>
          <p>Posts: {stats?.posts || 0}</p>
          <p>Active Users: {stats?.activeUsers || 0}</p>
          {/* Add more */}
        </div>

        <div
          style={{
            background: theme.cardBackground,
            borderRadius: styles.borderRadius,
            boxShadow: styles.cardShadow,
            padding: styles.padding,
          }}
        >
          <h3>Daily Active Users</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyActiveUsers} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke={styles.primaryColor} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            background: theme.cardBackground,
            borderRadius: styles.borderRadius,
            boxShadow: styles.cardShadow,
            padding: styles.padding,
          }}
        >
          <h3>Post Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={postMetrics} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {postMetrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Management */}
      <div
        style={{
          background: theme.cardBackground,
          borderRadius: styles.borderRadius,
          boxShadow: styles.cardShadow,
          padding: styles.padding,
          marginBottom: styles.margin * 2,
        }}
      >
        <h3>User Management</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Name</th>
              <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Email</th>
              <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Role</th>
              <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user._id}>
                <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{user.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{user.email}</td>
                <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{user.role}</td>
                <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                  <button
                    onClick={() => banMutation.mutate(user._id)}
                    style={{ ...styles.buttonStyle, background: 'red' }}
                  >
                    Ban
                  </button>
                  {/* Change role dropdown */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Post Management */}
      <div
        style={{
          background: theme.cardBackground,
          borderRadius: styles.borderRadius,
          boxShadow: styles.cardShadow,
          padding: styles.padding,
          marginBottom: styles.margin * 2,
        }}
      >
        <h3>Post Management</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Title</th>
              <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Author</th>
              <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts?.map((post) => (
              <tr key={post._id}>
                <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{post.title}</td>
                <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{post.author.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{post.status}</td>
                <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                  <button
                    onClick={() => deletePostMutation.mutate(post._id)}
                    style={{ ...styles.buttonStyle, background: 'red' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => featurePostMutation.mutate(post._id)}
                    style={styles.buttonStyle}
                  >
                    Feature
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comment Moderation */}
      <div
        style={{
          background: theme.cardBackground,
          borderRadius: styles.borderRadius,
          boxShadow: styles.cardShadow,
          padding: styles.padding,
          marginBottom: styles.margin * 2,
        }}
      >
        <h3>Comment Moderation</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Content</th>
              <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Author</th>
              <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Post</th>
              <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {comments?.map((comment) => (
              <tr key={comment._id}>
                <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{comment.content}</td>
                <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{comment.author.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{comment.blog.title}</td>
                <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                  <button
                    onClick={() => deleteCommentMutation.mutate(comment._id)}
                    style={{ ...styles.buttonStyle, background: 'red' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ads Management */}
      <div
        style={{
          background: theme.cardBackground,
          borderRadius: styles.borderRadius,
          boxShadow: styles.cardShadow,
          padding: styles.padding,
        }}
      >
        <h3>Ads Management</h3>
        <p>Current Positions: {adPositions.join(', ')}</p>
        <input
          type="text"
          value={adPositions.join(', ')}
          onChange={(e) => setAdPositions(e.target.value.split(', '))}
          style={{ width: '100%', marginBottom: styles.margin }}
        />
        <button onClick={handleUpdateAds} style={styles.buttonStyle}>Update Ads</button>
      </div>
    </div>
  );
}

export default AdminPanel;