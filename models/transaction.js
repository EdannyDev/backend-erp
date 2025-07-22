const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    lines: [
      {
        account: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Account',
          required: true,
        },
        debit: {
          type: Number,
          default: 0,
          min: 0,
        },
        credit: {
          type: Number,
          default: 0,
          min: 0,
        },
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);