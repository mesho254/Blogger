import { Link } from 'react-router-dom';
import { useTheme, styles } from '../styles/theme';
import { useAuth } from '../hooks/useAuth';
import { MdFavoriteBorder, MdBookmarkBorder } from 'react-icons/md';

function BlogCard({ blog }) {
  const theme = useTheme();
  const { data: me } = useAuth();
  return (
    <div
      style={{
        background: theme.cardBackground,
        borderRadius: styles.borderRadius,
        boxShadow: styles.cardShadow,
        padding: styles.padding,
        margin: styles.margin,
      }}
    >
      <img
        src={blog.featuredImage?.url}
        alt={blog.title}
        style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: styles.borderRadius }}
      />
      <h3 style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>{blog.title}</h3>
      <p style={{ color: styles.secondaryColor }}>{blog.excerpt.slice(0, 100)}...</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/blogs/${blog._id}`} style={styles.buttonStyle}>
          Read More
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MdFavoriteBorder />
            <span>{blog.likesCount || 0}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MdBookmarkBorder />
            <span>{blog.bookmarksCount || 0}</span>
          </div>
          {/* Edit link for owner/admin */}
          {me && (me._id === (blog.authorId?._id || blog.authorId) || me.role === 'admin') && (
            <Link to={`/blogs/${blog._id}/edit`} style={styles.buttonStyle}>Edit</Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default BlogCard;