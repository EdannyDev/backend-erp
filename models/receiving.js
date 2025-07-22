const mongoose = require('mongoose');

const receivingSchema = new mongoose.Schema(
  {
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
    },
    receivedItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Receiving', receivingSchema);