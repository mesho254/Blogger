const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  entityId: mongoose.Schema.Types.ObjectId,
  data: Object,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);