const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  replyToCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  reactions: { type: Map, of: [mongoose.Schema.Types.ObjectId] }, // emoji: [userIds]
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);