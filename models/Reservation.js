const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  partySize: { type: Number, default: 1 },
  dateTime: { type: Date, required: true },
  notes: { type: String },
  status: { type: String, enum: ['pending','confirmed','cancelled'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', ReservationSchema);
