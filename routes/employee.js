const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const EmployeeProfile = require('../models/employee');
const User = require('../models/user');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Crear perfil de empleado (solo admin)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { userId, position, department, hireDate, salary } = req.body;

  if (!isValidObjectId(userId)) {
    return res.status(400).json({ mensaje: 'ID de usuario no válido' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const exists = await EmployeeProfile.findOne({ user: userId });
    if (exists) {
      return res.status(409).json({ mensaje: 'Este usuario ya tiene un perfil laboral' });
    }

    const profile = new EmployeeProfile({
      user: userId,
      position,
      department,
      hireDate,
      salary,
    });

    await profile.save();

    res.status(201).json({ mensaje: 'Perfil laboral creado exitosamente', profile });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear perfil laboral', error: err.message });
  }
});

// Obtener todos los perfiles laborales
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const profiles = await EmployeeProfile.find().populate('user', 'name email');
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener perfiles laborales' });
  }
});

// Obtener perfil laboral por ID
router.get('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ mensaje: 'ID no válido' });

  try {
    const profile = await EmployeeProfile.findById(id).populate('user', 'name email');
    if (!profile) return res.status(404).json({ mensaje: 'Perfil no encontrado' });

    res.json(profile);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener perfil laboral' });
  }
});

// Actualizar perfil laboral
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { position, department, hireDate, salary } = req.body;

  if (!isValidObjectId(id)) return res.status(400).json({ mensaje: 'ID no válido' });

  try {
    const updated = await EmployeeProfile.findByIdAndUpdate(
      id,
      { position, department, hireDate, salary },
      { new: true }
    ).populate('user', 'name email');

    if (!updated) return res.status(404).json({ mensaje: 'Perfil no encontrado' });

    res.json({ mensaje: 'Perfil actualizado correctamente', profile: updated });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar perfil laboral' });
  }
});

// Eliminar perfil laboral
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) return res.status(400).json({ mensaje: 'ID no válido' });

  try {
    const deleted = await EmployeeProfile.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ mensaje: 'Perfil no encontrado' });

    res.json({ mensaje: 'Perfil eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar perfil laboral' });
  }
});

module.exports = router;