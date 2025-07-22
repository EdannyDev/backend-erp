const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Attendance = require('../models/attendance');
const Employee = require('../models/employee');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Crear registro de asistencia (solo admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { employeeId, date, status, comment } = req.body;

  if (!isValidObjectId(employeeId)) {
    return res.status(400).json({ mensaje: 'ID de empleado no válido' });
  }

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }

    const existe = await Attendance.findOne({ employee: employeeId, date: new Date(date) });
    if (existe) {
      return res.status(409).json({ mensaje: 'Asistencia ya registrada para este día' });
    }

    const nuevoRegistro = new Attendance({ employee: employeeId, date, status, comment });
    await nuevoRegistro.save();

    res.status(201).json({ mensaje: 'Asistencia registrada exitosamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor al registrar asistencia' });
  }
});

// Obtener todos los registros (solo admin)
router.get('/list', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const registros = await Attendance.find()
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ date: -1 });

    res.json(registros);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener los registros' });
  }
});

// Obtener registros de un empleado (admin o el mismo empleado)
router.get('/employee/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de empleado no válido' });
  }

  try {
    const employee = await Employee.findById(id).populate('user');
    if (!employee) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }

    // Solo el admin o el mismo empleado puede consultar
    if (req.user.role !== 'admin' && req.user.id !== employee.user._id.toString()) {
      return res.status(403).json({ mensaje: 'No tienes permiso para ver estos registros' });
    }

    const registros = await Attendance.find({ employee: id }).sort({ date: -1 });
    res.json(registros);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener los registros' });
  }
});

// Actualizar registro (solo admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { status, comment } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de asistencia no válido' });
  }

  try {
    const actualizado = await Attendance.findByIdAndUpdate(
      id,
      { status, comment },
      { new: true }
    );

    if (!actualizado) {
      return res.status(404).json({ mensaje: 'Registro no encontrado' });
    }

    res.json({ mensaje: 'Asistencia actualizada correctamente', asistencia: actualizado });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar asistencia' });
  }
});

// Eliminar registro (solo admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID de asistencia no válido' });
  }

  try {
    const eliminado = await Attendance.findByIdAndDelete(id);
    if (!eliminado) {
      return res.status(404).json({ mensaje: 'Registro no encontrado' });
    }

    res.json({ mensaje: 'Registro de asistencia eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar asistencia' });
  }
});

module.exports = router;