const Blog = require('../Models/Blog');
const sanitizeHtml = require('sanitize-html');
const cloudinary = require('../Utils/cloudinary');
const redis = require('redis');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect();

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog_images',
    public_id: (req, file) => file.originalname.split('.')[0], // Use original filename without extension
  },
});

const upload = multer({ storage });

// Helper to flush blog-related cache keys
async function flushCache() {
  try {
    await client.flushAll();
  } catch (e) {
    console.warn('Redis flush failed', e.message || e);
  }
}

exports.getBlogs = async (req, res) => {
  try {
    const { limit = 20, cursor, q, category, sort = 'newest', authorId } = req.query;
    const cacheKey = `blogs:${q}:${category}:${sort}:${cursor}`;
    let blogs = await client.get(cacheKey);
    if (blogs) {
      blogs = JSON.parse(blogs);
    } else {
      const query = {};
      if (authorId) query.authorId = authorId;
      if (q) query.$or = [{ title: { $regex: q, $options: 'i' } }];
      if (category) query.category = category;
      const sortObj = sort === 'newest' ? { createdAt: -1 } : { createdAt: 1 };
      blogs = await Blog.find(query).sort(sortObj).limit(limit).skip(cursor || 0);
      await client.set(cacheKey, JSON.stringify(blogs), { EX: 300 });
    }
    // normalize featuredImage shape for clients
    const normalize = (b) => {
      if (!b) return b;
      const obj = b.toObject ? b.toObject() : b;
      if (obj.featuredImage) {
        if (typeof obj.featuredImage === 'string') {
          obj.featuredImage = { url: obj.featuredImage };
        } else {
          obj.featuredImage.url = obj.featuredImage.url || obj.featuredImage.secure_url || obj.featuredImage.path || obj.featuredImage.location || null;
          obj.featuredImage.publicId = obj.featuredImage.publicId || obj.featuredImage.public_id || obj.featuredImage.filename || null;
        }
      }
      return obj;
    };

    const normalized = Array.isArray(blogs) ? blogs.map(normalize) : normalize(blogs);
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFeatured = async (req, res) => {
  const blogs = await Blog.find().sort({ likesCount: -1 }).limit(5);
  const normalized = blogs.map(b => {
    const obj = b.toObject ? b.toObject() : b;
    if (obj.featuredImage) {
      if (typeof obj.featuredImage === 'string') obj.featuredImage = { url: obj.featuredImage };
      else obj.featuredImage.url = obj.featuredImage.url || obj.featuredImage.secure_url || obj.featuredImage.path || obj.featuredImage.location || null;
      obj.featuredImage.publicId = obj.featuredImage.publicId || obj.featuredImage.public_id || obj.featuredImage.filename || null;
    }
    return obj;
  });
  res.json(normalized);
};

exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('authorId', 'name email');

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const User = require('../Models/User');
        const [liked, bookmarked] = await Promise.all([
          User.exists({ _id: userId, likedPosts: blog._id }),
          User.exists({ _id: userId, bookmarkedPosts: blog._id })
        ]);

        const result = blog.toObject();
        result.isLiked = !!liked;
        result.isBookmarked = !!bookmarked;
        return res.json(result);
      } catch (jwtErr) {
        console.warn('getBlog: token verify failed', jwtErr.message || jwtErr);
      }
    }

    // normalize featuredImage for single blog response as well
    const obj = blog.toObject ? blog.toObject() : blog;
    if (obj.featuredImage) {
      if (typeof obj.featuredImage === 'string') obj.featuredImage = { url: obj.featuredImage };
      else obj.featuredImage.url = obj.featuredImage.url || obj.featuredImage.secure_url || obj.featuredImage.path || obj.featuredImage.location || null;
      obj.featuredImage.publicId = obj.featuredImage.publicId || obj.featuredImage.public_id || obj.featuredImage.filename || null;
    }

    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const blogData = {
      ...req.body,
      authorId: req.user.id,
      contentJson: JSON.parse(req.body.contentJson || '{}'), // Parse from FormData
      tags: JSON.parse(req.body.tags || '[]'),
    };

    if (req.file) {
      // multer / cloudinary storage can put returned values in different properties
      const f = req.file;
      const url = f.secure_url || f.path || f.url || f.location || req.body.url || req.body.secure_url;
      const publicId = f.public_id || f.publicId || f.filename || req.body.publicId || req.body.public_id || req.body.public_id;
      const width = f.width || (f.metadata && f.metadata.width) || req.body.width;
      const height = f.height || (f.metadata && f.metadata.height) || req.body.height;

      blogData.featuredImage = {
        url,
        publicId,
        width,
        height,
      };
    }

    const blog = new Blog(blogData);
    await blog.save();
    flushCache();
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (blog.authorId.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    if (req.file) {
      // remove previous image from cloudinary if we have a public id
      if (blog.featuredImage && blog.featuredImage.publicId) {
        try {
          await cloudinary.uploader.destroy(blog.featuredImage.publicId);
        } catch (e) {
          // non-fatal
          console.warn('Failed to destroy previous image', e.message || e);
        }
      }

      const f = req.file;
      const url = f.secure_url || f.path || f.url || f.location || req.body.url || req.body.secure_url;
      const publicId = f.public_id || f.publicId || f.filename || req.body.publicId || req.body.public_id;
      const width = f.width || (f.metadata && f.metadata.width) || req.body.width;
      const height = f.height || (f.metadata && f.metadata.height) || req.body.height;

      blog.featuredImage = {
        url,
        publicId,
        width,
        height,
      };
    }

    Object.assign(blog, {
      ...req.body,
      contentJson: req.body.contentJson ? JSON.parse(req.body.contentJson) : blog.contentJson,
      tags: req.body.tags ? JSON.parse(req.body.tags) : blog.tags,
    });

    await blog.save();
    flushCache();
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (blog.authorId.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    if (blog.featuredImage && blog.featuredImage.publicId) {
      await cloudinary.uploader.destroy(blog.featuredImage.publicId);
    }

    await blog.remove();
    flushCache();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const blogId = req.params.id;

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ error: 'Post not found' });

    const User = require('../Models/User');
    const user = await User.findById(userId);
    const hasLiked = user.likedPosts?.some(p => p.toString() === blogId);

    if (hasLiked) {
      await Blog.findByIdAndUpdate(blogId, { $inc: { likesCount: -1 } });
      await User.findByIdAndUpdate(userId, { $pull: { likedPosts: blogId } });
    } else {
      await Blog.findByIdAndUpdate(blogId, { $inc: { likesCount: 1 } });
      await User.findByIdAndUpdate(userId, { $addToSet: { likedPosts: blogId } });
    }

    flushCache();
    res.json({ liked: !hasLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const blogId = req.params.id;

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ error: 'Post not found' });

    const User = require('../Models/User');
    const user = await User.findById(userId);
    const hasBookmarked = user.bookmarkedPosts?.some(p => p.toString() === blogId);

    if (hasBookmarked) {
      await User.findByIdAndUpdate(userId, { $pull: { bookmarkedPosts: blogId } });
      await Blog.findByIdAndUpdate(blogId, { $inc: { bookmarksCount: -1 } });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { bookmarkedPosts: blogId } });
      await Blog.findByIdAndUpdate(blogId, { $inc: { bookmarksCount: 1 } });
    }

    flushCache();
    res.json({ bookmarked: !hasBookmarked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.incrementView = async (req, res) => {
  await Blog.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
  res.json({ message: 'View incremented' });
};

// New endpoint for uploading images (e.g., for editor content)
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const f = req.file;
    const url = f.secure_url || f.path || f.url || f.location || req.body.url || req.body.secure_url;
    const publicId = f.public_id || f.publicId || f.filename || req.body.publicId || req.body.public_id;
    res.json({ url, publicId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export upload middleware for routes
exports.upload = upload;