const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    rfc: { type: String, required: true, trim: true, uppercase: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);