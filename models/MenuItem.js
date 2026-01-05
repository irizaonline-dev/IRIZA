const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String },
  available: { type: Boolean, default: true },
  images: [String]
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', MenuItemSchema);
