const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);