import { useLocation } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../services/api';
import BlogCard from '../components/BlogCard';
import AdSlot from '../components/AdSlot';
import { useEffect, useRef } from 'react';
import { useTheme, styles } from '../styles/theme';

function BlogList() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const q = queryParams.get('q');
  const category = queryParams.get('category');
  const sort = queryParams.get('sort') || 'newest';

  const theme = useTheme();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useInfiniteQuery(
    ['blogs', q, category, sort],
    ({ pageParam = 0 }) => api.get(`/blogs?limit=20&cursor=${pageParam}&q=${q}&category=${category}&sort=${sort}`).then((res) => res.data),
    {
      getNextPageParam: (lastPage, pages) => {
        // Use an offset cursor (total loaded) to keep cursor numeric and avoid duplicates
        const totalLoaded = pages.reduce((sum, p) => sum + (p?.length || 0), 0);
        return lastPage.length === 20 ? totalLoaded : undefined;
      },
    }
  );

  const observerRef = useRef();
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{ background: theme.background }}>
      <h2>Blogs</h2>
      {/* Filters */}
      <select value={category} onChange={() => {/* update params */}}>
        <option>All Categories</option>
      </select>
      <select value={sort} onChange={() => {/* update params */}}>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: styles.margin }}>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: styles.margin }}>
            {(() => {
              const flat = data?.pages?.flat() || [];
              const seen = new Set();
              const unique = [];
              for (const b of flat) {
                if (!b || !b._id) continue;
                if (seen.has(b._id)) continue;
                seen.add(b._id);
                unique.push(b);
              }
              return unique.map((blog) => <BlogCard key={blog._id} blog={blog} />);
            })()}
          </div>
        </div>
        <aside style={{ padding: styles.padding }}>
          <AdSlot position="sidebar" />
        </aside>
      </div>
      <div ref={observerRef} />
    </div>
  );
}

export default BlogList;