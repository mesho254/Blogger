import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useMemo } from 'react';
import { useTheme, styles } from '../styles/theme';
import AdSlot from './AdSlot';
import { MdBookmark, MdFavorite } from 'react-icons/md';

function BlogView({ content, blog }) {
  const theme = useTheme();
  const output = useMemo(() => {
    if (typeof content !== 'object' || content === null) {
      console.error('Invalid content type:', content);
      return '';
    }
    return generateHTML(content, [StarterKit, Image, Link, /* custom imageGrid */]);
  }, [content]);

  return (
    <div style={{ padding: styles.padding, background: theme.background, color: theme.color }}>
      {blog && blog.author && (
        <>
          <span style={{ background: styles.primaryColor, color: '#fff', padding: '0.2rem 0.5rem', borderRadius: styles.borderRadius }}>
            {blog.category}
          </span>
          <h1 style={{ fontSize: styles.titleSize, margin: `${styles.margin} 0` }}>{blog.title}</h1>
          <p style={{ fontSize: styles.subtitleSize, color: styles.secondaryColor }}>{blog.excerpt}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src={blog.author.avatarUrl || 'https://via.placeholder.com/40'}
              alt="Author"
              style={{ width: '40px', height: '40px', borderRadius: '50%' }}
            />
            <span>{blog.author.name || 'Unknown Author'}</span>
            <span>{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : 'N/A'}</span>
            <span>{blog.views || 0} views</span>
          </div>
          <button style={styles.buttonStyle}>Follow Author</button>
          <MdBookmark style={{ fontSize: '1.5rem', cursor: 'pointer' }} />
          <MdFavorite style={{ fontSize: '1.5rem', cursor: 'pointer' }} />
        </>
      )}
      <div dangerouslySetInnerHTML={{ __html: output }} style={{ lineHeight: 1.6, fontFamily: styles.fontFamily }} />
      {/* Ads placeholder */}
      <AdSlot position="inline" />
    </div>
  );
}

export default BlogView;