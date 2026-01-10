const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{ menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }, title: String, qty: Number, price: Number }],
  total: { type: Number, default: 0 },
  status: { type: String, default: 'Pending' },
  payment: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
