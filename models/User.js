const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['client','admin','collaborator'], default: 'client' },
  metadata: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
