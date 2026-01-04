const multer = require('multer');
const cloudinary = require('../Utils/cloudinary');

// Use memory storage by default so we can support both direct CloudinaryStorage and manual upload
const upload = multer({ storage: multer.memoryStorage() });

module.exports = (req, res, next) => {
  // Expect either 'featuredImage' or 'file' as the field name depending on route
  const field = req.headers['x-upload-field'] || 'file';
  upload.single(field)(req, res, async (err) => {
    if (err) return next(err);
    // If middleware was used together with CloudinaryStorage it will already populate req.file
    if (req.file && req.file.buffer) {
      // previous behavior: upload buffer to cloudinary
      try {
        const base64 = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${base64}`;
        const result = await cloudinary.uploader.upload(dataUri, { folder: 'blogs' });
        // normalize req.file to include cloudinary fields
        req.file.secure_url = result.secure_url;
        req.file.public_id = result.public_id;
        req.file.width = result.width;
        req.file.height = result.height;
      } catch (e) {
        console.warn('upload.middleware: cloudinary upload failed', e.message || e);
      }
    }

    // If previous middleware populated req.body.url/publicId, reflect them into req.file for consistency
    if (!req.file && (req.body.url || req.body.publicId || req.body.public_id)) {
      req.file = {
        secure_url: req.body.url || req.body.secure_url,
        public_id: req.body.publicId || req.body.public_id,
      };
    }

    next();
  });
};