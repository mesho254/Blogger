import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../services/api';
import BlogCard from '../components/BlogCard';
import FeaturedCarousel from '../components/FeaturedCarousel';
import AdSlot from '../components/AdSlot';
import { useEffect, useRef } from 'react';
import { useTheme, styles } from '../styles/theme';

function Home() {
  const theme = useTheme();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['blogs'],
    queryFn: ({ pageParam = 0 }) => api.get(`/blogs?limit=20&cursor=${pageParam}`).then((res) => res.data),
    getNextPageParam: (lastPage) => (lastPage.length === 20 ? lastPage[lastPage.length - 1]._id : undefined), // Cursor-based
  });

  const observerRef = useRef();
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  if (isLoading) return <div style={{ textAlign: 'center', padding: styles.padding }}>Loading...</div>;

  return (
    <div style={{ background: theme.background, minHeight: '100vh' }}>
  <FeaturedCarousel />
  <AdSlot position="top" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: styles.margin, padding: styles.padding }}>
        {(() => {
          const flat = data?.pages?.flat() || [];
          const seen = new Set();
          const unique = [];
          for (const b of flat) {
            if (!b || !b._id) continue;
            // Skip featured posts here because they're shown in the FeaturedCarousel
            if (b.featured) continue;
            if (seen.has(b._id)) continue;
            seen.add(b._id);
            unique.push(b);
          }
          return unique.map((blog) => <BlogCard key={blog._id} blog={blog} />);
        })()}
      </div>
      <div ref={observerRef} style={{ height: '20px' }} />
    </div>
  );
}

export default Home;