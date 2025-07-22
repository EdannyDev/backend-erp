const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  position: { type: String, required: true },
  department: { type: String },
  hireDate: { type: Date, required: true },
  salary: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);