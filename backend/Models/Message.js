const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: String, // Or ObjectId if using a Conversation model
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
  replyToMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reactions: { type: Map, of: [mongoose.Schema.Types.ObjectId] },
  delivered: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);