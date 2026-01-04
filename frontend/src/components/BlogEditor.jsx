import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useState, useEffect } from 'react';
import api from '../services/api'; // Assuming this is your Axios instance
import BlogView from './BlogView'; // For live preview
import { useTheme, styles } from '../styles/theme';

function BlogEditor({ initialContent = {}, onUpdate, editMode }) {
  const theme = useTheme();
  const [previewMode, setPreviewMode] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your blog...',
      }),
      // Custom extension for image grids (simplified as a node)
      {
        name: 'imageGrid',
        group: 'block',
        content: 'image*',
        addAttributes: () => ({ columns: { default: 2 } }),
        parseHTML: () => [{ tag: 'div.image-grid' }],
        renderHTML: ({ HTMLAttributes }) => ['div', { class: `grid grid-cols-${HTMLAttributes.columns}` }, 0],
      },
    ],
    content: initialContent,
    onUpdate: ({ editor }) => onUpdate(editor.getJSON()),
  });

  // If initialContent changes (e.g., when editing an existing blog), update the editor
  useEffect(() => {
    if (editor && initialContent) {
      try {
        editor.commands.setContent(initialContent);
      } catch {
        // setContent may throw if initialContent is empty or malformed; ignore
      }
    }
  }, [initialContent, editor]);

  const addImage = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.post('/blogs/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
  const { url } = res.data;
  editor.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        console.error('Image upload failed:', err);
        // Handle error (e.g., toast notification)
      }
    }
  }, [editor]);

  const addImageGrid = (columns) => {
    editor.chain().focus().insertContent({ type: 'imageGrid', attrs: { columns } }).run();
  };

  if (!editor) return null;

  return (
    <div style={{ padding: styles.padding, background: theme.background, color: theme.color }}>
      {!previewMode ? (
        <>
          <div style={{ marginBottom: styles.margin }}>
            <button onClick={() => editor.chain().focus().toggleBold().run()} style={styles.buttonStyle}>Bold</button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} style={styles.buttonStyle}>Italic</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={styles.buttonStyle}>H1</button>
            <button onClick={() => editor.chain().focus().setTextAlign('center').run()} style={styles.buttonStyle}>Center</button>
            <input type="file" onChange={addImage} style={{ display: 'none' }} id="image-upload" />
            <label htmlFor="image-upload" style={styles.buttonStyle}>Add Image</label>
            <button onClick={() => addImageGrid(2)} style={styles.buttonStyle}>2-Col Grid</button>
            <button onClick={() => addImageGrid(3)} style={styles.buttonStyle}>3-Col Grid</button>
            <button onClick={() => editor.chain().focus().setLink({ href: prompt('URL') }).run()} style={styles.buttonStyle}>Link</button>
          </div>
          <EditorContent editor={editor} style={{ minHeight: '500px', border: '1px solid #ddd', padding: '1rem' }} />
        </>
      ) : (
        <BlogView content={editor.getJSON()} />
      )}
      <button onClick={() => setPreviewMode(!previewMode)} style={{ ...styles.buttonStyle, marginTop: styles.margin }}>
        {previewMode ? 'Edit' : 'Preview'}
      </button>
    </div>
  );
}

export default BlogEditor;