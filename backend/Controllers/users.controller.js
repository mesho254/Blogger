const User = require('../Models/User');
const jwt = require('jsonwebtoken');

exports.getUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id)
      .select('-passwordHash')
      .populate({ path: 'likedPosts', select: 'title slug createdAt authorId excerpt featuredImage likesCount bookmarksCount' })
      .populate({ path: 'bookmarkedPosts', select: 'title slug createdAt authorId excerpt featuredImage likesCount bookmarksCount' });

    // De-duplicate populated arrays in case of accidental duplicate ObjectId entries
    if (user) {
      const dedupe = (arr) => {
        if (!Array.isArray(arr)) return arr;
        const map = new Map();
        arr.forEach((b) => {
          if (b && b._id) map.set(String(b._id), b);
        });
        return Array.from(map.values());
      };
      user = user.toObject();
      user.likedPosts = dedupe(user.likedPosts);
      user.bookmarkedPosts = dedupe(user.bookmarkedPosts);
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Unauthorized' });
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleFollow = async (req, res) => {
  try {
    // Logic to toggle follow, update counts
    // For simplicity, assume followers/following arrays if added to model
    res.json({ message: 'Follow toggled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    // Check token from header (Bearer) or cookie for flexibility
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : req.cookies.jwt;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id).select('-passwordHash -resetToken -resetTokenExpiry');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get Me Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};