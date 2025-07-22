const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['activo', 'pasivo', 'capital', 'ingreso', 'gasto'],
      required: true
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null
    },
    isGroup: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Account', accountSchema);