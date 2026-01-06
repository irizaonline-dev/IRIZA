const mongoose = require('mongoose');

const CheckoutSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  paymentMethod: { type: String },
  paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  billing: { type: Object },
  metadata: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Checkout', CheckoutSchema);
