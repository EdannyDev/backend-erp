const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  status: { type: String, enum: ['pendiente', 'aceptada', 'rechazada'], default: 'pendiente' }
}, { timestamps: true });

module.exports = mongoose.model('Quote', quoteSchema);