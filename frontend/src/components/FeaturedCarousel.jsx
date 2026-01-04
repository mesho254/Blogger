import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import BlogCard from './BlogCard';
import { useTheme, styles } from '../styles/theme';

function FeaturedCarousel() {
  const { data: featured } = useQuery({
    queryKey: ['featured'],
    queryFn: () => api.get('/blogs/featured').then((res) => res.data),
  });

  const theme = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        overflowX: 'auto',
        padding: styles.padding,
        background: theme.background,
      }}
    >
      {featured?.map((blog) => (
        <div key={blog._id} style={{ minWidth: '300px', marginRight: styles.margin }}>
          <BlogCard blog={blog} />
        </div>
      ))}
    </div>
  );
}

export default FeaturedCarousel;