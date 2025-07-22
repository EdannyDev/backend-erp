const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rate: { type: Number, required: true, min: 0 },
  appliesTo: { type: String, enum: ['global', 'product', 'service'], default: 'global' }
}, { _id: false });

const currencySchema = new mongoose.Schema({
  code: { type: String, required: true },
  symbol: { type: String, required: true },
  decimalSeparator: { type: String, default: '.' },
  thousandSeparator: { type: String, default: ',' }
}, { _id: false });

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  legalName: String,
  taxId: { type: String, required: true },
  address: String,
  phone: String,
  email: String,
  website: String,
  logoUrl: String
}, { _id: false });

const notificationsSchema = new mongoose.Schema({
  emailEnabled: { type: Boolean, default: false },
  smtpHost: String,
  smtpPort: Number,
  smtpUser: String,
  smtpPass: String
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  company: companySchema,
  currency: currencySchema,
  taxes: [taxSchema],
  notifications: notificationsSchema
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);