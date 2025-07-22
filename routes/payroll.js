const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Payroll = require('../models/payroll');
const Employee = require('../models/employee');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Crear nómina (admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { employeeId, periodStart, periodEnd, baseSalary, bonus, deductions, notes } = req.body;

  if (!isValidObjectId(employeeId)) {
    return res.status(400).json({ mensaje: 'ID de empleado no válido' });
  }

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ mensaje: 'Empleado no encontrado' });

    const existe = await Payroll.findOne({
      employee: employeeId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd)
    });
    if (existe) return res.status(409).json({ mensaje: 'Nómina ya registrada para este período' });

    const totalPay = baseSalary + (bonus || 0) - (deductions || 0);

    const nuevaNomina = new Payroll({
      employee: employeeId,
      periodStart,
      periodEnd,
      baseSalary,
      bonus,
      deductions,
      totalPay,
      notes
    });

    await nuevaNomina.save();
    res.status(201).json({ mensaje: 'Nómina registrada exitosamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al registrar la nómina', error: err.message });
  }
});

// Obtener todas las nóminas (admin)
router.get('/list', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const nominas = await Payroll.find()
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ periodEnd: -1 });

    res.json(nominas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener nóminas' });
  }
});

// Obtener nóminas de un empleado (admin o el mismo empleado)
router.get('/employee/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ mensaje: 'ID no válido' });

  try {
    const employee = await Employee.findById(id).populate('user');
    if (!employee) return res.status(404).json({ mensaje: 'Empleado no encontrado' });

    if (req.user.role !== 'admin' && req.user.id !== employee.user._id.toString()) {
      return res.status(403).json({ mensaje: 'No tienes permiso para ver estas nóminas' });
    }

    const nominas = await Payroll.find({ employee: id }).sort({ periodEnd: -1 });
    res.json(nominas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener nóminas' });
  }
});

// Actualizar nómina (admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { bonus, deductions, notes, paidAt } = req.body;

  if (!isValidObjectId(id)) return res.status(400).json({ mensaje: 'ID de nómina no válido' });

  try {
    const nomina = await Payroll.findById(id);
    if (!nomina) return res.status(404).json({ mensaje: 'Nómina no encontrada' });

    if (bonus !== undefined) nomina.bonus = bonus;
    if (deductions !== undefined) nomina.deductions = deductions;
    if (notes !== undefined) nomina.notes = notes;
    if (paidAt !== undefined) nomina.paidAt = paidAt;

    nomina.totalPay = nomina.baseSalary + nomina.bonus - nomina.deductions;

    await nomina.save();
    res.json({ mensaje: 'Nómina actualizada correctamente', nomina });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar nómina' });
  }
});

// Eliminar nómina (admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) return res.status(400).json({ mensaje: 'ID no válido' });

  try {
    const eliminado = await Payroll.findByIdAndDelete(id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Nómina no encontrada' });

    res.json({ mensaje: 'Nómina eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar nómina' });
  }
});

module.exports = router;