const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./Models/User');
const Message = require('./Models/Message');
const Blog = require('./Models/Blog');

module.exports = (io) => {
  const onlineUsers = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    onlineUsers.set(socket.user.id, socket.id);
    io.emit('presence:update', { userId: socket.user.id, online: true });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.user.id);
      io.emit('presence:update', { userId: socket.user.id, online: false });
    });

    // Messaging
    socket.on('message:send', async (data) => {
      // Save message to DB
      try {
        const message = new Message(data);
        await message.save();
        io.to(data.conversationId).emit('message:receive', message);
      } catch (err) {
        console.error('Failed to save message', err);
        // Fallback: emit the raw data so UI still shows optimistic message
        io.to(data.conversationId).emit('message:receive', { ...data, _id: Date.now().toString(), createdAt: new Date().toISOString() });
      }
    });

    socket.on('typing', (data) => {
      socket.broadcast.to(data.conversationId).emit('typing', data);
    });

    // Reactions
    socket.on('reaction:add', async (data) => {
      try {
        // Validate messageId before querying to avoid CastError for non-ObjectId ids
        if (!mongoose.Types.ObjectId.isValid(data.messageId)) {
          console.warn('reaction:add received invalid messageId:', data.messageId);
          // Broadcast the reaction update to clients but don't attempt DB update
          io.to(data.conversationId).emit('reaction:update', data);
          return;
        }

        // Update message reactions in DB
        const message = await Message.findById(data.messageId);
        if (!message) {
          // message not found; still broadcast so UI can update optimistically
          io.to(data.conversationId).emit('reaction:update', data);
          return;
        }
        if (!message.reactions[data.emoji]) message.reactions[data.emoji] = [];
        message.reactions[data.emoji].push(socket.user.id);
        await message.save();
        io.to(data.conversationId).emit('reaction:update', data);
      } catch (err) {
        console.error('reaction:add error', err);
        io.to(data.conversationId).emit('reaction:update', data);
      }
    });

    // Notifications
    socket.on('notification:send', (data) => {
      const targetSocket = onlineUsers.get(data.userId);
      if (targetSocket) io.to(targetSocket).emit('notification:receive', data);
    });

    // Calls
    socket.on('call:signal', (data) => {
      const targetSocket = onlineUsers.get(data.to);
      if (targetSocket) io.to(targetSocket).emit('call:signal', { from: socket.user.id, signal: data.signal });
    });

    socket.on('call:accept', (data) => {
      const targetSocket = onlineUsers.get(data.to);
      if (targetSocket) io.to(targetSocket).emit('call:accept', data);
    });

    socket.on('call:decline', (data) => {
      const targetSocket = onlineUsers.get(data.to);
      if (targetSocket) io.to(targetSocket).emit('call:decline', data);
    });

    // Chatbot - simple rule-based responder
    socket.on('chatbot:message', async (data) => {
      try {
        const text = (data.content || '').trim();
        const lower = text.toLowerCase();
        let reply = null;

        if (!text) {
          reply = "I'm here — send me a message and I can help with: 'latest', 'donate', 'help'.";
        } else if (/\b(hi|hello|hey)\b/.test(lower)) {
          reply = `Hi there! I'm the site assistant — you can ask me for 'latest' posts, how to 'donate', or ask for 'help'.`;
        } else if (lower.includes('help')) {
          reply = "I can help with:\n- 'latest' — show recent posts\n- 'donate' — donation link\n- 'contact' — how to reach the team\nTry sending 'latest' to see recent posts.";
        } else if (lower.includes('donate')) {
          const base = process.env.APP_URL || '';
          reply = `Thanks for wanting to support us — donate here: ${base}/donate`;
        } else if (lower.includes('contact')) {
          reply = 'You can reach out at support@example.com or use the contact form on the site.';
        } else if (lower.includes('latest')) {
          const posts = await Blog.find({}).sort({ createdAt: -1 }).limit(3).select('title slug');
          if (posts.length === 0) {
            reply = 'No posts found yet.';
          } else {
            reply = 'Latest posts:\n' + posts.map((p) => `- ${p.title} (/blogs/${p._id})`).join('\n');
          }
        } else if (lower.includes('who are you') || lower.includes('what are you')) {
          reply = "I'm an automated assistant here to help with simple site questions. For complex issues please contact support.";
        } else {
          reply = "Sorry, I didn't understand that. Try 'help' to see what I can do.";
        }

        const botMessage = {
          content: reply,
          senderId: 'bot',
          conversationId: data.conversationId || 'chatbot',
          createdAt: new Date().toISOString(),
        };

        // Save bot message to DB (best-effort)
        try {
          const m = new Message({ content: botMessage.content, senderId: 'bot', conversationId: botMessage.conversationId, type: 'text' });
          await m.save();
          // use saved message (with _id)
          io.to(botMessage.conversationId).emit('message:receive', m);
        } catch (saveErr) {
          // Fallback to emitting the constructed bot message (without custom _id)
          io.to(botMessage.conversationId).emit('message:receive', botMessage);
        }
      } catch (err) {
        console.error('Chatbot error', err);
        socket.emit('message:receive', { _id: `bot-${Date.now()}`, content: 'Bot encountered an error.', senderId: 'bot', createdAt: new Date().toISOString() });
      }
    });

    // Join conversations
    socket.on('join:conversation', (conversationId) => {
      socket.join(conversationId);
      // If user joins chatbot, send a warm welcome message
      if (conversationId === 'chatbot') {
        const welcomeContent = "Hello! I'm the site assistant — ask me for 'latest', 'donate', or 'help'.";
        // Try to save welcome message and emit the saved message (with valid ObjectId). If saving fails,
        // emit a welcome payload without a custom _id so downstream listeners don't try to query by it.
        Message.create({ content: welcomeContent, senderId: 'bot', conversationId: 'chatbot', type: 'text' })
          .then((m) => io.to('chatbot').emit('message:receive', m))
          .catch(() => io.to('chatbot').emit('message:receive', { content: welcomeContent, senderId: 'bot', conversationId: 'chatbot', createdAt: new Date().toISOString() }));
      }
    });
  });
};