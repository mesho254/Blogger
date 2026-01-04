const User = require('../Models/User');
const Blog = require('../Models/Blog');
const Comment = require('../Models/Comment');

exports.getStats = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  
  try {
    const stats = {
      users: await User.countDocuments(),
      posts: await Blog.countDocuments(),
      comments: await Comment.countDocuments(),
      activeUsers: await User.countDocuments({ lastActive: { $gt: new Date(Date.now() - 24*60*60*1000) } })
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
};

exports.getUsers = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  
  try {
    const users = await User.find({}, 'name email role createdAt lastActive').sort('-createdAt');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
};

exports.updateUserRole = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  
  try {
    const user = await User.findByIdAndUpdate(req.params.id, 
      { role: req.body.role },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error updating user role' });
  }
};

exports.getPosts = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  
  try {
    const posts = await Blog.find({})
      .populate('authorId', 'name email')
      .sort('-createdAt')
      .select('title status featured createdAt authorId');

    // Normalize shape so frontend can use post.author.name
    const normalized = posts.map(p => ({
      _id: p._id,
      title: p.title,
      status: p.status,
      featured: p.featured,
      createdAt: p.createdAt,
      author: p.authorId ? { name: p.authorId.name, email: p.authorId.email, _id: p.authorId._id } : null
    }));

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching posts' });
  }
};

exports.deletePost = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  
  try {
    const post = await Blog.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    // Also delete associated comments
    await Comment.deleteMany({ blogId: req.params.id });
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting post' });
  }
};

exports.featurePost = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    post.featured = !post.featured; // Toggle featured status
    await post.save();
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error featuring post' });
  }
};

exports.getComments = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  
  try {
    const comments = await Comment.find({})
      .populate('authorId', 'name email')
      .populate('blogId', 'title')
      .sort('-createdAt')
      .select('content createdAt authorId blogId replyToCommentId reactions');

    // Normalize shape for frontend (author and blog fields)
    const normalized = comments.map((c) => ({
      _id: c._id,
      content: c.content,
      createdAt: c.createdAt,
      author: c.authorId ? { _id: c.authorId._id, name: c.authorId.name, email: c.authorId.email } : null,
      blog: c.blogId ? { _id: c.blogId._id, title: c.blogId.title } : null,
      replyToCommentId: c.replyToCommentId,
      reactions: c.reactions || {}
    }));

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching comments' });
  }
};

exports.deleteComment = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting comment' });
  }
};

exports.getAnalytics = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  
  try {
    // Get daily active users for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
    
    const dailyActiveUsers = await User.aggregate([
      {
        $match: {
          lastActive: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$lastActive" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get post metrics
    // Compute posts count and comments count in parallel
    const postsCountPromise = Blog.countDocuments();
    const commentsCountPromise = Comment.countDocuments();

    // Compute totalLikes by summing likesCount field (added to Blog model)
    const likesAgg = await Blog.aggregate([
      { $group: { _id: null, totalLikes: { $sum: { $ifNull: ["$likesCount", 0] } } } }
    ]);

    const totalLikes = likesAgg[0]?.totalLikes || 0;
    const [postsCount, commentsCount] = await Promise.all([postsCountPromise, commentsCountPromise]);

    const analytics = {
      dailyActiveUsers: dailyActiveUsers.map(day => ({ date: day._id, count: day.count })),
      postMetrics: [
        { name: 'Posts Created', value: postsCount },
        { name: 'Likes', value: totalLikes },
        { name: 'Comments', value: commentsCount }
      ]
    };

    res.json(analytics);
  } catch (error) {
    console.error('getAnalytics error:', error);
    res.status(500).json({ error: 'Error fetching analytics' });
  }
};

exports.updateAds = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  
  try {
    // You might want to store this in a separate collection/model
    // For now, we'll just return success
    const { positions } = req.body;
    if (!Array.isArray(positions)) {
      return res.status(400).json({ error: 'Positions must be an array' });
    }
    
    // Here you would typically save the positions to your database
    res.json({ message: 'Ad positions updated successfully', positions });
  } catch (error) {
    res.status(500).json({ error: 'Error updating ad positions' });
  }
};