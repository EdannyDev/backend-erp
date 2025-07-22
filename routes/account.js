const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Account = require('../models/account');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Crear cuenta contable
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { code, name, type, parent, isGroup, description } = req.body;

    if (!code || !name || !type) {
      return res.status(400).json({ mensaje: 'Código, nombre y tipo son obligatorios' });
    }

    if (parent && !isValidObjectId(parent)) {
      return res.status(400).json({ mensaje: 'ID de cuenta padre no válido' });
    }

    const duplicate = await Account.findOne({ code });
    if (duplicate) {
      return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese código' });
    }

    let parentAccount = null;
    if (parent) {
      parentAccount = await Account.findById(parent);
      if (!parentAccount) {
        return res.status(404).json({ mensaje: 'Cuenta padre no encontrada' });
      }
    }

    const newAccount = new Account({ code, name, type, parent, isGroup, description });
    await newAccount.save();

    res.status(201).json({ mensaje: 'Cuenta creada exitosamente', cuenta: newAccount });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear cuenta', error: err.message });
  }
});

// Obtener todas las cuentas
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), async (_req, res) => {
  try {
    const accounts = await Account.find().populate('parent', 'code name');
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener cuentas', error: err.message });
  }
});

// Obtener una cuenta por ID
router.get('/:id', authenticateToken, authorizeRoles('admin', 'employee'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) return res.status(400).json({ mensaje: 'ID no válido' });

  try {
    const account = await Account.findById(id).populate('parent', 'code name');
    if (!account) return res.status(404).json({ mensaje: 'Cuenta no encontrada' });

    res.json(account);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener cuenta', error: err.message });
  }
});

// Actualizar cuenta
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) return res.status(400).json({ mensaje: 'ID no válido' });

  try {
    const account = await Account.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!account) return res.status(404).json({ mensaje: 'Cuenta no encontrada' });

    res.json({ mensaje: 'Cuenta actualizada', cuenta: account });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar cuenta', error: err.message });
  }
});

// Eliminar cuenta
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'ID no válido' });
  }

  try {
    // Verifica si hay cuentas hijas que dependen de esta cuenta
    const sons = await Account.exists({ parent: id });

    if (sons) {
      return res.status(400).json({
        mensaje: 'No se puede eliminar la cuenta porque tiene cuentas asociadas.'
      });
    }

    // Procede con la eliminación si no tiene hijas
    const deleted = await Account.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    res.json({ mensaje: 'Cuenta eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar cuenta', error: err.message });
  }
});

module.exports = router;