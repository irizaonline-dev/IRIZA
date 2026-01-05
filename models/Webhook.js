const mongoose = require('mongoose');

const WebhookSchema = new mongoose.Schema({
  url: { type: String, required: true },
  events: [String],
  secret: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Webhook', WebhookSchema);
