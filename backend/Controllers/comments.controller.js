const Comment = require('../Models/Comment');
const Blog = require('../Models/Blog');

exports.createComment = async (req, res) => {
  try {
    const comment = new Comment({ ...req.body, authorId: req.user.id, blogId: req.params.id });
    await comment.save();
    await Blog.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getComments = async (req, res) => {
  const comments = await Comment.find({ blogId: req.params.id });
  res.json(comments);
};

exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (comment.authorId.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    comment.content = req.body.content;
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (comment.authorId.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    await comment.remove();
    await Blog.findByIdAndUpdate(comment.blogId, { $inc: { commentsCount: -1 } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};