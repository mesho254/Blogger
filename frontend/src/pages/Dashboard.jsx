import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import BlogCard from '../components/BlogCard';
import { useTheme, styles } from '../styles/theme';

function Dashboard() {
  const theme = useTheme();
  const { data: drafts, isLoading, error } = useQuery({
    queryKey: ['drafts'],
    queryFn: () => api.get('/blogs?status=draft').then((res) => res.data),
  });

  return (
    <div style={{ padding: styles.padding, background: theme.background }}>
      <h2>Drafts</h2>
      {isLoading && <div>Loading drafts...</div>}
      {error && <div>Error loading drafts: {error.message}</div>}
      {drafts?.map((blog) => <BlogCard key={blog._id} blog={blog} />)}
      {/* Analytics charts, etc. */}
    </div>
  );
}

export default Dashboard;