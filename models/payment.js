const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentDate: { type: Date, default: Date.now },
  method: { 
    type: String, 
    enum: ['efectivo', 'tarjeta', 'transferencia'], 
    required: true, 
    trim: true 
  },
  paymentNumber: { type: String, required: true, trim: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);