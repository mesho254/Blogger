import { useCallback } from 'react';
import { uploadImage } from '../services/uploads';

function FileUploader({ onUpload }) {
  const handleUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file) {
  const result = await uploadImage(file);
  onUpload(result.url);
    }
  }, [onUpload]);

  return <input type="file" onChange={handleUpload} />;
}

export default FileUploader;