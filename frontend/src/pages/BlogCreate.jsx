import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import BlogEditor from '../components/BlogEditor';
import { toast } from 'react-toastify';
import { useTheme, styles } from '../styles/theme';

function BlogCreate({ editMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [content, setContent] = useState({});
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [featuredFile, setFeaturedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [status, setStatus] = useState('draft');
  const [scheduledAt, setScheduledAt] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => api.get(`/blogs/${id}`).then((res) => res.data),
    enabled: !!editMode && !!id,
    onSuccess: (data) => {
      setContent(data.contentJson);
      setTitle(data.title);
      setExcerpt(data.excerpt);
      setCategory(data.category);
      setTags(data.tags);
      setPreviewImage(data.featuredImage?.url || '');
      setStatus(data.status);
      setScheduledAt(data.scheduledAt);
    },
  });

  const mutation = useMutation({
    mutationFn: (formData) => (editMode ? api.put(`/blogs/${id}`, formData) : api.post('/blogs', formData)),
    onSuccess: () => {
      toast.success(editMode ? 'Blog updated' : 'Blog created');
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      navigate('/dashboard');
    },
  });

  const handleSubmit = (newStatus) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('excerpt', excerpt);
    formData.append('category', category);
    formData.append('tags', JSON.stringify(tags));
    formData.append('contentJson', JSON.stringify(content));
    formData.append('status', newStatus);
    if (newStatus === 'scheduled' && scheduledAt) formData.append('scheduledAt', scheduledAt);
  if (featuredFile) formData.append('file', featuredFile);

    mutation.mutate(formData);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFeaturedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  return (
    <div style={{ padding: styles.padding, background: theme.background }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        style={{ fontSize: styles.titleSize, width: '100%', marginBottom: styles.margin }}
      />
      <input
        type="text"
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        placeholder="Excerpt"
        style={{ width: '100%', marginBottom: styles.margin }}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginBottom: styles.margin }}>
        <option>Category</option>
        {/* Options */}
      </select>
      <input
        type="text"
        value={tags.join(', ')}
        onChange={(e) => setTags(e.target.value.split(', ').filter(tag => tag.trim()))}
        placeholder="Tags (comma-separated)"
        style={{ width: '100%', marginBottom: styles.margin }}
      />
      <label style={{ display: 'block', marginBottom: styles.margin }}>Featured Image:</label>
      {previewImage && <div style={{ marginBottom: styles.margin }}>
        <img src={previewImage} alt="Featured Preview" style={{ maxWidth: '100%', marginBottom: styles.margin }} />
        <div style={{ marginBottom: styles.margin, color: '#666' }}>Upload a different file to replace the existing image.</div>
      </div>}
      <input type="file" onChange={handleFileChange} accept="image/*" />
      <BlogEditor initialContent={content} onUpdate={setContent} />
      {status === 'scheduled' && (
        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
      )}
      <button onClick={() => handleSubmit('draft')} style={styles.buttonStyle} disabled={mutation.isLoading}>
        Save Draft
      </button>
      <button onClick={() => handleSubmit('published')} style={styles.buttonStyle} disabled={mutation.isLoading}>
        {editMode ? 'Update' : 'Publish'}
      </button>
      <button onClick={() => handleSubmit('scheduled')} style={styles.buttonStyle} disabled={mutation.isLoading}>
        Schedule
      </button>
    </div>
  );
}

export default BlogCreate;