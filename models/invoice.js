const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  total: { type: Number, required: true, min: 0 },
  paid: { type: Boolean, default: false },
  dueDate: { type: Date, required: true },
  invoiceNumber: { type: String, required: true, trim: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);