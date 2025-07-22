const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  baseSalary: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  totalPay: { type: Number, required: true },
  paidAt: { type: Date, default: null },
  notes: { type: String }
}, { timestamps: true });

payrollSchema.index({ employee: 1, periodStart: 1, periodEnd: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);