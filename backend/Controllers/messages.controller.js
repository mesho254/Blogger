const Message = require('../Models/Message');

exports.getConversations = async (req, res) => {
  // Get user's conversations
  res.json([]);
};

exports.getMessages = async (req, res) => {
  const messages = await Message.find({ conversationId: req.params.id });
  res.json(messages);
};