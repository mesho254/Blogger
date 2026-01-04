const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  passwordHash: String,
  avatarUrl: String,
  bio: String,
  location: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  bookmarkedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (this.isModified('passwordHash')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);