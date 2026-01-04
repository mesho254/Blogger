const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  // make slug unique but sparse so null/undefined values don't violate the unique index
  slug: { type: String, unique: true, sparse: true },
  contentJson: Object, // Structured JSON from Tiptap 
  excerpt: String,
  category: String,
  tags: [String],
  featuredImage: { url: String, publicId: String, width: Number, height: Number },
  status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft' },
  scheduledAt: Date,
  views: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  likes : [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Mark if a post is featured on the platform
  featured: { type: Boolean, default: false },
  bookmarksCount: { type: Number, default: 0 },
  bookmarks : [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentsCount: { type: Number, default: 0 },
  comments : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Simple slugify helper
function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Ensure a unique slug is generated when missing
blogSchema.pre('save', async function (next) {
  if (!this.slug) {
    const base = slugify(this.title) || 'post';
    let candidate = base;
    // Append random suffix if slug already exists
    const Blog = mongoose.model('Blog');
    let exists = await Blog.exists({ slug: candidate });
    let attempts = 0;
    while (exists && attempts < 5) {
      candidate = `${base}-${Math.floor(Math.random() * 9000) + 1000}`;
      exists = await Blog.exists({ slug: candidate });
      attempts += 1;
    }
    if (exists) {
      // fallback to timestamp
      candidate = `${base}-${Date.now()}`;
    }
    this.slug = candidate;
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);