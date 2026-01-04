export async function uploadImage(file) {
  const formData = new FormData();
  // backend expects field name 'file' for the upload middleware
  formData.append('file', file);

  const base = import.meta.env.VITE_API_BASE || '';
  const res = await fetch(`${base}/api/blogs/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  // normalize to { url, publicId }
  return { url: data.url || data.secure_url || data.secureUrl, publicId: data.publicId || data.public_id };
}