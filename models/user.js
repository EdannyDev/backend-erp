const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  tempPassword: { type: String, default: null },
  tempPasswordExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);