const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pendiente', 'enviado', 'recibido', 'cancelado'],
      default: 'pendiente',
    },
    expectedDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);